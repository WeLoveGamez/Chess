import type { Position } from './types';
import { board, applyMove, getPieceValue, selectedCell, playerTurn, King2Checked, King1Checked, piecesOnBoard } from './board';
import { checkAllLegalMoves, checkLegalMoves, checkChecks } from './moves';
import { computed, ref } from 'vue';

export const bot = ref(true);
export const botPlayer = ref<1 | 2>(2);
export type Move = { piece: Position; target: Position };

export function getGoodBotMove(moveableBotPieces: Position[], restrictedMoves?: Move[]): Move {
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
  if (restrictedMoves && restrictedMoves.length > 0) allMoves = restrictedMoves;

  let restrictedMove;
  if (!restrictedMoves) {
    console.log('get restricted move');
    let noKingMoves = allMoves.filter(m => board.value[m.piece[0]][m.piece[1]].type != 'King');
    restrictedMove = getGoodBotMove(moveableBotPieces, noKingMoves);
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

  // trade horses and bishops

  let tradeMoves: Move[] = [];
  {
    for (let move of targetablePieces) {
      if (getPieceValue(board.value[move.piece[0]][move.piece[1]].type) <= getPieceValue(board.value[move.target[0]][move.target[1]].type)) {
        tradeMoves.push(move);
      }
    }
  }

  // prevent blunders
  let blunderedPieces: Position[] = [];
  {
    let allEnemyMoves: Move[] = [];
    {
      for (let position of getMoveableBotPieces(botPlayer.value == 1 ? 2 : 1)) {
        let targets = checkLegalMoves(position[0], position[1], board.value, true);
        for (let target of targets) {
          allEnemyMoves.push({ piece: position, target: target });
        }
      }
    }

    let possibleBlunders: Move[] = [];
    for (let move of allEnemyMoves) {
      let tile = board.value[move.target[0]][move.target[1]];
      if (tile.player == botPlayer.value) {
        possibleBlunders.push(move);
      }
    }

    let coveredFields: Position[] = [];
    {
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

    for (let move of possibleBlunders) {
      if (
        !coveredFields.find(f => f[0] == move.piece[0] && f[1] == move.piece[1]) ||
        getPieceValue(board.value[move.piece[0]][move.piece[1]].type) > getPieceValue(board.value[move.target[0]][move.target[1]].type)
      ) {
        blunderedPieces.push(move.target);
      }
    }
  }

  //TODO:
  // move towards enemy king
  // develop

  let bestDifference, best;
  if (tradeMoves.length > 0) {
    best = tradeMoves[0];
    bestDifference = getPieceValue(board.value[best.target[0]][best.target[1]].type) - getPieceValue(board.value[best.piece[0]][best.piece[1]].type);
    for (let move of tradeMoves) {
      let piece = board.value[move.piece[0]][move.piece[1]];
      let target = board.value[move.target[0]][move.target[1]];
      if (getPieceValue(target.type) - getPieceValue(piece.type) > bestDifference) {
        best = move;
        bestDifference = getPieceValue(target.type) - getPieceValue(piece.type);
      }
    }
    returnMove = best;
    console.log('trade', '+', bestDifference, { tradeMoves });
  }

  if (blunderedPieces.length > 0) {
    let filteredMoves = allMoves
      .filter(m => blunderedPieces.find(p => p[0] == m.piece[0] && p[1] == m.piece[1]))
      .filter(m => !blunderedPieces.find(p => p[0] == m.piece[0] && p[1] == m.piece[1] && board.value[p[0]][p[1]].type == 'Pawn'))
      .filter(m => !coveredFields.find(f => f[0] == m.target[0] && f[1] == m.target[1]));
    returnMove = filteredMoves[Math.floor(Math.random() * filteredMoves.length)];
    console.log('preventBlunder', blunderedPieces);
  }
  //check if best trade is better than enemies blunder
  if (
    best &&
    blunderedPieces.length > 0 &&
    bestDifference &&
    getPieceValue(board.value[returnMove.target[0]][returnMove.target[1]].type) < bestDifference
  ) {
    returnMove = best;
  }
  //check if "blundered" piece can trade
  if (best && blunderedPieces.length > 0 && tradeMoves.find(m => blunderedPieces.find(p => p[0] == m.piece[0] && p[1] == m.piece[1]))) {
    returnMove = best;
  }
  if (QueenTakes.length > 0 || takeBlunders.length > 0) {
    if (QueenTakes.length > 0) {
      let position = QueenTakes.map(m => m.piece).sort(
        (a, b) => getPieceValue(board.value[a[0]][a[1]].type) - getPieceValue(board.value[b[0]][b[1]].type)
      )[0];
      let target = QueenTakes.find(m => m.piece[0] == position[0] && m.piece[1] == position[1])!.target;
      // if(board.value[position[0]][position[1]].type == 'Queen' && takeBlunders.length >0)
      returnMove = { piece: position, target };
      console.log('takeQueen');
      if (board.value[position[0]][position[1]].type == 'Queen' && takeBlunders.length > 0 && takeBlunders[0].target) {
        returnMove = takeBlunder(takeBlunders);
      }
    } else if (takeBlunders.length > 0 && takeBlunders[0].target) {
      returnMove = takeBlunder(takeBlunders);
    }
  }
  if (checks.length > 0) {
    returnMove = checks[0];
    console.log('check');
  }
  if (checkmate.piece && checkmate.target) {
    returnMove = checkmate;
    console.log('checkmate');
  }
  //get random move without blunders if nothing else works //TODO: update the if for every prio above
  if (!returnMove?.piece?.[0] || !returnMove?.target?.[0]) {
    console.log('no returnMove found');
    returnMove = getRandomMove(coveredFields, allMoves);
  }
  console.log(returnMove);
  if (restrictedMove) return restrictedMove;
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
function takeBlunder(takeBlunders: { piece: Position; target: Position }[]) {
  console.log('takeBlunder', { takeBlunders });
  return { piece: takeBlunders[0].piece, target: takeBlunders[0].target };
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
    : (King1Checked.value.length == 0 && King2Checked.value.length == 0 && AllLegalMoves.value.length == 0) || piecesOnBoard.value == 2
    ? 'stalemate'
    : ''
);
