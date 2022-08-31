<template>
  <div class="container">
    <!-- FIXME: add variablen -->
    <div class="text-center">{{ `lvl: ${player.lvl}` }}</div>
    <div class="mt-1">
      <!-- FIXME: add variablen -->
      <ProgressBar :progress="player.exp" :max-value="player.lvl * 50"></ProgressBar>
    </div>
    <div class="mt-3"><Button @click="play()">Play</Button></div>
    <div class="mt-3">
      <Modal title="lineup">
        <div class="container">
          <div class="d-flex">
            <div v-for="unit of player.units" class="me-2" @click="selectedUnit = unit.name">
              {{ `${unit.name}: ${availableNumber(unit)}` }}
            </div>
          </div>
          <div>
            {{ selectedUnit || 'no selected unit' }}
          </div>
          <div class="lineup">
            <div class="d-flex">
              <button v-for="(piece, index) of player.lineup.frontline" class="frontline" @click="clickLineup('frontline', index)">
                {{ piece }}
              </button>
            </div>
            <div class="d-flex">
              <button v-for="(piece, index) of player.lineup.backline" class="backline" @click="clickLineup('backline', index)">
                {{ piece }}
              </button>
            </div>
          </div>
        </div>
        <template #button>
          <div class="cellButton"><Button>Lineup</Button></div>
        </template>
      </Modal>
    </div>
    <div class="mt-3">
      <div class="row" v-for="row of 5">
        <div class="cell" v-for="cell of 5">
          <!-- FIXME: add variablen -->
          <Modal title="test">
            <div class="container">
              <div>max amount: Pi</div>
              <div>
                <Button>
                  <div>increase</div>
                  <div>costs: Pi</div>
                </Button>
              </div>
              <div>new units per round: Pi</div>
              <div>
                <Button>
                  <div>increase</div>
                  <div>costs: Pi</div>
                </Button>
              </div>
            </div>
            <template #button>
              <div class="cellButton"><Button>piece name</Button></div>
            </template>
          </Modal>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import { Button, ProgressBar, Modal } from 'custom-mbd-components';
import { player } from '../Player';
import router from '../router';
import * as type from '../types';

const selectedUnit = ref('' as type.UnitNames);
function play() {
  router.push({ name: 'Board' });
}
function availableNumber(unit: type.Unit) {
  let i = 0;
  for (let name of player.value.lineup.frontline.concat(player.value.lineup.backline)) {
    if (name == unit.name) i++;
  }
  return unit.amount - i;
}
function clickLineup(line: 'frontline' | 'backline', index: number) {
  if (selectedUnit.value) {
    addToLineup(line, index);
  } else {
    removeFromLineup(line, index);
  }
}
function removeFromLineup(line: 'frontline' | 'backline', index: number) {
  player.value.lineup[line][index] = '';
}
function addToLineup(line: 'frontline' | 'backline', index: number) {
  player.value.lineup[line][index] = selectedUnit.value;
  selectedUnit.value = '';
}
</script>
<style lang="scss" scoped>
$size: 20vw;
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
    font-size: 5rem;
    @media (max-width: 1000px) {
      font-size: 2.5rem;
    }
  }
}
.frontline,
.backline {
  background-color: gray;
  width: $size;
  height: $size;
  border: 1px solid black;
}
.lineup :nth-child(odd).frontline,
.row:nth-child(odd) .cell:nth-child(even) {
  background: #854000;
}
.lineup :nth-child(even).backline,
.row:nth-child(even) .cell:nth-child(odd) {
  background: #854000;
}
.cellButton {
  display: flex;
}
</style>
