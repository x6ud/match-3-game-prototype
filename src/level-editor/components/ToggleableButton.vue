<template>
    <button class="toggleable-button"
            :class="{active}"
            @click="$emit('click')"
    >
        <slot/>
    </button>
</template>

<script>
    export default {
        props: {
            active: Boolean
        }
    };
</script>

<style lang="scss" scoped>
    button {
        box-sizing: border-box;
        border: 1px solid #fff;
        outline: 1px solid #a0a0a0;
        background-color: #fafafa;
        color: #656565;
        text-align: center;
        vertical-align: top;

        &:hover {
            border-color: #ffe294;
            outline-color: #f29436;
        }

        &:active {
            outline-color: #ef4810;
        }

        &.active {
            background-color: #ffe294;
        }
    }
</style>
