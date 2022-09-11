import type { Move, Position } from './types';
import { board, applyMove, getPieceType, getTile, getTilePlayer } from './board';
import { checkAllLegalMoves, checkLegalMoves, checkChecks } from './moves';
import { getPieceValue } from './utils';
import { ref } from 'vue';

export const bot = ref(true);
export const botPlayer = ref<1 | 2>(2);

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

export function getGoodBotMove(moveableBotPieces: Position[]): Move {
  let returnMove: null | Move = null;

  const allMoves = getAllMoves(moveableBotPieces);
  const targetablePieces = getTargetablePieces(allMoves);
  const coveredFields = getCoveredFields(allMoves, botPlayer.value);

  // const noKingMoves = allMoves.filter(m => board.value[m.piece[0]][m.piece[1]].type == 'King');
  const blunders = getSortedBlunders(targetablePieces);
  const queenTakes = getSortedQueenTakes(allMoves);
  const checkMates = getCheckmates(allMoves);
  const checks = getChecks(allMoves, coveredFields);
  const trades = getSortedTrades(targetablePieces);
  const preventBlunders = getPreventBlunders(allMoves);

  if (checkMates.length > 0) {
    console.log('checkmate');
    return checkMates[0];
  }

  //  TODO: fix all prio checks below
  {
    {
      let bestTrade = trades[0];
      if (bestTrade) {
        let bestDifference = getPieceValue(getPieceType(bestTrade.target)) - getPieceValue(getPieceType(bestTrade.piece));

        returnMove = bestTrade;
        console.log('trade', '+', bestDifference);
      }
    }
    if (safeBlunderedPiece) {
      returnMove = safeBlunderedPiece;
      console.log('preventBlunder');
    }
  }
  //check if "blundered" piece can trade
  if (tradeMove && safeBlunderedPiece && safeBlunderedPiece.piece[0] == tradeMove.piece[0] && safeBlunderedPiece.piece[0] == tradeMove.piece[1]) {
    returnMove = tradeMove;
  }
  if (queenTake || takeBlunder) {
    if (queenTake) {
      returnMove = queenTake;
      console.log('takeQueen');
      if (getPieceType(queenTake.piece) == 'Queen' && takeBlunder) {
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

  if (restrictedMove) return restrictedMove;
  //get random move without blunders if nothing else works
  if (!returnMove) {
    console.log('no returnMove found');
    returnMove = getRandomSafeMove(coveredFields, allMoves);
  }
  return returnMove;
}

function getAllMoves(moveableBotPieces: Position[]) {
  let allMoves: Move[] = [];

  for (let position of moveableBotPieces) {
    let targets = checkLegalMoves(position[0], position[1], board.value, true);
    for (let target of targets) {
      allMoves.push({ piece: position, target: target });
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

function getChecks(allMoves: Move[], coveredFields: Position[]) {
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

function getPreventBlunders(allMoves: Move[]) {
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
  // safeStrongestPiece: {
  //   let strongest = blunderedPieces[0].target;

  //   let safeMoves = allMoves
  //     .filter(m => blunderedPieces.find(p => p.target[0] == m.piece[0] && p.target[1] == m.piece[1]))
  //     .filter(m => !coveredFields.find(f => f[0] == m.target[0] && f[1] == m.target[1]));

  //   if (safeMoves.find(m => m.piece[0] == strongest[0] && m.piece[1] == strongest[1])) {
  //     safeMoves = safeMoves.filter(m => m.piece[0] == strongest[0] && m.piece[1] == strongest[1]);
  //   }
  //   if (safeMoves.length > 0) {
  //     safeBlunderedPiece = safeMoves[Math.floor(Math.random() * safeMoves.length)];
  //   }
  //   for (let piece of blunderedPieces.map(m => m.target)) {
  //     let possibleMoves = safeMoves.filter(m => m.piece[0] == piece[0] && m.piece[1] == piece[1]);
  //     if (possibleMoves.length > 0) {
  //       safeBlunderedPiece = possibleMoves[0];
  //       break;
  //     }
  //   }
  // }
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
