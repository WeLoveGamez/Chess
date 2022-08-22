import { board } from './board';

export function checkLegalMoves(fromRow: number, fromCell: number): [number, number][] {
  if (fromRow == -1 || fromCell == -1) return [];
  const legalMoves: [number, number][] = [];
  const tile = board.value[fromRow][fromCell];
  const piece = tile.type;
  const player = tile.player;
  if (piece.includes('Rook')) {
    legalMoves.push(...checkLegalMovesRook(fromRow, fromCell, player));
  }
  if (piece.includes('Knight')) {
    legalMoves.push(...checkLegalMovesKnight(fromRow, fromCell, player));
  }
  if (piece.includes('Bishop')) {
    legalMoves.push(...checkLegalMovesBishop(fromRow, fromCell, player));
  }
  if (piece.includes('Queen')) {
    legalMoves.push(...checkLegalMovesBishop(fromRow, fromCell, player));
    legalMoves.push(...checkLegalMovesRook(fromRow, fromCell, player));
  }
  if (piece.includes('King')) {
    legalMoves.push(...checkLegalMovesKing(fromRow, fromCell, player));
  }
  if (piece.includes('Pawn')) {
    legalMoves.push(...checkLegalMovesPawn(fromRow, fromCell, player));
  }

  return legalMoves;
}

function checkLegalMovesPawn(fromRow: number, fromCell: number, player: 1 | 2 | 0): [number, number][] {
  const legalMoves: [number, number][] = [];
  const playerOffset = player == 1 ? 1 : -1;
  //straight
  if (board.value[fromRow + playerOffset][fromCell].type == '') legalMoves.push([fromRow + playerOffset, fromCell]);

  //straight 2
  if (fromRow == (playerOffset == 1 ? 1 : 6) && board.value[fromRow + 2 * playerOffset][fromCell].type == '') {
    legalMoves.push([fromRow + 2 * playerOffset, fromCell]);
  }

  //diagonal right
  if (board.value[fromRow + playerOffset][fromCell + playerOffset]?.player != player) {
    legalMoves.push([fromRow + playerOffset, fromCell + playerOffset]);
  }
  //diagonal left
  if (board.value[fromRow + playerOffset][fromCell - playerOffset]?.player != player) {
    legalMoves.push([fromRow + playerOffset, fromCell - playerOffset]);
  }
  return legalMoves;
}
function checkLegalMovesKnight(fromRow: number, fromCell: number, player: 1 | 2 | 0): [number, number][] {
  const legalMoves: [number, number][] = [];
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
    if (board.value?.[fromRow + rowOffset]?.[fromCell + cellOffset]?.player != player) {
      legalMoves.push([fromRow + rowOffset, fromCell + cellOffset]);
    }
  }
  return legalMoves;
}

function checkLegalMovesRook(fromRow: number, fromCell: number, player: 1 | 2 | 0): [number, number][] {
  const legalMoves: [number, number][] = [];

  //down
  for (let row = fromRow + 1; row < board.value.length; row++) {
    if (board.value[row][fromCell]) {
      if (board.value[row][fromCell].player != player) legalMoves.push([row, fromCell]);
      break;
    }
    legalMoves.push([row, fromCell]);
  }
  //up
  for (let row = fromRow - 1; row >= 0; row--) {
    if (board.value[row][fromCell]) {
      if (board.value[row][fromCell].player != player) legalMoves.push([row, fromCell]);
      break;
    }
    legalMoves.push([row, fromCell]);
  }
  //left
  for (let cell = fromCell - 1; cell >= 0; cell--) {
    if (board.value[fromRow][cell]) {
      if (board.value[fromRow][cell].player != player) legalMoves.push([fromRow, cell]);
      break;
    }
    legalMoves.push([fromRow, cell]);
  }
  //right
  for (let cell = fromCell + 1; cell < board.value[0].length; cell++) {
    if (board.value[fromRow][cell]) {
      if (board.value[fromRow][cell].player != player) legalMoves.push([fromRow, cell]);
      break;
    }
    legalMoves.push([fromRow, cell]);
  }

  return legalMoves;
}
function checkLegalMovesBishop(fromRow: number, fromCell: number, player: 1 | 2 | 0): [number, number][] {
  const legalMoves: [number, number][] = [];

  //up left
  for (let distance = 1; distance < board.value.length; distance++) {
    if (board.value[fromRow + -1 * distance]?.[fromCell + -1 * distance]) {
      if (board.value[fromRow + -1 * distance]?.[fromCell + -1 * distance]?.player != player)
        legalMoves.push([fromRow + -1 * distance, fromCell + -1 * distance]);
      break;
    }
    legalMoves.push([fromRow + -1 * distance, fromCell + -1 * distance]);
  }
  //up right
  for (let distance = 1; distance < board.value.length; distance++) {
    if (board.value[fromRow + -1 * distance]?.[fromCell + 1 * distance]) {
      if (board.value[fromRow + -1 * distance]?.[fromCell + 1 * distance]?.player != player)
        legalMoves.push([fromRow + -1 * distance, fromCell + 1 * distance]);
      break;
    }
    legalMoves.push([fromRow + -1 * distance, fromCell + 1 * distance]);
  }
  //down right
  for (let distance = 1; distance < board.value.length; distance++) {
    if (board.value[fromRow + 1 * distance]?.[fromCell + 1 * distance]) {
      if (board.value[fromRow + 1 * distance]?.[fromCell + 1 * distance]?.player != player)
        legalMoves.push([fromRow + 1 * distance, fromCell + 1 * distance]);
      break;
    }
    legalMoves.push([fromRow + 1 * distance, fromCell + 1 * distance]);
  }
  //down left
  for (let distance = 1; distance < board.value.length; distance++) {
    if (board.value[fromRow + 1 * distance]?.[fromCell + -1 * distance]) {
      if (board.value[fromRow + 1 * distance]?.[fromCell + -1 * distance]?.player != player)
        legalMoves.push([fromRow + 1 * distance, fromCell + -1 * distance]);
      break;
    }
    legalMoves.push([fromRow + 1 * distance, fromCell + -1 * distance]);
  }
  return legalMoves;
}
function checkLegalMovesKing(fromRow: number, fromCell: number, player: 1 | 2 | 0): [number, number][] {
  const legalMoves: [number, number][] = [];
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
    if (board.value[fromRow + rowOffset]?.[fromCell + cellOffset]) {
      if (board.value[fromRow + rowOffset]?.[fromCell + cellOffset]?.player != player) legalMoves.push([fromRow + rowOffset, fromCell + cellOffset]);
      continue;
    }
    legalMoves.push([fromRow + rowOffset, fromCell + cellOffset]);
  }
  return legalMoves;
}
