// Symbol extractor — tree-sitter primary (AST), regex fallback.
// Extracts functions, classes, imports, configs, routes from source files.

import * as fs from 'node:fs';

export interface SymbolParam {
  name: string;
  type: string;
}

export interface ExtractedSymbol {
  name: string;
  type: 'function' | 'class' | 'import' | 'config' | 'route';
  filePath: string;
  line: number;
  exported?: boolean;
  language: string;
  source?: string;
  parent?: string;
  params?: SymbolParam[];   // depth extraction: function parameters
  returnType?: string;      // depth extraction: return type annotation
  handler?: string;         // depth extraction: route handler function name
  visibility?: string;      // depth extraction: public/protected/private
}

// ── Tree-sitter state ──

let tsParser: any = null;
let tsLanguages: Record<string, any> = {};
let tsAvailable = false;

async function tryLoadTreeSitter(): Promise<boolean> {
  if (tsAvailable) return true;
  try {
    const ts = await import('tree-sitter');
    tsParser = ts.default;
    const JS = await import('tree-sitter-javascript');
    const TS = await import('tree-sitter-typescript');
    const PY = await import('tree-sitter-python');
    const JAVA = await import('tree-sitter-java');
    const GO = await import('tree-sitter-go');

    tsLanguages = {
      javascript: JS.default,
      typescript: TS.default.typescript || TS.default,
      vue: JS.default, // Vue uses JS parser for script blocks
      python: PY.default,
      java: JAVA.default,
      go: GO.default,
    };
    tsAvailable = true;
    return true;
  } catch {
    return false;
  }
}

// ── Language → tree-sitter node type mapping ──

interface NodeMap {
  functionNodes: string[];
  classNodes: string[];
  methodNodes: string[];
  importNodes: string[];
}

const NODE_MAP: Record<string, NodeMap> = {
  typescript: {
    functionNodes: ['function_declaration', 'method_definition', 'arrow_function'],
    classNodes: ['class_declaration', 'class'],
    methodNodes: ['method_definition', 'public_field_definition'],
    importNodes: ['import_statement'],
  },
  javascript: {
    functionNodes: ['function_declaration', 'method_definition', 'arrow_function'],
    classNodes: ['class_declaration', 'class'],
    methodNodes: ['method_definition'],
    importNodes: ['import_statement'],
  },
  python: {
    functionNodes: ['function_definition'],
    classNodes: ['class_definition'],
    methodNodes: ['function_definition'],
    importNodes: ['import_statement', 'import_from_statement'],
  },
  java: {
    functionNodes: ['method_declaration', 'constructor_declaration'],
    classNodes: ['class_declaration', 'interface_declaration', 'enum_declaration'],
    methodNodes: ['method_declaration'],
    importNodes: ['import_declaration'],
  },
  go: {
    functionNodes: ['function_declaration', 'method_declaration'],
    classNodes: ['type_declaration'],
    methodNodes: ['method_declaration'],
    importNodes: ['import_declaration', 'import_spec_list'],
  },
  vue: {
    functionNodes: ['function_declaration', 'method_definition', 'arrow_function'],
    classNodes: ['class_declaration'],
    methodNodes: ['method_definition'],
    importNodes: ['import_statement'],
  },
};

// ── Tree-sitter AST extraction ──

function extractName(node: any): string | null {
  const nameNode = node.childForFieldName?.('name') ?? node;
  // Try common child patterns
  for (const child of node.namedChildren || []) {
    if (child.type === 'identifier' || child.type === 'property_identifier') {
      return contentForNode(child);
    }
  }
  if (nameNode && nameNode !== node && nameNode.type) {
    return contentForNode(nameNode);
  }
  return null;
}

// ── Depth extraction: function parameters ──

function extractTypeAnnotation(node: any): string {
  const typeNode = node.childForFieldName?.('type');
  if (typeNode) return (typeNode.text || '').trim();
  if (node.childForFieldName?.('return_type')) {
    return (node.childForFieldName('return_type').text || '').trim();
  }
  for (const child of node.namedChildren || []) {
    if (child.type === 'type_annotation') {
      return (child.text || '').trim();
    }
  }
  return '';
}

function extractAnnotation(node: any): string {
  const typeNode = node.childForFieldName?.('return_type') || node.childForFieldName?.('type');
  if (typeNode) return (typeNode.text || '').trim();
  for (const child of node.namedChildren || []) {
    if (child.type === 'type_annotation') {
      return (child.text || '').trim();
    }
  }
  return '';
}

function extractTypeFromIdentifier(node: any): string {
  // type_annotation → type → identifier
  const typeAnnot = node.namedChildren?.find((c: any) => c.type === 'type_annotation');
  if (typeAnnot) {
    const typeId = (typeAnnot.text || '').replace(/^:\s*/, '').trim();
    if (typeId) return typeId;
  }
  // field type_annotation child on parameter node
  const typeNode = node.childForFieldName?.('type') || node.childForFieldName?.('return_type');
  if (typeNode) return (typeNode.text || '').replace(/^[:\s]+/, '').trim();
  return '';
}

function extractParameters(node: any): SymbolParam[] {
  const params: SymbolParam[] = [];
  const parametersNode = node.childForFieldName?.('parameters');
  if (!parametersNode) return params;

  // Look for required_parameter and optional_parameter children
  function collect(node: any): void {
    for (const child of node.namedChildren || []) {
      if (child.type === 'required_parameter' || child.type === 'optional_parameter') {
        // Find the identifier name
        const identifier = child.namedChildren?.find((c: any) =>
          c.type === 'identifier' || c.type === 'property_identifier'
        );
        const name = identifier?.text || child.text?.split(':')[0]?.trim() || '';
        if (!name || name === 'this') continue;

        // Find the type annotation
        let paramType = '';
        for (const gc of child.namedChildren || []) {
          if (gc.type === 'type_annotation') {
            paramType = (gc.text || '').replace(/^[:\s]+/, '').trim();
            break;
          }
        }
        // Also try pattern matching for pattern parameters
        if (!paramType) {
          for (const gc of child.namedChildren || []) {
            if (gc.type === 'object_pattern' || gc.type === 'array_pattern') {
              paramType = gc.type.replace('_pattern', '').trim();
              break;
            }
          }
        }

        params.push({ name, type: paramType || 'any' });
      }
      if (child.namedChildren) collect(child);
    }
  }
  collect(parametersNode);
  return params;
}

function extractFunctionReturnType(node: any): string {
  // Try return_type first (tree-sitter convention)
  const returnTypeNode = node.childForFieldName?.('return_type');
  if (returnTypeNode) {
    return (returnTypeNode.text || '').replace(/^[:\s]+/, '').trim();
  }
  // Try type_annotation for arrow functions
  for (const child of node.namedChildren || []) {
    if (child.type === 'type_annotation') {
      return (child.text || '').replace(/^[:\s]+/, '').trim();
    }
  }
  // For function_declaration with return type in body
  const body = node.childForFieldName?.('return_type') || node.childForFieldName?.('type');
  if (body) return (body.text || '').replace(/^[:\s]+/, '').trim();

  return '';
}

function extractVisibility(node: any): string | undefined {
  for (const child of node.namedChildren || []) {
    if (child.type === 'accessibility_modifier' || child.type === 'public' || child.type === 'private' || child.type === 'protected') {
      return child.text || child.type;
    }
  }
  return undefined;
}

function contentForNode(node: any): string {
  return node.text || '';
}

function isExported(node: any, content: string, language: string): boolean {
  // Check parent chain for export modifiers
  let current = node.parent;
  while (current) {
    if (current.type === 'export_statement') return true;
    if (current.type === 'export_default_clause') return true;
    if (current.type?.includes('export')) return true;
    // Java: public keyword
    if (language === 'java') {
      for (const child of current.namedChildren || []) {
        if (child.type === 'modifiers' && child.text?.includes('public')) return true;
      }
    }
    current = current.parent;
  }
  return false;
}

function walkTree(
  node: any, filePath: string, language: string, content: string,
  detail = false,
): ExtractedSymbol[] {
  const symbols: ExtractedSymbol[] = [];
  const nodeMap = NODE_MAP[language] || NODE_MAP['javascript'];
  const nodeType = node.type;

  // Class
  if (nodeMap.classNodes.includes(nodeType)) {
    const name = extractName(node);
    if (name) {
      symbols.push({
        name, type: 'class', filePath, line: node.startPosition.row + 1,
        exported: isExported(node, content, language), language,
      });
    }
  }

  // Function / Method
  if (nodeMap.functionNodes.includes(nodeType)) {
    const name = extractName(node);
    if (name && name.length > 1 && !name.startsWith('_')) {
      let parent: string | undefined;
      let current = node.parent;
      while (current) {
        if (nodeMap.classNodes.includes(current.type)) {
          const parentName = extractName(current);
          if (parentName) { parent = parentName; break; }
        }
        current = current.parent;
      }
      const symbol: ExtractedSymbol = {
        name, type: 'function', filePath, line: node.startPosition.row + 1,
        exported: isExported(node, content, language), language, parent,
      };
      // Depth extraction
      if (detail) {
        symbol.params = extractParameters(node);
        symbol.returnType = extractFunctionReturnType(node) || undefined;
        if (parent) {
          symbol.visibility = extractVisibility(node);
        }
      }
      symbols.push(symbol);
    }
  }

  // Import
  if (nodeMap.importNodes.includes(nodeType)) {
    // Extract module source path from child string nodes
    let source = '';

    for (const child of node.namedChildren || []) {
      if (child.type === 'string' || child.type === 'string_fragment') {
        source = (child.text || '').replace(/^["']+|["']+$/g, '');
        break;
      }
    }
    // Also try field name 'source' or 'path'
    if (!source) {
      for (const fieldName of ['source', 'path', 'module']) {
        try {
          const field = typeof node.childForFieldName === 'function'
            ? node.childForFieldName(fieldName)
            : node[fieldName];
          if (field && field.text) {
            source = field.text.replace(/^["']+|["']+$/g, '');
            break;
          }
        } catch { /* field not found */ }
      }
    }

    // Named imports — recurse into import_clause → named_imports → import_specifier
    function collectSpecifiers(children: any[]): void {
      for (const child of children) {
        if (child.type === 'import_specifier') {
          const nameField = typeof child.childForFieldName === 'function'
            ? child.childForFieldName('name')
            : null;
          const name = nameField?.text || child.text?.split(/\s+/)[0] || '';
          if (name && name !== 'type') {
            symbols.push({
              name, type: 'import', filePath,
              line: child.startPosition.row + 1, source, language,
            });
          }
        }
        if (child.namedChildren) {
          collectSpecifiers(child.namedChildren);
        }
      }
    }
    collectSpecifiers(node.namedChildren || []);
  }

  // Config: const UPPER_CASE = ...
  if (nodeType === 'variable_declaration' || nodeType === 'lexical_declaration') {
    for (const child of node.namedChildren || []) {
      if (child.type === 'variable_declarator') {
        const nameNode = child.childForFieldName?.('name');
        if (nameNode) {
          const name = nameNode.text || '';
          if (/^[A-Z_]{2,}$/.test(name)) {
            symbols.push({
              name, type: 'config', filePath,
              line: nameNode.startPosition.row + 1, language,
            });
          }
        }
      }
    }
    // Python assignment
    for (const child of node.namedChildren || []) {
      if (child.type === 'identifier' && /^[A-Z_]{2,}$/.test(child.text || '')) {
        symbols.push({
          name: child.text || '', type: 'config', filePath,
          line: child.startPosition.row + 1, language,
        });
      }
    }
  }

  // Route: decorators with HTTP methods
  if (nodeType === 'decorator') {
    const text = node.text || '';
    const routeMatch = text.match(/@(Get|Post|Put|Delete|Patch|RequestMapping)\s*\(['"]([^'"]*)['"]/i);
    if (routeMatch) {
      const symbol: ExtractedSymbol = {
        name: `${routeMatch[1].toUpperCase()} ${routeMatch[2]}`,
        type: 'route', filePath, line: node.startPosition.row + 1, language,
      };
      if (detail) {
        // Find the decorated function/method name
        let current = node.parent;
        while (current) {
          const methodNodes = NODE_MAP[language]?.methodNodes || [];
          if (methodNodes.includes(current.type)) {
            symbol.handler = extractName(current) || undefined;
            break;
          }
          current = current.parent;
        }
      }
      symbols.push(symbol);
    }
  }
  // Express/Koa router routes
  if (nodeType === 'call_expression') {
    const text = node.text || '';
    const routeMatch = text.match(
      /(?:app|router|this|server)\.\s*(get|post|put|delete|patch|all|use)\s*\(['"]([^'"]+)['"]/i,
    );
    if (routeMatch) {
      const symbol: ExtractedSymbol = {
        name: `${routeMatch[1].toUpperCase()} ${routeMatch[2]}`,
        type: 'route', filePath, line: node.startPosition.row + 1, language,
      };
      if (detail) {
        // Extract handler: next argument after the path string
        const pathIdx = text.indexOf(`'${routeMatch[2]}'`) + routeMatch[2].length + 2;
        const afterPath = text.substring(pathIdx);
        const handlerMatch = afterPath.match(/^\s*,\s*(\w+)/);
        if (handlerMatch) {
          symbol.handler = handlerMatch[1];
        }
      }
      symbols.push(symbol);
    }
  }

  // State enum / string literal union (detail mode)
  if (detail && nodeType === 'type_alias_declaration') {
    const name = extractName(node);
    const text = node.text || '';
    // TypeScript string literal union: type Status = 'a' | 'b' | 'c'
    const unionMatch = text.match(/type\s+\w+\s*=\s*(.+)/);
    if (unionMatch && (text.includes("'") || text.includes('"'))) {
      // Check if all values are string literals
      const values = (unionMatch[1] || '').split('|').map((s: string) => s.trim().replace(/^['"]|['"]$/g, ''));
      if (values.length >= 2 && values.every((v: string) => v && /^[a-zA-Z_]/.test(v))) {
        symbols.push({
          name: name || '', type: 'config', filePath,
          line: node.startPosition.row + 1, language,
          source: `StateUnion:${values.join(',')}`,
        });
      }
    }
  }

  // Enum declarations for state machines (detail mode)
  if (detail && nodeType === 'enum_declaration') {
    const name = extractName(node);
    if (name && (/status|state|mode/i.test(name) || name.endsWith('Status') || name.endsWith('State'))) {
      const values: string[] = [];
      for (const child of node.namedChildren || []) {
        if (child.type === 'enum_member' || child.type === 'enum_body') {
          for (const member of child.namedChildren || []) {
            if (member.type === 'enum_member' || member.type === 'property_identifier') {
              const memberName = member.text || '';
              if (memberName) values.push(memberName);
            }
          }
        }
      }
      if (values.length >= 2) {
        symbols.push({
          name, type: 'config', filePath,
          line: node.startPosition.row + 1, language,
          source: `StateEnum:${values.join(',')}`,
        });
      }
    }
  }

  // Recurse
  for (const child of node.namedChildren || []) {
    symbols.push(...walkTree(child, filePath, language, content, detail));
  }
  return symbols;
}

function extractWithTreeSitter(
  content: string, filePath: string, language: string, detail = false,
): ExtractedSymbol[] {
  try {
    const lang = tsLanguages[language];
    if (!lang) return [];

    const parser = new tsParser();
    parser.setLanguage(lang);
    const tree = parser.parse(content);
    return walkTree(tree.rootNode, filePath, language, content, detail);
  } catch {
    return [];
  }
}

// ── Regex fallback ──

function extractWithRegex(
  content: string, filePath: string, language: string,
): ExtractedSymbol[] {
  const symbols: ExtractedSymbol[] = [];
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // Function
    const funcPatterns = [
      /(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(/,
      /(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\s*\(/,
      /def\s+(\w+)\s*\(/,  // Python
      /func\s+(\w+)\s*\(/, // Go
    ];
    for (const pat of funcPatterns) {
      const m = line.match(pat);
      if (m) {
        symbols.push({
          name: m[1], type: 'function', filePath, line: lineNum,
          exported: line.includes('export') || line.includes('public'), language,
        });
        break;
      }
    }

    // Class
    const classMatch = line.match(/(?:export\s+|public\s+)?class\s+(\w+)/);
    if (classMatch) {
      symbols.push({
        name: classMatch[1], type: 'class', filePath, line: lineNum,
        exported: line.includes('export') || line.includes('public'), language,
      });
    }

    // Import
    const importPatterns = [
      /import\s+\{?\s*(\w+)/,
      /import\s+(\w+)\s+from\s+['"](.+?)['"]/,
      /const\s+(\w+)\s*=\s*require\(['"](.+?)['"]\)/,
      /from\s+(\S+)\s+import\s+(\w+)/,
      /import\s+\(?\s*"(.+?)"\s*\)/,
    ];
    for (const pat of importPatterns) {
      const m = line.match(pat);
      if (m) {
        symbols.push({
          name: m[1], type: 'import', filePath, line: lineNum,
          source: m[2] || m[1], language,
        });
        break;
      }
    }

    // Config
    const configPatterns = [
      /process\.env\.(\w+)/,
      /^([A-Z_]{2,})\s*[=:]\s*(.+)/,
      /const\s+([A-Z_]+)\s*=\s*/,
    ];
    for (const pat of configPatterns) {
      const m = line.match(pat);
      if (m) {
        symbols.push({ name: m[1], type: 'config', filePath, line: lineNum, language });
        break;
      }
    }

    // Route
    const routePatterns = [
      /(?:app|router|this|server)\.\s*(get|post|put|delete|patch)\s*\(['"]([^'"]+)['"]/i,
      /@(Get|Post|Put|Delete|Patch|RequestMapping)\s*\(['"]([^'"]*)['"]/,
    ];
    for (const pat of routePatterns) {
      const m = line.match(pat);
      if (m) {
        const method = (m[1] || 'Get').toUpperCase();
        symbols.push({
          name: `${method} ${m[2] || '/'}`, type: 'route', filePath, line: lineNum, language,
        });
        break;
      }
    }
  }

  return symbols;
}

// ── Public API ──

export async function extractSymbols(
  filePath: string, language: string, detail = false,
): Promise<ExtractedSymbol[]> {
  let content: string;
  try { content = fs.readFileSync(filePath, 'utf-8'); } catch { return []; }

  const hasTreeSitter = await tryLoadTreeSitter();
  if (hasTreeSitter) {
    const result = extractWithTreeSitter(content, filePath, language, detail);
    if (result.length > 0) return result;
    // Fallback to regex if tree-sitter returned empty (unsupported syntax)
  }
  return extractWithRegex(content, filePath, language);
}

export async function isTreeSitterAvailable(): Promise<boolean> {
  return tryLoadTreeSitter();
}
