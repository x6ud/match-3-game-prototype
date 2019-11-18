import Tile from "./Tile";
import Board from "./Board";
import {randomlySelectOne} from "../common/random";
import {LIGHTNING_BOMBS_MIN_MATCH} from "./process-clear";

export const MIN_MATCH_IN_ONE_LINE = 3;

/**
 * Find continuous tiles of same color in one line and mark as cleared.
 */
export function processMatching(board: Board): boolean {
    const rows = board.rows;
    const cols = board.cols;
    let shouldClear: boolean = false;
    for (let row = 0; row < rows; ++row) {
        for (let col = 0; col < cols; ++col) {
            // ===============================
            const tile = board.tiles[board.index(row, col)];
            if (!tile.isMatchable()) {
                continue;
            }
            // check in horizontal direction
            if (col <= cols - MIN_MATCH_IN_ONE_LINE) {
                let count = 1;
                for (let i = 1; col + i < cols; ++i) {
                    const curr = board.tiles[board.index(row, col + i)];
                    if (curr.isMatchable() && curr.matches(tile)) {
                        count += 1;
                    } else {
                        break;
                    }
                }
                if (count >= MIN_MATCH_IN_ONE_LINE) {
                    shouldClear = true;
                    for (let i = 0; i < count; ++i) {
                        board.tiles[board.index(row, col + i)].clearMark = true;
                    }
                }
            }
            // check in vertical direction
            if (row <= rows - MIN_MATCH_IN_ONE_LINE) {
                let count = 1;
                for (let i = 1; row + i < rows; ++i) {
                    const curr = board.tiles[board.index(row + i, col)];
                    if (curr.isMatchable() && curr.matches(tile)) {
                        count += 1;
                    } else {
                        break;
                    }
                }
                if (count >= MIN_MATCH_IN_ONE_LINE) {
                    shouldClear = true;
                    for (let i = 0; i < count; ++i) {
                        board.tiles[board.index(row + i, col)].clearMark = true;
                    }
                }
            }
            // ===============================
        }
    }
    return shouldClear;
}

/**
 * Affect operation tips.
 */
export function getSwappingPriority(tile1: Tile, tile2: Tile) {
    if (!(tile1.isSwappable() && tile2.isSwappable())) {
        return 0;
    }
    if (tile1.isBomb() && tile2.isBomb()) {
        return 4;
    }
    if (!(tile1.isMatchable() || tile2.isMatchable())) {
        return 0;
    }
    if (tile1.isBomb() || tile2.isBomb()) {
        return 1;
    }
    temporarySwapTiles(tile1, tile2);
    let t1H =
        tile1.isMatchable() ?
            1
            + countContinuousTilesMatchTarget(tile1, tile1.row, tile1.col, 0, -1)
            + countContinuousTilesMatchTarget(tile1, tile1.row, tile1.col, 0, +1)
            : 0;
    let t1V =
        tile1.isMatchable() ?
            1
            + countContinuousTilesMatchTarget(tile1, tile1.row, tile1.col, -1, 0)
            + countContinuousTilesMatchTarget(tile1, tile1.row, tile1.col, +1, 0)
            : 0;
    let t2H =
        tile2.isMatchable() ?
            1
            + countContinuousTilesMatchTarget(tile2, tile2.row, tile2.col, 0, -1)
            + countContinuousTilesMatchTarget(tile2, tile2.row, tile2.col, 0, +1)
            : 0;
    let t2V =
        tile2.isMatchable() ?
            1
            + countContinuousTilesMatchTarget(tile2, tile2.row, tile2.col, -1, 0)
            + countContinuousTilesMatchTarget(tile2, tile2.row, tile2.col, +1, 0)
            : 0;
    temporarySwapTiles(tile1, tile2);
    t1H = t1H >= MIN_MATCH_IN_ONE_LINE ? t1H : 0;
    t1V = t1V >= MIN_MATCH_IN_ONE_LINE ? t1V : 0;
    t2H = t2H >= MIN_MATCH_IN_ONE_LINE ? t2H : 0;
    t2V = t2V >= MIN_MATCH_IN_ONE_LINE ? t2V : 0;
    // const t1 = t1H + t1V - (t1H && t1V ? 1 : 0);
    // const t2 = t2H + t2V - (t2H && t1V ? 1 : 0);
    // return Math.max(t1, t2);
    const maxLine = Math.max(t1H, t1V, t2H, t2V);
    if (maxLine >= LIGHTNING_BOMBS_MIN_MATCH) {
        return maxLine + 1;
    }
    if (t1H >= MIN_MATCH_IN_ONE_LINE && t1V >= MIN_MATCH_IN_ONE_LINE
        || t2H >= MIN_MATCH_IN_ONE_LINE && t2V >= MIN_MATCH_IN_ONE_LINE
    ) {
        return 5;
    }
    return maxLine;
}

function temporarySwapTiles(tile1: Tile, tile2: Tile) {
    const board = tile1.board;
    [board.tiles[board.index(tile1.row, tile1.col)], board.tiles[board.index(tile2.row, tile2.col)]] = [tile2, tile1];
    [tile1.row, tile1.col, tile2.row, tile2.col] = [tile2.row, tile2.col, tile1.row, tile1.col];
}

function countContinuousTilesMatchTarget(target: Tile, row: number, col: number, detRow: number, detCol: number): number {
    if (!target.isMatchable()) {
        return 0;
    }
    if (row === target.row && col === target.col) {
        return countContinuousTilesMatchTarget(target, row + detRow, col + detCol, detRow, detCol);
    }
    const board = target.board;
    if (row < 0 || col < 0 || row >= board.rows || col >= board.cols) {
        return 0;
    }
    const tile = board.tiles[board.index(row, col)];
    if (tile.isMatchable() && target.matches(tile)) {
        return 1 + countContinuousTilesMatchTarget(target, row + detRow, col + detCol, detRow, detCol);
    }
    return 0;
}

/**
 * Find a pair of tiles that will clear the most tiles after swapping.
 */
export function findBestSwappingPair(board: Board): [Tile, Tile] | undefined {
    let bestPairs: [Tile, Tile][] = [];
    let bestPriority: number = 0;
    const rows = board.rows;
    const cols = board.cols;
    for (let row = 0; row < rows; ++row) {
        for (let col = 0; col < cols; ++col) {
            const tile = board.tiles[board.index(row, col)];
            if (row < rows - 1) {
                const other = board.tiles[board.index(row + 1, col)];
                const priority = getSwappingPriority(tile, other);
                if (priority > bestPriority) {
                    bestPriority = priority;
                    bestPairs = [[tile, other]];
                } else if (priority && priority === bestPriority) {
                    bestPairs.push([tile, other]);
                }
            }
            if (col < cols - 1) {
                const other = board.tiles[board.index(row, col + 1)];
                const priority = getSwappingPriority(tile, other);
                if (priority > bestPriority) {
                    bestPriority = priority;
                    bestPairs = [[tile, other]];
                } else if (priority && priority === bestPriority) {
                    bestPairs.push([tile, other]);
                }
            }
        }
    }
    return randomlySelectOne(bestPairs);
}
