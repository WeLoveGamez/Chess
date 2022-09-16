

export const PIECES = ['Rook', 'Knight', 'Bishop', 'Queen', 'King', 'Pawn'] as const;

export type UnitName = typeof PIECES[number] | '';

export type Position = [number, number];
export type Move = { piece: Position; target: Position };

export interface SkillTree {
  id:string;
  name: string;
  skills: Skill[];
}
export interface Skill {
  id: number;
  lvl: number;
}

interface skillTrees{
  activated:SkillTree;
  
}

export interface Player {
  exp: number;
  money: number;
  lvl: number;
  units: Unit[];
  lineup: Lineup;
  skillTrees:SkillTree[];
}
export interface DeadPiece {
  player: 1 | 2;
  name: UnitName;
}
export interface Unit {
  name: UnitName;
  amount: number;
  maxAmount: number;
  amountPerRound: number;
  value: number;
}
export interface Lineup {
  frontline: UnitName[];
  backline: UnitName[];
}

export interface Tile {
  type: UnitName | '';
  player: 1 | 2 | 0;
}
