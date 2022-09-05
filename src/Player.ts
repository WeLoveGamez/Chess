import { getPlayer } from './API';
import { computed, ref } from 'vue';
import type { Player } from './types';
export const player = ref(getPlayer());
if (!player.value) {
  player.value = {
    exp: 0,
    money: 0,
    lvl: 1,
    units: [
      { name: 'Pawn', value: 1, maxAmount: 5, amount: 5, amountPerRound: 5 },
      { name: 'King', value: 3.5, maxAmount: 1, amount: 1, amountPerRound: 1 },
    ],
    lineup: { frontline: ['Pawn', 'Pawn', 'Pawn'], backline: ['Pawn', 'King', 'Pawn'] },
  };
}
export const maxValue = computed(() => {
  return player.value.lvl * 3 + 6;
});
export const haveAllNeedUnits = computed(() => {
  let copyPlayer: Player = JSON.parse(JSON.stringify(player.value));
  for (let name of copyPlayer.lineup.frontline.concat(copyPlayer.lineup.backline).filter(e => e)) {
    copyPlayer.units.find(e => e.name == name)!.amount--;
  }
  return copyPlayer.units.every(e => e.amount >= 0);
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
  player.value.exp -= player.value.lvl * 10;
  player.value.lvl++;
  if (player.value.lvl >= 2) {
    if (!player.value.units.find(e => e.name == 'Bishop'))
      player.value.units.push({ name: 'Bishop', value: 3, maxAmount: 0, amount: 0, amountPerRound: 0 });
  }
  if (player.value.lvl >= 5) {
    if (!player.value.units.find(e => e.name == 'Knight'))
      player.value.units.push({ name: 'Knight', value: 3, maxAmount: 0, amount: 0, amountPerRound: 0 });
  }
  if (player.value.lvl >= 9) {
    if (!player.value.units.find(e => e.name == 'Rook'))
      player.value.units.push({ name: 'Rook', value: 5, maxAmount: 0, amount: 0, amountPerRound: 0 });
  }
  if (player.value.lvl >= 14) {
    if (!player.value.units.find(e => e.name == 'Queen'))
      player.value.units.push({ name: 'Queen', value: 9, maxAmount: 0, amount: 0, amountPerRound: 0 });
  }
}
export const needExp = computed(() => {
  return player.value.lvl;
});
export function gainExp(exp: number) {
  player.value.exp += exp;
  while (player.value.exp >= player.value.lvl * 10) {
    lvlUp();
  }
}
