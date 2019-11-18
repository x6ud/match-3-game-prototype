import Tile, {TILE_TYPE} from "../Tile";
import {Graphics} from "pixi.js";
import Grid, {GRID_GRAVITY_DIRECTION} from "../Grid";
import Vec2 from "../../common/Vec2";
import {easeInCubic} from "../../common/easing";

const COLORS = [
    0xff0068,
    0xfed200,
    0x00ddff,
    0x7bd100,
    0x01959f,
    0xff7f27,
    0x8800aa
];

export function createGraphics(tile: Tile) {
    const gridSize = tile.board.gridSize;
    const radius = gridSize / 2 * 0.85;

    const g1 = new Graphics();
    switch (tile.type) {
        case TILE_TYPE.EMPTY:
            break;
        case TILE_TYPE.TILE:
            g1.beginFill(COLORS[tile.color])
                .drawCircle(0, 0, radius)
                .endFill();
            break;
        case TILE_TYPE.BOMB_LIGHTNING:
            g1.lineStyle(5, 0x989898)
                .drawCircle(0, 0, radius);
            break;
        case TILE_TYPE.BOMB_CROSS:
            g1.lineStyle(2, 0x989898)
                .drawCircle(0, 0, radius - 1)
                .moveTo(-radius * 0.5, 0)
                .lineTo(radius * 0.5, 0)
                .moveTo(0, -radius * 0.5)
                .lineTo(0, radius * 0.5);
            break;
        case TILE_TYPE.BOMB_SMALL:
            g1.beginFill(0x989898)
                .drawCircle(0, 0, radius * 0.85)
                .endFill();
            break;
    }
    g1.name = 'g1';
    g1.visible = false;
    tile.displayObject.addChild(g1);

    // a graphics copy for portal effect
    const g2 = g1.clone();
    g2.name = 'g2';
    g2.visible = false;
    tile.displayObject.addChild(g2);
}

export function updateGraphics(tile: Tile) {
    const g1 = tile.displayObject.getChildByName('g1');
    const g2 = tile.displayObject.getChildByName('g2');

    const board = tile.board;
    const gridSize = board.gridSize;

    switch (tile.type) {
        case TILE_TYPE.EMPTY:
            g1.visible = g2.visible = false;
            break;
        case TILE_TYPE.TILE:
        case TILE_TYPE.BOMB_LIGHTNING:
        case TILE_TYPE.BOMB_CROSS:
        case TILE_TYPE.BOMB_SMALL:
            g1.visible = true;
            g2.visible = false;
            if (tile.animation.isPlaying(Tile.ANIMATION_FALLING)) {
                // falling
                const grid = board.grids[tile.index()];
                if (tile.fallingFrom) {
                    if (
                        tile.fallingFrom.portalEnd
                        && tile.fallingFrom.portalEnd.row === grid.row
                        && tile.fallingFrom.portalEnd.col === grid.col
                    ) {
                        // portal
                        const offset1 = getGridGravityOffset(grid, gridSize).mul(1 - tile.fallingDistance);
                        g1.x = gridSize / 2 + tile.localPosition.x + offset1.x;
                        g1.y = gridSize / 2 + tile.localPosition.y + offset1.y;

                        g2.visible = true;
                        const offset2 = getGridGravityOffset(tile.fallingFrom, gridSize).mul(tile.fallingDistance);
                        g2.x = gridSize / 2 + tile.fallingFrom.localPosition.x - offset2.x;
                        g2.y = gridSize / 2 + tile.fallingFrom.localPosition.y - offset2.y;
                    } else {
                        // normal
                        const offset = (tile.fallingFrom.localPosition.sub(tile.localPosition)).mul(1 - tile.fallingDistance);
                        g1.x = gridSize / 2 + tile.localPosition.x + offset.x;
                        g1.y = gridSize / 2 + tile.localPosition.y + offset.y;
                    }
                } else {
                    // generator
                    const offset = getGridGravityOffset(grid, gridSize).mul(1 - tile.fallingDistance);
                    g1.x = gridSize / 2 + tile.localPosition.x + offset.x;
                    g1.y = gridSize / 2 + tile.localPosition.y + offset.y;
                }
            } else {
                // landing
                g1.x = gridSize / 2 + tile.localPosition.x + tile.actualOffset.x + tile.bounceOffset.x;
                g1.y = gridSize / 2 + tile.localPosition.y + tile.actualOffset.y + tile.bounceOffset.y;
            }
            break;
    }

    if (tile.animation.isPlaying(Tile.ANIMATION_DETONATION)) {
        g1.alpha = 1 - Math.abs(Math.sin(tile.detonationAnimationProgress * 2 * Math.PI)) * (1 - tile.detonationAnimationProgress);
    }

    if (tile.animation.isPlaying(Tile.ANIMATION_EXPLOSION)) {
        const coeff = easeInCubic(Math.max(0, tile.explosionAnimationProgress - 0.2) / 0.8);
        const scale = 1 + coeff * 1.5;
        g1.scale.set(scale, scale);
        g1.alpha = 1 - coeff;
    } else if (tile.cleared) {
        // clearing
        if (tile.isBomb()) {
            g1.scale.set(1, 1);
        } else {
            const scale = 1 - easeInCubic(Math.max(0, tile.clearAnimationProgress - 0.2) / 0.8);
            g1.scale.set(scale, scale);
        }

        if (tile.combinedTo) {
            const offset = tile.combinedTo.localPosition.sub(tile.localPosition)
                .mul(easeInCubic(tile.clearAnimationProgress));
            g1.x += offset.x;
            g1.y += offset.y;
        }
    } else if (tile.animation.isPlaying(Tile.ANIMATION_GENERATING)) {
        // bomb generating
        const scale = easeInCubic(Math.max(0, tile.generatingAnimationProgress - 0.2) / 0.8);
        g1.scale.set(scale, scale);
    } else {
        g1.scale.set(1, 1);
    }

    if (tile === board.draggingTile || tile.detonated) {
        tile.displayObject.zIndex = 2;
    } else {
        tile.displayObject.zIndex = 1;
    }
}

function getGridGravityOffset(grid: Grid, gridSize: number) {
    const offset = new Vec2();
    switch (grid.gravityDirection) {
        case GRID_GRAVITY_DIRECTION.UP:
            offset.y += gridSize;
            break;
        case GRID_GRAVITY_DIRECTION.DOWN:
            offset.y -= gridSize;
            break;
        case GRID_GRAVITY_DIRECTION.LEFT:
            offset.x += gridSize;
            break;
        case GRID_GRAVITY_DIRECTION.RIGHT:
            offset.x -= gridSize;
            break;
    }
    return offset;
}
