import type { Move, Position } from './types';
import { board, applyMove, getPieceType, getTile, getTilePlayer } from './board';
import { checkAllLegalMoves, checkLegalMoves, checkChecks } from './moves';
import { getPieceValue } from './utils';
import { ref } from 'vue';

export const bot = ref(true);
export const botPlayer = ref<1 | 2>(2);

export function getGoodBotMove(): Move {
  const allMoves = getAllMoves();
  const checkMates = getCheckmates(allMoves);
  if (checkMates.length > 0) {
    console.log('checkmate');
    return checkMates[0];
  }

  const targetablePieces = getTargetablePieces(allMoves);
  const blunders = getSortedBlunders(targetablePieces);
  const trades = getSortedTrades(targetablePieces);
  const queenTakes = getSortedQueenTakes(allMoves);
  let dif;
  if (trades.length > 0) {
    dif = getPieceValue(getPieceType(trades[0].target)) - getPieceValue(getPieceType(trades[0].piece));
  }
  if (dif && trades.length > 0 && blunders.length > 0) {
    if (queenTakes.length > 0 && getPieceValue(getPieceType(queenTakes[0].target)) - getPieceValue(getPieceType(queenTakes[0].piece)) >= dif) {
      return queenTakes[0];
    }
    if (getPieceValue(getPieceType(blunders[0].target)) >= dif) {
      return blunders[0];
    }
  } else if (blunders.length > 0) {
    return blunders[0];
  }

  const coveredFields = getCoveredFields(allMoves, botPlayer.value);
  const preventBlunders = getSortedPreventBlunders(allMoves);
  const checks = getSafeChecks(allMoves, coveredFields);
  if (preventBlunders.length > 0) {
    if (checks.length > 0) {
      for (let move of preventBlunders) {
        let safeWithCheck = checks.find(m => m.piece[0] == move.piece[0] && m.piece[1] == move.piece[1]);
        if (safeWithCheck) return safeWithCheck;
      }
    }
    if (dif && dif > getPieceValue(getPieceType(preventBlunders[0].piece))) {
      return trades[0];
    }
    return preventBlunders[0];
  }
  if (trades[0]) {
    return trades[0];
  }
  if (checks.length > 0) {
    return checks[0];
  }
  const noKingMoves = allMoves.filter(m => getPieceType(m.piece) == 'King');
  let safeNoKingMove = getRandomSafeMove(coveredFields, noKingMoves);
  let safeMove = getRandomSafeMove(coveredFields, allMoves);
  if (safeNoKingMove) return safeNoKingMove;
  else if (safeMove) return safeMove;
  else return allMoves.sort((a, b) => getPieceValue(getPieceType(a.piece)) - getPieceValue(getPieceType(b.piece)))[0];
}

function getAllMoves() {
  let allMoves: Move[] = [];

  for (let [rowIndex, row] of Object.entries(board.value)) {
    for (let [cellIndex, cell] of Object.entries(row)) {
      let moves = checkLegalMoves(+rowIndex, +cellIndex, board.value, true);
      if (getTilePlayer([+rowIndex, +cellIndex]) == botPlayer.value) {
        for (let move of moves) {
          allMoves.push({ piece: [+rowIndex, +cellIndex], target: move });
        }
      }
    }
  }
  return allMoves;
}

function getTargetablePieces(allMoves: Move[]) {
  let targetablePieces: Move[] = [];

  for (let move of allMoves) {
    if (getPieceType(move.target)) targetablePieces.push(move);
  }

  return targetablePieces;
}

function getSortedBlunders(targetablePieces: Move[]) {
  let blunders: Move[] = [];
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
  blunders = targetablePieces
    .filter(t => !enemyMoves.find(m => t.target[0] == m[0] && t.target[1] == m[1]))
    .sort((a, b) => getPieceValue(getPieceType(b.target)) - getPieceValue(getPieceType(a.target)));

  return blunders;
}

function getSortedQueenTakes(allMoves: Move[]) {
  let queenTakes = allMoves
    .filter(m => getPieceType(m.target) == 'Queen')
    .sort((a, b) => getPieceValue(getPieceType(a.piece)) - getPieceValue(getPieceType(b.piece)));

  return queenTakes;
}

function getCheckmates(allMoves: Move[]) {
  let checkmates: Move[] = [];
  for (let move of allMoves) {
    let possibleMoves = checkAllLegalMoves(
      applyMove(
        move.piece[0],
        move.piece[1],
        move.target[0],
        move.target[1],
        checkLegalMoves(move.piece[0], move.piece[1], board.value, true),
        board.value
      ),
      botPlayer.value == 1 ? 2 : 1
    );
    let checks = checkChecks(
      botPlayer.value,
      applyMove(
        move.piece[0],
        move.piece[1],
        move.target[0],
        move.target[1],
        checkLegalMoves(move.piece[0], move.piece[1], board.value, true),
        board.value
      )
    );
    if (possibleMoves.length == 0 && checks.length > 0) {
      checkmates.push(move);
    }
  }
  return checkmates;
}

function getSafeChecks(allMoves: Move[], coveredFields: Position[]) {
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
  return checks;
}

function getSortedTrades(targetablePieces: Move[]) {
  let tradeMoves: Move[] = [];
  for (let move of targetablePieces) {
    if (getPieceValue(getPieceType(move.piece)) <= getPieceValue(getPieceType(move.target))) {
      tradeMoves.push(move);
    }
  }
  tradeMoves = tradeMoves.sort(
    (a, b) =>
      getPieceValue(getPieceType(b.target)) -
      getPieceValue(getPieceType(b.piece)) -
      (getPieceValue(getPieceType(a.target)) - getPieceValue(getPieceType(a.piece)))
  );

  return tradeMoves;
}

function getSortedPreventBlunders(allMoves: Move[]) {
  let allEnemyMoves: Move[] = allMoves.filter(m => getTilePlayer(m.piece) != botPlayer.value);
  let attackedPieces: Move[] = allEnemyMoves.filter(m => getTilePlayer(m.target) == botPlayer.value);
  // let byEnemyCoveredFields: Position[] = allEnemyMoves.map(m => m.target);
  // let selfCoveredFields: Position[] = allMoves.filter(m => getTilePlayer(m.target) == botPlayer.value).map(e => e.target);

  let blunderedPieces: Move[] = [];
  let coveredFields: Position[] = [];
  blunderedPieces: {
    for (let move of attackedPieces) {
      let appliedBoard = applyMove(
        move.piece[0],
        move.piece[1],
        move.target[0],
        move.target[1],
        checkLegalMoves(move.piece[0], move.piece[1], board.value, false),
        board.value
      );
      coveredFields.push(...checkAllLegalMoves(appliedBoard, botPlayer.value).filter(m => m[0] == move.target[0] && m[1] == move.target[1]));
      blunderedPieces = attackedPieces.filter(
        m =>
          !coveredFields.find(p => p[0] == m.target[0] && p[1] == m.target[1]) &&
          getPieceValue(getPieceType(m.target)) < getPieceValue(getPieceType(m.target))
      );
    }
  }
  blunderedPieces.sort((a, b) => getPieceValue(getPieceType(b.target)) - getPieceValue(getPieceType(a.target)));
  return blunderedPieces;
}

function getCoveredFields(allMoves: Move[], player: 1 | 2) {
  let coveredFields: Position[] = [];
  for (let move of allMoves) {
    let appliedBoard = applyMove(
      move.piece[0],
      move.piece[1],
      move.target[0],
      move.target[1],
      checkLegalMoves(move.piece[0], move.piece[1], board.value, false),
      board.value
    );
    coveredFields.push(...checkAllLegalMoves(appliedBoard, player).filter(m => m[0] == move.target[0] && m[1] == move.target[1]));
  }
  return coveredFields;
}

function getRandomSafeMove(coveredFields: Position[], allMoves: Move[]) {
  let returnMove: Move;
  let rndMoves = allMoves.filter(m => !coveredFields.find(f => f[0] == m.target[0] && f[1] == m.target[1]));
  if (rndMoves.length == 0) {
    returnMove = allMoves[Math.floor(Math.random() * allMoves.length)];
  } else {
    let move = rndMoves[Math.floor(Math.random() * rndMoves.length)];
    returnMove = move;
  }
  console.log('RandomMove');
  return returnMove;
}
