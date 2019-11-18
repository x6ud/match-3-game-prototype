<template>
    <div class="editor">
        <div class="toolbar">
            <button @click="createNew">New</button>
            <span class="sep"></span>
            <button @click="save" title="Save to Local Storage">Save</button>
            <button @click="load" title="Load Local Storage">Load</button>
            <button @click="exportToClipboard" title="Export to Clipboard">Export</button>

            <div class="fill"></div>

            <button class="primary" @click="toggleMode">
                {{editMode ? 'Run' : 'Edit'}}
            </button>
        </div>

        <div class="main">
            <div class="tools">
                <template v-for="item in tools">
                    <toggleable-button v-if="item.type === 'tool'"
                                       :active="tool === item.id"
                                       @click="tool = item.id"
                                       :title="item.description"
                    >
                        <span>{{item.label}}</span>
                    </toggleable-button>
                    <hr v-if="item.type === 'sep'">
                </template>
            </div>

            <div class="canvas-wrapper" ref="canvasWrapper">
                <canvas ref="canvas"
                        @mouseleave="onMouseLeave"
                        @mousemove="onMouseMove"
                        @mousedown="onMouseDown"
                        @mouseup="onMouseUp"
                        @contextmenu.prevent
                ></canvas>
            </div>
        </div>

        <div class="status-bar">
            <div>Rows: {{rows}}</div>
            <div>Cols: {{cols}}</div>
            <div>Colors: {{colors}}</div>
        </div>

        <create-new-dialog ref="createNewDialog"/>
    </div>
</template>

<script>
    import Game from "../game/Game.ts";
    import LevelEditor, {LEVEL_EDITOR_TOOL} from "./LevelEditor.ts";
    import LevelEditorRunner from "./LevelEditorRunner.ts";

    import {copyToClipboard} from "@/level-editor/clipboard";

    import defaultLevel from "./default-level.json";

    import ToggleableButton from "./components/ToggleableButton.vue";
    import CreateNewDialog from "./components/CreateNewDialog.vue";

    const STORAGE_KEY = 'MATCH_3_LEVEL_DATA';

    export default {
        components: {ToggleableButton, CreateNewDialog},
        data() {
            return {
                tools: [
                    {
                        type: 'tool',
                        id: LEVEL_EDITOR_TOOL.GRID_GRAVITY_DOWN,
                        label: '↓',
                        description: 'Grid with Gravity Down'
                    },
                    {
                        type: 'tool',
                        id: LEVEL_EDITOR_TOOL.GRID_GRAVITY_UP,
                        label: '↑',
                        description: 'Grid with Gravity Up'
                    },
                    {
                        type: 'tool',
                        id: LEVEL_EDITOR_TOOL.GRID_GRAVITY_LEFT,
                        label: '←',
                        description: 'Grid with Gravity Left'
                    },
                    {
                        type: 'tool',
                        id: LEVEL_EDITOR_TOOL.GRID_GRAVITY_RIGHT,
                        label: '→',
                        description: 'Grid with Gravity Right'
                    },
                    {type: 'sep'},
                    {type: 'tool', id: LEVEL_EDITOR_TOOL.GENERATOR, label: 'G', description: 'Generator'},
                    {type: 'tool', id: LEVEL_EDITOR_TOOL.PORTAL, label: 'P', description: 'Portal'}
                ],
                tool: LEVEL_EDITOR_TOOL.GRID_GRAVITY_DOWN,
                rows: 6,
                cols: 9,
                colors: 4,
                editMode: true
            };
        },
        watch: {
            tool() {
                this.levelEditor && this.levelEditor.setTool(this.tool);
            }
        },
        mounted() {
            this.game = new Game({
                canvas: /** @type {HTMLCanvasElement} */ this.$refs.canvas,
                viewWidth: 800,
                viewHeight: 600
            });
            this.levelEditor = new LevelEditor({global: this.game});
            this.levelRunner = new LevelEditorRunner({global: this.game});
            this.game.useScene(this.levelEditor);
            this.levelEditor.createNew(this.rows, this.cols, this.colors);
            if (!this.load()) {
                this.levelEditor.importData(defaultLevel);
            }

            window.addEventListener('resize', this.resize);
            this.resize();
            this.game.start();
        },
        beforeDestroy() {
            window.removeEventListener('resize', this.resize);
            this.game.stop();
        },
        methods: {
            resize() {
                const wrapperWidth = this.$refs.canvasWrapper.clientWidth;
                const wrapperHeight = this.$refs.canvasWrapper.clientHeight;
                const aspect = this.game.camera.getAspect();
                let width, height;
                if (wrapperWidth / wrapperHeight >= aspect) {
                    width = Math.floor(wrapperHeight * aspect);
                    height = wrapperHeight;
                } else {
                    width = wrapperWidth;
                    height = Math.floor(wrapperWidth / aspect);
                }
                this.game.resizeCanvas(width, height);
            },
            onMouseLeave(e) {
                this.game.handleMouseLeave(e.offsetX, e.offsetY);
            },
            onMouseMove(e) {
                this.game.handleMouseMove(e.offsetX, e.offsetY);
            },
            onMouseDown(e) {
                this.game.handleMouseDown(e.offsetX, e.offsetY, e.button);
            },
            onMouseUp(e) {
                this.game.handleMouseUp(e.offsetX, e.offsetY, e.button);
            },
            createNew() {
                this.$refs.createNewDialog.show().then(params => {
                    if (!this.editMode) {
                        this.toggleMode();
                    }
                    this.levelEditor.createNew(
                        this.rows = params.rows,
                        this.cols = params.cols,
                        this.colors = params.colors
                    )
                });
            },
            save() {
                window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.levelEditor.exportData()));
            },
            load() {
                const json = window.localStorage.getItem(STORAGE_KEY);
                const data = json && JSON.parse(json);
                if (data) {
                    this.levelEditor.importData(data);
                    this.rows = data.rows;
                    this.cols = data.cols;
                    this.colors = data.colors;
                    return true;
                } else {
                    return false;
                }
            },
            exportToClipboard() {
                copyToClipboard(JSON.stringify(this.levelEditor.exportData()));
            },
            toggleMode() {
                this.editMode = !this.editMode;
                if (this.editMode) {
                    this.game.useScene(this.levelEditor);
                } else {
                    this.game.useScene(this.levelRunner);
                    this.levelRunner.run(this.levelEditor.exportData());
                }
            }
        }
    };
</script>

<style lang="scss" scoped>
    .editor {
        display: flex;
        flex-direction: column;
        width: 100%;
        height: 100%;
        background-color: #fafafa;
        user-select: none;

        .toolbar {
            display: flex;
            width: 100%;
            height: 32px;
            background-color: #545c64;

            .sep {
                display: inline-block;
                width: 0;
                height: 24px;
                margin: 4px 2px;
                border-left: 1px solid rgba(255, 255, 255, .25);
            }

            .fill {
                flex: 1 1;
            }

            button {
                display: inline-block;
                position: relative;
                height: 32px;
                line-height: 32px;
                padding: 0 8px;
                border: none;
                background: none;
                color: rgba(255, 255, 255, .5);
                font-size: 14px;
                outline: none;
                overflow: hidden;

                &:hover {
                    background: rgba(255, 255, 255, .1);
                    color: #fff;
                }

                &:active {
                    background: rgba(255, 255, 255, .25);
                    color: #fff;
                }

                &.primary {
                    background: #409eff;
                    color: #fff;

                    &:hover {
                        background: #66b1ff;
                    }

                    &:active {
                        background: #3a8ee6;
                    }
                }
            }
        }

        .main {
            flex: 1 1;
            display: flex;
            width: 100%;
            min-height: 0;

            .tools {
                display: flex;
                flex-direction: column;
                padding: 8px;
                border-right: 1px solid #e6e6e6;
                background-color: #fafafa;

                hr {
                    border: none;
                    width: 100%;
                    height: 1px;
                    background-color: #e6e6e6;
                    margin: 4px 0 8px 0;
                }

                button {
                    width: 32px;
                    height: 32px;
                    margin-bottom: 4px;
                    font-size: 18px;
                }
            }

            .canvas-wrapper {
                flex: 1 1;
                display: flex;
                align-items: center;
                min-width: 0;
                height: 100%;

                canvas {
                    margin: 0 auto;
                    background-color: #fff;
                }
            }
        }

        .status-bar {
            display: flex;
            padding: 2px 8px;
            border-top: 1px solid #e6e6e6;
            background-color: #fafafa;
            font-size: 12px;

            & > div {
                margin-right: 1em;
            }
        }
    }
</style>
