import BaseSprite, {BaseSpriteSettings} from "../game/BaseSprite";
import LevelEditorGrid from "./LevelEditorGrid";
import {MOUSE_BUTTON} from "../game/Mouse";
import {Graphics} from "pixi.js";
import {drawRect} from "../game/common/graphics";
import {GRID_GRAVITY_DIRECTION, GRID_TYPE} from "../game/match3/Grid";
import LevelEditorPortalArrow from "./LevelEditorPortalArrow";
import {LevelDefData, LevelDefDataGrid} from "./LevelEditorData";
import {LevelDef} from "../game/match3/process-level-loading";

export enum LEVEL_EDITOR_TOOL {
    GRID_GRAVITY_DOWN,
    GRID_GRAVITY_UP,
    GRID_GRAVITY_LEFT,
    GRID_GRAVITY_RIGHT,
    GENERATOR,
    PORTAL
}

export default class LevelEditor extends BaseSprite {

    $handleMouseEvents = true;

    readonly gridSize: number = 42;

    rows: number = 0;
    cols: number = 0;
    colors: number = 0;
    grids: LevelEditorGrid[] = [];
    portalArrows: LevelEditorPortalArrow[] = [];
    portalEntrance?: LevelEditorGrid;
    tool: LEVEL_EDITOR_TOOL = LEVEL_EDITOR_TOOL.GRID_GRAVITY_DOWN;

    graphicsCurrentGridBorder: Graphics;

    constructor(settings: BaseSpriteSettings) {
        super(settings);

        const gridSize = this.gridSize;
        this.displayObject.sortableChildren = true;
        {
            const currentGridBorder = drawRect(new Graphics().lineStyle(1, 0x0000ff), 0, 0, gridSize, gridSize);
            currentGridBorder.zIndex = 2;
            this.displayObject.addChild(currentGridBorder);
            this.graphicsCurrentGridBorder = currentGridBorder;
        }
    }

    index(row: number, col: number) {
        if (row < 0 || col < 0 || row >= this.rows || col >= this.cols) {
            throw new Error(`Invalid index: (${row}, ${col}).`);
        }
        return row * this.cols + col;
    }

    setTool(tool: LEVEL_EDITOR_TOOL) {
        this.tool = tool;
        if (tool !== LEVEL_EDITOR_TOOL.PORTAL) {
            this.portalEntrance = undefined;
        }
    }

    createNew(rows: number, cols: number, colors: number) {
        this.rows = rows;
        this.cols = cols;
        this.colors = colors;
        this.grids.forEach(child => child.remove());
        this.grids = [];
        for (let row = 0; row < rows; ++row) {
            for (let col = 0; col < cols; ++col) {
                const index = this.index(row, col);
                const grid = new LevelEditorGrid({global: this.global, board: this, row, col});
                this.addChild(grid);
                this.grids[index] = grid;
            }
        }
        this.width = cols * this.gridSize;
        this.height = rows * this.gridSize;
        this.localPosition.set(
            (this.global.camera.viewWidth - this.width) / 2,
            (this.global.camera.viewHeight - this.height) / 2
        );

        this.portalArrows.forEach(child => child.remove());
        for (let row = 0; row < rows; ++row) {
            for (let col = 0; col < cols; ++col) {
                const index = this.index(row, col);
                const arrow = new LevelEditorPortalArrow({global: this.global, board: this, row, col});
                this.addChild(arrow);
                this.portalArrows[index] = arrow;
            }
        }
    }

    exportData() {
        const ret = new LevelDefData();
        ret.colors = this.colors;
        ret.rows = this.rows;
        ret.cols = this.cols;
        ret.grids = [];
        for (let row = 0; row < this.rows; ++row) {
            for (let col = 0; col < this.cols; ++col) {
                const index = this.index(row, col);
                const grid = this.grids[index];
                const gridDef = new LevelDefDataGrid();
                gridDef.row = grid.row;
                gridDef.col = grid.col;
                gridDef.type = grid.type;
                gridDef.gravityDirection = grid.gravityDirection;
                gridDef.generator = grid.generator;
                gridDef.portalEnd = grid.portalEnd;
                ret.grids[index] = gridDef;
            }
        }
        return ret;
    }

    importData(data: LevelDef) {
        this.createNew(data.rows, data.cols, data.colors);
        this.grids.forEach((grid, index) => {
            const gridDef = data.grids[index];
            grid.type = gridDef.type;
            grid.generator = gridDef.generator;
            grid.gravityDirection = gridDef.gravityDirection;
            grid.portalEnd = gridDef.portalEnd;
        });
    }

    onMouseDown(x: number, y: number, button: MOUSE_BUTTON) {
        this.onMouseMove(x, y);
    }

    onMouseUp(x: number, y: number, button: MOUSE_BUTTON) {
        this.portalEntrance = undefined;
    }

    onMouseMove(x: number, y: number) {
        const mouseLeft = this.global.mouse.leftButtonDown;
        const mouseRight = this.global.mouse.rightButtonDown;
        if (!mouseLeft && !mouseRight) {
            return;
        }
        const position = this.getGlobalPosition();
        const col = Math.floor((x - position.x) / this.gridSize);
        const row = Math.floor((y - position.y) / this.gridSize);
        const grid = this.grids[this.index(row, col)];
        switch (this.tool) {
            case LEVEL_EDITOR_TOOL.GRID_GRAVITY_DOWN:
                if (mouseLeft) {
                    grid.type = GRID_TYPE.SPACE;
                    grid.gravityDirection = GRID_GRAVITY_DIRECTION.DOWN;
                } else {
                    grid.type = GRID_TYPE.VOID;
                    grid.generator = false;
                    grid.portalEnd = undefined;
                }
                break;
            case LEVEL_EDITOR_TOOL.GRID_GRAVITY_UP:
                if (mouseLeft) {
                    grid.type = GRID_TYPE.SPACE;
                    grid.gravityDirection = GRID_GRAVITY_DIRECTION.UP;
                } else {
                    grid.type = GRID_TYPE.VOID;
                    grid.generator = false;
                    grid.portalEnd = undefined;
                }
                break;
            case LEVEL_EDITOR_TOOL.GRID_GRAVITY_LEFT:
                if (mouseLeft) {
                    grid.type = GRID_TYPE.SPACE;
                    grid.gravityDirection = GRID_GRAVITY_DIRECTION.LEFT;
                } else {
                    grid.type = GRID_TYPE.VOID;
                    grid.generator = false;
                    grid.portalEnd = undefined;
                }
                break;
            case LEVEL_EDITOR_TOOL.GRID_GRAVITY_RIGHT:
                if (mouseLeft) {
                    grid.type = GRID_TYPE.SPACE;
                    grid.gravityDirection = GRID_GRAVITY_DIRECTION.RIGHT;
                } else {
                    grid.type = GRID_TYPE.VOID;
                    grid.generator = false;
                    grid.portalEnd = undefined;
                }
                break;
            case LEVEL_EDITOR_TOOL.GENERATOR:
                if (grid.type === GRID_TYPE.SPACE) {
                    grid.generator = mouseLeft;
                }
                break;
            case LEVEL_EDITOR_TOOL.PORTAL:
                if (mouseLeft) {
                    if (this.portalEntrance) {
                        if (this.portalEntrance !== grid) {
                            this.portalEntrance.portalEnd = {row: grid.row, col: grid.col};
                        }
                    } else {
                        this.portalEntrance = grid;
                    }
                } else {
                    this.portalEntrance = undefined;
                    grid.portalEnd = undefined;
                }
                break;
        }
    }

    onUpdate(dt: number) {
        const gridSize = this.gridSize;
        const position = this.getGlobalPosition();
        const mouse = this.global.mouse;
        if (this.isPointInside(mouse.x, mouse.y)) {
            this.graphicsCurrentGridBorder.visible = true;
            const col = Math.floor((mouse.x - position.x) / gridSize);
            const row = Math.floor((mouse.y - position.y) / gridSize);
            this.graphicsCurrentGridBorder.position.set(col * gridSize, row * gridSize);
        } else {
            this.graphicsCurrentGridBorder.visible = false;
        }
    }

}
