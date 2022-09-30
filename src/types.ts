export const PIECES = ['Rook', 'Knight', 'Bishop', 'Queen', 'King', 'Pawn'] as const;

export type UnitId = typeof PIECES[number] | '';

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
  id: UnitId;
}
export interface Unit {
  id: UnitId
  amount: number;
  maxAmount: number;
  amountPerRound: number;
}
export interface Lineup {
  frontline: UnitId[];
  backline: UnitId[];
}

export interface Tile {
  type: UnitId | '';
  player: 1 | 2 | 0;
}
