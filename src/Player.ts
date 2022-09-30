import { getPlayer } from './API';
import { computed, ref } from 'vue';
import type { Player } from './types';
import { offenseTree } from './skillTree';
export const player = ref(getPlayer());
if (!player.value) {
  player.value = {
    exp: 0,
    money: 0,
    lvl: 1,
    units: [
      { id: 'Pawn', maxAmount: 5, amount: 5, amountPerRound: 5 },
      { id: 'King', maxAmount: 1, amount: 1, amountPerRound: 1 },
    ],
    lineup: { frontline: ['Pawn', 'Pawn', 'Pawn'], backline: ['Pawn', 'King', 'Pawn'] },
    skillTrees: { activated: 'test', trees: [offenseTree] }
  };
}
export const usedTree = computed(() => player.value.skillTrees.trees.find(t => player.value.skillTrees.activated == t.id))
export const maxValue = computed(() => player.value.lvl * 3 + 6);
export const haveAllNeedUnits = computed(() => {
  let copyPlayer: Player = JSON.parse(JSON.stringify(player.value));
  const lineUp = copyPlayer.lineup.frontline.concat(copyPlayer.lineup.backline);
  for (let id of lineUp.filter(e => e)) {
    copyPlayer.units.find(e => e.id == id)!.amount--;
  }
  return !copyPlayer.units.some(e => e.amount < 0 && lineUp.includes(e.id));
});
export const boardSize = computed(() => {
  const boardSize = {
    row: 3,
    cell: 5,
  };
  if (player.value.lvl >= 3) {
    boardSize.row++;
  }
  if (player.value.lvl >= 4) {
    boardSize.row++;
  }
  if (player.value.lvl >= 6) {
    boardSize.cell++;
  }
  if (player.value.lvl >= 7) {
    boardSize.row++;
  }
  if (player.value.lvl >= 8) {
    boardSize.cell++;
  }
  if (player.value.lvl >= 10) {
    boardSize.row++;
  }
  if (player.value.lvl >= 11) {
    boardSize.cell++;
  }
  if (player.value.lvl >= 12) {
    boardSize.row++;
  }
  if (player.value.lvl >= 13) {
    boardSize.cell++;
  }
  if (player.value.lvl >= 15) {
    boardSize.row++;
  }
  if (player.value.lvl >= 16) {
    boardSize.cell++;
  }
  if (player.value.lvl >= 17) {
    boardSize.row++;
  }
  return boardSize;
});
export function lvlUp() {
  player.value.exp -= needExp.value;
  player.value.lvl++;
  if (player.value.lvl >= 2) {
    if (!player.value.units.find(e => e.id == 'Bishop'))
      player.value.units.push({ id: 'Bishop', maxAmount: 0, amount: 0, amountPerRound: 0 });
  }
  if (player.value.lvl >= 5) {
    if (!player.value.units.find(e => e.id == 'Knight'))
      player.value.units.push({ id: 'Knight', maxAmount: 0, amount: 0, amountPerRound: 0 });
  }
  if (player.value.lvl >= 9) {
    if (!player.value.units.find(e => e.id == 'Rook'))
      player.value.units.push({ id: 'Rook', maxAmount: 0, amount: 0, amountPerRound: 0 });
  }
  if (player.value.lvl >= 14) {
    if (!player.value.units.find(e => e.id == 'Queen'))
      player.value.units.push({ id: 'Queen', maxAmount: 0, amount: 0, amountPerRound: 0 });
  }
}
export const needExp = computed(() => {
  return player.value.lvl ** 2 + 5;
});
export function gainExp(exp: number) {
  player.value.exp += exp;
  while (player.value.exp >= needExp.value) {
    lvlUp();
  }
}
