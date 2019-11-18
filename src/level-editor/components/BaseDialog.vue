<template>
    <transition name="fade">
        <div class="dialog-wrapper"
             v-if="visible"
        >
            <div class="dialog">
                <div class="dialog-title">
                    <span class="title">{{title}}</span>
                    <button class="btn-close" @click="$emit('update:visible', false)">
                        <span>×</span>
                    </button>
                </div>
                <div class="dialog-body">
                    <slot/>

                    <div class="dialog-buttons">
                        <button @click="$emit('update:visible', false)">Cancel</button>
                        <button @click="$emit('ok')">Ok</button>
                    </div>
                </div>
            </div>
        </div>
    </transition>
</template>

<script>
    export default {
        props: {
            title: String,
            visible: Boolean,
            width: {
                type: Number,
                default: 480
            }
        }
    };
</script>

<style lang="scss" scoped>
    .fade-enter-active, .fade-leave-active {
        transition: opacity .15s;
    }

    .fade-enter, .fade-leave-to {
        opacity: 0;
    }

    .dialog-wrapper {
        display: flex;
        align-items: center;
        justify-content: center;
        position: fixed;
        z-index: 1000;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, .25);

        .dialog {
            display: inline-flex;
            flex-direction: column;

            .dialog-title {
                height: 32px;
                line-height: 32px;
                background-color: #545c64;
                color: #fff;

                .title {
                    margin-left: 16px;
                }

                .btn-close {
                    float: right;
                    width: 32px;
                    height: 32px;
                    line-height: 32px;
                    padding: 0 8px;
                    border: none;
                    background: none;
                    color: rgba(255, 255, 255, .5);
                    font-size: 20px;
                    outline: none;

                    &:hover {
                        background: rgba(255, 255, 255, .1);
                        color: #fff;
                    }

                    &:active {
                        background: rgba(255, 255, 255, .25);
                        color: #fff;
                    }
                }
            }

            .dialog-body {
                padding: 16px;
                background-color: #fafafa;
                box-shadow: 0 0 8px rgba(0, 0, 0, 0.25);

                & > .dialog-buttons {
                    display: flex;
                    justify-content: flex-end;
                    margin: 17px 1px 1px 0;

                    button {
                        box-sizing: border-box;
                        height: 24px;
                        line-height: 24px;
                        padding: 0 8px;
                        margin-left: 8px;
                        background-color: #fafafa;
                        color: #656565;
                        border: 1px solid #fff;
                        outline: 1px solid #a0a0a0;

                        &:hover {
                            border-color: #ffe294;
                            outline-color: #f29436;
                        }

                        &:active {
                            background-color: #ffe294;
                            outline-color: #ef4810;
                        }
                    }
                }
            }
        }
    }
</style>
