import OperationTips from "../OperationTips";
import {Graphics} from "pixi.js";
import Vec2 from "../../common/Vec2";

export function createGraphics(sprite: OperationTips) {
    const board = sprite.board;
    const gridSize = board.gridSize;

    const arrowSize = gridSize / 5;
    const p0 = new Vec2(gridSize / 2, arrowSize / 3 * 2);
    const p1 = p0.add(new Vec2(arrowSize / 2, -arrowSize));
    const p2 = p0.add(new Vec2(-arrowSize / 2, -arrowSize));

    const a1 = new Graphics();
    a1.beginFill(0x000000, 0.75)
        .moveTo(p0.x, p0.y)
        .lineTo(p1.x, p1.y)
        .lineTo(p2.x, p2.y)
        .endFill();
    a1.name = 'a1';
    sprite.displayObject.addChild(a1);

    const a2 = a1.clone();
    a2.name = 'a2';
    sprite.displayObject.addChild(a2);
}

export function updateGraphics(sprite: OperationTips) {
    sprite.displayObject.visible = sprite.visible;
    const a1 = sprite.displayObject.getChildByName('a1');
    const a2 = sprite.displayObject.getChildByName('a2');
    const tile1 = sprite.tile1;
    const tile2 = sprite.tile2;
    a1.visible = !!tile1;
    a2.visible = !!tile2;
    const gridSize = sprite.board.gridSize;
    if (tile1) {
        a1.x = tile1.col * gridSize;
        a1.y = tile1.row * gridSize;
    }
    if (tile2) {
        a2.x = tile2.col * gridSize;
        a2.y = tile2.row * gridSize;
    }
}
