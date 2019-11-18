import Vec2 from "./common/Vec2";
import Game from "./Game";

export interface CameraSettings {
    viewWidth: number;
    viewHeight: number;
}

export default class Camera {

    viewWidth: number;
    viewHeight: number;
    x: number = 0;
    y: number = 0;
    rotation: number = 0;

    constructor(settings: CameraSettings) {
        this.viewWidth = settings.viewWidth;
        this.viewHeight = settings.viewHeight;
    }

    getAspect() {
        return this.viewWidth / this.viewHeight;
    }

    // setStageTransform(game: Game) {
    //     const sx = game.canvasWidth / this.viewWidth;
    //     const sy = game.canvasHeight / this.viewHeight;
    //     game.application.stage.setTransform(-this.x * sx, -this.y * sy, sx, sy, -this.rotation);
    // }

    transformMousePoint(elementWidth: number, elementHeight: number, x: number, y: number) {
        return new Vec2(
            x / elementWidth * this.viewWidth + this.x,
            y / elementHeight * this.viewHeight + this.y
        );
    }

    translate(dx: number, dy: number) {
        this.x += dx;
        this.y += dy;
    }

    moveTo(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

}
