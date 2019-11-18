import Board from "./Board";
import Tile, {TILE_TYPE} from "./Tile";
import Animation from "../Animation";
import {randomlySelectOne} from "../common/random";
import {MIN_MATCH_IN_ONE_LINE} from "./process-matching";

export const LIGHTNING_BOMBS_MIN_MATCH = 5;
export const SMALL_BOMBS_MATCH = 4;

export function processClear(board: Board) {
    const rows = board.rows;
    const cols = board.cols;
    const clearAnimations: Animation[] = [];

    // generate lightning bombs
    for (let directionFlag = 0; directionFlag <= 1; ++directionFlag) {
        for (let row = 0; row < rows; ++row) {
            for (let col = 0; col < cols; ++col) {
                const target = board.tiles[board.index(row, col)];
                if (!(
                    target.clearMark && !target.cleared
                )) {
                    continue;
                }
                // ================================================
                const group: Tile[] = [target];
                for (
                    let det = 1;
                    directionFlag ? (det + col < cols) : (det + row < rows);
                    ++det
                ) {
                    const tile = board.tiles[
                        directionFlag ?
                            board.index(row, col + det)
                            : board.index(row + det, col)
                        ];
                    if (!(
                        tile.clearMark
                        && !tile.cleared
                        && tile.matches(target)
                    )) {
                        break;
                    }
                    group.push(tile);
                }
                if (group.length >= LIGHTNING_BOMBS_MIN_MATCH) {
                    clearAnimations.push(...group.map(tile => tile.clear()));

                    let replaced =
                        board.lastSwappedTile1 && group.includes(board.lastSwappedTile1) ? board.lastSwappedTile1
                            : board.lastSwappedTile2 && group.includes(board.lastSwappedTile2) ? board.lastSwappedTile2
                            : group[Math.floor(group.length / 2)];
                    if (replaced) {
                        const bombTile = board.createTile(
                            replaced.row,
                            replaced.col,
                            TILE_TYPE.BOMB_LIGHTNING,
                            replaced.color
                        );
                        replaced.replacement = bombTile;
                        bombTile.playGeneratingAnimation();
                        group.forEach(tile => tile.combinedTo = bombTile);
                    }
                }
                // ================================================
            }
        }
    }

    // generate cross bombs
    for (let row = 0; row < rows; ++row) {
        for (let col = 0; col < cols; ++col) {
            const target = board.tiles[board.index(row, col)];
            if (!(
                target.clearMark && !target.cleared
            )) {
                continue;
            }
            // ================================================
            const group: Tile[] = [target];
            let countH = 1;
            let countV = 1;
            for (let det = -1; det + col >= 0; --det) {
                const tile = board.tiles[board.index(row, col + det)];
                if (tile.clearMark && !tile.cleared && tile.matches(target)) {
                    countH += 1;
                    group.push(tile);
                } else {
                    break;
                }
            }
            for (let det = 1; det + col < cols; ++det) {
                const tile = board.tiles[board.index(row, col + det)];
                if (tile.clearMark && !tile.cleared && tile.matches(target)) {
                    countH += 1;
                    group.push(tile);
                } else {
                    break;
                }
            }
            for (let det = -1; det + row >= 0; --det) {
                const tile = board.tiles[board.index(row + det, col)];
                if (tile.clearMark && !tile.cleared && tile.matches(target)) {
                    countV += 1;
                    group.push(tile);
                } else {
                    break;
                }
            }
            for (let det = 1; det + row < rows; ++det) {
                const tile = board.tiles[board.index(row + det, col)];
                if (tile.clearMark && !tile.cleared && tile.matches(target)) {
                    countV += 1;
                    group.push(tile);
                } else {
                    break;
                }
            }
            if (countH >= MIN_MATCH_IN_ONE_LINE && countV >= MIN_MATCH_IN_ONE_LINE) {
                clearAnimations.push(...group.map(tile => tile.clear()));

                const bombTile = board.createTile(
                    target.row,
                    target.col,
                    TILE_TYPE.BOMB_CROSS,
                    target.color
                );
                target.replacement = bombTile;
                bombTile.playGeneratingAnimation();
                group.forEach(tile => tile.combinedTo = bombTile);
            }
            // ================================================
        }
    }

    // generate small bombs
    for (let directionFlag = 0; directionFlag <= 1; ++directionFlag) {
        for (let row = 0; row < rows; ++row) {
            for (let col = 0; col < cols; ++col) {
                const target = board.tiles[board.index(row, col)];
                if (!(
                    target.clearMark && !target.cleared
                )) {
                    continue;
                }
                // ================================================
                const group: Tile[] = [target];
                for (
                    let det = 1;
                    directionFlag ? (det + col < cols) : (det + row < rows);
                    ++det
                ) {
                    const tile = board.tiles[
                        directionFlag ?
                            board.index(row, col + det)
                            : board.index(row + det, col)
                        ];
                    if (!(
                        tile.clearMark
                        && !tile.cleared
                        && tile.matches(target)
                    )) {
                        break;
                    }
                    group.push(tile);
                }
                if (group.length === SMALL_BOMBS_MATCH) {
                    clearAnimations.push(...group.map(tile => tile.clear()));

                    let replaced =
                        board.lastSwappedTile1 && group.includes(board.lastSwappedTile1) ? board.lastSwappedTile1
                            : board.lastSwappedTile2 && group.includes(board.lastSwappedTile2) ? board.lastSwappedTile2
                            : randomlySelectOne(group);
                    if (replaced) {
                        const bombTile = board.createTile(
                            replaced.row,
                            replaced.col,
                            TILE_TYPE.BOMB_SMALL,
                            replaced.color
                        );
                        replaced.replacement = bombTile;
                        bombTile.playGeneratingAnimation();
                        group.forEach(tile => tile.combinedTo = bombTile);
                    }
                }
                // ================================================
            }
        }
    }

    board.tiles.forEach(tile => {
        if (tile.clearMark && !tile.cleared) {
            clearAnimations.push(tile.clear());
        }
    });

    if (clearAnimations.length) {
        board.animation
            .sync(
                Board.ANIMATION_CLEAR,
                ...clearAnimations
            );
    }
}
