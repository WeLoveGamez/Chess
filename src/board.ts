import { Ref, ref } from 'vue';
import type { Position } from './types';

export interface Tile {
  type: 'Rook' | 'Knight' | 'Bishop' | 'Queen' | 'King' | 'Pawn' | '';
  player: 1 | 2 | 0;
}

export const board = ref<Tile[][]>([
  [
    { type: 'Rook', player: 1 },
    { type: 'Knight', player: 1 },
    { type: 'Bishop', player: 1 },
    { type: 'Queen', player: 1 },
    { type: 'King', player: 1 },
    { type: 'Bishop', player: 1 },
    { type: 'Knight', player: 1 },
    { type: 'Rook', player: 1 },
  ],
  [
    { type: 'Pawn', player: 1 },
    { type: 'Pawn', player: 1 },
    { type: 'Pawn', player: 1 },
    { type: 'Pawn', player: 1 },
    { type: 'Pawn', player: 1 },
    { type: 'Pawn', player: 1 },
    { type: 'Pawn', player: 1 },
    { type: 'Pawn', player: 1 },
  ],
  [
    { type: '', player: 0 },
    { type: '', player: 0 },
    { type: '', player: 0 },
    { type: '', player: 0 },
    { type: '', player: 0 },
    { type: '', player: 0 },
    { type: '', player: 0 },
    { type: '', player: 0 },
  ],
  [
    { type: '', player: 0 },
    { type: '', player: 0 },
    { type: '', player: 0 },
    { type: '', player: 0 },
    { type: '', player: 0 },
    { type: '', player: 0 },
    { type: '', player: 0 },
    { type: '', player: 0 },
  ],
  [
    { type: '', player: 0 },
    { type: '', player: 0 },
    { type: '', player: 0 },
    { type: '', player: 0 },
    { type: '', player: 0 },
    { type: '', player: 0 },
    { type: '', player: 0 },
    { type: '', player: 0 },
  ],
  [
    { type: '', player: 0 },
    { type: '', player: 0 },
    { type: '', player: 0 },
    { type: '', player: 0 },
    { type: '', player: 0 },
    { type: '', player: 0 },
    { type: '', player: 0 },
    { type: '', player: 0 },
  ],
  [
    { type: 'Pawn', player: 2 },
    { type: 'Pawn', player: 2 },
    { type: 'Pawn', player: 2 },
    { type: 'Pawn', player: 2 },
    { type: 'Pawn', player: 2 },
    { type: 'Pawn', player: 2 },
    { type: 'Pawn', player: 2 },
    { type: 'Pawn', player: 2 },
  ],
  [
    { type: 'Rook', player: 2 },
    { type: 'Knight', player: 2 },
    { type: 'Bishop', player: 2 },
    { type: 'Queen', player: 2 },
    { type: 'King', player: 2 },
    { type: 'Bishop', player: 2 },
    { type: 'Knight', player: 2 },
    { type: 'Rook', player: 2 },
  ],
]);

export function applyMove(fromRow: number, fromCell: number, toRow: number, toCell: number, legalMoves: Position[], board: Tile[][]) {
  if (toRow < 0 || toCell < 0) return board;
  const copyBoard = JSON.parse(JSON.stringify(board));
  // console.log(fromRow, fromCell, toRow, toCell);
  if (legalMoves.find(m => m[0] == toRow && m[1] == toCell)) {
    copyBoard[toRow][toCell] = copyBoard[fromRow][fromCell];
    copyBoard[fromRow][fromCell] = { type: '', player: 0 };
  }
  return copyBoard;
}
