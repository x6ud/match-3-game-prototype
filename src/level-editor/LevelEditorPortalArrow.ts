import BaseSprite, {BaseSpriteSettings} from "../game/BaseSprite";
import LevelEditor from "./LevelEditor";
import {Graphics} from "pixi.js";
import {GRID_GRAVITY_DIRECTION} from "../game/match3/Grid";
import {drawArrow} from "../game/common/graphics";

export interface LevelEditorPortalArrowSettings extends BaseSpriteSettings {
    board: LevelEditor;
    row: number;
    col: number;
}

export default class LevelEditorPortalArrow extends BaseSprite {

    board: LevelEditor;
    row: number;
    col: number;

    direction: GRID_GRAVITY_DIRECTION = GRID_GRAVITY_DIRECTION.DOWN;
    endRow: number = -1;
    endCol: number = -1;
    endDirection: GRID_GRAVITY_DIRECTION = GRID_GRAVITY_DIRECTION.DOWN;

    graphics: Graphics;

    constructor(settings: LevelEditorPortalArrowSettings) {
        super(settings);
        this.board = settings.board;
        this.row = settings.row;
        this.col = settings.col;

        this.displayObject.zIndex = 2;
        this.graphics = new Graphics();
        this.displayObject.addChild(this.graphics);
    }

    onUpdate(dt: number) {
        const entrance = this.board.grids[this.board.index(this.row, this.col)];
        if (entrance.portalEnd) {
            this.graphics.visible = true;
            const end = this.board.grids[this.board.index(entrance.portalEnd.row, entrance.portalEnd.col)];

            if (this.direction !== entrance.gravityDirection
                || this.endRow !== entrance.portalEnd.row
                || this.endCol !== entrance.portalEnd.col
                || this.endDirection !== end.gravityDirection
            ) {
                const gridSize = this.board.gridSize;
                this.graphics.clear();

                let x0 = this.col * gridSize;
                let y0 = this.row * gridSize;
                let x1 = end.col * gridSize;
                let y1 = end.row * gridSize;
                const gridEnd = this.board.grids[this.board.index(end.row, end.col)];
                this.graphics.lineStyle(2, 0x0000ff);
                switch (entrance.gravityDirection) {
                    case GRID_GRAVITY_DIRECTION.UP:
                        this.graphics.moveTo(x0, y0 + 1);
                        this.graphics.lineTo(x0 + gridSize, y0 + 1);
                        x0 += gridSize / 2;
                        break;
                    case GRID_GRAVITY_DIRECTION.DOWN:
                        this.graphics.moveTo(x0, y0 + gridSize - 1);
                        this.graphics.lineTo(x0 + gridSize, y0 + gridSize - 1);
                        x0 += gridSize / 2;
                        y0 += gridSize;
                        break;
                    case GRID_GRAVITY_DIRECTION.LEFT:
                        this.graphics.moveTo(x0 + 1, y0);
                        this.graphics.lineTo(x0 + 1, y0 + gridSize);
                        y0 += gridSize / 2;
                        break;
                    case GRID_GRAVITY_DIRECTION.RIGHT:
                        this.graphics.moveTo(x0 + gridSize - 1, y0);
                        this.graphics.lineTo(x0 + gridSize - 1, y0 + gridSize);
                        x0 += gridSize;
                        y0 += gridSize / 2;
                        break;
                }
                this.graphics.lineStyle(2, 0xff0000);
                switch (gridEnd.gravityDirection) {
                    case GRID_GRAVITY_DIRECTION.DOWN:
                        this.graphics.moveTo(x1, y1 + 1);
                        this.graphics.lineTo(x1 + gridSize, y1 + 1);
                        x1 += gridSize / 2;
                        break;
                    case GRID_GRAVITY_DIRECTION.UP:
                        this.graphics.moveTo(x1, y1 + gridSize - 1);
                        this.graphics.lineTo(x1 + gridSize, y1 + gridSize - 1);
                        x1 += gridSize / 2;
                        y1 += gridSize;
                        break;
                    case GRID_GRAVITY_DIRECTION.RIGHT:
                        this.graphics.moveTo(x1 + 1, y1);
                        this.graphics.lineTo(x1 + 1, y1 + gridSize);
                        y1 += gridSize / 2;
                        break;
                    case GRID_GRAVITY_DIRECTION.LEFT:
                        this.graphics.moveTo(x1 + gridSize - 1, y1);
                        this.graphics.lineTo(x1 + gridSize - 1, y1 + gridSize);
                        x1 += gridSize;
                        y1 += gridSize / 2;
                        break;
                }
                drawArrow(
                    this.graphics.lineStyle(1, 0x0000ff),
                    x0, y0, x1, y1, gridSize / 6
                );

                this.direction = entrance.gravityDirection;
                this.endRow = entrance.portalEnd.row;
                this.endCol = entrance.portalEnd.col;
                this.endDirection = end.gravityDirection;
            }
        } else {
            this.graphics.visible = false;
        }
    }

}
