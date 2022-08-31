<template>
  <main class="container flex-column" @click="selectedCell = [-1, -1]">
    <div>
      <div class="board flex-row">
        <div class="row" v-for="(row, rowIndex) in board">
          <div
            class="cell"
            v-for="(cell, cellIndex) in row"
            :class="{
              selected: selectedCell[0] === rowIndex && selectedCell[1] === cellIndex,
              legal: legalMoves?.find(c => c[0] == rowIndex && c[1] == cellIndex),
              whitePiece: board[rowIndex][cellIndex].player == 1,
              blackPiece: board[rowIndex][cellIndex].player == 2,
              checking: [...King2Checked, ...King1Checked].find(p => p[0] == rowIndex && p[1] == cellIndex),
            }"
            @click.stop="cellClicked(rowIndex, cellIndex)"
          >
            {{ getUnicodePiece(cell.type) }}
            <!-- <span style="font-size: 1rem">{{ rowIndex }},{{ cellIndex }}</span> -->
          </div>
        </div>
      </div>
    </div>
    <aside>
      <div>
        <span class="text-center">Play vs Bot:</span>
        <Button @click="bot = !bot">{{ bot }}</Button>
      </div>

      <div>Player: {{ playerTurn == 1 ? 'White' : 'Black' }}</div>
      <!-- <div>selectedCell:{{ selectedCell }}</div>
          <div>WhiteChecked:{{ King1Checked }}</div>
          <div>BlackChecked:{{ King2Checked }}</div>
          <div>LagalMoves:{{ legalMoves }}</div>
          <div>AllLegalMoves:{{ AllLegalMoves }}</div> -->
      <div>checkMate:{{ checkMate }}</div>
      <div v-if="openPromotePawnSelect" class="promotions">
        <div @click.stop="choosePromotionPiece(piece)" v-for="piece of PIECES.filter(p => p != 'King' && p != 'Pawn')">
          {{ getUnicodePiece(piece) }}
        </div>
      </div>
      <div>
        moveHistory:
        <div v-for="move of moveHistory" :key="JSON.stringify(move)">
          {{ ` ${move.piece} from: ${move.from} to: ${move.to}` }}
        </div>
      </div>
    </aside>
  </main>
  <!-- <div class="letters">
    <div v-for="letter in 'abcdefgh'">{{ letter }}</div>
  </div>
  <div class="numbers">
    <div v-for="number in '87654321'">{{ number }}</div>
  </div> -->
</template>
<script setup lang="ts">
import { computed } from '@vue/reactivity';
import { ref } from 'vue';
import { board, Tile, applyMove, moveHistory, King1Checked, King2Checked, PIECES, getPieceValue } from '../board';
import { Position } from '../types';
import { checkLegalMoves, checkAllLegalMoves } from '../moves';
import { Button } from 'custom-mbd-components';
const selectedCell = ref<Position>([-1, -1]);
const playerTurn = ref<1 | 2>(1);
const bot = ref(true);
const botPlayer = ref<1 | 2>(2);

function cellClicked(rowIndex: number, cellIndex: number) {
  if (openPromotePawnSelect.value) return;
  if (selectedCell.value[0] === -1 || selectedCell.value[1] === -1) {
    if (!board.value[rowIndex][cellIndex]) return;
    if (
      (playerTurn.value === 1 && board.value[rowIndex][cellIndex].player != 1) ||
      (playerTurn.value === 2 && board.value[rowIndex][cellIndex].player != 2)
    )
      return;
    selectedCell.value = [rowIndex, cellIndex];
  } else {
    const [fromRow, fromCell] = selectedCell.value;
    const toRow = rowIndex;
    const toCell = cellIndex;
    if (toCell == fromCell && toRow == fromRow) return;
    if (board.value[toRow][toCell].player == playerTurn.value) {
      selectedCell.value = [toRow, toCell];
      return;
    }
    board.value = applyMove(fromRow, fromCell, toRow, toCell, legalMoves.value, board.value, playerTurn, selectedCell, moveHistory);
    if (bot && playerTurn.value == botPlayer.value && !checkMate.value) {
      setTimeout(botMove, 500);
    }
  }
}
function botMove() {
  if (openPromotePawnSelect.value) return;
  let move = getGoodBotMove(moveableBotPieces.value);
  selectedCell.value = move.piece;
  board.value = applyMove(
    move.piece[0],
    move.piece[1],
    move.target[0],
    move.target[1],
    legalMoves.value,
    board.value,
    playerTurn,
    selectedCell,
    moveHistory
  );
  if (openPromotePawnSelect.value) {
    choosePromotionPiece('Queen');
  }
}
function getGoodBotMove(moveableBotPieces: Position[]) {
  type Move = { piece: Position; targets: Position[] };
  type ReturnMove = { piece: Position; target: Position };
  let returnMove: ReturnMove | null = null;

  let takeBlunders: Move[] = [];

  let targetablePieces: Move[] = [];
  //get targetable Pieces
  for (let position of moveableBotPieces) {
    let targets = checkLegalMoves(position[0], position[1], board.value, true).filter(m => board.value[m[0]][m[1]].type);
    targetablePieces.push({ piece: position, targets: targets });
  }
  targetablePieces = targetablePieces.filter(m => m.targets.length != 0);

  // filter for free pieces
  takeBlunders = [...targetablePieces];
  let enemyMoves: Position[] = [];
  for (let move of takeBlunders) {
    for (let target of move.targets) {
      enemyMoves.push(
        ...checkAllLegalMoves(
          applyMove(
            move.piece[0],
            move.piece[1],
            target[0],
            target[1],
            checkLegalMoves(move.piece[0], move.piece[1], board.value, true),
            board.value
          ),
          botPlayer.value == 1 ? 2 : 1
        )
      );
      move.targets = move.targets.filter(t => !enemyMoves.find(m => t[0] == m[0] && t[1] == m[1]));
    }
  }
  takeBlunders.filter(m => m.targets.length > 0);

  //take queen if possible
  let QueenTakes: Move[] = [];
  for (let position of moveableBotPieces) {
    let targets = checkLegalMoves(position[0], position[1], board.value, true).filter(m => board.value[m[0]][m[1]].type == 'Queen');
    if (targets.length) QueenTakes.push({ piece: position, targets: targets });
  }

  //checkmate if possible
  let checkmate = {} as ReturnMove;
  for (let piece of moveableBotPieces) {
    for (let target of checkLegalMoves(piece[0], piece[1], board.value, true)) {
      if (
        checkAllLegalMoves(
          applyMove(piece[0], piece[1], target[0], target[1], checkLegalMoves(piece[0], piece[1], board.value, true), board.value),
          botPlayer.value == 1 ? 2 : 1
        ).length == 0
      ) {
        checkmate = { piece, target };
      }
    }
  }

  // prevent blunders
  // castle
  // develop
  // trade horses and bishops
  // move towards enemy king

  if (checkmate.piece && checkmate.target) {
    returnMove = checkmate;
    console.log('checkmate');
  } else if (QueenTakes.length) {
    let position = QueenTakes.map(m => m.piece).sort(
      (a, b) => getPieceValue(board.value[a[0]][a[1]].type) - getPieceValue(board.value[b[0]][b[1]].type)
    )[0];
    let target = QueenTakes.find(m => m.piece[0] == position[0] && m.piece[1] == position[1])!.targets[0];
    returnMove = { piece: position, target };
    console.log('takeQueen');
  } else if (takeBlunders.length && takeBlunders[0].targets[0]) {
    returnMove = { piece: takeBlunders[0].piece, target: takeBlunders[0].targets[0] };
    console.log('takeBlunder', takeBlunders);
  }
  //get random move if nothing else works //TODO: update the if for every prio above
  else {
    let position = moveableBotPieces[Math.floor(Math.random() * moveableBotPieces.length)];
    let legalBotMoves = checkLegalMoves(position[0], position[1], board.value, true);
    let target = legalBotMoves[Math.floor(Math.random() * legalBotMoves.length)];
    returnMove = { piece: position, target: target };
    console.log('RandomMove');
  }
  return returnMove;
}
function choosePromotionPiece(piece: Tile['type']) {
  if (!openPromotePawnSelect.value) return;
  board.value[openPromotePawnSelect.value[0]][openPromotePawnSelect.value[1]].type = piece;
  if (botPlayer.value == playerTurn.value) {
    botMove();
  }
}
function getMoveableBotPieces(botPlayer: number) {
  let pieces: Position[] = [];
  for (let [rowIndex, row] of Object.entries(board.value)) {
    for (let [cellIndex, cell] of Object.entries(row)) {
      if (board.value[+rowIndex][+cellIndex].player == botPlayer && checkLegalMoves(+rowIndex, +cellIndex, board.value, true).length != 0) {
        pieces.push([+rowIndex, +cellIndex]);
      }
    }
  }
  return pieces;
}

const moveableBotPieces = computed(() => getMoveableBotPieces(botPlayer.value));
const legalMoves = computed(() => checkLegalMoves(selectedCell.value[0], selectedCell.value[1], board.value, true));
const AllLegalMoves = computed(() => checkAllLegalMoves(board.value, playerTurn.value));
const checkMate = computed(() =>
  King2Checked.value.length > 0 && AllLegalMoves.value.length == 0
    ? 'checkmate for white'
    : King1Checked.value.length > 0 && AllLegalMoves.value.length == 0
    ? 'checkmate for black'
    : King1Checked.value.length == 0 && King2Checked.value.length == 0 && AllLegalMoves.value.length == 0
    ? 'stalemate'
    : ''
);

const openPromotePawnSelect = computed(() => {
  for (let [rowIndex, row] of Object.entries(board.value)) {
    for (let [cellIndex, cell] of Object.entries(row)) {
      if (cell.type == 'Pawn' && (+rowIndex == 0 || +rowIndex == 7)) return [+rowIndex, +cellIndex];
    }
  }
  return null;
});

const UNICODE_PIECES = {
  King: 0x2654,
  Queen: 0x2655,
  Rook: 0x2656,
  Bishop: 0x2657,
  Knight: 0x2658,
  Pawn: 0x2659,
};
function getUnicodePiece(string: Tile['type']) {
  if (string == '') return '';
  return String.fromCharCode(UNICODE_PIECES[string] + 6);
}
</script>
<style lang="scss" scoped>
$size: 12vw;

.board {
  transform: rotateX(180deg);

  .row {
    display: grid;
    grid-template-columns: repeat(8, auto);
    .cell {
      border: 1px solid #000;
      display: flex;
      justify-content: center;
      align-items: center;
      width: $size;
      height: $size;
      cursor: pointer;
      background-color: gray;
      transform: rotateX(180deg);
      font-size: 5rem;
      @media (max-width: 1000px) {
        font-size: 2.5rem;
      }
    }
  }
}

aside * {
  margin: 20px;
}

.row:nth-child(odd) .cell:nth-child(even) {
  background: #854000;
}
.row:nth-child(even) .cell:nth-child(odd) {
  background: #854000;
}
.selected {
  box-shadow: inset 0 0 0 2000px rgba(35, 211, 0, 0.5);
  color: white;
}
.checking {
  background-color: red !important;
}
.legal {
  background-color: aqua !important;
}
.whitePiece {
  color: white;
}
.BlackPiece {
  color: black;
}

main {
  display: flex;
  margin: 8px;
}

// .numbers {
//   position: absolute;
//   top: 10px;
//   left: 10px;
//   * {
//     height: $size;
//     font-size: 20px;
//   }
// }
// .letters {
//   position: absolute;
//   top: calc($size * 8 - 20px);
//   left: calc($size - 8px);
//   display: flex;
//   width: min-content;
//   * {
//     width: calc($size);
//     font-size: 20px;
//   }
// }
.promotions {
  font-size: 2.5rem;
  background-color: black;
  color: white;
  display: flex;
  * {
    width: $size;
    height: $size;
    cursor: pointer;
  }
}
</style>
