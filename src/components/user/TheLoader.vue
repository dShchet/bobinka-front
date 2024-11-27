<script lang="ts" setup>
import {useWebAppTheme} from "vue-tg";

const {colorScheme} = useWebAppTheme();
</script>

<template>
    <div class="d-flex align-center justify-center fill-height">
        <v-progress-circular
            :theme="colorScheme"
            indeterminate
        ></v-progress-circular>
    </div>
</template>
