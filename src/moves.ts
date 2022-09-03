import type { Tile } from './board';
import type { Position } from './types';
import { applyMove, moveHistory, King1Checked, King2Checked } from './board';

export function checkChecks(player: 1 | 2, board: Tile[][]) {
  const checkingPieces: Position[] = [];
  let kingPosition: Position = [-1, -1];
  for (let i = 0; i < board.length; i++) {
    for (let j = 0; j < board[0].length; j++) {
      if (board[i][j]?.type == 'King' && board[i][j].player == player) kingPosition = [i, j];
    }
  }

  for (let i = 0; i < board.length; i++) {
    for (let j = 0; j < board[0].length; j++) {
      const legalMoves: Position[] = [];
      if (board[i][j].player && board[i][j].player != player) legalMoves.push(...checkLegalMoves(i, j, board, false));
      if (legalMoves.find(m => m[0] == kingPosition[0] && m[1] == kingPosition[1])) {
        checkingPieces.push([i, j]);
      }
    }
  }
  return checkingPieces;
}

export function checkLegalMoves(fromRow: number, fromCell: number, board: Tile[][], checkIllegalMoves: boolean): Position[] {
  if (fromRow == -1 || fromCell == -1) return [];

  const tile = board[fromRow][fromCell];
  const piece = tile.type;
  const player = tile.player;
  let legalMoves = {
    Rook: checkLegalMovesRook,
    Knight: checkLegalMovesKnight,
    Bishop: checkLegalMovesBishop,
    Queen: (...args: [number, number, 1 | 2 | 0, Tile[][]]) => [...checkLegalMovesBishop(...args), ...checkLegalMovesRook(...args)],
    King: checkLegalMovesKing,
    Pawn: checkLegalMovesPawn,
    '': () => [],
  }[piece](fromRow, fromCell, player, board);

  if (player && checkIllegalMoves) legalMoves = removeIllegalmoves(legalMoves, board, player, fromRow, fromCell);
  return legalMoves;
}
export function checkAllLegalMoves(board: Tile[][], player: 1 | 2): Position[] {
  let legalMoves: Position[] = [];
  for (let [rowIndex, row] of Object.entries(board)) {
    for (let [cellIndex, cell] of Object.entries(row)) {
      if (cell.player == player) legalMoves.push(...checkLegalMoves(+rowIndex, +cellIndex, board, true));
    }
  }
  return legalMoves;
}

function checkLegalMovesPawn(fromRow: number, fromCell: number, player: 1 | 2 | 0, board: Tile[][]): Position[] {
  const legalMoves: Position[] = [];
  const playerOffset = player == 1 ? 1 : -1;
  //straight
  if (board[fromRow + playerOffset]?.[fromCell]?.type == '') legalMoves.push([fromRow + playerOffset, fromCell]);
  //straight 2
  if (
    fromRow == (playerOffset == 1 ? 1 : 6) &&
    board[fromRow + 2 * playerOffset]?.[fromCell]?.type == '' &&
    board[fromRow + playerOffset]?.[fromCell]?.type == ''
  ) {
    legalMoves.push([fromRow + 2 * playerOffset, fromCell]);
  }

  //diagonal right
  let tilePlayer = board[fromRow + playerOffset]?.[fromCell + playerOffset]?.player;
  if (tilePlayer && tilePlayer != player) {
    legalMoves.push([fromRow + playerOffset, fromCell + playerOffset]);
  }
  //diagonal left
  tilePlayer = board[fromRow + playerOffset]?.[fromCell - playerOffset]?.player;
  if (tilePlayer && tilePlayer != player) {
    legalMoves.push([fromRow + playerOffset, fromCell - playerOffset]);
  }
  // en passant
  if (fromRow == (player == 1 ? 4 : 3)) {
    if (board[fromRow][fromCell - 1]?.type == 'Pawn' || board[fromRow][fromCell + 1]?.type == 'Pawn') {
      if (moveHistory.value.at(-1)?.to[0] == fromRow && moveHistory.value.at(-1)?.from[0] == fromRow + 2 * playerOffset) {
        legalMoves.push([fromRow + playerOffset, moveHistory.value.at(-1)!.to[1]]);
      }
    }
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
  if (!(board.length == 8 && board[0].length == 8)) return legalMoves;
  //große Rochade schwarz
  if (
    player == 2 &&
    !moveHistory.value.find(m => m.from[0] == 7 && m.from[1] == 4) &&
    !moveHistory.value.find(m => m.from[0] == 7 && m.from[1] == 0) &&
    board[7][1].type == '' &&
    board[7][2].type == '' &&
    board[7][3].type == '' &&
    King2Checked.value?.length == 0 &&
    legalMoves.find(m => m[0] == 7 && m[1] == 3)
  ) {
    legalMoves.push([7, 2]);
  }

  //kleine Rochade schwarz
  if (
    player == 2 &&
    !moveHistory.value.find(m => m.from[0] == 7 && m.from[1] == 4) &&
    !moveHistory.value.find(m => m.from[0] == 7 && m.from[1] == 7) &&
    board[7][5].type == '' &&
    board[7][6].type == '' &&
    King2Checked.value?.length == 0 &&
    legalMoves.find(m => m[0] == 7 && m[1] == 5)
  ) {
    legalMoves.push([7, 6]);
  }
  //große Rochade weiß
  if (
    player == 1 &&
    !moveHistory.value.find(m => m.from[0] == 0 && m.from[1] == 4) &&
    !moveHistory.value.find(m => m.from[0] == 0 && m.from[1] == 0) &&
    board[0][1].type == '' &&
    board[0][2].type == '' &&
    board[0][3].type == '' &&
    King1Checked.value?.length == 0 &&
    legalMoves.find(m => m[0] == 0 && m[1] == 3)
  ) {
    legalMoves.push([0, 2]);
  }
  //kleine Rochade weiß
  if (
    player == 1 &&
    !moveHistory.value.find(m => m.from[0] == 0 && m.from[1] == 4) &&
    !moveHistory.value.find(m => m.from[0] == 0 && m.from[1] == 7) &&
    board[0][5].type == '' &&
    board[0][6].type == '' &&
    King1Checked.value?.length == 0 &&
    legalMoves.find(m => m[0] == 0 && m[1] == 5)
  ) {
    legalMoves.push([0, 6]);
  }

  return legalMoves;
}

function removeIllegalmoves(legalMoves: Position[], board: Tile[][], player: 1 | 2, fromRow: number, fromCell: number): Position[] {
  const checks: Position[] = [];
  if (!board[fromRow][fromCell].type) return [];
  legalMoves = legalMoves.filter(m => 0 <= m[0] && m[0] <= board.length - 1 && m[1] <= board[0].length - 1 && 0 <= m[1]);
  for (let action of legalMoves) {
    if (checkChecks(player, applyMove(fromRow, fromCell, action[0], action[1], legalMoves, board)).length > 0) {
      checks.push(action);
    }
  }
  return legalMoves.filter(m => !checks.find(c => c[0] == m[0] && c[1] == m[1]));
}
