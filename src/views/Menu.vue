<template>
  <div class="container">
    <div class="text-center">{{ `lvl: ${player.lvl}` }}</div>
    <div class="mt-1">
      <ProgressBar :progress="player.exp" :max-value="needExp"></ProgressBar>
    </div>
    <div class="mt-3"><Button @click="play()">Play</Button></div>
    <div v-if="!haveAllNeedUnits">you do not own all the required figures</div>
    <div class="mt-1">
      <Modal title="lineup" affirm-text="save" affirm-class="btn btn-success" :affirm-action="save">
        <div class="container">
          <div>
            {{ `used Value: ${usedValue} /${maxValue}` }}
          </div>
          <div class="d-flex">
            <div v-for="unit of player.units.filter(e => availableNumber(e) > 0)" class="me-2 icons" @click="selectedUnit = unit.id">
              {{ `${getUnicodePiece(unit.id)}: ${availableNumber(unit)}` }}
            </div>
          </div>
          <div :class="{ icons: getUnicodePiece(selectedUnit) }">
            {{ `selected: ${getUnicodePiece(selectedUnit) || 'none'}` }}
          </div>
          <div class="lineup">
            <div class="front d-flex">
              <button v-for="index of boardSize.row" class="frontline" @click="clickLineup('frontline', index - 1)">
                {{ getUnicodePiece(player.lineup.frontline[index - 1]) }}
              </button>
            </div>
            <div class="back d-flex">
              <button v-for="index of boardSize.row" class="backline" @click="clickLineup('backline', index - 1)">
                {{ getUnicodePiece(player.lineup.backline[index - 1]) }}
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
      {{ player.money }}
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
  </div>
  <div class="container d-flex justify-content-center">
    <div class="m-1 field">
      <div class="row" v-for="row of 5">
        <div class="cell" v-for="cell of 5">
          <Modal :title="getUnit(row, cell)">
            <div class="container" v-if="getUnit(row, cell) != 'coming soon' && !getUnit(row, cell).includes('lvl') && getUnit(row, cell) != 'King'">
              <div class="text-center">{{ `max amount: ${player.units.find(e => e.id == getUnit(row, cell))?.maxAmount}` }}</div>
              <div>
                <Button @click="buyMaxAmount(getUnit(row, cell) as type.UnitId)">
                  <div>increase</div>
                  <div>{{ displayMaxAmountCost(row, cell) }}</div>
                </Button>
              </div>
              <div class="text-center">{{ `new units per round: ${player.units.find(e => e.id == getUnit(row, cell))?.amountPerRound}` }}</div>
              <div>
                <Button @click="buyAmountPerRound(getUnit(row, cell) as type.UnitId)">
                  <div>increase</div>
                  <div>
                    {{ displayamountPerRoundCost(row, cell) }}
                  </div>
                </Button>
              </div>
              <div class="text-center">
                {{
                  `amount (${player.units.find(e => e.id == getUnit(row, cell))?.amount} / ${
                    player.units.find(e => e.id == getUnit(row, cell))?.maxAmount
                  })`
                }}
              </div>
              <div>
                <Button @click="buyUnit(getUnit(row, cell)as type.UnitId)">
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
</template>
<script setup lang="ts">
import { ref } from 'vue';
import { Button, ProgressBar, Modal } from 'custom-mbd-components';
import { player, boardSize, haveAllNeedUnits, maxValue, needExp } from '../Player';
import { setPlayer } from '../API';
import router from '../router';
import * as type from '../types';
import { autoPlay, createBoard, getUnicodePiece } from '../board';
import { computed } from '@vue/reactivity';
import { getPieceValue } from '../utils';

const selectedUnit = ref<type.UnitId>('');
function save() {
  if (player.value.lineup.frontline.concat(player.value.lineup.backline).includes('King')) setPlayer(player.value);
}
function play() {
  if (!haveAllNeedUnits.value) return;
  autoPlay.value = false;
  createBoard();
  router.push({ name: 'Board' });
}

function availableNumber(unit: type.Unit) {
  let i = 0;
  for (let id of player.value.lineup.frontline.concat(player.value.lineup.backline)) {
    if (id == unit.id) i++;
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
function calcCost(value: number, multiplicator: number) {
  return value * Math.round((multiplicator + 1) ** 1.5);
}
function displayMaxAmountCost(row: number, cell: number) {
  const id = getUnit(row, cell) as type.UnitId;
  const maxAmount = player.value.units.find(e => e.id == id)?.maxAmount;
  if (typeof maxAmount == 'number') return `costs: ${calcCost(getPieceValue(id), maxAmount)}`;
}
function displayamountPerRoundCost(row: number, cell: number) {
  const id = getUnit(row, cell) as type.UnitId;
  const amountPerRound = player.value.units.find(e => e.id == id)?.amountPerRound;
  if (typeof amountPerRound == 'number') return `costs: ${calcCost(getPieceValue(id), amountPerRound)}`;
}
function displayBuyCost(row: number, cell: number) {
  const id = getUnit(row, cell) as type.UnitId;
  return `costs: ${getPieceValue(id)}`;
}
function buyMaxAmount(id: type.UnitId) {
  const unit = player.value.units.find(e => e.id == id);
  if (!unit || unit?.maxAmount >= 100) return;
  const cost = calcCost(getPieceValue(id), unit?.maxAmount);
  if (cost <= player.value.money) {
    player.value.money -= cost;
    unit.maxAmount++;
    setPlayer(player.value);
  }
}
function buyAmountPerRound(id: type.UnitId) {
  const unit = player.value.units.find(e => e.id == id);
  if (!unit || unit?.amountPerRound >= unit.maxAmount) return;
  const cost = calcCost(getPieceValue(id), unit?.amountPerRound);
  if (cost <= player.value.money) {
    player.value.money -= cost;
    unit.amountPerRound++;
    setPlayer(player.value);
  }
}
function buyUnit(id: type.UnitId) {
  const unit = player.value.units.find(e => e.id == id);
  if (!unit || unit?.amount >= unit.maxAmount) return;
  if (getPieceValue(id) <= player.value.money) {
    player.value.money -= getPieceValue(id);
    unit.amount++;
    setPlayer(player.value);
  }
}
function removeFromLineup(line: 'frontline' | 'backline', index: number) {
  player.value.lineup[line][index] = '';
}
function addToLineup(line: 'frontline' | 'backline', index: number) {
  if (usedValue.value + getPieceValue(selectedUnit.value) > maxValue.value) return;
  if (player.value.units.find(e => e.id == selectedUnit.value)!.amount <= 0) return;
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

function getUnit(row: number, cell: number): type.UnitId | string {
  if (row == 1 && cell == 1) return 'King';
  if (row == 1 && cell == 2) return 'Pawn';
  if (row == 1 && cell == 3) return player.value.lvl >= 2 ? 'Bishop' : 'lvl 2';
  if (row == 1 && cell == 4) return player.value.lvl >= 5 ? 'Knight' : 'lvl 5';
  if (row == 1 && cell == 5) return player.value.lvl >= 9 ? 'Rook' : 'lvl 9';
  if (row == 2 && cell == 1) return player.value.lvl >= 14 ? 'Queen' : 'lvl 14';
  return 'coming soon';
}
</script>
<style lang="scss" scoped>
.field {
  display: grid;
  grid-template-rows: repeat(5, 1fr);
  .row {
    .cell {
      display: flex;
      justify-content: center;
      align-items: center;

      border: 1px solid #000;
      cursor: pointer;
      background-color: gray;
      font-size: 5rem;

      width: 20%;
      aspect-ratio: 1 / 1;

      @media (max-width: 1000px) {
        font-size: 2.5rem;
      }
    }
  }
}
.frontline,
.backline {
  background-color: gray;
  border: 1px solid black;
  font-size: 5rem;

  width: 20%;
  aspect-ratio: 1 / 1;

  @media (max-width: 1000px) {
    font-size: 2.5rem;
  }
}
.icons {
  font-size: 3rem;
  @media (max-width: 1000px) {
    font-size: 1.5rem;
  }
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
