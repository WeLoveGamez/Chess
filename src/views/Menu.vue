<template>
  <div>
    <div class="container">
      <div class="text-center">{{ `lvl: ${player.lvl}` }}</div>
      <div class="mt-1">
        <ProgressBar :progress="player.exp" :max-value="player.lvl * 10"></ProgressBar>
      </div>
      <div class="mt-3"><Button @click="play()">Play</Button></div>
      <div v-if="!haveAllNeedUnits">you do not own all the required figures</div>
      <div class="mt-3">
        <Modal title="lineup" affirm-text="save" affirm-class="btn btn-success" :affirm-action="save">
          <div class="container">
            <div>
              {{ `${usedValue} /${maxValue}` }}
            </div>
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
                <button v-for="index of boardSize.row" class="frontline" @click="clickLineup('frontline', index - 1)">
                  {{ player.lineup.frontline[index - 1] }}
                </button>
              </div>
              <div class="d-flex">
                <button v-for="index of boardSize.row" class="backline" @click="clickLineup('backline', index - 1)">
                  {{ player.lineup.backline[index - 1] }}
                </button>
              </div>
            </div>
          </div>
          <template #button>
            <div class="cellButton"><Button>Lineup</Button></div>
          </template>
        </Modal>
      </div>
      <div class="text-center mt-3">
        {{ `money: ${player.money}` }}
      </div>
    </div>
    <div class="d-flex justify-content-center">
      <div class="mt-1">
        <div class="row" v-for="row of 5">
          <div class="cell" v-for="cell of 5">
            <Modal :title="getUnit(row, cell)">
              <div
                class="container"
                v-if="getUnit(row, cell) != 'coming soon' && !getUnit(row, cell).includes('lvl') && getUnit(row, cell) != 'King'"
              >
                <div class="text-center">{{ `max amount: ${player.units.find(e => e.name == getUnit(row, cell))?.maxAmount}` }}</div>
                <div>
                  <Button @click="buyMaxAmount(getUnit(row, cell) as type.UnitName)">
                    <div>increase</div>
                    <div>{{ displayMaxAmountCost(row, cell) }}</div>
                  </Button>
                </div>
                <div class="text-center">{{ `new units per round: ${player.units.find(e => e.name == getUnit(row, cell))?.amountPerRound}` }}</div>
                <div>
                  <Button @click="buyAmountPerRound(getUnit(row, cell) as type.UnitName)">
                    <div>increase</div>
                    <div>
                      {{ displayamountPerRoundCost(row, cell) }}
                    </div>
                  </Button>
                </div>
                <div class="text-center">
                  {{
                    `amount (${player.units.find(e => e.name == getUnit(row, cell))?.amount} / ${
                      player.units.find(e => e.name == getUnit(row, cell))?.maxAmount
                    })`
                  }}
                </div>
                <div>
                  <Button @click="buyUnit(getUnit(row, cell) as type.UnitName)">
                    <div>buy</div>
                    <div>{{ displayBuyCost(row, cell) }}</div>
                  </Button>
                </div>
              </div>
              <div v-if="getUnit(row, cell).includes('lvl')">
                {{ getUnit(row, cell) }}
              </div>
              <div v-if="getUnit(row, cell) == 'King'">You are King</div>
              <div v-if="getUnit(row, cell) == 'coming soon'">
                {{ '<3' }}
              </div>
              <template #button>
                <div class="cellButton">
                  <Button class="px-2" style="font-size: 0.8rem">{{ getUnit(row, cell) }}</Button>
                </div>
              </template>
            </Modal>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import { Button, ProgressBar, Modal } from 'custom-mbd-components';
import { player, boardSize, haveAllNeedUnits } from '../Player';
import { setPlayer } from '../API';
import router from '../router';
import * as type from '../types';
import { autoPlay, createBoard } from '../board';
import { computed } from '@vue/reactivity';
import { getPieceValue } from '../utils';
import { botPlayer } from '../bot';

const selectedUnit = ref<type.UnitName>('');
function save() {
  if (player.value.lineup.frontline.concat(player.value.lineup.backline).includes('King')) setPlayer(player.value);
}
function play() {
  if (!haveAllNeedUnits) return;
  autoPlay.value = false;
  createBoard();
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
function displayMaxAmountCost(row: number, cell: number) {
  const name = getUnit(row, cell) as type.UnitName;
  const maxAmount = player.value.units.find(e => e.name == name)?.maxAmount;
  if (typeof maxAmount == 'number') return `costs: ${(maxAmount + 1) * getPieceValue(name)}`;
}
function displayamountPerRoundCost(row: number, cell: number) {
  const name = getUnit(row, cell) as type.UnitName;
  const amountPerRound = player.value.units.find(e => e.name == name)?.amountPerRound;
  if (typeof amountPerRound == 'number') return `costs: ${(amountPerRound + 1) * getPieceValue(name)}`;
}
function displayBuyCost(row: number, cell: number) {
  const name = getUnit(row, cell) as type.UnitName;
  return `costs: ${getPieceValue(name)}`;
}
function buyMaxAmount(name: type.UnitName) {
  const unit = player.value.units.find(e => e.name == name);
  if (!unit || unit?.maxAmount >= 100) return;
  if (getPieceValue(name) * (unit?.maxAmount + 1) <= player.value.money) {
    player.value.money -= getPieceValue(name) * (unit?.maxAmount + 1);
    unit.maxAmount++;
    setPlayer(player.value);
  }
}
function buyAmountPerRound(name: type.UnitName) {
  const unit = player.value.units.find(e => e.name == name);
  if (!unit || unit?.amountPerRound >= unit.maxAmount) return;
  if (getPieceValue(name) * (unit?.amountPerRound + 1) <= player.value.money) {
    player.value.money -= getPieceValue(name) * (unit?.amountPerRound + 1);
    unit.amountPerRound++;
    setPlayer(player.value);
  }
}
function buyUnit(name: type.UnitName) {
  const unit = player.value.units.find(e => e.name == name);
  if (!unit || unit?.amount >= unit.maxAmount) return;
  if (getPieceValue(name) <= player.value.money) {
    player.value.money -= getPieceValue(name);
    unit.amount++;
    setPlayer(player.value);
  }
}
function removeFromLineup(line: 'frontline' | 'backline', index: number) {
  player.value.lineup[line][index] = '';
}
function addToLineup(line: 'frontline' | 'backline', index: number) {
  if (usedValue.value + getPieceValue(selectedUnit.value) > maxValue.value) return;
  if (player.value.units.find(e => e.name == selectedUnit.value)!.amount <= 0) return;
  player.value.lineup[line][index] = selectedUnit.value;
  selectedUnit.value = '';
}
const usedValue = computed(() => {
  let used = 0;
  for (let name of player.value.lineup.frontline.concat(player.value.lineup.backline)) {
    used += getPieceValue(name);
  }
  return used;
});
const maxValue = computed(() => {
  return player.value.lvl * 3 + 6;
});
function getUnit(row: number, cell: number): type.UnitName | string {
  if (row == 1 && cell == 1) return 'King';
  if (row == 1 && cell == 2) return 'Pawn';
  if (row == 1 && cell == 3) return player.value.lvl >= 2 ? 'Bishop' : 'need lvl 2';
  if (row == 1 && cell == 4) return player.value.lvl >= 5 ? 'Knight' : 'need lvl 5';
  if (row == 1 && cell == 5) return player.value.lvl >= 9 ? 'Rook' : 'need lvl 9';
  if (row == 2 && cell == 1) return player.value.lvl >= 14 ? 'Queen' : 'need lvl 14';
  return 'coming soon';
}
</script>
<style lang="scss" scoped>
$size: 20vw;
$sizePc: 20vh;
.row {
  display: flex;
  .cell {
    border: 1px solid #000;
    display: flex;
    justify-content: center;
    align-items: center;
    width: $size;
    height: $size;
    @media (min-width: 1000px) {
      width: $sizePc;
      height: $sizePc;
    }
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
  @media (min-width: 1000px) {
    width: $sizePc;
    height: $sizePc;
  }
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
