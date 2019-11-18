import Board from './Board'
import Grid, {GridDef, GRID_GRAVITY_DIRECTION, GRID_TYPE} from './Grid'

export interface LevelDef {
    rows: number;
    cols: number;
    colors: number;
    grids: GridDef[];
}

export function loadLevel(board: Board, levelDef: LevelDef) {
    const rows = levelDef.rows;
    const cols = levelDef.cols;
    board.rows = rows;
    board.cols = cols;
    board.colors = levelDef.colors;
    board.width = cols * board.gridSize;
    board.height = rows * board.gridSize;
    board.grids = [];

    for (let row = 0; row < rows; ++row) {
        for (let col = 0; col < cols; ++col) {
            const index = board.index(row, col);
            const gridDef = levelDef.grids[index];
            const grid = board.grids[index] = new Grid({
                global: board.global,
                board,
                row: gridDef.row,
                col: gridDef.col,
                type: gridDef.type,
                gravityDirection: gridDef.gravityDirection,
                generator: gridDef.generator,
                portalEnd: gridDef.portalEnd
            });
            board.addChild(grid);
        }
    }

    for (let row = 0; row < rows; ++row) {
        for (let col = 0; col < cols; ++col) {
            // ======================================
            const index = board.index(row, col);
            const grid = board.grids[index];

            switch (grid.type) {
                case GRID_TYPE.SPACE:
                    if (grid.portalEnd) {
                        const portalEnd = board.grids[board.index(grid.portalEnd.row, grid.portalEnd.col)];
                        if (portalEnd.type === GRID_TYPE.SPACE) {
                            portalEnd.directSources.push(grid);
                            grid.directTarget = portalEnd;
                        }
                    }
                    switch (grid.gravityDirection) {
                        case GRID_GRAVITY_DIRECTION.DOWN:
                            if (row < rows - 1) {
                                if (!grid.portalEnd) {
                                    const target = board.grids[board.index(row + 1, col)];
                                    if (target.type === GRID_TYPE.SPACE) {
                                        target.directSources.push(grid);
                                        grid.directTarget = target;
                                    }
                                }
                                if (col > 0) {
                                    const target = board.grids[board.index(row + 1, col - 1)];
                                    if (target.type === GRID_TYPE.SPACE) {
                                        target.flankSources.push(grid);
                                        grid.flankTarget.push(target);
                                    }
                                }
                                if (col < cols - 1) {
                                    const target = board.grids[board.index(row + 1, col + 1)];
                                    if (target.type === GRID_TYPE.SPACE) {
                                        target.flankSources.push(grid);
                                        grid.flankTarget.push(target);
                                    }
                                }
                            }
                            break;
                        case GRID_GRAVITY_DIRECTION.UP:
                            if (row > 0) {
                                if (!grid.portalEnd) {
                                    const target = board.grids[board.index(row - 1, col)];
                                    if (target.type === GRID_TYPE.SPACE) {
                                        target.directSources.push(grid);
                                        grid.directTarget = target;
                                    }
                                }
                                if (col > 0) {
                                    const target = board.grids[board.index(row - 1, col - 1)];
                                    if (target.type === GRID_TYPE.SPACE) {
                                        target.flankSources.push(grid);
                                        grid.flankTarget.push(target);
                                    }
                                }
                                if (col < cols - 1) {
                                    const target = board.grids[board.index(row - 1, col + 1)];
                                    if (target.type === GRID_TYPE.SPACE) {
                                        target.flankSources.push(grid);
                                        grid.flankTarget.push(target);
                                    }
                                }
                            }
                            break;
                        case GRID_GRAVITY_DIRECTION.LEFT:
                            if (col > 0) {
                                if (!grid.portalEnd) {
                                    const target = board.grids[board.index(row, col - 1)];
                                    if (target.type === GRID_TYPE.SPACE) {
                                        target.directSources.push(grid);
                                        grid.directTarget = target;
                                    }
                                }
                                if (row > 0) {
                                    const target = board.grids[board.index(row - 1, col - 1)];
                                    if (target.type === GRID_TYPE.SPACE) {
                                        target.flankSources.push(grid);
                                        grid.flankTarget.push(target);
                                    }
                                }
                                if (row < rows - 1) {
                                    const target = board.grids[board.index(row + 1, col - 1)];
                                    if (target.type === GRID_TYPE.SPACE) {
                                        target.flankSources.push(grid);
                                        grid.flankTarget.push(target);
                                    }
                                }
                            }
                            break;
                        case GRID_GRAVITY_DIRECTION.RIGHT:
                            if (col < cols - 1) {
                                if (!grid.portalEnd) {
                                    const target = board.grids[board.index(row, col + 1)];
                                    if (target.type === GRID_TYPE.SPACE) {
                                        target.directSources.push(grid);
                                        grid.directTarget = target;
                                    }
                                }
                                if (row > 0) {
                                    const target = board.grids[board.index(row - 1, col + 1)];
                                    if (target.type === GRID_TYPE.SPACE) {
                                        target.flankSources.push(grid);
                                        grid.flankTarget.push(target);
                                    }
                                }
                                if (row < rows - 1) {
                                    const target = board.grids[board.index(row + 1, col + 1)];
                                    if (target.type === GRID_TYPE.SPACE) {
                                        target.flankSources.push(grid);
                                        grid.flankTarget.push(target);
                                    }
                                }
                            }
                            break;
                    }
                    break;
                case GRID_TYPE.VOID:
                    break;
            }
            // ======================================
        }
    }
}
