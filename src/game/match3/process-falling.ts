import Board from "./Board";
import Tile, {TILE_FALLING_STATE, TILE_TYPE} from "./Tile";
import Grid, {GRID_TYPE} from "./Grid";
import {randomInt} from "../common/random";

/**
 * Return true if any tile moved.
 */
export function processFalling(board: Board) {
    board.tiles.forEach(tile => {
        if (!tile.animation.isPlaying(Tile.ANIMATION_FALLING)) {
            tile.fallingProcessedThisFrame = false;
            tile.fallingProcessedThisTurn = false;
            tile.fallingState = TILE_FALLING_STATE.UNCHECK;
        }
    });

    let moved = false;
    while (stepFalling(board, true)) {
        moved = true;
    }
    const rows = board.rows;
    const cols = board.cols;
    for (let row = 0; row < rows; ++row) {
        for (let col = 0; col < cols; ++col) {
            const tile = board.tiles[board.index(row, col)];
            if (tile.type === TILE_TYPE.EMPTY) {
                generatorCreateTile(board, row, col);
            }
        }
    }

    board.tiles.forEach(tile => {
        if (!tile.fallingProcessedThisFrame && tile.animation.isPlaying(Tile.ANIMATION_FALLING)) {
            return;
        }
        if (!tile.fallingProcessedThisFrame && tile.fallingProcessedPrevTurn && !tile.fallingProcessedThisTurn) {
            tile.playBounceAnimation();
        }
        tile.fallingProcessedPrevTurn = tile.fallingProcessedThisTurn;
        if (!tile.fallingProcessedThisTurn) {
            tile.fallingVelocity = 0;
        }
        tile.fallingProcessedThisTurn = false;
        tile.fallingProcessedThisFrame = false;
    });

    return moved;
}

/**
 * Swap the positions of each nonempty tile and the empty tile below it in gravity direction.
 * Return true if any tile moved.
 */
function stepFalling(board: Board, allowSlip: boolean) {
    const rows = board.rows;
    const cols = board.cols;
    const pairs: { [bottomIndex: string]: { fallingTile: Tile, empty: Tile, slip: boolean }[] } = {};
    for (let row = 0; row < rows; ++row) {
        for (let col = 0; col < cols; ++col) {
            // ===============================
            const index = board.index(row, col);
            const tile = board.tiles[index];

            if (!tile.isMovable()
                || tile.fallingProcessedThisTurn
                || tile.animation.isPlaying(Tile.ANIMATION_FALLING)
            ) {
                continue;
            }

            const grid = board.grids[index];
            const directTarget = grid.directTarget;
            if (directTarget) {
                const targetTile = board.tiles[directTarget.index];
                if (directTarget.type === GRID_TYPE.SPACE && targetTile.type === TILE_TYPE.EMPTY) {
                    pairs[directTarget.index] = pairs[directTarget.index] || [];
                    pairs[directTarget.index].push({fallingTile: tile, empty: targetTile, slip: false});
                    continue;
                }
            }

            if (!allowSlip) {
                continue;
            }

            // slip to bottom left or bottom right empty grid
            if (!directTarget || isLanded(board, board.tiles[directTarget.index])) {
                const offset = randomInt(0, 1);
                for (let i = 0; i < grid.flankTarget.length; ++i) {
                    const index = (i + offset) % grid.flankTarget.length;
                    const flankTarget = grid.flankTarget[index];
                    const targetTile = board.tiles[flankTarget.index];
                    if (targetTile.type === TILE_TYPE.EMPTY && !willAnyTileFallsInto(board, flankTarget)) {
                        pairs[flankTarget.index] = pairs[flankTarget.index] || [];
                        pairs[flankTarget.index].push({fallingTile: tile, empty: targetTile, slip: true});
                        break;
                    }
                }
            }
            // ===============================
        }
    }

    // swap
    let moved = false;
    Object.keys(pairs).forEach(bottomIndex => {
        moved = true;
        const currentGridPairs = pairs[bottomIndex];
        const directlyFallingPairs = currentGridPairs.filter(pair => !pair.slip);
        const candidatePairs = directlyFallingPairs.length ? directlyFallingPairs : currentGridPairs;
        const pair = candidatePairs[randomInt(0, currentGridPairs.length - 1)];
        const {fallingTile, empty} = pair;

        fallingTile.fallingFrom = board.grids[fallingTile.index()];
        fallingTile.fallingProcessedThisTurn = true;
        fallingTile.fallingProcessedThisFrame = true;
        board.swapTiles(fallingTile, empty);
        fallingTile.actualOffset.set(0, 0);
        empty.actualOffset.set(0, 0);

        // avoid overlapping
        if (empty.fallingProcessedThisTurn) {
            empty.fallingVelocity = fallingTile.fallingVelocity = Math.min(empty.fallingVelocity, fallingTile.fallingVelocity);
        } else {
            empty.fallingProcessedThisTurn = true;
            empty.fallingVelocity = fallingTile.fallingVelocity;
        }

        generatorCreateTile(board, empty.row, empty.col, fallingTile.fallingVelocity);
        board.animation.sync(Board.ANIMATION_FALLING, fallingTile.playFallingAnimation());
    });
    return moved;
}

function generatorCreateTile(board: Board, row: number, col: number, fallingVelocity: number = 0) {
    const index = board.index(row, col);
    const grid = board.grids[index];
    if (grid.type === GRID_TYPE.SPACE && grid.generator) {
        const newTile = board.createTile(row, col, TILE_TYPE.TILE, randomInt(0, board.colors - 1));
        newTile.fallingVelocity = fallingVelocity;
        newTile.fallingProcessedThisTurn = true;
        newTile.fallingProcessedThisFrame = true;
        board.tiles[index].remove();
        board.tiles[index] = newTile;
        board.animation.sync(Board.ANIMATION_FALLING, newTile.playFallingAnimation());
    }
}

function willAnyTileFallsInto(board: Board, space: Grid) {
    if (space.generator) {
        return true;
    }
    if (space.directSources.length < 1) {
        return false;
    }
    return space.directSources.findIndex(grid => willAnyTileFallsOrSlipsInto(board, grid)) >= 0;
}

function willAnyTileFallsOrSlipsInto(board: Board, space: Grid): boolean {
    if (space.generator) {
        return true;
    }
    const tile = board.tiles[board.index(space.row, space.col)];
    if (tile.isMovable()) {
        return true;
    }
    return space.directSources.findIndex(grid => willAnyTileFallsOrSlipsInto(board, grid)) >= 0
        || space.flankSources.findIndex(grid => canATileSlipsFrom(board, grid)) >= 0;
}

function canATileSlipsFrom(board: Board, grid: Grid) {
    if (!grid.directTarget || !isLanded(board, board.tiles[grid.directTarget.index])) {
        return false;
    }
    return willAnyTileFallsOrSlipsInto(board, grid);
}

function isLanded(board: Board, tile: Tile): boolean {
    const row = tile.row;
    const col = tile.col;
    const grid = board.grids[board.index(row, col)];
    if (tile.type === TILE_TYPE.EMPTY && grid.type !== GRID_TYPE.VOID) {
        return false;
    }
    let landed: boolean = false;
    switch (tile.fallingState) {
        case TILE_FALLING_STATE.FALLING:
            return false;
        case TILE_FALLING_STATE.LANDED:
            return true;
        case TILE_FALLING_STATE.UNCHECK:
            // avoid infinity loop
            tile.fallingState = TILE_FALLING_STATE.LANDED;
            if (!grid.directTarget) {
                landed = true;
            } else {
                landed = isLanded(board, board.tiles[grid.directTarget.index]);
            }
            break;
    }
    tile.fallingState = landed ? TILE_FALLING_STATE.LANDED : TILE_FALLING_STATE.FALLING;
    return landed;
}
