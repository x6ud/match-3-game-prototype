import {Text, TextStyle} from "pixi.js";
import ShufflingText from "../ShufflingText";

export function createGraphics(sprite: ShufflingText) {
    const textStyle = new TextStyle();
    textStyle.fontSize = 14;
    const text = new Text('No more mores, shuffling...', textStyle);
    text.name = 'text';
    text.anchor.set(0.5, 1);
    sprite.displayObject.addChild(text)
}

export function updateGraphics(sprite: ShufflingText) {
    const text = <Text>sprite.displayObject.getChildByName('text');
    text.position.set(sprite.board.width / 2, -8);
    text.alpha = sprite.opacity;
}
