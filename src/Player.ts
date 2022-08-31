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
