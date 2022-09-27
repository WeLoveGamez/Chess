export const PIECES = ['Rook', 'Knight', 'Bishop', 'Queen', 'King', 'Pawn'] as const;

export type UnitName = typeof PIECES[number] | '';

export type Position = [number, number];
export type Move = { piece: Position; target: Position };
export type Id = string;

export interface SkillTree {
  id: Id;
  skills: {
    [key: Id]: Skill
  };
}
interface Requirements {
  usedPoints: number;
  preSkills?: { id: Id; needLvl: number }[];
}
export interface Skill {
  lvl: number;
}

interface PlayerSkillTrees {
  activated: Id;
  trees: SkillTree[];
}

export interface Player {
  exp: number;
  money: number;
  lvl: number;
  units: Unit[];
  lineup: Lineup;
  skillTrees: PlayerSkillTrees;
}
export interface DeadPiece {
  player: 1 | 2;
  name: UnitName;
}
export interface Unit {
  id: Id
  amount: number;
  maxAmount: number;
  amountPerRound: number;
}
export interface Lineup {
  frontline: UnitName[];
  backline: UnitName[];
}

export interface Tile {
  type: UnitName | '';
  player: 1 | 2 | 0;
}
