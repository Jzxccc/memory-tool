// Skill registry — aggregates all 5 memory skill definitions.
// Used by `memory init` command and `scripts/generate-skills.js`.

import { NAME as buildName, DESCRIPTION as buildDesc, SKILL as buildSkill } from './memory-build.js';
import { NAME as searchName, DESCRIPTION as searchDesc, SKILL as searchSkill } from './memory-search.js';
import { NAME as readName, DESCRIPTION as readDesc, SKILL as readSkill } from './memory-read.js';
import { NAME as writeName, DESCRIPTION as writeDesc, SKILL as writeSkill } from './memory-write.js';
import { NAME as statusName, DESCRIPTION as statusDesc, SKILL as statusSkill } from './memory-status.js';

export interface SkillDef {
  name: string;
  description: string;
  content: string;
}

export const SKILLS = new Map<string, SkillDef>([
  [buildName, { name: buildName, description: buildDesc, content: buildSkill }],
  [searchName, { name: searchName, description: searchDesc, content: searchSkill }],
  [readName, { name: readName, description: readDesc, content: readSkill }],
  [writeName, { name: writeName, description: writeDesc, content: writeSkill }],
  [statusName, { name: statusName, description: statusDesc, content: statusSkill }],
]);

export const SKILL_NAMES = Array.from(SKILLS.keys());
