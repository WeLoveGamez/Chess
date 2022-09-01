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
              lastMoved:
                (lastMovedCell?.from[0] == rowIndex && lastMovedCell?.from[1] == cellIndex) ||
                (lastMovedCell?.to[0] == rowIndex && lastMovedCell?.to[1] == cellIndex),
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
      <div>
        <Button @click="goToMenu()">Menu</Button>
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
  <Modal
    :title="checkMate"
    affirm-alt-text="Menu"
    affirm-text="Play Again"
    :affirm-action="closeModal"
    :affirm-alt-action="goToMenu"
    :model-value="!!checkMate"
    @update:model-value="show => (show ? calcAfterGame() : closeModal())"
  >
    <div>Money:e^i*Pi</div>
    <div>Exp:Pi</div>
  </Modal>
</template>
<script setup lang="ts">
import { computed } from '@vue/reactivity';
import {
  board,
  Tile,
  applyMove,
  moveHistory,
  King1Checked,
  King2Checked,
  PIECES,
  selectedCell,
  playerTurn,
  createBoard,
  deadPieces,
  getPieceValue,
  lastMovedCell,
} from '../board';

import { Modal, Button, handleClick } from 'custom-mbd-components';
// test
import { bot, getGoodBotMove, botPlayer, legalMoves, checkMate, moveableBotPieces } from '../bot';
import { player } from '../Player';
import { setPlayer } from '../API';
import router from '../router';
function calcAfterGame() {
  for (let piece of deadPieces.value.filter(e => e.player == botPlayer.value)) {
    player.value.money += getPieceValue(piece.name);
  }
  if (checkMate.value.includes('white'))
    for (let piece of board.value.flatMap(p => p.filter(e => e.type)).filter(e => e.player != botPlayer.value)) {
      player.value.exp += getPieceValue(piece.type);
    }
}
function closeModal() {
  handleClick(goToMenu, startGame);
}
function goToMenu() {
  setPlayer(player.value);
  router.push({ name: 'Menu' });
}
function startGame() {
  createBoard();
}

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
  if (!move.piece[0] || !move.target[0]) return;
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

function choosePromotionPiece(piece: Tile['type']) {
  if (!openPromotePawnSelect.value) return;
  board.value[openPromotePawnSelect.value[0]][openPromotePawnSelect.value[1]].type = piece;
  if (botPlayer.value == playerTurn.value) {
    botMove();
  }
}

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
.lastMoved {
  background-color: rgb(146, 155, 108) !important;
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
