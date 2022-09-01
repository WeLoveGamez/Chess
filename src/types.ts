export type Position = [number, number];
export interface Player {
  exp: number;
  money: number;
  lvl: number;
  units: Unit[];
  lineup: Lineup;
}
export type UnitName = 'Rook' | 'Knight' | 'Bishop' | 'Queen' | 'King' | 'Bishop' | 'Knight' | 'Pawn' | '';
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
