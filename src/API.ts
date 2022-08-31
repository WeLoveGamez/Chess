import * as type from './types';
export function getPlayer(): type.Player {
  return JSON.parse(localStorage.getItem('player') || 'null');
}
export function setPlayer(player: type.Player) {
  localStorage.setItem('player', JSON.stringify(player));
}
