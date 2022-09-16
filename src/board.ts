import { computed, Ref, ref } from 'vue';
import { checkAllLegalMoves, checkChecks, checkLegalMoves } from './moves';
import type { Position, DeadPiece, UnitName, Tile } from './types';
import { player, boardSize, maxValue } from './Player';
import { getPieceValue } from './utils';
import { botPlayer } from './bot';

export const King1Checked = computed(() => checkChecks(1, board.value));
export const King2Checked = computed(() => checkChecks(2, board.value));
export const lastMovedCell = computed(() => moveHistory.value.at(-1));
// export const moveableBotPieces = computed(() => getMoveableBotPieces(botPlayer.value));
export const legalMoves = computed(() => checkLegalMoves(selectedCell.value[0], selectedCell.value[1], board.value, true));
export const AllLegalMoves = computed(() => checkAllLegalMoves(board.value, playerTurn.value));
export const stalemateCheck = ref(0);

export const openPromotePawnSelect = computed(() => {
  for (let [rowIndex, row] of Object.entries(board.value)) {
    for (let [cellIndex, cell] of Object.entries(row)) {
      if (
        cell.type == 'Pawn' &&
        ((+rowIndex == 0 && cell.player == 2 && player.value.units.filter(p => p.name != 'King' && p.name != 'Pawn').length > 0) ||
          (+rowIndex == board.value.length - 1 &&
            cell.player == 1 &&
            player.value.units.filter(p => p.name != 'King' && p.name != 'Pawn' && p.amount > 0).length > 0))
      )
        return [+rowIndex, +cellIndex];
    }
  }
  return null;
});
export const checkMate = computed(() =>
  King2Checked.value.length > 0 && AllLegalMoves.value.length == 0
    ? 'checkmate for white'
    : King1Checked.value.length > 0 && AllLegalMoves.value.length == 0
    ? 'checkmate for black'
    : (King1Checked.value.length == 0 && King2Checked.value.length == 0 && AllLegalMoves.value.length == 0 && !openPromotePawnSelect.value) ||
      piecesOnBoard.value == 2 ||
      stalemateCheck.value > 10
    ? 'stalemate'
    : ''
);

export const moveHistory = ref<{ from: Position; to: Position; piece: Tile['type'] }[]>([]);
export const selectedCell = ref<Position>([-1, -1]);
export const playerTurn = ref<1 | 2>(1);
export const autoPlay = ref(false);
export const piecesOnBoard = computed(() => board.value.flatMap(p => p.filter(e => e.type)).length);
export const deadPieces = ref<DeadPiece[]>([]);
export const board = ref<Tile[][]>([]);

export function getTile(position: Position) {
  console.trace(position);
  return board.value[position[0]][position[1]];
}
export function getPieceType(position: Position): UnitName {
  return getTile(position).type;
}
export function getTilePlayer(position: Position): 0 | 1 | 2 {
  return getTile(position).player;
}

createBoard();
export function createBoard() {
  playerTurn.value = 1;
  botPlayer.value = autoPlay.value ? 1 : 2;
  stalemateCheck.value = 0;
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
  }
  for (let i = 0; i < boardSize.value.row - backline.length; i++) {
    backline.push({ type: '', player: 0 });
  }
  let enemyValue = 4;
  let enemyUnits: UnitName[] = ['King'];
  const possibleUnits = player.value.units.filter(e => e.name != 'King');

  for (let i = 1; i < frontline.length * 2; i++) {
    if (enemyValue <= maxValue.value) {
      enemyUnits[i] = possibleUnits[Math.floor(Math.random() * possibleUnits.length)].name;
      enemyValue += getPieceValue(enemyUnits[i]);
    } else {
      if (maxValue.value - enemyValue >= 2) {
        enemyUnits[i] = 'Pawn';
        enemyValue += getPieceValue('Pawn');
        continue;
      }
      enemyUnits[i] = '';
    }
  }
  enemyUnits = enemyUnits.shuffle();
  let index = enemyUnits.findIndex(e => e == 'King') + 1;
  let front, back;
  if (index > enemyUnits.length / 2) {
    back = enemyUnits.splice(enemyUnits.length / 2);
    front = enemyUnits;
  } else {
    front = enemyUnits.splice(enemyUnits.length / 2);
    back = enemyUnits;
  }

  const enemyFrontline = front.map(e => {
    return { type: e, player: e ? 2 : 0 } as Tile;
  });
  const enemyBackline = back.map(e => {
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

const UNICODE_PIECES = {
  King: 0x2654,
  Queen: 0x2655,
  Rook: 0x2656,
  Bishop: 0x2657,
  Knight: 0x2658,
  Pawn: 0x2659,
};
export function getUnicodePiece(string: Tile['type']) {
  if (string == '') return '';
  return String.fromCharCode(UNICODE_PIECES[string] + 6);
}
