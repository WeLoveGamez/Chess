import { Tile } from './types';

declare global {
  interface Array<T> {
    shuffle(): T[];
  }
}
Object.defineProperty(Array.prototype, 'shuffle', {
  value: function () {
    var i = this.length;
    while (i) {
      var j = Math.floor(Math.random() * i);
      var t = this[--i];
      this[i] = this[j];
      this[j] = t;
    }
    return this;
  },
});

export function getPieceValue(piece: Tile['type']) {
  switch (piece) {
    default:
      return 0;
    case 'Pawn':
      return 1;
    case 'Bishop':
    case 'Knight':
      return 3;
    case 'King':
      return 4;
    case 'Rook':
      return 5;
    case 'Queen':
      return 9;
  }
}
