// memory init — deploy skill files to target project's tool directories.
//
// Reads skill definitions from src/skills/ (dev mode) or dist/skills/ (package mode),
// writes SKILL.md files respecting each tool's directory convention.

import * as fs from 'node:fs';
import * as path from 'node:path';

interface ToolConfig {
  template: (name: string) => string;
}

const TOOL_CONFIGS: Record<string, ToolConfig> = {
  claude: {
    template: (name) => `.claude/skills/memory/${name}/SKILL.md`,
  },
  codebuddy: {
    template: (name) => `.codebuddy/skills/${name}/SKILL.md`,
  },
  lingma: {
    template: (name) => `.lingma/skills/${name}/SKILL.md`,
  },
};

const VALID_TOOLS = Object.keys(TOOL_CONFIGS);

export interface InitResult {
  created: string[];
  skipped: string[];
  errors: Array<{ path: string; error: string }>;
}

async function loadSkills(): Promise<Map<string, { name: string; description: string; content: string }>> {
  // Try compiled assets first (npm package mode)
  try {
    const mod = await import('../skills/index.js');
    return mod.SKILLS;
  } catch {
    // Dev mode fallback
    const build = await import('../skills/memory-build.js');
    const search = await import('../skills/memory-search.js');
    const read = await import('../skills/memory-read.js');
    const write = await import('../skills/memory-write.js');
    const status = await import('../skills/memory-status.js');

    const skills = new Map();
    for (const m of [build, search, read, write, status]) {
      skills.set(m.NAME, { name: m.NAME, description: m.DESCRIPTION, content: m.SKILL });
    }
    return skills;
  }
}

export async function initCommand(options: {
  tool?: string;
  all?: boolean;
  force?: boolean;
}) {
  const projectRoot = process.cwd();
  const result: InitResult = { created: [], skipped: [], errors: [] };

  const skills = await loadSkills();

  // Determine target tools
  const tools = options.all
    ? VALID_TOOLS
    : options.tool
      ? [options.tool]
      : [];

  if (tools.length === 0) {
    console.log('Usage: memory init --tool <name> | --all');
    console.log(`Available tools: ${VALID_TOOLS.join(', ')}`);
    console.log('');
    console.log('Options:');
    console.log('  --tool <name>  Deploy to a single tool (claude|codebuddy|lingma)');
    console.log('  --all          Deploy to all supported tools');
    console.log('  --force        Overwrite existing SKILL.md files');
    return;
  }

  // Validate tool names
  for (const tool of tools) {
    if (!TOOL_CONFIGS[tool]) {
      result.errors.push({ path: tool, error: `Unknown tool: ${tool}. Valid: ${VALID_TOOLS.join(', ')}` });
    }
  }

  if (result.errors.length > 0) {
    for (const e of result.errors) {
      console.error(`  ✗ ${e.path}: ${e.error}`);
    }
    return;
  }

  console.log('');
  console.log(`Deploying ${skills.size} skills to ${tools.length} tool(s)...`);
  console.log('');

  for (const tool of tools) {
    const config = TOOL_CONFIGS[tool];

    for (const [skillName, skillDef] of skills) {
      const relPath = config.template(skillName);
      const fullPath = path.join(projectRoot, relPath);

      try {
        // Ensure directory exists
        const dir = path.dirname(fullPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        // Check if file already exists
        if (fs.existsSync(fullPath) && !options.force) {
          result.skipped.push(relPath);
          console.log(`  · ${relPath} (skipped)`);
          continue;
        }

        fs.writeFileSync(fullPath, skillDef.content, 'utf-8');
        result.created.push(relPath);
        console.log(`  ✓ ${relPath}`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        result.errors.push({ path: relPath, error: msg });
        console.log(`  ✗ ${relPath}: ${msg}`);
      }
    }
  }

  // Summary
  console.log('');
  console.log(`Done! Created: ${result.created.length}, Skipped: ${result.skipped.length}${result.errors.length > 0 ? `, Errors: ${result.errors.length}` : ''}`);
  console.log('');
}
