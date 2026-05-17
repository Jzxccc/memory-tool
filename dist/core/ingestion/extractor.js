// Symbol extractor — tree-sitter primary (AST), regex fallback.
// Extracts functions, classes, imports, configs, routes from source files.
import * as fs from 'node:fs';
// ── Tree-sitter state ──
let tsParser = null;
let tsLanguages = {};
let tsAvailable = false;
async function tryLoadTreeSitter() {
    if (tsAvailable)
        return true;
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
    }
    catch {
        return false;
    }
}
const NODE_MAP = {
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
function extractName(node) {
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
function contentForNode(node) {
    return node.text || '';
}
function isExported(node, content, language) {
    // Check parent chain for export modifiers
    let current = node.parent;
    while (current) {
        if (current.type === 'export_statement')
            return true;
        if (current.type === 'export_default_clause')
            return true;
        if (current.type?.includes('export'))
            return true;
        // Java: public keyword
        if (language === 'java') {
            for (const child of current.namedChildren || []) {
                if (child.type === 'modifiers' && child.text?.includes('public'))
                    return true;
            }
        }
        current = current.parent;
    }
    return false;
}
function walkTree(node, filePath, language, content) {
    const symbols = [];
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
            let parent;
            let current = node.parent;
            while (current) {
                if (nodeMap.classNodes.includes(current.type)) {
                    const parentName = extractName(current);
                    if (parentName) {
                        parent = parentName;
                        break;
                    }
                }
                current = current.parent;
            }
            symbols.push({
                name, type: 'function', filePath, line: node.startPosition.row + 1,
                exported: isExported(node, content, language), language, parent,
            });
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
                }
                catch { /* field not found */ }
            }
        }
        // Named imports — recurse into import_clause → named_imports → import_specifier
        function collectSpecifiers(children) {
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
            symbols.push({
                name: `${routeMatch[1].toUpperCase()} ${routeMatch[2]}`,
                type: 'route', filePath, line: node.startPosition.row + 1, language,
            });
        }
    }
    // Express routes: app.get('/path'
    if (nodeType === 'call_expression') {
        const text = node.text || '';
        const routeMatch = text.match(/(?:app|router|this|server)\.\s*(get|post|put|delete|patch)\s*\(['"]([^'"]+)['"]/i);
        if (routeMatch) {
            symbols.push({
                name: `${routeMatch[1].toUpperCase()} ${routeMatch[2]}`,
                type: 'route', filePath, line: node.startPosition.row + 1, language,
            });
        }
    }
    // Recurse
    for (const child of node.namedChildren || []) {
        symbols.push(...walkTree(child, filePath, language, content));
    }
    return symbols;
}
function extractWithTreeSitter(content, filePath, language) {
    try {
        const lang = tsLanguages[language];
        if (!lang)
            return [];
        const parser = new tsParser();
        parser.setLanguage(lang);
        const tree = parser.parse(content);
        return walkTree(tree.rootNode, filePath, language, content);
    }
    catch {
        return [];
    }
}
// ── Regex fallback ──
function extractWithRegex(content, filePath, language) {
    const symbols = [];
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNum = i + 1;
        // Function
        const funcPatterns = [
            /(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(/,
            /(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\s*\(/,
            /def\s+(\w+)\s*\(/, // Python
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
export async function extractSymbols(filePath, language) {
    let content;
    try {
        content = fs.readFileSync(filePath, 'utf-8');
    }
    catch {
        return [];
    }
    const hasTreeSitter = await tryLoadTreeSitter();
    if (hasTreeSitter) {
        const result = extractWithTreeSitter(content, filePath, language);
        if (result.length > 0)
            return result;
        // Fallback to regex if tree-sitter returned empty (unsupported syntax)
    }
    return extractWithRegex(content, filePath, language);
}
export async function isTreeSitterAvailable() {
    return tryLoadTreeSitter();
}
//# sourceMappingURL=extractor.js.map