import BaseSprite, {BaseSpriteSettings} from "../game/BaseSprite";
import Board from "../game/match3/Board";
import {LevelDef} from "../game/match3/process-level-loading";

export interface LevelEditorRunnerSettings extends BaseSpriteSettings {
}

export default class LevelEditorRunner extends BaseSprite {

    $handleMouseEvents = true;

    board: Board;

    constructor(settings: LevelEditorRunnerSettings) {
        super(settings);

        this.board = new Board({
            global: this.global,
            gridSize: 42
        });
        this.addChild(this.board);
    }

    run(levelDef: LevelDef) {
        this.board.loadLevel(levelDef);
        this.board.initTiles();
        this.board.localPosition.set(
            (this.global.camera.viewWidth - this.board.width) / 2,
            (this.global.camera.viewHeight - this.board.height) / 2
        );
    }

}
