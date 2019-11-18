import Vec2 from "./common/Vec2";

export enum MOUSE_BUTTON {
    LEFT = 0, RIGHT = 2
}

export default class Mouse extends Vec2 {

    leftButtonDown: boolean;
    rightButtonDown: boolean;

    constructor() {
        super();
        this.leftButtonDown = false;
        this.rightButtonDown = false;
    }

}
