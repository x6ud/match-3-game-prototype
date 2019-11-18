import Board from "./Board";
import {randomInt} from "../common/random";
import Tile from "./Tile";

function shuffleArray<T>(arr: T[]): T[] {
    for (let i = 0, last = arr.length - 1; i < last; ++i) {
        const j = randomInt(i, last);
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

export function shuffle(board: Board, onFinish?: () => void) {
    const tiles = shuffleArray(board.tiles.filter(tile => tile.isSwappable() && tile.isMatchable()));
    const shuffled = shuffleArray([...tiles]);
    board.animation.delay(Board.ANIMATION_SHUFFLE, Board.ANIMATION_SHUFFLE_DELAY)
        .onFinished(() => {
            doSwap(board, tiles, shuffled, 0, Board.ANIMATION_SHUFFLE_SWAPPING_DURATION, onFinish);
        });
}

function doSwap(board: Board, tiles: Tile[], shuffled: Tile[], index: number, duration: number, onFinish?: () => void) {
    if (index >= tiles.length) {
        const animation = board.animation.delay(Board.ANIMATION_SHUFFLE, Board.ANIMATION_SHUFFLE_DELAY);
        onFinish && animation.onFinished(onFinish);
        return;
    }
    const tile1 = tiles[index];
    const tile2 = shuffled[index];
    if (tile1 === tile2) {
        doSwap(board, tiles, shuffled, index + 1, duration, onFinish);
        return;
    }
    board.swapTiles(tile1, tile2);
    board.animation
        .sync(
            Board.ANIMATION_SHUFFLE,
            tile1.setOffset(0, 0, duration),
            tile2.setOffset(0, 0, duration)
        )
        .onFinished(() => {
            doSwap(board, tiles, shuffled, index + 1,
                Math.max(
                    Board.ANIMATION_SHUFFLE_SWAPPING_MIN_DURATION,
                    duration * Board.ANIMATION_SHUFFLE_SWAPPING_DURATION_REDUCTION_RATIO
                ),
                onFinish
            )
        });
}

