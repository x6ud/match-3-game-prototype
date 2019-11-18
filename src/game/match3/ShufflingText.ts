import BaseSprite, {BaseSpriteSettings} from "../BaseSprite";
import Board from "./Board";
import {createGraphics, updateGraphics} from "./render/render-shuffling-text";
import AnimationDispatcher from "../AnimationDispatcher";
import TransitionValue from "../TransitionValue";

export interface ShufflingTextSettings extends BaseSpriteSettings {
    board: Board;
}

/**
 * Tip text display when shuffling.
 */
export default class ShufflingText extends BaseSprite {

    static readonly ANIMATION_VISIBLE = 'visible';
    static readonly ANIMATION_VISIBLE_DURATION = 150;

    animation = new AnimationDispatcher();

    board: Board;
    opacity: number = 0;

    constructor(settings: ShufflingTextSettings) {
        super(settings);
        this.board = settings.board;

        this.displayObject.zIndex = 3;
        createGraphics(this);
    }

    setVisible(visible: boolean) {
        const transition = new TransitionValue({
            duration: ShufflingText.ANIMATION_VISIBLE_DURATION,
            from: this.opacity,
            to: visible ? 1 : 0
        });
        this.animation.cancel(ShufflingText.ANIMATION_VISIBLE);
        return this.animation.create(
            ShufflingText.ANIMATION_VISIBLE,
            dt => {
                this.opacity = transition.step(dt);
                return transition.finished;
            }
        );
    }

    onUpdate(dt: number) {
        this.animation.update(dt);
        updateGraphics(this);
    }

}
