import { computed, Ref, ref } from 'vue';
import { checkChecks } from './moves';
import type { Position, DeadPiece } from './types';
import { player, boardSize } from './Player';
export const moveHistory = ref<{ from: Position; to: Position; piece: Tile['type'] }[]>([]);
export const King1Checked = computed(() => checkChecks(1, board.value));
export const King2Checked = computed(() => checkChecks(2, board.value));
export const lastMovedCell = computed(() => moveHistory.value.at(-1));

export interface Tile {
  type: typeof PIECES[number] | '';
  player: 1 | 2 | 0;
}
export const PIECES = ['Rook', 'Knight', 'Bishop', 'Queen', 'King', 'Pawn'] as const;

export const selectedCell = ref<Position>([-1, -1]);
export const playerTurn = ref<1 | 2>(1);

export const piecesOnBoard = computed(() => board.value.flatMap(p => p.filter(e => e.type)).length);
export const deadPieces = ref<DeadPiece[]>([]);
export const board = ref<Tile[][]>([]);
createBoard();
export function createBoard() {
  playerTurn.value = 1;
  deadPieces.value = [];
  const frontline = player.value.lineup.frontline.map(e => {
    return { type: e, player: e ? 1 : 0 } as Tile;
  });
  const backline = player.value.lineup.backline.map(e => {
    return { type: e, player: e ? 1 : 0 } as Tile;
  });

  const enemyFrontline = player.value.lineup.frontline.map(e => {
    return { type: e, player: e ? 2 : 0 } as Tile;
  });
  const enemyBackline = player.value.lineup.backline.map(e => {
    return { type: e, player: e ? 2 : 0 } as Tile;
  });

  board.value = [backline, frontline, new Array(backline.length).fill({ type: '', player: 0 }), enemyFrontline, enemyBackline];
}
export function getPieceValue(piece: Tile['type']) {
  switch (piece) {
    case 'Bishop':
    case 'Knight':
      return 3;
    case 'Pawn':
      return 1;
    case 'Queen':
      return 9;
    case 'Rook':
      return 5;
    case 'King':
      return 4;
  }
  return 0;
}

export function applyMove(
  fromRow: number,
  fromCell: number,
  toRow: number,
  toCell: number,
  legalMoves: Position[],
  board: Tile[][],
  playerTurn?: Ref<number>,
  selectedCell?: Ref<Position>,
  moveHistory?: Ref<{ from: Position; to: Position; piece: Tile['type'] }[]>
) {
  if (toRow < 0 || toCell < 0 || toRow >= board.length || toCell >= board.length) return board;
  const copyBoard = JSON.parse(JSON.stringify(board));
  if (legalMoves.find(m => m[0] == toRow && m[1] == toCell)) {
    //rocharde weiß
    if (copyBoard[fromRow][fromCell].type == 'King' && toRow == 0 && toCell == 2 && (toCell == fromCell - 2 || toCell == fromCell + 2)) {
      copyBoard[0][3] = copyBoard[0][0];
      copyBoard[0][0] = { type: '', player: 0 };
    }
    if (copyBoard[fromRow][fromCell].type == 'King' && toRow == 0 && toCell == 6 && (toCell == fromCell - 2 || toCell == fromCell + 2)) {
      copyBoard[0][5] = copyBoard[0][7];
      copyBoard[0][7] = { type: '', player: 0 };
    }

    //rocharde nicht weiß
    if (copyBoard[fromRow][fromCell].type == 'King' && toRow == 7 && toCell == 2 && (toCell == fromCell - 2 || toCell == fromCell + 2)) {
      copyBoard[7][3] = copyBoard[7][0];
      copyBoard[7][0] = { type: '', player: 0 };
    }
    if (copyBoard[fromRow][fromCell].type == 'King' && toRow == 7 && toCell == 6 && (toCell == fromCell - 2 || toCell == fromCell + 2)) {
      copyBoard[7][5] = copyBoard[7][7];
      copyBoard[7][7] = { type: '', player: 0 };
    }

    if (copyBoard[fromRow][fromCell].type == 'Pawn' && copyBoard[toRow][toCell].type == '' && toCell != fromCell) {
      copyBoard[fromRow][toCell] = { type: '', player: 0 };
    }
    copyBoard[toRow][toCell] = copyBoard[fromRow][fromCell];
    copyBoard[fromRow][fromCell] = { type: '', player: 0 };

    if (playerTurn && selectedCell) {
      const player = board[toRow][toCell].player;
      if (player) deadPieces.value.push({ name: board[toRow][toCell].type, player: player });
      moveHistory?.value.push({ from: [fromRow, fromCell], to: [toRow, toCell], piece: board[fromRow][fromCell].type });
      playerTurn.value = playerTurn.value == 1 ? 2 : 1;
      selectedCell.value = [-1, -1];
    }
  }

  return copyBoard;
}
