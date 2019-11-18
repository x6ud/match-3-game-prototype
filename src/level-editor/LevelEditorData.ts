import {LevelDef} from "../game/match3/process-level-loading";
import {GRID_GRAVITY_DIRECTION, GRID_TYPE, GridDef} from "../game/match3/Grid";

export class LevelDefData implements LevelDef {
    colors: number = 0;
    rows: number = 0;
    cols: number = 0;
    grids: LevelDefDataGrid[] = [];
}

export class LevelDefDataGrid implements GridDef {
    type: GRID_TYPE = GRID_TYPE.VOID;
    row: number = 0;
    col: number = 0;
    generator: boolean = false;
    gravityDirection: GRID_GRAVITY_DIRECTION = GRID_GRAVITY_DIRECTION.DOWN;
    portalEnd?: { row: number; col: number };
}
