import Grid, {GRID_TYPE} from "../Grid";
import {Graphics} from "pixi.js";

export function createGraphics(grid: Grid) {
    const graphics = new Graphics();
    graphics.beginFill(0x000000, (grid.row + grid.col) % 2 ? 0.02 : 0.075)
        .drawRect(0, 0, grid.board.gridSize, grid.board.gridSize)
        .endFill();
    graphics.name = 'background';
    grid.displayObject.addChild(graphics);
}

export function updateGraphics(grid: Grid) {
    const background = grid.displayObject.getChildByName('background');
    background.visible = grid.type === GRID_TYPE.SPACE;
}
