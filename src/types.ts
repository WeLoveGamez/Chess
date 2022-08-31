export type Position = [number, number];
export interface Player {
  exp: number;
  money: number;
  lvl: number;
  units: Unit[];
  lineup: Lineup;
}
export type UnitNames = 'Rook' | 'Knight' | 'Bishop' | 'Queen' | 'King' | 'Bishop' | 'Knight' | 'Pawn' | '';

export interface Unit {
  name: UnitNames;
  amount: number;
  maxAmount: number;
  amountPerRound: number;
  value: number;
}
export interface Lineup {
  frontline: UnitNames[];
  backline: UnitNames[];
}
