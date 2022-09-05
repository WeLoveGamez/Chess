import { getPlayer } from './API';
import * as type from './types';
import { ref } from 'vue';
export const player = ref(getPlayer());
if (!player.value) {
  player.value = {
    exp: 0,
    money: 0,
    lvl: 1,
    units: [
      { name: 'Pawn', value: 1, maxAmount: 3, amount: 3, amountPerRound: 3 },
      { name: 'King', value: 3.5, maxAmount: 1, amount: 1, amountPerRound: 1 },
    ],
    lineup: { frontline: ['', 'Pawn', ''], backline: ['Pawn', 'King', 'Pawn'] },
  };
}

export function lvlUp() {
  player.value.exp -= player.value.lvl * 10;
  player.value.lvl++;
  if (player.value.lvl >= 2) {
    if (!player.value.units.find(e => e.name == 'Rook'))
      player.value.units.push({ name: 'Rook', value: 5, maxAmount: 0, amount: 0, amountPerRound: 0 });
  }
  if (player.value.lvl >= 5) {
    if (!player.value.units.find(e => e.name == 'Bishop'))
      player.value.units.push({ name: 'Bishop', value: 3, maxAmount: 0, amount: 0, amountPerRound: 0 });
  }
  if (player.value.lvl >= 9) {
    if (!player.value.units.find(e => e.name == 'Knight'))
      player.value.units.push({ name: 'Knight', value: 3, maxAmount: 0, amount: 0, amountPerRound: 0 });
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
