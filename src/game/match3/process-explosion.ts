import Board from "./Board";
import Tile, {TILE_TYPE} from "./Tile";
import {randomlySelectOne} from "../common/random";

export const EXPLOSION_DELAY_PER_GRID = 80;

export function processExplosion(board: Board) {
    board.tiles.forEach(target => {
        if (
            target.isBomb()
            && target.exploded
            && !target.cleared
        ) {
            switch (target.type) {
                case TILE_TYPE.BOMB_LIGHTNING:
                    if (target.combinedWith && target.combinedWith.type === TILE_TYPE.BOMB_LIGHTNING) {
                        processAllClear(board, target);
                    } else {
                        processBombLightning(board, target, target.combinedWith);
                    }
                    break;
                case TILE_TYPE.BOMB_CROSS:
                    if (target.combinedWith) {
                        switch (target.combinedWith.type) {
                            case TILE_TYPE.BOMB_LIGHTNING:
                                processBombLightning(board, target, target);
                                break;
                            case TILE_TYPE.BOMB_CROSS:
                                processBombCross(board, target, 3);
                                break;
                            case TILE_TYPE.BOMB_SMALL:
                                processBombCross(board, target, 3);
                                break;
                            default:
                                processBombCross(board, target, 1);
                                break;
                        }
                    } else {
                        processBombCross(board, target, 1);
                    }
                    break;
                case TILE_TYPE.BOMB_SMALL:
                    if (target.combinedWith) {
                        switch (target.combinedWith.type) {
                            case TILE_TYPE.BOMB_LIGHTNING:
                                processBombLightning(board, target, target);
                                break;
                            case TILE_TYPE.BOMB_CROSS:
                                processBombCross(board, target, 3);
                                break;
                            case TILE_TYPE.BOMB_SMALL:
                                processBombSmall(board, target, 5);
                                break;
                            default:
                                processBombSmall(board, target, 3);
                                break;
                        }
                    } else {
                        processBombSmall(board, target, 3);
                    }
                    break;
            }

            target.cleared = true;
            board.animation.sync(
                Board.ANIMATION_EXPLOSION,
                target.playExplosionAnimation()
                    .onFinished(() => {
                        const index = board.index(target.row, target.col);
                        board.tiles[index].remove();
                        board.tiles[index] = board.createTile(target.row, target.col, TILE_TYPE.EMPTY);
                    })
            );
        }
    });
}

function bombTile(tile: Tile) {
    if (!tile.cleared) {
        const board = tile.board;
        switch (tile.type) {
            case TILE_TYPE.TILE:
                board.animation.sync(
                    Board.ANIMATION_EXPLOSION,
                    tile.clear().onFinished(() => {
                        const index = board.index(tile.row, tile.col);
                        board.tiles[index].remove();
                        board.tiles[index] = board.createTile(tile.row, tile.col, TILE_TYPE.EMPTY);
                    })
                );
                break;
            case TILE_TYPE.BOMB_SMALL:
            case TILE_TYPE.BOMB_CROSS:
            case TILE_TYPE.BOMB_LIGHTNING:
                if (!(tile.detonated || tile.exploded)) {
                    board.animation.sync(
                        Board.ANIMATION_EXPLOSION,
                        tile.detonate()
                    );
                }
                break;
            default:
                break;
        }
    }
}

function processBombSmall(board: Board, bomb: Tile, range: number) {
    const rows = board.rows;
    const cols = board.cols;
    const halfRange = Math.floor(range / 2);
    for (let row = bomb.row - halfRange; row <= bomb.row + halfRange; ++row) {
        if (row >= 0 && row < rows) {
            for (let col = bomb.col - halfRange; col <= bomb.col + halfRange; ++col) {
                if (col >= 0 && col < cols) {
                    const delay = Math.max(Math.abs(row - bomb.row), Math.abs(col - bomb.col));
                    board.animation.delay(
                        Board.ANIMATION_EXPLOSION,
                        EXPLOSION_DELAY_PER_GRID * delay
                    ).onFinished(() => {
                        bombTile(board.tiles[board.index(row, col)])
                    });
                }
            }
        }
    }
}

function processBombCross(board: Board, bomb: Tile, range: number) {
    const rows = board.rows;
    const cols = board.cols;
    const halfRange = Math.floor(range / 2);
    const directions: [number, number][] = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    directions.forEach(det => {
        for (
            let row = bomb.row + det[0], col = bomb.col + det[1], delay = 1;
            row >= 0 && row < rows && col >= 0 && col <= cols;
            row += det[0], col += det[1], delay += 1
        ) {
            for (let detRange = -halfRange; detRange <= +halfRange; ++detRange) {
                const aRow = row + det[1] * detRange;
                const aCol = col + det[0] * detRange;
                if (aRow >= 0 && aRow < rows && aCol >= 0 && aCol < cols) {
                    board.animation.delay(
                        Board.ANIMATION_EXPLOSION,
                        EXPLOSION_DELAY_PER_GRID * delay
                    ).onFinished(() => {
                        bombTile(board.tiles[board.index(aRow, aCol)])
                    });
                }
            }
        }
    });
}

function processBombLightning(board: Board, bomb: Tile, combinedWith?: Tile) {
    let matches: Tile | undefined;
    if (combinedWith && combinedWith.isMatchable()) {
        matches = combinedWith;
    } else {
        matches = randomlySelectOne(board.tiles.filter(tile => tile.isMatchable()));
    }
    const replacement: Tile | undefined = combinedWith && combinedWith.isBomb() ? combinedWith : undefined;
    if (matches) {
        board.tiles.forEach(tile => {
            if (tile.isMatchable() && tile.matches(<Tile>matches)) {
                const delay = Math.max(Math.abs(tile.row - bomb.row), Math.abs(tile.col - bomb.col));
                board.animation.delay(
                    Board.ANIMATION_EXPLOSION,
                    EXPLOSION_DELAY_PER_GRID * delay
                ).onFinished(() => {
                    if (replacement) {
                        const newTile = board.createTile(
                            tile.row,
                            tile.col,
                            replacement.type,
                            replacement.color
                        );
                        tile.replacement = newTile;
                        board.animation.sync(
                            Board.ANIMATION_EXPLOSION,
                            newTile.playGeneratingAnimation(),
                            tile.clear().onFinished(() => {
                                newTile.detonate();
                            })
                        );
                    } else {
                        bombTile(tile);
                    }
                });
            }
        });
    }
}

function processAllClear(board: Board, bomb: Tile) {
    board.tiles.forEach(tile => {
        const delay = Math.max(Math.abs(tile.row - bomb.row), Math.abs(tile.col - bomb.col));
        board.animation.delay(
            Board.ANIMATION_EXPLOSION,
            EXPLOSION_DELAY_PER_GRID * delay
        ).onFinished(() => {
            bombTile(board.tiles[board.index(tile.row, tile.col)])
        });
    });
}
