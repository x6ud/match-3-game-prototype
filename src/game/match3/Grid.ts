import BaseSprite, {BaseSpriteSettings} from "../BaseSprite";
import Board from "./Board";
import {createGraphics, updateGraphics} from "./render/render-grid";

export enum GRID_TYPE {
    VOID, SPACE
}

export enum GRID_GRAVITY_DIRECTION {
    DOWN, UP, RIGHT, LEFT
}

export interface GridDef {
    row: number;
    col: number;
    type: GRID_TYPE;
    gravityDirection: GRID_GRAVITY_DIRECTION;
    generator: boolean;
    portalEnd?: { row: number, col: number };
}

export interface GridSettings extends BaseSpriteSettings {
    board: Board;
    row: number;
    col: number;
    type: GRID_TYPE;
    gravityDirection: GRID_GRAVITY_DIRECTION;
    generator: boolean;
    portalEnd?: { row: number, col: number };
}

export default class Grid extends BaseSprite implements GridDef {

    board: Board;

    index: number;
    row: number;
    col: number;
    type: GRID_TYPE;
    gravityDirection: GRID_GRAVITY_DIRECTION;
    generator: boolean;
    portalEnd?: { row: number, col: number };

    /**
     * Non-void grids with gravity direction pointing to this grid.
     */
    directSources: Grid[] = [];
    /**
     * Non-void grids that tiles will slip from those grids to this grid.
     */
    flankSources: Grid[] = [];
    /**
     * The grid pointed by this grid's gravity direction.
     */
    directTarget?: Grid;
    /**
     * Grids that tiles will slip from this grids to those grids.
     */
    flankTarget: Grid[] = [];

    /**
     * Flag property used by board mask.
     */
    maskFlag: boolean = false;

    constructor(settings: GridSettings) {
        super(settings);

        this.board = settings.board;
        this.row = settings.row;
        this.col = settings.col;
        this.index = this.board.index(this.row, this.col);
        this.type = settings.type;
        this.gravityDirection = settings.gravityDirection;
        this.generator = settings.generator;
        this.portalEnd = settings.portalEnd;

        const gridSize = this.board.gridSize;
        this.localPosition.set(gridSize * this.col, gridSize * this.row);
        this.width = gridSize;
        this.height = gridSize;

        this.displayObject.zIndex = 1;
        createGraphics(this);
    }

    onUpdate(dt: number) {
        updateGraphics(this);
    }

}
