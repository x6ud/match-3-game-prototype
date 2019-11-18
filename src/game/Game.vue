<template>
    <div class="wrapper" ref="wrapper">
        <canvas ref="canvas"
                @mouseleave="onMouseLeave"
                @mousemove="onMouseMove"
                @mousedown="onMouseDown"
                @mouseup="onMouseUp"
                @contextmenu.prevent
        ></canvas>
    </div>
</template>

<script>
    import Game from "./Game.ts";

    export default {
        mounted() {
            this.game = new Game({
                canvas: /** @type {HTMLCanvasElement} */ this.$refs.canvas,
                viewWidth: 800,
                viewHeight: 600
            });
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
                const wrapperWidth = this.$refs.wrapper.clientWidth;
                const wrapperHeight = this.$refs.wrapper.clientHeight;
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
            }
        }
    };
</script>

<style lang="scss" scoped>
    .wrapper {
        display: flex;
        align-items: center;
        width: 100%;
        height: 100%;
        background: #fafafa;
        user-select: none;

        canvas {
            margin: 0 auto;
            background: #fff;
        }
    }
</style>
