// scripts/generate-skills.js
// Reads compiled skill definitions from dist/skills/index.js and writes
// SKILL.md files into .claude/, .codebuddy/, and .lingma/ directories.
//
// Called by npm run build as a post-compile step.

import { createRequire } from 'node:module';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

const require = createRequire(import.meta.url);

// Tool directory conventions
const TOOL_CONFIGS = {
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

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function writeSkill(filePath, content) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, 'utf-8');
  return filePath;
}

async function main() {
  const skillsModule = require(path.join(projectRoot, 'dist', 'skills', 'index.js'));
  const skills = skillsModule.SKILLS;

  let totalWritten = 0;

  for (const toolName of Object.keys(TOOL_CONFIGS)) {
    const config = TOOL_CONFIGS[toolName];

    for (const [skillName, skillDef] of skills) {
      const relPath = config.template(skillName);
      const fullPath = path.join(projectRoot, relPath);

      writeSkill(fullPath, skillDef.content);
      totalWritten++;
    }
  }

  console.log(`Skills: ${totalWritten} SKILL.md files written (3 tools × ${skills.size} skills)`);
}

main().catch((err) => {
  console.error('generate-skills failed:', err);
  process.exit(1);
});
