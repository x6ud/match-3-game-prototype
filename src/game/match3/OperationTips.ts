import BaseSprite, {BaseSpriteSettings} from "../BaseSprite";
import {createGraphics, updateGraphics} from "./render/render-operation-tips";
import Tile from "./Tile";
import Board from "./Board";

export interface OperationTipsSettings extends BaseSpriteSettings {
    board: Board;
}

export default class OperationTips extends BaseSprite {

    board: Board;
    tile1?: Tile;
    tile2?: Tile;
    visible: boolean = false;

    constructor(settings: OperationTipsSettings) {
        super(settings);
        this.board = settings.board;

        createGraphics(this);
        this.displayObject.zIndex = 3;
    }

    setPair(tile1?: Tile, tile2?: Tile) {
        this.tile1 = tile1;
        this.tile2 = tile2;
    }

    onUpdate(dt: number) {
        updateGraphics(this);
    }

}
