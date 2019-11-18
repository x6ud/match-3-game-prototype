import Board from "./Board";
import Grid, {GRID_GRAVITY_DIRECTION} from "./Grid";
import AnimationDispatcher from "../AnimationDispatcher";
import BaseSprite, {BaseSpriteSettings} from "../BaseSprite";
import TransitionValue from "../TransitionValue";
import {easeOutQuart} from "../common/easing";
import Vec2 from "../common/Vec2";
import {EPSILON} from "../common/constants";
import {createGraphics, updateGraphics} from "./render/render-tile";

export enum TILE_TYPE {
    EMPTY,
    TILE,
    /**
     * Generated when 5+ tiles match in a row.
     * Clear all tiles of a color.
     */
    BOMB_LIGHTNING,
    /**
     * Generated when tiles match in a L or T shape.
     * Clear an entire row and col.
     */
    BOMB_CROSS,
    /**
     * Generated when 4 tiles match in a row.
     * Clear a 3x3 area.
     */
    BOMB_SMALL
}

export enum TILE_FALLING_STATE {
    UNCHECK,
    LANDED,
    FALLING
}

export interface TileSettings extends BaseSpriteSettings {
    board: Board;
    row: number;
    col: number;
    color?: number;
    type: TILE_TYPE;
}

export default class Tile extends BaseSprite {

    static readonly ANIMATION_CLEAR = 'clear';
    static readonly ANIMATION_CLEAR_DURATION = 500;

    static readonly ANIMATION_GENERATING = 'generating';
    static readonly ANIMATION_GENERATING_DURATION = 500;

    static readonly ANIMATION_OFFSET = 'offset';
    static readonly ANIMATION_OFFSET_DURATION = 250;

    static readonly ANIMATION_BOUNCE = 'bounce';
    static readonly ANIMATION_BOUNCE_INIT_VELOCITY = 1 / 1400;
    static readonly ANIMATION_BOUNCE_GRAVITY = 2 / 600 ** 2;
    static readonly ANIMATION_BOUNCE_ELASTIC = 0.75;
    static readonly ANIMATION_BOUNCE_TIMES = 1;

    static readonly ANIMATION_FALLING = 'falling';

    static readonly ANIMATION_DETONATION = 'detonation';
    static readonly ANIMATION_DETONATION_DURATION = 300;

    static readonly ANIMATION_EXPLOSION = 'explosion';

    animation = new AnimationDispatcher();

    board: Board;
    row: number = 0;
    col: number = 0;
    color: number;
    type: TILE_TYPE;

    /**
     * Flag property used during matching process. Tile will be cleared.
     */
    clearMark: boolean = false;
    /**
     * Clearing animation has been played and tile will be removed.
     */
    cleared: boolean = false;
    /**
     * Tile will be replaced by this tile after being cleared.
     */
    replacement?: Tile;
    clearAnimationProgress: number = 0;
    /**
     * Bomb generation animation related property. Tile will moves to the position where the bomb will be generated.
     */
    combinedTo?: Tile;
    generatingAnimationProgress: number = 0;

    /**
     * Position offset.
     */
    offset: Vec2 = new Vec2();
    /**
     * Actual display position offset, updated by animation.
     */
    actualOffset: Vec2 = new Vec2();

    fallingProcessedThisFrame: boolean = false;
    fallingProcessedThisTurn: boolean = false;
    fallingProcessedPrevTurn: boolean = false;
    fallingVelocity: number = 0;
    fallingState: TILE_FALLING_STATE = TILE_FALLING_STATE.UNCHECK;
    fallingFrom?: Grid;
    fallingDistance: number = 0;

    bounceOffset: Vec2 = new Vec2();
    bounceTimes: number = 0;
    bounceHeight: number = 0;
    bounceVelocity: number = 0;

    /**
     * Detonation animation has been played.
     */
    detonated: boolean = false;
    detonationAnimationProgress: number = 0;
    /**
     * Detonation animation has finished playing and bomb will be removed in this frame.
     */
    exploded: boolean = false;
    explosionAnimationProgress: number = 0;
    /**
     * The other tile swapped with this tile when detonating.
     */
    combinedWith?: Tile;

    constructor(settings: TileSettings) {
        super(settings);

        this.board = settings.board;
        this.color = settings.color || 0;
        this.type = settings.type;
        this.width = this.board.gridSize;
        this.height = this.board.gridSize;
        this.setBoardPosition(settings.row, settings.col);

        createGraphics(this);
    }

    index() {
        return this.board.index(this.row, this.col);
    }

    setBoardPosition(row: number, col: number) {
        this.row = row;
        this.col = col;
        this.localPosition.set(col * this.board.gridSize, row * this.board.gridSize);
    }

    /**
     * Mark as cleared and play clear animation.
     * Tile will be removed after the animation ends.
     */
    clear() {
        if (this.cleared) {
            throw new Error('Already cleared.');
        }
        this.cleared = true;
        const transition = new TransitionValue({
            duration: Tile.ANIMATION_CLEAR_DURATION,
            from: 0,
            to: 1,
            easingFunction: n => n
        });
        return this.animation.create(
            Tile.ANIMATION_CLEAR,
            dt => {
                this.clearAnimationProgress = transition.step(dt);
                return transition.finished;
            }
        )
            .onFinished(() => {
                if (!this.replacement) {
                    this.replacement = this.board.createTile(this.row, this.col, TILE_TYPE.EMPTY);
                }
                this.board.tiles[this.index()] = this.replacement;
                this.remove();
            });
    }

    /**
     * Set offset and play transitional moving animation.
     */
    setOffset(x: number,
              y: number,
              duration: number = Tile.ANIMATION_OFFSET_DURATION,
              easingFunction: (progress: number) => number = easeOutQuart
    ) {
        this.offset.set(x, y);
        const transitionX = new TransitionValue({
            duration,
            from: this.actualOffset.x,
            to: x,
            easingFunction
        });
        const transitionY = new TransitionValue({
            duration,
            from: this.actualOffset.y,
            to: y,
            easingFunction
        });
        this.animation.cancel(Tile.ANIMATION_BOUNCE);
        this.animation.cancel(Tile.ANIMATION_OFFSET);
        return this.animation.create(
            Tile.ANIMATION_OFFSET,
            dt => {
                this.actualOffset.x = transitionX.step(dt);
                this.actualOffset.y = transitionY.step(dt);
                return transitionX.finished && transitionY.finished;
            }
        );
    }

    playGeneratingAnimation() {
        this.generatingAnimationProgress = 0;
        const transition = new TransitionValue({
            duration: Tile.ANIMATION_GENERATING_DURATION,
            from: 0,
            to: 1,
            easingFunction: n => n
        });
        return this.animation.create(
            Tile.ANIMATION_GENERATING,
            dt => {
                this.generatingAnimationProgress = transition.step(dt);
                return transition.finished;
            }
        );
    }

    playFallingAnimation() {
        const v0 = this.fallingVelocity;
        // tileSize = 1
        // tileSize = 0.5 * g * t^2 + v0 * t
        // 0.5 * g * t^2 + v0 * t - tileSize = 0
        // t = (-v0 + sqrt(v0^2 + 2 * g * tileSize)) / g
        const duration = (-v0 + Math.sqrt(v0 ** 2 + 2 * Board.GRAVITY_ACCELERATION)) / Board.GRAVITY_ACCELERATION;
        const actualDuration = Math.max(duration, Board.ANIMATION_FALLING_MIN_DURATION);
        // v1 = v0 + g * t
        this.fallingVelocity = Math.min(v0 + Board.GRAVITY_ACCELERATION * duration, Board.MAX_FALLING_VELOCITY);
        // a = (v1 - v0) / t
        const actualAcceleration = (this.fallingVelocity - v0) / actualDuration;
        const transition = new TransitionValue({
            from: 0,
            to: 1,
            duration,
            easingFunction: x => {
                if (x <= EPSILON || x >= 1) {
                    return x;
                }
                // t = x * duration
                // distance = 0.5 * g * t^2 + v0 * t
                // y = distance / tileSize
                const t = x * actualDuration;
                return 0.5 * actualAcceleration * t ** 2 + v0 * t;
            }
        });
        this.fallingDistance = 0;
        return this.animation.create(
            Tile.ANIMATION_FALLING,
            dt => {
                this.fallingDistance = transition.step(dt);
                return transition.finished;
            }
        );
    }

    playBounceAnimation() {
        const gridSize = this.board.gridSize;
        const v0 = gridSize * Tile.ANIMATION_BOUNCE_INIT_VELOCITY;
        const gravity = gridSize * Tile.ANIMATION_BOUNCE_GRAVITY;

        this.animation.cancel(Tile.ANIMATION_BOUNCE);

        this.bounceTimes = 0;
        this.bounceHeight = 0;
        this.bounceVelocity = v0;

        const grid = this.board.grids[this.index()];
        let gravityDirection = grid.gravityDirection;
        if (this.fallingFrom && !(
            this.fallingFrom.portalEnd
            && this.fallingFrom.portalEnd.row === grid.row
            && this.fallingFrom.portalEnd.col === grid.col
        )
        ) {
            gravityDirection = this.fallingFrom.gravityDirection;
        }

        return this.animation
            .create(
                Tile.ANIMATION_BOUNCE,
                dt => {
                    this.bounceVelocity -= gravity * dt;
                    this.bounceHeight += this.bounceVelocity * dt;
                    if (this.bounceHeight <= 0) {
                        this.bounceTimes += 1;
                        this.bounceVelocity = v0 * Tile.ANIMATION_BOUNCE_ELASTIC ** this.bounceTimes;
                    }

                    switch (gravityDirection) {
                        case GRID_GRAVITY_DIRECTION.UP:
                            this.bounceOffset.y = +this.bounceHeight;
                            break;
                        case GRID_GRAVITY_DIRECTION.DOWN:
                            this.bounceOffset.y = -this.bounceHeight;
                            break;
                        case GRID_GRAVITY_DIRECTION.LEFT:
                            this.bounceOffset.x = +this.bounceHeight;
                            break;
                        case GRID_GRAVITY_DIRECTION.RIGHT:
                            this.bounceOffset.x = -this.bounceHeight;
                            break;
                    }
                    return this.bounceTimes >= Tile.ANIMATION_BOUNCE_TIMES;
                }
            )
            .onFinishedOrCanceled(() => {
                this.bounceOffset = new Vec2();
            });
    }

    isMatchable(): boolean {
        if (this.cleared) {
            return false;
        }
        switch (this.type) {
            case TILE_TYPE.TILE:
                return true;
            default:
                return false;
        }
    }

    /**
     * Whether the 2 tiles have the same color.
     */
    matches(tile: Tile): boolean {
        return this.color === tile.color;
    }

    /**
     * Whether the tile can fall or slip.
     */
    isMovable(): boolean {
        if (this.cleared) {
            return false;
        }
        switch (this.type) {
            case TILE_TYPE.TILE:
            case TILE_TYPE.BOMB_LIGHTNING:
            case TILE_TYPE.BOMB_CROSS:
            case TILE_TYPE.BOMB_SMALL:
                return true;
            default:
                return false;
        }
    }

    /**
     * Whether the tile can be dragged and swapped.
     */
    isSwappable(): boolean {
        if (
            this.cleared
            || this.fallingProcessedThisTurn
            || this.animation.isPlaying(Tile.ANIMATION_FALLING)
        ) {
            return false;
        }
        switch (this.type) {
            case TILE_TYPE.TILE:
            case TILE_TYPE.BOMB_LIGHTNING:
            case TILE_TYPE.BOMB_CROSS:
            case TILE_TYPE.BOMB_SMALL:
                return true;
            default:
                return false;
        }
    }

    isBomb(): boolean {
        switch (this.type) {
            case TILE_TYPE.BOMB_SMALL:
            case TILE_TYPE.BOMB_CROSS:
            case TILE_TYPE.BOMB_LIGHTNING:
                return true;
            default:
                return false;
        }
    }

    detonate(combinedWith?: Tile, draggedOne?: boolean) {
        if (this.detonated || this.exploded) {
            throw new Error('Already detonated.')
        }
        this.detonated = true;
        this.combinedWith = combinedWith;
        if (combinedWith && combinedWith.isBomb() && !draggedOne) {
            this.combinedTo = combinedWith;
            return this.clear();
        }
        const transition = new TransitionValue({
            duration: Tile.ANIMATION_DETONATION_DURATION,
            from: 0,
            to: 1,
            easingFunction: n => n
        });
        return this.animation
            .create(
                Tile.ANIMATION_DETONATION,
                dt => {
                    this.detonationAnimationProgress = transition.step(dt);
                    return transition.finished;
                }
            )
            .onFinished(() => {
                this.exploded = true;
            });
    }

    playExplosionAnimation() {
        const transition = new TransitionValue({
            duration: Tile.ANIMATION_CLEAR_DURATION,
            from: 0,
            to: 1,
            easingFunction: n => n
        });
        return this.animation
            .create(
                Tile.ANIMATION_EXPLOSION,
                dt => {
                    this.explosionAnimationProgress = transition.step(dt);
                    return transition.finished;
                }
            );
    }

    // =============================================================

    update(dt: number) {
        this.onUpdate(dt);
    }

    onUpdate(dt: number) {
        this.animation.update(dt);
        updateGraphics(this);
    }

}
