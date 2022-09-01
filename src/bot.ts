import type { Position } from './types';
import { board, applyMove, getPieceValue, selectedCell, playerTurn, King2Checked, King1Checked, Tile } from './board';
import { checkAllLegalMoves, checkLegalMoves, checkChecks } from './moves';
import { computed, ref } from 'vue';

export const bot = ref(true);
export const botPlayer = ref<1 | 2>(2);

export function getGoodBotMove(moveableBotPieces: Position[]) {
  type Move = { piece: Position; target: Position };
  let returnMove = {} as Move;

  //getAllMoves possible
  let allMoves: Move[] = [];
  {
    for (let position of moveableBotPieces) {
      let targets = checkLegalMoves(position[0], position[1], board.value, true);
      for (let target of targets) {
        allMoves.push({ piece: position, target: target });
      }
    }
  }

  //dont go on covered Fields
  let coveredFields: Position[] = [];
  {
    for (let move of allMoves) {
      if (
        checkAllLegalMoves(
          applyMove(
            move.piece[0],
            move.piece[1],
            move.target[0],
            move.target[1],
            checkLegalMoves(move.piece[0], move.piece[1], board.value, true),
            board.value
          ),
          botPlayer.value == 1 ? 2 : 1
        ).find(m => m[0] == move.target[0] && m[1] == move.target[1])
      )
        coveredFields.push(move.target);
    }
  }
  //get targetable Pieces
  let targetablePieces: Move[] = [];
  {
    for (let move of allMoves) {
      if (board.value[move.target[0]][move.target[1]].type) targetablePieces.push(move);
    }
  }

  // filter for free pieces
  let takeBlunders: Move[] = [];
  {
    takeBlunders = [...targetablePieces];
    let enemyMoves: Position[] = [];
    for (let move of takeBlunders) {
      enemyMoves.push(
        ...checkAllLegalMoves(
          applyMove(
            move.piece[0],
            move.piece[1],
            move.target[0],
            move.target[1],
            checkLegalMoves(move.piece[0], move.piece[1], board.value, true),
            board.value
          ),
          botPlayer.value == 1 ? 2 : 1
        )
      );
      takeBlunders = takeBlunders.filter(t => !enemyMoves.find(m => t.target[0] == m[0] && t.target[1] == m[1]));
    }
  }

  //take queen if possible
  let QueenTakes: Move[] = [];
  {
    for (let move of allMoves) {
      if (board.value[move.target[0]][move.target[1]].type == 'Queen') {
        QueenTakes.push({ piece: move.piece, target: move.target });
      }
    }
  }

  //checkmate if possible
  let checkmate = {} as Move;
  {
    for (let move of allMoves) {
      if (
        checkAllLegalMoves(
          applyMove(
            move.piece[0],
            move.piece[1],
            move.target[0],
            move.target[1],
            checkLegalMoves(move.piece[0], move.piece[1], board.value, true),
            board.value
          ),
          botPlayer.value == 1 ? 2 : 1
        ).length == 0
      ) {
        checkmate = move;
      }
    }
  }

  //find random checks
  let checks: Move[] = [];
  {
    let viableMoves = allMoves.filter(m => !coveredFields.find(f => f[0] == m.target[0] && f[1] == m.target[1]));
    for (let move of viableMoves) {
      if (
        checkChecks(
          botPlayer.value == 1 ? 2 : 1,
          applyMove(
            move.piece[0],
            move.piece[1],
            move.target[0],
            move.target[1],
            checkLegalMoves(move.piece[0], move.piece[1], board.value, true),
            board.value
          )
        ).length
      ) {
        checks.push({ piece: move.piece, target: move.target });
      }
    }
  }

  // prevent blunders

  // develop
  // trade horses and bishops

  let tradeMoves: Move[] = [];
  {
    for (let move of targetablePieces) {
      if (getPieceValue(board.value[move.piece[0]][move.piece[1]].type) <= getPieceValue(board.value[move.target[0]][move.target[1]].type)) {
        tradeMoves.push(move);
      }
    }
  }
  // move towards enemy king

  if (checkmate.piece && checkmate.target) {
    returnMove = checkmate;
    console.log('checkmate');
  } else if (QueenTakes.length > 0) {
    let position = QueenTakes.map(m => m.piece).sort(
      (a, b) => getPieceValue(board.value[a[0]][a[1]].type) - getPieceValue(board.value[b[0]][b[1]].type)
    )[0];
    let target = QueenTakes.find(m => m.piece[0] == position[0] && m.piece[1] == position[1])!.target;
    returnMove = { piece: position, target };
    console.log('takeQueen');
  } else if (takeBlunders.length > 0 && takeBlunders[0].target) {
    returnMove = { piece: takeBlunders[0].piece, target: takeBlunders[0].target };
    console.log('takeBlunder');
  } else if (checks.length > 0) {
    returnMove = checks[0];
    console.log('check');
  } else if (tradeMoves.length > 0) {
    returnMove = tradeMoves.sort(
      (a, b) =>
        getPieceValue(board.value[a.piece[0]][a.piece[1]].type) -
        getPieceValue(board.value[a.target[0]][a.target[1]].type) -
        (getPieceValue(board.value[b.piece[0]][b.piece[1]].type) - getPieceValue(board.value[b.target[0]][b.target[1]].type))
    )[tradeMoves.length];
    console.log('trade');
  }
  //get random move without blunders if nothing else works //TODO: update the if for every prio above
  else {
    let rndMoves = allMoves.filter(m => !coveredFields.find(f => f[0] == m.target[0] && f[1] == m.target[1]));
    let move = rndMoves[Math.floor(Math.random() * rndMoves.length)];
    returnMove = move;

    if (!move?.piece[0] || !move?.target[0]) {
      returnMove = allMoves[Math.floor(Math.random() * allMoves.length)];
    }
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
