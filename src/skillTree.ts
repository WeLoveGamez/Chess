import { player, usedTree } from './Player';
import { Id, SkillTree } from './types';

export const offenseTree: SkillTree = {
  id: 'test',
  name: 'offense',
  skills: [
    {
      id: '100',
      lvl: 1,
      req: { usedPoints: 0 },
    },
  ],
};
export const defenseTree = {};
export const utilityTree = {};

export const SKILLTREES: SkillTree[] = [offenseTree];

export function getSkillLvl(playerTurn: 1 | 2, skillId: Id) {
  if (playerTurn != 1) return 0;
  return usedTree.value?.skills.find(s => s.id == skillId)?.lvl ?? 0;
}
