import { computed, Ref, ref } from 'vue';
import { checkChecks } from './moves';
import type { Position, DeadPiece, UnitName } from './types';
import { player, boardSize } from './Player';
import { botPlayer } from './bot';
export const moveHistory = ref<{ from: Position; to: Position; piece: Tile['type'] }[]>([]);
export const King1Checked = computed(() => checkChecks(1, board.value));
export const King2Checked = computed(() => checkChecks(2, board.value));
export const lastMovedCell = computed(() => moveHistory.value.at(-1));
export const stalemateCheck = ref(0);

export interface Tile {
  type: typeof PIECES[number] | '';
  player: 1 | 2 | 0;
}
export const PIECES = ['Rook', 'Knight', 'Bishop', 'Queen', 'King', 'Pawn'] as const;

export const selectedCell = ref<Position>([-1, -1]);
export const playerTurn = ref<1 | 2>(1);
export const autoPlay = ref(false);
export const piecesOnBoard = computed(() => board.value.flatMap(p => p.filter(e => e.type)).length);
export const deadPieces = ref<DeadPiece[]>([]);
export const board = ref<Tile[][]>([]);
createBoard();
export function createBoard() {
  playerTurn.value = 1;
  botPlayer.value = autoPlay.value ? 1 : 2;
  deadPieces.value = [];
  moveHistory.value = [];
  const frontline = player.value.lineup.frontline.map(e => {
    return { type: e, player: e ? 1 : 0 } as Tile;
  });
  const backline = player.value.lineup.backline.map(e => {
    return { type: e, player: e ? 1 : 0 } as Tile;
  });
  for (let i = 0; i < boardSize.value.row - frontline.length; i++) {
    frontline.push({ type: '', player: 0 });
    backline.push({ type: '', player: 0 });
  }

  let value = 0;
  for (let unit of frontline.concat(backline)) {
    value += getPieceValue(unit.type);
  }

  let enemyValue = 4;
  let enemyUnits: UnitName[] = ['King'];
  const possibleUnits = player.value.units.filter(e => e.name != 'King');

  for (let i = 1; i < frontline.length * 2; i++) {
    if (enemyValue <= value) {
      enemyUnits[i] = possibleUnits[Math.floor(Math.random() * possibleUnits.length)].name;
      enemyValue += getPieceValue(enemyUnits[i]);
    } else {
      if (enemyValue - value <= 2) {
        enemyUnits[i] = 'Pawn';
        enemyValue += getPieceValue('Pawn');
        continue;
      }
      enemyUnits[i] = '';
    }
  }

  enemyUnits = shuffle(enemyUnits);
  const enemyFrontline = enemyUnits.splice(0, frontline.length).map(e => {
    return { type: e, player: e ? 2 : 0 } as Tile;
  });
  const enemyBackline = enemyUnits.map(e => {
    return { type: e, player: e ? 2 : 0 } as Tile;
  });

  const buildBoard = [];
  buildBoard.push(backline);
  buildBoard.push(frontline);
  for (let i = 0; i < boardSize.value.cell - 4; i++) buildBoard.push(new Array(backline.length).fill({ type: '', player: 0 }));
  buildBoard.push(enemyFrontline);
  buildBoard.push(enemyBackline);

  board.value = buildBoard;
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
): Tile[][] {
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
      stalemateCheck.value++;
      if (player) {
        deadPieces.value.push({ name: board[toRow][toCell].type, player: player });
        stalemateCheck.value = 0;
      }
      moveHistory?.value.push({ from: [fromRow, fromCell], to: [toRow, toCell], piece: board[fromRow][fromCell].type });
      playerTurn.value = playerTurn.value == 1 ? 2 : 1;
      selectedCell.value = [-1, -1];
    }
  }

  return copyBoard;
}
function shuffle(array: any[]) {
  let counter = array.length;

  // While there are elements in the array
  while (counter > 0) {
    // Pick a random index
    let index = Math.floor(Math.random() * counter);

    // Decrease counter by 1
    counter--;

    // And swap the last element with it
    let temp = array[counter];
    array[counter] = array[index];
    array[index] = temp;
  }

  return array;
}
