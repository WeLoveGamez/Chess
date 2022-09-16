<template>
  <main class="container flex-column p-0 m-0" @click="selectedCell = [-1, -1]">
    <div class="d-flex justify-content-center">
      <div class="board">
        <div class="rows" v-for="(row, rowIndex) in board">
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
          </div>
        </div>
      </div>
    </div>

    <div
      class="promotions mt-2"
      v-if="openPromotePawnSelect"
      @click.stop="choosePromotionPiece(piece.name)"
      v-for="piece of player.units.filter(p => p.name != 'King' && p.name != 'Pawn' && p.amount > 0)"
    >
      {{ getUnicodePiece(piece.name) }}
    </div>
    <aside>
      <div>Player: {{ playerTurn == 1 ? 'White' : 'Black' }}</div>
      <div class="mt-1">
        <Button class="button" @click="bot = !bot">{{ bot ? 'bot' : 'player' }}</Button>
      </div>
      <div v-if="bot && !activeGame">
        <Button
          @click="
            () => {
              botPlayer = 1;
              activeGame = true;
              botMove();
            }
          "
        >
          start
        </Button>
      </div>
      <div>
        <Button class="button" @click="autoPlay = !autoPlay">{{ autoPlay ? 'auto play' : 'no auto play' }}</Button>
      </div>
      <div>
        <Button class="button" @click="goToMenu()">Menu</Button>
      </div>
    </aside>
  </main>
  <Modal
    :title="checkMate"
    affirm-alt-text="Menu"
    affirm-text="Play Again"
    :affirm-action="closeModal"
    affirm-class="affirmButton"
    :affirm-alt-action="goToMenu"
    :model-value="!!checkMate"
    @update:model-value="show => (show ? calcAfterGame() : closeModal())"
  >
    <div>
      {{ rewards.money }}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        fill="currentColor"
        class="bi bi-cash"
        viewBox="0 0 16 16"
        style="margin-bottom: 0.2rem"
      >
        <path d="M8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
        <path
          d="M0 4a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H1a1 1 0 0 1-1-1V4zm3 0a2 2 0 0 1-2 2v4a2 2 0 0 1 2 2h10a2 2 0 0 1 2-2V6a2 2 0 0 1-2-2H3z"
        />
      </svg>
    </div>
    <div>{{ rewards.exp }} Exp</div>
    <template #button>
      <div></div>
    </template>
  </Modal>
</template>
<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue';
import router from '../router';
import { Modal, Button, handleClick, Alert } from 'custom-mbd-components';
import type { Tile } from '../types';
import { bot, getGoodBotMove, botPlayer } from '../bot';
import { lvlUp, player, haveAllNeedUnits, gainExp } from '../Player';
import { setPlayer } from '../API';
import { getPieceValue } from '../utils';
import NoSleep from 'nosleep.js';
import {
  board,
  applyMove,
  moveHistory,
  King1Checked,
  King2Checked,
  selectedCell,
  playerTurn,
  createBoard,
  deadPieces,
  lastMovedCell,
  openPromotePawnSelect,
  checkMate,
  legalMoves,
  autoPlay,
  getUnicodePiece,
} from '../board';

const noSleep = new NoSleep();
noSleep.enable();

const activeGame = ref(false);

const rewards = ref({ money: 0, exp: 0 });
function calcAfterGame() {
  for (let piece of deadPieces.value.filter(e => e.player == 2)) {
    rewards.value.money += getPieceValue(piece.name);
  }
  for (let piece of board.value.flatMap(p => p.filter(e => e.type)).filter(e => e.player == 1)) {
    rewards.value.exp += getPieceValue(piece.type);
  }
  if (checkMate.value.includes('white')) {
    rewards.value.money = Math.round(rewards.value.money);
    rewards.value.exp = Math.round(rewards.value.exp);
  }

  if (checkMate.value.includes('stalemate')) {
    rewards.value.money = Math.round(rewards.value.money / 2);
    rewards.value.exp = Math.round(rewards.value.exp / 2);
  }
  if (checkMate.value.includes('black')) {
    rewards.value.money = Math.round(rewards.value.money / 4);
    rewards.value.exp = Math.round(rewards.value.exp / 4);
  }
  gainExp(rewards.value.exp);
  player.value.money += rewards.value.money;

  for (let piece of deadPieces.value.filter(e => e.player == 1)) {
    const unit = player.value.units.find(e => e.name == piece.name);
    if (unit) unit.amount--;
  }
  for (let piece of player.value.units) {
    piece.amount += piece.amountPerRound;
    if (piece.amount > piece.maxAmount) piece.amount = piece.maxAmount;
  }
  noSleep.disable();
  if (autoPlay.value && player.value.money >= 5) {
    player.value.money -= 5;
    const collection = document.getElementsByClassName('affirmButton');
    setTimeout(() => {
      (collection[0] as HTMLElement).click();
      activeGame.value = true;
    }, 2000);
  }
  activeGame.value = false;
  setPlayer(player.value);
}
function resetRewards() {
  rewards.value = { money: 0, exp: 0 };
}
function closeModal() {
  resetRewards();
  handleClick(goToMenu, startGame);
}
function goToMenu() {
  activeGame.value = false;
  router.push({ name: 'Menu' });
}
function startGame() {
  if (!haveAllNeedUnits.value) goToMenu();
  noSleep.enable();
  createBoard();
  if (autoPlay.value) setTimeout(botMove, 500);
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
    activeGame.value = true;
    if (bot && playerTurn.value == botPlayer.value && !checkMate.value) {
      setTimeout(botMove, 500);
    }
  }
}
function botMove() {
  if (!activeGame.value) return;
  if (openPromotePawnSelect.value || checkMate.value) return;
  let move = getGoodBotMove();
  if ((move && !(typeof move.piece[0] == 'number')) || !(typeof move.target[0] == 'number')) return;
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
    choosePromotionPiece(player.value.units.filter(p => p.name != 'King' && p.name != 'Pawn').sort((a, b) => b.value - a.value)[0].name);
  }
  if (bot.value) {
    botPlayer.value = botPlayer.value == 1 ? 2 : 1;
    setTimeout(botMove, 500);
  }
}

function choosePromotionPiece(piece: Tile['type']) {
  if (!openPromotePawnSelect.value) return;
  board.value[openPromotePawnSelect.value[0]][openPromotePawnSelect.value[1]].type = piece;
  if (botPlayer.value == playerTurn.value) {
    botMove();
  }
}
</script>
<style lang="scss" scoped>
$size: calc((95vw / v-bind('board.length')));
$sizePc: calc((95vh / v-bind('board.length')));
.board {
  transform: rotateX(180deg);
  position: relative;
  .rows {
    display: flex;
    width: 100%;
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

      font-size: 3rem;

      @media (min-width: 1000px) {
        font-size: 4rem;
        width: $sizePc;
        height: $sizePc;
      }
    }
  }
}

aside {
  position: absolute;
  bottom: 0;
  left: 16px;
  width: calc(100% - 32px);
  * {
    margin-bottom: 0.25rem;
  }
  .button {
    width: 100%;
  }
}

.rows:nth-child(odd) .cell:nth-child(even) {
  background: #854000;
}
.rows:nth-child(even) .cell:nth-child(odd) {
  background: #854000;
}
.selected {
  box-shadow: inset 0 0 0 2000px rgba(35, 211, 0, 0.5);
  color: white;
}

.lastMoved {
  background-color: rgb(146, 155, 108) !important;
}
.checking {
  background-color: red !important;
}
.legal {
  background-color: aqua !important;
}

main {
  display: flex;
  margin: 8px;
}

.promotions {
  font-size: 3rem;
  color: white;
  display: flex;
  justify-content: center;
  * {
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #854000;
    border: 1px solid black;
    width: $size;
    height: $size;
    @media (min-width: 1000px) {
      width: $sizePc;
      height: $sizePc;
    }
    cursor: pointer;
  }
}
</style>
