<template>
    <base-dialog title="New"
                 :visible.sync="visible"
                 @ok="ok"
    >
        <div class="form">
            <div class="prop">
                <span class="label">Rows</span>
                <div class="editor">
                    <input type="number" v-model="rows" min="1">
                </div>
            </div>
            <div class="prop">
                <span class="label">Cols</span>
                <div class="editor">
                    <input type="number" v-model="cols" min="1">
                </div>
            </div>
            <div class="prop">
                <span class="label">Colors</span>
                <div class="editor">
                    <input type="number" v-model="colors" min="2" max="7">
                </div>
            </div>
        </div>
    </base-dialog>
</template>

<script>
    import BaseDialog from './BaseDialog.vue'

    export default {
        components: {BaseDialog},
        data() {
            return {
                visible: false,
                rows: 9,
                cols: 9,
                colors: 4
            };
        },
        methods: {
            show() {
                this.visible = true;
                return new Promise((resolve) => {
                    this.resolve = resolve;
                });
            },
            ok() {
                this.visible = false;
                this.resolve && this.resolve({
                    rows: this.rows,
                    cols: this.cols,
                    colors: Math.min(7, Math.max(2, this.colors))
                });
            }
        }
    };
</script>

<style lang="scss" scoped>
    .form {
        display: table;
        font-size: 14px;

        .prop {
            display: table-row;

            .label {
                display: table-cell;
                padding-right: 1em;
                text-align: right;

                &:after {
                    content: ':';
                }
            }

            .editor {
                display: table-cell;
                padding: 4px 0;

                input {
                    width: 96px;
                }
            }
        }
    }
</style>
