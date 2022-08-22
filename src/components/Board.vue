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
          }"
          @click="cellClicked(rowIndex, cellIndex)"
        >
          <!-- {{ getUnicodePiece(cell.type, cell.player == 1) }} -->
          {{ cell }}
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed } from '@vue/reactivity';
import { ref } from 'vue';
import { board, Tile } from '../board';
import { checkLegalMoves } from '../moves';
const selectedCell = ref([-1, -1]);
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
    move(fromRow, fromCell, toRow, toCell);
  }
}
function move(fromRow: number, fromCell: number, toRow: number, toCell: number) {
  board.value[toRow][toCell] = board.value[fromRow][fromCell];
  board.value[fromRow][fromCell] = { type: '', player: 0 };
  playerTurn.value = playerTurn.value == 1 ? 2 : 1;
  selectedCell.value = [-1, -1];
}

const legalMoves = computed(() => checkLegalMoves(selectedCell.value[0], selectedCell.value[1]));

const UNICODE_PIECES = {
  King: 0x2654,
  Queen: 0x2655,
  Rook: 0x2656,
  Bishop: 0x2657,
  Knight: 0x2658,
  Pawn: 0x2659,
};
function getUnicodePiece(string: Tile['type'], isBlack: boolean) {
  if (string == '') return '';
  return String.fromCharCode(UNICODE_PIECES[string] + (isBlack ? 6 : 0));
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
    // font-size: 5rem;
  }
}

.row:nth-child(odd) .cell:nth-child(even) {
  background: #000;
  color: white;
}
.row:nth-child(even) .cell:nth-child(odd) {
  background: #000;
  color: white;
}
.selected {
  box-shadow: inset 0 0 0 2000px rgba(35, 211, 0, 0.5);
  color: white;
}
.legal {
  background-color: aqua !important;
}
</style>
