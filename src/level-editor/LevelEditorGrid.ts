import BaseSprite, {BaseSpriteSettings} from "../game/BaseSprite";
import LevelEditor from "./LevelEditor";
import {GRID_GRAVITY_DIRECTION, GRID_TYPE, GridDef} from "../game/match3/Grid";
import {Graphics} from "pixi.js";
import {drawArrow, drawRect} from "../game/common/graphics";

export interface LevelEditorGridSettings extends BaseSpriteSettings {
    board: LevelEditor;
    row: number;
    col: number;
}

export default class LevelEditorGrid extends BaseSprite implements GridDef {

    $handleMouseEvents = true;

    board: LevelEditor;
    row: number;
    col: number;
    type: GRID_TYPE = GRID_TYPE.VOID;
    gravityDirection: GRID_GRAVITY_DIRECTION = GRID_GRAVITY_DIRECTION.DOWN;
    generator: boolean = false;
    portalEnd?: { row: number, col: number };

    graphicsBackground: Graphics;
    graphicsArrow: Graphics;
    graphicsGenerator: Graphics;

    constructor(settings: LevelEditorGridSettings) {
        super(settings);

        this.board = settings.board;
        this.row = settings.row;
        this.col = settings.col;
        const gridSize = this.board.gridSize;
        this.width = this.height = gridSize;
        this.localPosition.set(this.col * gridSize, this.row * gridSize);

        this.displayObject.zIndex = 1;
        {
            this.displayObject.sortableChildren = true;

            const border = drawRect(new Graphics().lineStyle(1, 0xfafafa), 0, 0, gridSize, gridSize);
            border.zIndex = 1;
            this.displayObject.addChild(border);

            const background = new Graphics()
                .beginFill(0x000000, (this.row + this.col) % 2 ? 0.02 : 0.075)
                .drawRect(0, 0, gridSize, gridSize)
                .endFill();
            background.zIndex = 2;
            this.displayObject.addChild(background);
            this.graphicsBackground = background;

            const arrow = drawArrow(new Graphics().lineStyle(1, 0x989898),
                0, -gridSize / 4, 0, gridSize / 4, gridSize / 6);
            arrow.x = gridSize / 2;
            arrow.y = gridSize / 2;
            background.addChild(arrow);
            this.graphicsArrow = arrow;

            const generator = new Graphics().lineStyle(1, 0xff0000)
                .moveTo(-gridSize / 2, -gridSize / 2 + 1)
                .lineTo(gridSize / 2, -gridSize / 2 + 1);
            generator.x = gridSize / 2;
            generator.y = gridSize / 2;
            generator.zIndex = 2;
            this.displayObject.addChild(generator);
            this.graphicsGenerator = generator;
        }
    }

    onUpdate(dt: number) {
        this.graphicsBackground.visible = this.type === GRID_TYPE.SPACE;
        this.graphicsGenerator.visible = this.generator;
        switch (this.gravityDirection) {
            case GRID_GRAVITY_DIRECTION.DOWN:
                this.graphicsArrow.rotation = 0;
                this.graphicsGenerator.rotation = 0;
                break;
            case GRID_GRAVITY_DIRECTION.UP:
                this.graphicsArrow.rotation = Math.PI;
                this.graphicsGenerator.rotation = Math.PI;
                break;
            case GRID_GRAVITY_DIRECTION.LEFT:
                this.graphicsArrow.rotation = Math.PI / 2;
                this.graphicsGenerator.rotation = Math.PI / 2;
                break;
            case GRID_GRAVITY_DIRECTION.RIGHT:
                this.graphicsArrow.rotation = -Math.PI / 2;
                this.graphicsGenerator.rotation = -Math.PI / 2;
                break;
        }
    }

}
