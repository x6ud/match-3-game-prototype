import Graphics = PIXI.Graphics;
import Vec2 from "./Vec2";

export function drawRect(graphic: Graphics, x: number, y: number, width: number, height: number) {
    return graphic
        .moveTo(x, y)
        .lineTo(x + width, y)
        .lineTo(x + width, y + height)
        .lineTo(x, y + height)
        .lineTo(x, y);
}

export function drawArrow(graphic: Graphics,
                          x0: number,
                          y0: number,
                          x1: number,
                          y1: number,
                          arrowSize: number = 6,
                          arrowAngle: number = Math.PI / 180 * 75) {
    const norm = new Vec2(x0 - x1, y0 - y1).norm().mul(arrowSize);
    const angle = arrowAngle / 2;
    const head1 = norm.rotate(0, 0, angle);
    const head2 = norm.rotate(0, 0, -angle);
    return graphic
        .moveTo(x0, y0)
        .lineTo(x1, y1)
        .moveTo(x1, y1)
        .lineTo(head1.x + x1, head1.y + y1)
        .moveTo(x1, y1)
        .lineTo(head2.x + x1, head2.y + y1);
}
