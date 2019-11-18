import Grid, {GRID_TYPE} from "./Grid";
import Tile, {TILE_TYPE} from "./Tile";
import BoardMask from "./BoardMask";
import OperationTips from "./OperationTips";

import {LevelDef, loadLevel} from "./process-level-loading";
import {processFalling} from "./process-falling";
import {getSwappingPriority, findBestSwappingPair, processMatching} from "./process-matching";
import {processClear} from "./process-clear";
import {shuffle} from "./process-shuffle";
import ShufflingText from "./ShufflingText";

import AnimationDispatcher from "../AnimationDispatcher";
import BaseSprite, {BaseSpriteSettings} from "../BaseSprite";
import {randomIntExclude} from "../common/random";
import {EPSILON} from "../common/constants";
import {processExplosion} from "./process-explosion";

export interface BoardSettings extends BaseSpriteSettings {
    gridSize: number;
}

export default class Board extends BaseSprite {

    static readonly ANIMATION_FALLING = 'falling';
    static readonly ANIMATION_FALLING_ONE_GRID_DURATION = 290;
    static readonly ANIMATION_FALLING_MIN_DURATION = 50;

    static readonly ANIMATION_CLEAR = 'clear';

    static readonly ANIMATION_EXPLOSION = 'explosion';

    static readonly ANIMATION_SWAP = 'swap';

    static readonly ANIMATION_SHUFFLE = 'shuffle';
    static readonly ANIMATION_SHUFFLE_DELAY = 500;
    static readonly ANIMATION_SHUFFLE_SWAPPING_DURATION = 250;
    static readonly ANIMATION_SHUFFLE_SWAPPING_DURATION_REDUCTION_RATIO = 0.8;
    static readonly ANIMATION_SHUFFLE_SWAPPING_MIN_DURATION = 30;

    // tileSize = 1
    // tileSize = 0.5 * g * t^2
    // g = tileSize * 2 / t^2
    static readonly GRAVITY_ACCELERATION = 2 / Board.ANIMATION_FALLING_ONE_GRID_DURATION ** 2;
    // v = tileSize / t
    static readonly MAX_FALLING_VELOCITY = 1 / Board.ANIMATION_FALLING_MIN_DURATION;

    static readonly DRAGGING_MAX_OFFSET = 0.85;
    static readonly SWAPPING_SENSITIVITY = 0.15;

    static readonly NO_MORE_MOVES_TIMES_TRIGGER_GAME_OVER = 3;

    $handleMouseEvents = true;

    animation = new AnimationDispatcher();
    boardMask: BoardMask;
    operationTips: OperationTips;
    shufflingText: ShufflingText;

    gridSize: number;
    rows: number = 0;
    cols: number = 0;
    grids: Grid[] = [];
    tiles: Tile[] = [];
    colors: number = 0;

    gameOver: boolean = false;
    blockPlayerOperations: boolean = false;
    blockPlayerOperationsPrevFrame: boolean = false;
    matchingHasBeenChecked: boolean = false;
    noMoreMovesCount: number = 0;

    draggingTile?: Tile;
    draggingOffsetX: number = 0;
    draggingOffsetY: number = 0;
    swappedTile?: Tile;
    draggingOffsetProportion: number = 0;

    lastSwappedTile1?: Tile;
    lastSwappedTile2?: Tile;

    constructor(settings: BoardSettings) {
        super(settings);
        this.gridSize = settings.gridSize;

        this.boardMask = new BoardMask({
            global: this.global,
            board: this
        });
        this.addChild(this.boardMask);

        this.operationTips = new OperationTips({
            global: this.global,
            board: this
        });
        this.addChild(this.operationTips);

        this.shufflingText = new ShufflingText({
            global: this.global,
            board: this
        });
        this.addChild(this.shufflingText);

        this.displayObject.sortableChildren = true;
    }

    /**
     * Get array index of grid.
     */
    index(row: number, col: number) {
        if (row < 0 || col < 0 || row >= this.rows || col >= this.cols) {
            throw new Error(`Invalid index: (${row}, ${col}).`);
        }
        return row * this.cols + col;
    }

    loadLevel(levelDef: LevelDef) {
        this.animation.reset();
        this.gameOver = false;
        this.blockPlayerOperations = false;
        this.blockPlayerOperationsPrevFrame = false;
        this.matchingHasBeenChecked = false;
        this.noMoreMovesCount = 0;
        this.operationTips.setPair();
        this.draggingTile = undefined;
        this.swappedTile = undefined;
        this.lastSwappedTile1 = undefined;
        this.lastSwappedTile2 = undefined;
        this.grids.forEach(grid => grid.remove());
        loadLevel(this, levelDef);
        this.boardMask.reset();
        this.boardMask.updateMask();
    }

    /**
     * Create a new tile and add it to board's children sprites list.
     */
    createTile(row: number, col: number, type: TILE_TYPE, color: number = 0) {
        const tile = new Tile({
            global: this.global,
            board: this,
            row,
            col,
            type,
            color
        });
        this.boardMask.addChild(tile);
        return tile;
    }

    /**
     * Create tiles when game starts.
     */
    initTiles() {
        if (this.colors < 1) {
            throw new Error('The number of colors is not set.');
        }
        const rows = this.rows;
        const cols = this.cols;

        this.boardMask.removeAllChildren();

        this.tiles = [];
        for (let row = 0; row < rows; ++row) {
            for (let col = 0; col < cols; ++col) {
                const index = this.index(row, col);
                const grid = this.grids[index];
                switch (grid.type) {
                    case GRID_TYPE.SPACE:
                        // choose random color for each tile, but avoid setting 3 continuous tiles to a same color
                        const excludeColors: number[] = [];
                        if (row >= 2) {
                            const t1 = this.tiles[this.index(row - 1, col)];
                            const t2 = this.tiles[this.index(row - 2, col)];
                            if (t1.type === TILE_TYPE.TILE && t2.type === TILE_TYPE.TILE && t1.color === t2.color) {
                                excludeColors.push(t1.color);
                            }
                        }
                        if (col >= 2) {
                            const t1 = this.tiles[this.index(row, col - 1)];
                            const t2 = this.tiles[this.index(row, col - 2)];
                            if (t1.type === TILE_TYPE.TILE && t2.type === TILE_TYPE.TILE && t1.color === t2.color) {
                                excludeColors.push(t1.color);
                            }
                        }
                        this.tiles[index] = this.createTile(
                            row,
                            col,
                            TILE_TYPE.TILE,
                            randomIntExclude(0, this.colors - 1, excludeColors)
                        );
                        break;
                    default:
                        this.tiles[index] = this.createTile(row, col, TILE_TYPE.EMPTY);
                        break;
                }
            }
        }
    }

    swapTiles(tile1: Tile, tile2: Tile) {
        this.tiles[this.index(tile1.row, tile1.col)] = tile2;
        this.tiles[this.index(tile2.row, tile2.col)] = tile1;
        const actualPosition1 = tile1.localPosition.add(tile1.actualOffset);
        const actualPosition2 = tile2.localPosition.add(tile2.actualOffset);
        const tmpRow = tile1.row;
        const tmpCol = tile1.col;
        tile1.setBoardPosition(tile2.row, tile2.col);
        tile2.setBoardPosition(tmpRow, tmpCol);
        tile1.actualOffset.setAs(actualPosition1.sub(tile1.localPosition));
        tile2.actualOffset.setAs(actualPosition2.sub(tile2.localPosition));
    }

    // =============================================================

    onDragStart(x: number, y: number, button: number) {
        if (this.blockPlayerOperations || this.blockPlayerOperationsPrevFrame) {
            return;
        }
        const position = this.getGlobalPosition();
        const col = Math.floor((x - position.x) / this.gridSize);
        const row = Math.floor((y - position.y) / this.gridSize);
        const tile = this.tiles[this.index(row, col)];
        this.draggingTile = tile.isSwappable() ? tile : undefined;
        this.draggingOffsetX = 0;
        this.draggingOffsetY = 0;
    }

    onDragMove(x: number, y: number, dx: number, dy: number) {
        const draggingTile = this.draggingTile;
        if (!draggingTile) {
            return;
        }
        const offsetX = this.draggingOffsetX += dx;
        const offsetY = this.draggingOffsetY += dy;
        if (Math.abs(offsetX) < EPSILON || Math.abs(offsetY) < EPSILON) {
            return;
        }

        const maxOffset = this.gridSize * Board.DRAGGING_MAX_OFFSET;
        const row = draggingTile.row;
        const col = draggingTile.col;
        const canMoveLeft = col > 0 && this.tiles[this.index(row, col - 1)].isSwappable();
        const canMoveRight = col < this.cols - 1 && this.tiles[this.index(row, col + 1)].isSwappable();
        const canMoveUp = row > 0 && this.tiles[this.index(row - 1, col)].isSwappable();
        const canMoveDown = row < this.rows - 1 && this.tiles[this.index(row + 1, col)].isSwappable();

        let swappedTile: Tile | null = null;
        let offsetNorm: number = 0;
        do {
            if (Math.abs(offsetX) > Math.abs(offsetY)) {
                if (canMoveLeft && offsetX < 0) {
                    draggingTile.setOffset(offsetNorm = Math.max(offsetX, -maxOffset), 0);
                    swappedTile = this.tiles[this.index(row, col - 1)];
                    break;
                }
                if (canMoveRight && offsetX > 0) {
                    draggingTile.setOffset(offsetNorm = Math.min(offsetX, maxOffset), 0);
                    swappedTile = this.tiles[this.index(row, col + 1)];
                    break;
                }
            } else {
                if (canMoveUp && offsetY < 0) {
                    draggingTile.setOffset(0, offsetNorm = Math.max(offsetY, -maxOffset));
                    swappedTile = this.tiles[this.index(row - 1, col)];
                    break;
                }
                if (canMoveDown && offsetY > 0) {
                    draggingTile.setOffset(0, offsetNorm = Math.min(offsetY, maxOffset));
                    swappedTile = this.tiles[this.index(row + 1, col)];
                    break;
                }
            }
        } while (false);

        if (this.swappedTile) {
            this.swappedTile.setOffset(0, 0);
        }
        if (swappedTile) {
            this.swappedTile = swappedTile;
            swappedTile.setOffset(-draggingTile.offset.x, -draggingTile.offset.y);
            this.draggingOffsetProportion = Math.abs(offsetNorm) / maxOffset;
        } else {
            this.swappedTile = undefined;
            draggingTile.setOffset(0, 0);
            this.draggingOffsetProportion = 0;
        }
    }

    onDragEnd(x: number, y: number, dx: number, dy: number) {
        const tileA = this.draggingTile;
        const tileB = this.swappedTile;
        if (tileA && tileB
            && this.draggingOffsetProportion >= Board.SWAPPING_SENSITIVITY
            && (
                tileA.isBomb()
                || tileB.isBomb()
                || getSwappingPriority(tileA, tileB) > 0
            )
        ) {
            this.matchingHasBeenChecked = false;
            this.swapTiles(tileA, tileB);
            this.animation.sync(
                Board.ANIMATION_SWAP,
                tileA.setOffset(0, 0),
                tileB.setOffset(0, 0)
            );
            this.lastSwappedTile1 = tileA;
            this.lastSwappedTile2 = tileB;

            if (tileA.isBomb()) {
                this.animation.sync(
                    Board.ANIMATION_EXPLOSION,
                    tileA.detonate(tileB, true)
                );
            }
            if (tileB.isBomb()) {
                this.animation.sync(
                    Board.ANIMATION_EXPLOSION,
                    tileB.detonate(tileA, false)
                );
            }
        } else {
            this.draggingTile && this.draggingTile.setOffset(0, 0);
            this.swappedTile && this.swappedTile.setOffset(0, 0);
        }
        this.draggingTile = undefined;
        this.swappedTile = undefined;
    }

    onDragCancel() {
        if (this.draggingTile) {
            this.draggingTile.setOffset(0, 0);
            this.draggingTile = undefined;
        }
        if (this.swappedTile) {
            this.swappedTile.setOffset(0, 0);
            this.swappedTile = undefined;
        }
    }

    onGameOver() {
        // TODO
        console.log('GAME OVER');
    }

    // =============================================================

    onUpdate(dt: number) {
        this.animation.update(dt);

        if (this.gameOver) {
            this.blockPlayerOperations = true;
        } else {
            // explode
            if (!(
                this.animation.isPlaying(Board.ANIMATION_CLEAR)
                || this.animation.isPlaying(Board.ANIMATION_SHUFFLE)
            )) {
                processExplosion(this);
            }

            // falling
            let processingFalling = false;
            if (!(
                this.animation.isPlaying(Board.ANIMATION_CLEAR)
                || this.animation.isPlaying(Board.ANIMATION_SHUFFLE)
                || this.animation.isPlaying(Board.ANIMATION_EXPLOSION)
                || this.draggingTile
            )) {
                if (processFalling(this)) {
                    processingFalling = true;
                    this.matchingHasBeenChecked = false;
                    this.boardMask.updateMask();
                }
            }
            processingFalling = processingFalling || this.animation.isPlaying(Board.ANIMATION_FALLING);

            // match and clear
            if (!(
                processingFalling
                || this.animation.isPlaying(Board.ANIMATION_CLEAR)
                || this.animation.isPlaying(Board.ANIMATION_SHUFFLE)
                || this.animation.isPlaying(Board.ANIMATION_EXPLOSION)
            )) {
                if (processMatching(this)) {
                    processClear(this);
                    this.noMoreMovesCount = 0;
                    this.matchingHasBeenChecked = false;
                }
            }
            this.lastSwappedTile1 = undefined;
            this.lastSwappedTile2 = undefined;

            // check operable
            this.blockPlayerOperationsPrevFrame = this.blockPlayerOperations;
            this.blockPlayerOperations =
                processingFalling
                || this.animation.isPlaying(Board.ANIMATION_CLEAR)
                || this.animation.isPlaying(Board.ANIMATION_SHUFFLE)
                || this.animation.isPlaying(Board.ANIMATION_EXPLOSION);
            const playerOperable = !(this.blockPlayerOperations || this.blockPlayerOperationsPrevFrame);

            // check should shuffle
            this.operationTips.visible = playerOperable;
            if (playerOperable && !this.matchingHasBeenChecked) {
                this.matchingHasBeenChecked = true;
                const pair = findBestSwappingPair(this);
                if (pair) {
                    this.operationTips.visible = true;
                    this.operationTips.setPair(pair[0], pair[1]);
                } else {
                    this.noMoreMovesCount += 1;
                    this.operationTips.setPair();
                    if (this.noMoreMovesCount >= Board.NO_MORE_MOVES_TIMES_TRIGGER_GAME_OVER) {
                        this.gameOver = true;
                        this.onGameOver();
                    } else {
                        this.matchingHasBeenChecked = false;
                        shuffle(this);
                    }
                }
            }
            this.shufflingText.setVisible(this.animation.isPlaying(Board.ANIMATION_SHUFFLE));
        }
    }

}
