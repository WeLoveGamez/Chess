<template>
  <div @mousedown.self="selectedCell = [-1, -1]" style="width: 100%; height: 100vh">
    <div class="board">
      {{ selectedCell }}{{ playerTurn }}
      <div class="row" v-for="(row, rowIndex) in board">
        <div
          class="cell"
          v-for="(cell, cellIndex) in row"
          :class="{
            selected: selectedCell[0] === rowIndex && selectedCell[1] === cellIndex,
            legal: legalMoves?.find(c => c[0] == rowIndex && c[1] == cellIndex),
            whitePiece: board[rowIndex][cellIndex].player == 1,
            blackPiece: board[rowIndex][cellIndex].player == 2,
            // checking: [...King2Checked, ...King1Checked].find(p => p[0] == rowIndex && p[1] == cellIndex),
          }"
          @click="cellClicked(rowIndex, cellIndex)"
        >
          {{ getUnicodePiece(cell.type) }}
        </div>
      </div>
    </div>
  </div>
  {{ King1Checked }}{{ King2Checked }}
</template>
<script setup lang="ts">
import { computed } from '@vue/reactivity';
import { ref } from 'vue';
import { board, Tile, applyMove } from '../board';
import { Position } from '../types';
import { checkLegalMoves, checkChecks } from '../moves';
const selectedCell = ref<Position>([-1, -1]);
const playerTurn = ref(1);

function cellClicked(rowIndex: number, cellIndex: number) {
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
    board.value = applyMove(fromRow, fromCell, toRow, toCell, legalMoves.value, board.value);
    playerTurn.value = playerTurn.value == 1 ? 2 : 1;
    selectedCell.value = [-1, -1];
  }
}

const legalMoves = computed(() => checkLegalMoves(selectedCell.value[0], selectedCell.value[1], board.value));

const King1Checked = computed(() => checkChecks(1, board.value));
const King2Checked = computed(() => checkChecks(2, board.value));

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
.row {
  $size: 11vh;
  display: grid;
  grid-template-columns: repeat(8, minmax($size, 1fr));
  .cell {
    border: 1px solid #000;
    display: flex;
    justify-content: center;
    align-items: center;
    width: $size;
    height: $size;
    cursor: pointer;
    font-size: 5rem;
    background-color: gray;
  }
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
.legal {
  background-color: aqua !important;
}
.whitePiece {
  color: white;
}
.BlackPiece {
  color: black;
}
.checking {
  background-color: red !important;
}
</style>
