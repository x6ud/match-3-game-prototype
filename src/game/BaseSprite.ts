import {Container} from "pixi.js";
import Vec2 from "./common/Vec2";
import Game from "./Game";
import {MOUSE_BUTTON} from "./Mouse";

export interface BaseSpriteSettings {
    global: Game;
}

export default class BaseSprite {

    $handleMouseEvents: boolean = false;

    global: Game;

    parent?: BaseSprite;
    prev?: BaseSprite;
    next?: BaseSprite;
    firstChild?: BaseSprite;
    lastChild?: BaseSprite;

    displayObject: Container = new Container();

    localPosition: Vec2 = new Vec2();
    width: number = 0;
    height: number = 0;

    private mouseOver: boolean = false;
    private dragging: boolean = false;
    private lastDraggingX: number = 0;
    private lastDraggingY: number = 0;

    constructor(settings: BaseSpriteSettings) {
        this.global = settings.global;
    }

    update(dt: number) {
        this.displayObject.position.set(this.localPosition.x, this.localPosition.y);
        this.onUpdate(dt);
        for (let child = this.firstChild; child; child = child.next) {
            child.update(dt);
        }
    }

    remove() {
        if (this.parent) {
            if (this.prev) {
                this.prev.next = this.next;
            }
            if (this.next) {
                this.next.prev = this.prev;
            }
            if (this.parent.firstChild === this) {
                this.parent.firstChild = this.next;
            }
            if (this.parent.lastChild === this) {
                this.parent.lastChild = this.prev;
            }
            this.parent.displayObject.removeChild(this.displayObject);
            this.parent = undefined;
        }
    }

    addChild(sprite: BaseSprite) {
        if (sprite.parent) {
            sprite.remove();
        }
        sprite.parent = this;
        if (this.lastChild) {
            this.lastChild.next = sprite;
            sprite.prev = this.lastChild;
            this.lastChild = sprite;
        } else {
            this.firstChild = this.lastChild = sprite;
        }
        this.displayObject.addChild(sprite.displayObject);
    }

    removeChild(sprite: BaseSprite) {
        if (sprite.parent !== this) {
            throw new Error('Sprite is not a child of this node.');
        }
        sprite.remove();
    }

    removeAllChildren() {
        while (this.firstChild) {
            this.firstChild.remove();
        }
    }

    getGlobalPosition(): Vec2 {
        return this.parent ? this.parent.getGlobalPosition().add(this.localPosition) : this.localPosition;
    }

    isPointInside(x: number, y: number) {
        const position = this.getGlobalPosition();
        return x >= position.x
            && x <= position.x + this.width
            && y >= position.y
            && y <= position.y + this.height;
    }

    isMouseOver() {
        return this.mouseOver;
    }

    // ======================================================

    onUpdate(dt: number) {
    }

    onMouseDown(x: number, y: number, button: MOUSE_BUTTON) {
    }

    onMouseUp(x: number, y: number, button: MOUSE_BUTTON) {
    }

    onMouseMove(x: number, y: number) {
    }

    onDragStart(x: number, y: number, button: MOUSE_BUTTON) {
    }

    onDragMove(x: number, y: number, dx: number, dy: number) {
    }

    onDragEnd(x: number, y: number, dx: number, dy: number) {
    }

    onDragCancel() {
    }

    // ======================================================

    handleMouseLeave(x: number, y: number) {
        if (!this.$handleMouseEvents) {
            return;
        }
        this.mouseOver = false;
        if (this.dragging) {
            this.dragging = false;
            const dx = x - this.lastDraggingX;
            const dy = y - this.lastDraggingY;
            this.onDragEnd(x, y, dx, dy);
        }
        for (let child = this.firstChild; child; child = child.next) {
            child.handleMouseLeave(x, y);
        }
    }

    handleMouseMove(x: number, y: number) {
        if (!this.$handleMouseEvents) {
            return;
        }
        this.mouseOver = this.isPointInside(x, y);
        if (this.mouseOver) {
            this.onMouseMove(x, y);
        }
        if (this.dragging) {
            const dx = x - this.lastDraggingX;
            const dy = y - this.lastDraggingY;
            this.lastDraggingX = x;
            this.lastDraggingY = y;
            this.onDragMove(x, y, dx, dy);
        }
        for (let child = this.firstChild; child; child = child.next) {
            child.handleMouseMove(x, y);
        }
    }

    handleMouseDown(x: number, y: number, button: number) {
        if (!this.$handleMouseEvents) {
            return;
        }
        this.mouseOver = this.isPointInside(x, y);
        if (this.mouseOver) {
            this.onMouseDown(x, y, button);
        }
        switch (button) {
            case MOUSE_BUTTON.LEFT:
                if (!this.dragging && this.mouseOver) {
                    this.dragging = true;
                    this.lastDraggingX = x;
                    this.lastDraggingY = y;
                    this.onDragStart(x, y, button);
                }
                break;
            case MOUSE_BUTTON.RIGHT:
                if (this.dragging) {
                    this.dragging = false;
                    this.onDragCancel();
                }
                break;
        }
        for (let child = this.firstChild; child; child = child.next) {
            child.handleMouseDown(x, y, button);
        }
    }

    handleMouseUp(x: number, y: number, button: number) {
        if (!this.$handleMouseEvents) {
            return;
        }
        this.mouseOver = this.isPointInside(x, y);
        this.onMouseUp(x, y, button);
        if (button === MOUSE_BUTTON.LEFT) {
            if (this.dragging) {
                this.dragging = false;
                const dx = x - this.lastDraggingX;
                const dy = y - this.lastDraggingY;
                this.onDragEnd(x, y, dx, dy);
            }
        }
        for (let child = this.firstChild; child; child = child.next) {
            child.handleMouseUp(x, y, button);
        }
    }

}
