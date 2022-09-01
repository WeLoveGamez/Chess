import type { Position } from './types';
import { board, applyMove, getPieceValue, selectedCell, playerTurn, King2Checked, King1Checked } from './board';
import { checkAllLegalMoves, checkLegalMoves, checkChecks } from './moves';
import { computed, ref } from 'vue';

export const bot = ref(true);
export const botPlayer = ref<1 | 2>(2);

export function getGoodBotMove(moveableBotPieces: Position[]) {
  type Move = { piece: Position; targets: Position[] };
  type ReturnMove = { piece: Position; target: Position };
  let returnMove: ReturnMove | null = null;

  let takeBlunders: Move[] = [];

  let targetablePieces: Move[] = [];
  //get targetable Pieces
  {
    for (let position of moveableBotPieces) {
      let targets = checkLegalMoves(position[0], position[1], board.value, true).filter(m => board.value[m[0]][m[1]].type);
      targetablePieces.push({ piece: position, targets: targets });
    }
  }
  targetablePieces = targetablePieces.filter(m => m.targets.length != 0);

  // filter for free pieces
  {
    takeBlunders = [...targetablePieces];
    let enemyMoves: Position[] = [];
    for (let move of takeBlunders) {
      for (let target of move.targets) {
        enemyMoves.push(
          ...checkAllLegalMoves(
            applyMove(
              move.piece[0],
              move.piece[1],
              target[0],
              target[1],
              checkLegalMoves(move.piece[0], move.piece[1], board.value, true),
              board.value
            ),
            botPlayer.value == 1 ? 2 : 1
          )
        );
        move.targets = move.targets.filter(t => !enemyMoves.find(m => t[0] == m[0] && t[1] == m[1]));
      }
    }
  }
  takeBlunders = takeBlunders.filter(m => m.targets.length > 0);

  //take queen if possible
  let QueenTakes: Move[] = [];
  {
    for (let position of moveableBotPieces) {
      let targets = checkLegalMoves(position[0], position[1], board.value, true).filter(m => board.value[m[0]][m[1]].type == 'Queen');
      if (targets.length) QueenTakes.push({ piece: position, targets: targets });
    }
  }

  //checkmate if possible
  let checkmate = {} as ReturnMove;
  {
    for (let piece of moveableBotPieces) {
      for (let target of checkLegalMoves(piece[0], piece[1], board.value, true)) {
        if (
          checkAllLegalMoves(
            applyMove(piece[0], piece[1], target[0], target[1], checkLegalMoves(piece[0], piece[1], board.value, true), board.value),
            botPlayer.value == 1 ? 2 : 1
          ).length == 0
        ) {
          checkmate = { piece, target };
        }
      }
    }
  }
  //find random checks
  let checks: ReturnMove[] = [];
  {
    let coverdFields: Position[] = [];
    let viableMoves: Move[] = [];
    for (let piece of moveableBotPieces) {
      viableMoves.push({ piece, targets: checkLegalMoves(piece[0], piece[1], board.value, true) });
      for (let target of checkLegalMoves(piece[0], piece[1], board.value, true)) {
        coverdFields = checkAllLegalMoves(
          applyMove(piece[0], piece[1], target[0], target[1], checkLegalMoves(piece[0], piece[1], board.value, true), board.value),
          botPlayer.value == 1 ? 2 : 1
        ).filter(m => m[0] == target[0] && m[1] == target[1]);

        viableMoves = viableMoves.filter(m => m.targets.filter(t => !coverdFields.find(f => f[0] == t[0] && f[1] == t[1])));
      }
    }
    console.log({ coverdFields });
    for (let move of viableMoves) {
      for (let target of move.targets) {
        if (
          checkChecks(
            botPlayer.value == 1 ? 2 : 1,
            applyMove(
              move.piece[0],
              move.piece[1],
              target[0],
              target[1],
              checkLegalMoves(move.piece[0], move.piece[1], board.value, true),
              board.value
            )
          ).length
        ) {
          checks.push({ piece: move.piece, target });
        }
      }
    }
    console.log({ viableMoves });
  }

  // prevent blunders
  // castle
  // develop
  // trade horses and bishops
  // move towards enemy king

  if (checkmate.piece && checkmate.target) {
    returnMove = checkmate;
    console.log('checkmate');
  } else if (QueenTakes.length) {
    let position = QueenTakes.map(m => m.piece).sort(
      (a, b) => getPieceValue(board.value[a[0]][a[1]].type) - getPieceValue(board.value[b[0]][b[1]].type)
    )[0];
    let target = QueenTakes.find(m => m.piece[0] == position[0] && m.piece[1] == position[1])!.targets[0];
    returnMove = { piece: position, target };
    console.log('takeQueen');
  } else if (takeBlunders.length && takeBlunders[0].targets[0]) {
    returnMove = { piece: takeBlunders[0].piece, target: takeBlunders[0].targets[0] };
    console.log('takeBlunder', takeBlunders);
  } else if (checks.length) {
    returnMove = checks[0];
    console.log('check');
  }
  //get random move without blunders if nothing else works //TODO: update the if for every prio above
  else {
    let viableMoves: Move[] = [];
    for (let piece of moveableBotPieces) {
      viableMoves.push({ piece, targets: checkLegalMoves(piece[0], piece[1], board.value, true) });
      for (let target of checkLegalMoves(piece[0], piece[1], board.value, true)) {
        let coverdFields = checkAllLegalMoves(
          applyMove(piece[0], piece[1], target[0], target[1], checkLegalMoves(piece[0], piece[1], board.value, true), board.value),
          botPlayer.value == 1 ? 2 : 1
        ).filter(m => m[0] == target[0] && m[1] == target[1]);

        viableMoves = viableMoves.filter(m => m.targets.filter(t => !coverdFields.find(f => f[0] == t[0] && f[1] == t[1])));
      }
    }
    let move = viableMoves[Math.floor(Math.random() * viableMoves.length)];
    let position = move.piece;
    let target = move.targets[Math.floor(Math.random() * move.targets.length)];
    returnMove = { piece: position, target: target };
    console.log('RandomMove');
  }
  return returnMove;
}

export function getMoveableBotPieces(botPlayer: number) {
  let pieces: Position[] = [];
  for (let [rowIndex, row] of Object.entries(board.value)) {
    for (let [cellIndex, cell] of Object.entries(row)) {
      if (board.value[+rowIndex][+cellIndex].player == botPlayer && checkLegalMoves(+rowIndex, +cellIndex, board.value, true).length != 0) {
        pieces.push([+rowIndex, +cellIndex]);
      }
    }
  }
  return pieces;
}

export const moveableBotPieces = computed(() => getMoveableBotPieces(botPlayer.value));
export const legalMoves = computed(() => checkLegalMoves(selectedCell.value[0], selectedCell.value[1], board.value, true));
export const AllLegalMoves = computed(() => checkAllLegalMoves(board.value, playerTurn.value));
export const checkMate = computed(() =>
  King2Checked.value.length > 0 && AllLegalMoves.value.length == 0
    ? 'checkmate for white'
    : King1Checked.value.length > 0 && AllLegalMoves.value.length == 0
    ? 'checkmate for black'
    : King1Checked.value.length == 0 && King2Checked.value.length == 0 && AllLegalMoves.value.length == 0
    ? 'stalemate'
    : ''
);
