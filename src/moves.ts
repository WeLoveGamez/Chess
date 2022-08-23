import type { Tile } from './board';
import type { Position } from './types';
import { applyMove } from './board';

export function checkChecks(player: 1 | 2, board: Tile[][]) {
  const checkingPieces: Position[] = [];
  let kingPosition: Position = [-1, -1];
  for (let i = 0; i < board.length; i++) {
    for (let j = 0; j < board[0].length; j++) {
      if (board[i][j].type == 'King' && board[i][j].player == player) kingPosition = [i, j];
    }
  }

  for (let i = 0; i < board.length; i++) {
    for (let j = 0; j < board[0].length; j++) {
      const legalMoves: Position[] = [];
      console.log(i, j);
      console.log(board[i][j]);
      // if (board[i][j].player && board[i][j].player != player) legalMoves.push(...checkLegalMoves(i, j, board)); //FIXME:
      if (legalMoves.find(m => m[0] == kingPosition[0] && m[1] == kingPosition[1])) {
        checkingPieces.push([i, j]);
      }
    }
  }
  return checkingPieces;
}

export function checkLegalMoves(fromRow: number, fromCell: number, board: Tile[][]): Position[] {
  if (fromRow == -1 || fromCell == -1) return [];
  const legalMoves: Position[] = [];
  const tile = board[fromRow][fromCell];
  const piece = tile.type;
  const player = tile.player;
  if (piece.includes('Rook')) {
    legalMoves.push(...checkLegalMovesRook(fromRow, fromCell, player, board));
  }
  if (piece.includes('Knight')) {
    legalMoves.push(...checkLegalMovesKnight(fromRow, fromCell, player, board));
  }
  if (piece.includes('Bishop')) {
    legalMoves.push(...checkLegalMovesBishop(fromRow, fromCell, player, board));
  }
  if (piece.includes('Queen')) {
    legalMoves.push(...checkLegalMovesBishop(fromRow, fromCell, player, board));
    legalMoves.push(...checkLegalMovesRook(fromRow, fromCell, player, board));
  }
  if (piece.includes('King')) {
    legalMoves.push(...checkLegalMovesKing(fromRow, fromCell, player, board));
  }
  if (piece.includes('Pawn')) {
    legalMoves.push(...checkLegalMovesPawn(fromRow, fromCell, player, board));
  }

  // if (player) removeIllegalmoves(legalMoves, board, player, fromRow, fromCell);
  return legalMoves;
}

function checkLegalMovesPawn(fromRow: number, fromCell: number, player: 1 | 2 | 0, board: Tile[][]): Position[] {
  const legalMoves: Position[] = [];
  const playerOffset = player == 1 ? 1 : -1;
  //straight
  if (board[fromRow + playerOffset][fromCell]?.type == '') legalMoves.push([fromRow + playerOffset, fromCell]);

  //straight 2
  if (
    fromRow == (playerOffset == 1 ? 1 : 6) &&
    board[fromRow + 2 * playerOffset][fromCell].type == '' &&
    board[fromRow + playerOffset][fromCell]?.type == ''
  ) {
    legalMoves.push([fromRow + 2 * playerOffset, fromCell]);
  }

  //diagonal right
  let tilePlayer = board[fromRow + playerOffset][fromCell + playerOffset]?.player;
  if (tilePlayer && tilePlayer != player) {
    legalMoves.push([fromRow + playerOffset, fromCell + playerOffset]);
  }
  //diagonal left
  tilePlayer = board[fromRow + playerOffset][fromCell - playerOffset]?.player;
  if (tilePlayer && tilePlayer != player) {
    legalMoves.push([fromRow + playerOffset, fromCell - playerOffset]);
  }
  return legalMoves;
}
function checkLegalMovesKnight(fromRow: number, fromCell: number, player: 1 | 2 | 0, board: Tile[][]): Position[] {
  const legalMoves: Position[] = [];
  const offsets = [
    [1, 2],
    [2, 1],
    [-1, 2],
    [-2, 1],
    [1, -2],
    [2, -1],
    [-1, -2],
    [-2, -1],
  ];
  for (const [rowOffset, cellOffset] of offsets) {
    if (board?.[fromRow + rowOffset]?.[fromCell + cellOffset]?.player != player) {
      legalMoves.push([fromRow + rowOffset, fromCell + cellOffset]);
    }
  }
  return legalMoves;
}

function checkLegalMovesRook(fromRow: number, fromCell: number, player: 1 | 2 | 0, board: Tile[][]): Position[] {
  const legalMoves: Position[] = [];

  //down
  for (let row = fromRow + 1; row < board.length; row++) {
    if (board[row][fromCell].player) {
      if (board[row][fromCell].player != player) legalMoves.push([row, fromCell]);
      break;
    }
    legalMoves.push([row, fromCell]);
  }
  //up
  for (let row = fromRow - 1; row >= 0; row--) {
    if (board[row][fromCell].player) {
      if (board[row][fromCell].player != player) legalMoves.push([row, fromCell]);
      break;
    }
    legalMoves.push([row, fromCell]);
  }
  //left
  for (let cell = fromCell - 1; cell >= 0; cell--) {
    if (board[fromRow][cell].player) {
      if (board[fromRow][cell].player != player) legalMoves.push([fromRow, cell]);
      break;
    }
    legalMoves.push([fromRow, cell]);
  }
  //right
  for (let cell = fromCell + 1; cell < board[0].length; cell++) {
    if (board[fromRow][cell].player) {
      if (board[fromRow][cell].player != player) legalMoves.push([fromRow, cell]);
      break;
    }
    legalMoves.push([fromRow, cell]);
  }

  return legalMoves;
}
function checkLegalMovesBishop(fromRow: number, fromCell: number, player: 1 | 2 | 0, board: Tile[][]): Position[] {
  const legalMoves: Position[] = [];

  //up left
  for (let distance = 1; distance < board.length; distance++) {
    if (board[fromRow + -1 * distance]?.[fromCell + -1 * distance]?.player) {
      if (board[fromRow + -1 * distance]?.[fromCell + -1 * distance]?.player != player)
        legalMoves.push([fromRow + -1 * distance, fromCell + -1 * distance]);
      break;
    }
    legalMoves.push([fromRow + -1 * distance, fromCell + -1 * distance]);
  }
  //up right
  for (let distance = 1; distance < board.length; distance++) {
    if (board[fromRow + -1 * distance]?.[fromCell + 1 * distance]?.player) {
      if (board[fromRow + -1 * distance]?.[fromCell + 1 * distance]?.player != player)
        legalMoves.push([fromRow + -1 * distance, fromCell + 1 * distance]);
      break;
    }
    legalMoves.push([fromRow + -1 * distance, fromCell + 1 * distance]);
  }
  //down right
  for (let distance = 1; distance < board.length; distance++) {
    if (board[fromRow + 1 * distance]?.[fromCell + 1 * distance]?.player) {
      if (board[fromRow + 1 * distance]?.[fromCell + 1 * distance]?.player != player)
        legalMoves.push([fromRow + 1 * distance, fromCell + 1 * distance]);
      break;
    }
    legalMoves.push([fromRow + 1 * distance, fromCell + 1 * distance]);
  }
  //down left
  for (let distance = 1; distance < board.length; distance++) {
    if (board[fromRow + 1 * distance]?.[fromCell + -1 * distance]?.player) {
      if (board[fromRow + 1 * distance]?.[fromCell + -1 * distance]?.player != player)
        legalMoves.push([fromRow + 1 * distance, fromCell + -1 * distance]);
      break;
    }
    legalMoves.push([fromRow + 1 * distance, fromCell + -1 * distance]);
  }
  return legalMoves;
}
function checkLegalMovesKing(fromRow: number, fromCell: number, player: 1 | 2 | 0, board: Tile[][]): Position[] {
  const legalMoves: Position[] = [];
  const offsets = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
  ];
  for (const [rowOffset, cellOffset] of offsets) {
    if (board[fromRow + rowOffset]?.[fromCell + cellOffset]) {
      if (board[fromRow + rowOffset]?.[fromCell + cellOffset]?.player != player) legalMoves.push([fromRow + rowOffset, fromCell + cellOffset]);
      continue;
    }
    legalMoves.push([fromRow + rowOffset, fromCell + cellOffset]);
  }
  return legalMoves;
}

// function removeIllegalmoves(legalMoves: Position[], board: Tile[][], player: 1 | 2, fromRow: number, fromCell: number) {
//   const checks: Position[] = [];
//   for (let action of legalMoves) {
//     checks.push(...checkChecks(player, applyMove(fromRow, fromCell, action[0], action[1], legalMoves, board)));
//   }
// }
