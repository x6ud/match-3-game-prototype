import {Application, Sprite, Text, TextStyle} from "pixi.js";
import Camera from "./Camera";
import BaseSprite from "./BaseSprite";
import Mouse, {MOUSE_BUTTON} from "./Mouse";

export interface GameSettings {
    canvas: HTMLCanvasElement;
    viewWidth: number;
    viewHeight: number;
}

export default class Game {

    application: Application;
    stageDisplayObject: Sprite;
    uiDisplayObject: Sprite;
    fpsDisplayObject: Text;

    camera: Camera;
    mouse: Mouse;
    scene?: BaseSprite;

    private canvasWidth: number;
    private canvasHeight: number;

    constructor(settings: GameSettings) {
        this.application = new Application({
            view: settings.canvas,
            width: settings.viewWidth,
            height: settings.viewHeight,
            autoStart: false,
            antialias: true,
            backgroundColor: 0xffffff
        });
        this.stageDisplayObject = new Sprite();
        this.application.stage.addChild(this.stageDisplayObject);

        this.uiDisplayObject = new Sprite();
        this.application.stage.addChild(this.uiDisplayObject);

        const textStyle = new TextStyle();
        textStyle.fontSize = 12;
        const fps = this.fpsDisplayObject = new Text('', textStyle);
        fps.position.set(8, 2);
        this.application.stage.addChild(fps);

        this.canvasWidth = settings.viewWidth;
        this.canvasHeight = settings.viewHeight;
        this.application.ticker.add(this.update.bind(this));
        this.camera = new Camera({viewWidth: settings.viewWidth, viewHeight: settings.viewHeight});
        this.mouse = new Mouse();
    }

    start() {
        this.application.start();
    }

    stop() {
        this.application.stop();
    }

    useScene(scene?: BaseSprite) {
        if (this.scene) {
            this.stageDisplayObject.removeChild(this.scene.displayObject);
        }
        this.scene = scene;
        if (scene) {
            this.stageDisplayObject.addChild(scene.displayObject);
        }
    }

    update() {
        this.fpsDisplayObject.text = 'FPS: ' + Math.floor(this.application.ticker.FPS);

        this.scene && this.scene.update(this.application.ticker.deltaMS);
        const sx = this.canvasWidth / this.camera.viewWidth;
        const sy = this.canvasHeight / this.camera.viewHeight;
        this.stageDisplayObject.setTransform(-this.camera.x * sx, -this.camera.y * sy, sx, sy, -this.camera.rotation);
        this.uiDisplayObject.setTransform(0, 0, sx, sy);
        this.application.render();
    }

    resizeCanvas(width: number, height: number) {
        this.canvasWidth = width;
        this.canvasHeight = height;
        this.application.renderer.resize(width, height);
    }

    handleMouseLeave(x: number, y: number) {
        this.mouse.setAs(this.camera.transformMousePoint(this.canvasWidth, this.canvasHeight, x, y));
        this.scene && this.scene.handleMouseLeave(this.mouse.x, this.mouse.y);
    }

    handleMouseMove(x: number, y: number) {
        this.mouse.setAs(this.camera.transformMousePoint(this.canvasWidth, this.canvasHeight, x, y));
        this.scene && this.scene.handleMouseMove(this.mouse.x, this.mouse.y);
    }

    handleMouseDown(x: number, y: number, button: number) {
        this.mouse.setAs(this.camera.transformMousePoint(this.canvasWidth, this.canvasHeight, x, y));
        switch (button) {
            case MOUSE_BUTTON.LEFT:
                this.mouse.leftButtonDown = true;
                break;
            case MOUSE_BUTTON.RIGHT:
                this.mouse.rightButtonDown = true;
                break;
        }
        this.scene && this.scene.handleMouseDown(this.mouse.x, this.mouse.y, button);
    }

    handleMouseUp(x: number, y: number, button: number) {
        this.mouse.setAs(this.camera.transformMousePoint(this.canvasWidth, this.canvasHeight, x, y));
        switch (button) {
            case MOUSE_BUTTON.LEFT:
                this.mouse.leftButtonDown = false;
                break;
            case MOUSE_BUTTON.RIGHT:
                this.mouse.rightButtonDown = false;
                break;
        }
        this.scene && this.scene.handleMouseUp(this.mouse.x, this.mouse.y, button);
    }

}
