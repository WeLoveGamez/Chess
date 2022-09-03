import type { Position } from './types';
import { board, applyMove, getPieceValue, selectedCell, playerTurn, King2Checked, King1Checked, piecesOnBoard, stalemateCheck } from './board';
import { checkAllLegalMoves, checkLegalMoves, checkChecks } from './moves';
import { computed, ref } from 'vue';

export const bot = ref(true);
export const botPlayer = ref<1 | 2>(2);
export type Move = { piece: Position; target: Position };

export function getGoodBotMove(moveableBotPieces: Position[], restrictedMoves?: Move[]): Move {
  let returnMove: null | Move = null;

  let allMoves: Move[] = [];
  allMoves: {
    for (let position of moveableBotPieces) {
      let targets = checkLegalMoves(position[0], position[1], board.value, true);
      for (let target of targets) {
        allMoves.push({ piece: position, target: target });
      }
    }
  }
  if (restrictedMoves && restrictedMoves.length > 0) allMoves = restrictedMoves;

  let restrictedMove;
  if (!restrictedMoves) {
    console.log('get restricted move');
    let noKingMoves = allMoves.filter(m => board.value[m.piece[0]][m.piece[1]].type != 'King');
    restrictedMove = getGoodBotMove(moveableBotPieces, noKingMoves);
  }
  let coveredFields: Position[] = [];
  coveredFields: {
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
  let targetablePieces: Move[] = [];
  targetablePieces: {
    for (let move of allMoves) {
      if (board.value[move.target[0]][move.target[1]].type) targetablePieces.push(move);
    }
  }

  let takeBlunder: Move | null = null;
  takeBlunders: {
    let enemyMoves: Position[] = [];
    for (let move of targetablePieces) {
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
    }
    takeBlunder = targetablePieces
      .filter(t => !enemyMoves.find(m => t.target[0] == m[0] && t.target[1] == m[1]))
      .sort((a, b) => getPieceValue(board.value[b.target[0]][b.target[1]].type) - getPieceValue(board.value[a.target[0]][a.target[1]].type))[0];
  }

  let queenTake: Move | null = null;
  takeQueen: {
    let filteredMoves = allMoves.filter(m => board.value[m.target[0]][m.target[1]].type == 'Queen');
    let weakest = filteredMoves[0];
    let value = 0;
    for (let move of filteredMoves) {
      if (getPieceValue(board.value[move.piece[0]][move.piece[1]].type) > value) {
        weakest = move;
        value = getPieceValue(board.value[move.piece[0]][move.piece[1]].type);
      }
    }
    queenTake = weakest;
  }

  let checkmate = {} as Move;
  checkmate: {
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
        break checkmate;
      }
    }
  }
  //find random checks
  let check: Move | null = null;
  checks: {
    let viableMoves = allMoves.filter(m => !coveredFields.find(f => f[0] == m.target[0] && f[1] == m.target[1]));
    let checks: Move[] = [];
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
    let weakest = checks[0];
    let value = 0;
    for (let move of checks) {
      if (getPieceValue(board.value[move.piece[0]][move.piece[1]].type) > value) {
        weakest = move;
        value = getPieceValue(board.value[move.piece[0]][move.piece[1]].type);
      }
    }
    check = weakest;
  }

  let tradeMove: Move | null = null;
  trading: {
    let tradeMoves: Move[] = [];
    for (let move of targetablePieces) {
      if (getPieceValue(board.value[move.piece[0]][move.piece[1]].type) <= getPieceValue(board.value[move.target[0]][move.target[1]].type)) {
        tradeMoves.push(move);
      }
    }
    if (tradeMoves.length == 0) break trading;
    let best = tradeMoves[0];
    let bestDifference =
      getPieceValue(board.value[best.target[0]][best.target[1]].type) - getPieceValue(board.value[best.piece[0]][best.piece[1]].type);
    for (let move of tradeMoves) {
      let piece = board.value[move.piece[0]][move.piece[1]];
      let target = board.value[move.target[0]][move.target[1]];
      if (getPieceValue(target.type) - getPieceValue(piece.type) > bestDifference) {
        best = move;
        bestDifference = getPieceValue(target.type) - getPieceValue(piece.type);
      }
    }
    tradeMove = best;
  }

  let safeBlunderedPiece: Move | null = null;
  preventBlunders: {
    let blunderedPieces: Move[] = [];
    let allEnemyMoves: Move[] = [];
    getAllEnemyMoves: {
      for (let position of getMoveableBotPieces(botPlayer.value == 1 ? 2 : 1)) {
        let targets = checkLegalMoves(position[0], position[1], board.value, true);
        for (let target of targets) {
          allEnemyMoves.push({ piece: position, target: target });
        }
      }
    }

    let attackedPieces: Move[] = [];
    attackedPieces: {
      for (let move of allEnemyMoves) {
        let tile = board.value[move.target[0]][move.target[1]];
        if (tile.player == botPlayer.value) {
          attackedPieces.push(move);
        }
      }
    }

    let coveredFields: Position[] = [];
    getByEnemyCoveredFields: {
      for (let move of allEnemyMoves) {
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
            botPlayer.value
          ).find(m => m[0] == move.target[0] && m[1] == move.target[1])
        )
          coveredFields.push(move.target);
      }
    }

    blunderedPieces: {
      let coveredPieces: Position[] = [];
      for (let move of attackedPieces) {
        let appliedBoard = applyMove(
          move.piece[0],
          move.piece[1],
          move.target[0],
          move.target[1],
          checkLegalMoves(move.piece[0], move.piece[1], board.value, false),
          board.value
        );
        coveredPieces = checkAllLegalMoves(appliedBoard, botPlayer.value).filter(m => m[0] == move.target[0] && m[1] == move.target[1]);
      }
      if (coveredPieces) {
        for (let move of attackedPieces) {
          if (!coveredPieces.find(p => p[0] == move.target[0] && p[1] == move.target[1])) {
            blunderedPieces.push(move);
          }
        }
      }
    }
    safeStrongestPiece: {
      let strongest: Position;
      let value = 0;
      for (let move of blunderedPieces) {
        if (getPieceValue(board.value[move.target[0]][move.target[1]].type) > value) {
          strongest = move.target;
          value = getPieceValue(board.value[move.target[0]][move.target[1]].type);
        }
      }
      let filteredMoves = allMoves
        .filter(m => blunderedPieces.find(p => p.target[0] == m.piece[0] && p.target[1] == m.piece[1]))
        .filter(m => !coveredFields.find(f => f[0] == m.target[0] && f[1] == m.target[1]));

      if (filteredMoves.find(m => m.piece[0] == strongest[0] && m.piece[1] == strongest[1])) {
        filteredMoves = filteredMoves.filter(m => m.piece[0] == strongest[0] && m.piece[1] == strongest[1]);
      }
      if (filteredMoves.length > 0) {
        safeBlunderedPiece = filteredMoves[Math.floor(Math.random() * filteredMoves.length)];
      }
    }
  }

  if (tradeMove) {
    let bestDifference =
      getPieceValue(board.value[tradeMove.target[0]][tradeMove.target[1]].type) -
      getPieceValue(board.value[tradeMove.piece[0]][tradeMove.piece[1]].type);

    returnMove = tradeMove;
    console.log('trade', '+', bestDifference);
  }

  if (safeBlunderedPiece) {
    returnMove = safeBlunderedPiece;
    console.log('preventBlunder');
  }
  //check if "blundered" piece can trade
  if (tradeMove && safeBlunderedPiece && safeBlunderedPiece.piece[0] == tradeMove.piece[0] && safeBlunderedPiece.piece[0] == tradeMove.piece[1]) {
    returnMove = tradeMove;
  }
  if (queenTake || takeBlunder) {
    if (queenTake) {
      returnMove = queenTake;
      console.log('takeQueen');
      if (board.value[queenTake.piece[0]][queenTake.piece[1]].type == 'Queen' && takeBlunder) {
        returnMove = takeBlunder;
      }
    } else {
      returnMove = takeBlunder;
    }
  }
  if (check) {
    returnMove = check;
    console.log('check');
  }
  if (checkmate.piece && checkmate.target) {
    returnMove = checkmate;
    console.log('checkmate');
  }
  if (restrictedMove) return restrictedMove;
  //get random move without blunders if nothing else works
  if (!returnMove) {
    console.log('no returnMove found');
    returnMove = getRandomMove(coveredFields, allMoves);
  }
  return returnMove;
}
function getRandomMove(coveredFields: Position[], allMoves: Move[]) {
  let returnMove: Move;
  let rndMoves = allMoves.filter(m => !coveredFields.find(f => f[0] == m.target[0] && f[1] == m.target[1]));
  let move = rndMoves[Math.floor(Math.random() * rndMoves.length)];
  returnMove = move;

  if (!move?.piece[0] || !move?.target[0]) {
    returnMove = allMoves[Math.floor(Math.random() * allMoves.length)];
  }
  console.log('RandomMove');
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
    : (King1Checked.value.length == 0 && King2Checked.value.length == 0 && AllLegalMoves.value.length == 0) ||
      piecesOnBoard.value == 2 ||
      stalemateCheck.value > 10
    ? 'stalemate'
    : ''
);
