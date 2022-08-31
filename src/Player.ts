import { getPlayer, setPlayer } from './API';
import * as type from './types';
import { ref } from 'vue';
export const player = ref(getPlayer());
if (!player.value) {
  player.value = {
    exp: 0,
    money: 0,
    lvl: 1,
    units: [],
    lineup: { frontline: [], backline: [] },
  };
}
