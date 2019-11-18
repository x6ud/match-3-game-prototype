import BaseSprite, {BaseSpriteSettings} from "../BaseSprite";
import {Graphics} from "pixi.js";
import Board from "./Board";
import {GRID_TYPE} from "./Grid";
import Tile from "./Tile";

export interface BoardMaskSettings extends BaseSpriteSettings {
    board: Board;
}

/**
 * A mask that hides the parts of tiles outside the board boundary.
 */
export default class BoardMask extends BaseSprite {

    board: Board;
    mask: Graphics;
    currentMask: boolean[] = [];

    constructor(settings: BoardMaskSettings) {
        super(settings);
        this.board = settings.board;

        this.displayObject.zIndex = 2;
        const mask = this.mask = new Graphics();
        this.displayObject.addChild(mask);
        this.displayObject.sortableChildren = true;
    }

    reset() {
        this.currentMask = [];
    }

    updateMask() {
        const board = this.board;

        board.grids.forEach(grid => grid.maskFlag = false);

        // expand mask for slipping tiles
        board.tiles.forEach(tile => {
            if (tile.animation.isPlaying(Tile.ANIMATION_FALLING)
                && tile.fallingFrom) {
                const grid = board.grids[tile.index()];
                if (tile.fallingFrom.portalEnd
                    && tile.fallingFrom.portalEnd.row === grid.row
                    && tile.fallingFrom.portalEnd.col === grid.col) {
                    return;
                }

                const rowL = Math.min(tile.fallingFrom.row, grid.row);
                const rowH = Math.max(tile.fallingFrom.row, grid.row);
                const colL = Math.min(tile.fallingFrom.col, grid.col);
                const colH = Math.max(tile.fallingFrom.col, grid.col);
                for (let row = rowL; row <= rowH; ++row) {
                    for (let col = colL; col <= colH; ++col) {
                        board.grids[board.index(row, col)].maskFlag = true;
                    }
                }
            }
        });

        let shouldRedraw = false;
        for (let row = 0; row < board.rows; ++row) {
            for (let col = 0; col < board.cols; ++col) {
                const index = board.index(row, col);
                const grid = board.grids[index];
                const mask = grid.type === GRID_TYPE.SPACE || grid.maskFlag;
                if (this.currentMask[index] !== mask) {
                    shouldRedraw = true;
                    this.currentMask[index] = mask;
                }
            }
        }

        const mask = this.mask;
        mask.clear();
        const gridSize = board.gridSize;
        for (let row = 0; row < board.rows; ++row) {
            for (let col = 0; col < board.cols; ++col) {
                if (this.currentMask[board.index(row, col)]) {
                    mask.beginFill(0x000000, 1);
                    mask.drawRect(col * gridSize, row * gridSize, gridSize, gridSize);
                    mask.endFill();
                }
            }
        }
    }

    onUpdate(dt: number) {
        const useMask = !(
            this.board.animation.isPlaying(Board.ANIMATION_SHUFFLE)
            || this.board.animation.isPlaying(Board.ANIMATION_EXPLOSION)
        );
        this.mask.visible = useMask;
        this.displayObject.mask = useMask ? this.mask : null;
    }

}
