<script lang="ts" setup>
import {computed, onMounted, ref} from "vue";
import TheLoader from "~/components/user/TheLoader.vue";
import {createUrl} from "~/utils/common.ts";

// Common section
const props = defineProps<{
    srcs: string[],
    heightPx: number,
    download?: boolean,
}>();

const emit = defineEmits<{
    fetched: [value: File[]],
}>();

// Images section
const images = ref<File[]>([]);

const onFetchImages = async () => {
    images.value = await Promise.all(props.srcs.map(async (src) => {
        const response = await fetch(src);
        const blob = await response.blob();
        const srcArray = src.split('/');
        return new File([blob], `${srcArray[srcArray.length - 1]}.png`, {type: blob.type});
    }));
};

// Sizes section
const totalImages = props.srcs.length;
const imageHeight = computed(() => `${Math.round(props.heightPx / totalImages)}px`);

// Split images section
const firstRowImages = ref<File[]>([]);
const secondRowImages = ref<File[]>([]);

const splitImages = () => {
    const firstRowCount = Math.ceil(images.value.length / 2);
    const firstRow = images.value.slice(0, firstRowCount);
    const secondRow = images.value.slice(firstRowCount);
    return {firstRow, secondRow};
};

// On mounted actions
onMounted(async () => {
    await onFetchImages();
    emit('fetched', images.value);

    const {firstRow, secondRow} = splitImages();
    firstRowImages.value = firstRow;
    secondRowImages.value = secondRow;
});
</script>

<template>
    <v-container>
        <v-row>
            <v-col
                v-for="(image, index) in firstRowImages"
                :key="index"
                class="image-cell"
            >
                <v-img :height="imageHeight" :src="createUrl(image)" :width="imageHeight">
                    <template v-slot:placeholder>
                        <TheLoader/>
                    </template>
                </v-img>
                <v-btn v-if="download" class="mt-2">
                    <a
                        :href="createUrl(image)"
                        class="default-text"
                        download
                    >
                        Скачать
                    </a>
                </v-btn>
            </v-col>
        </v-row>
        <v-row>
            <v-col
                v-for="(image, index) in secondRowImages"
                :key="index"
                class="image-cell"
            >
                <v-img :height="imageHeight" :src="createUrl(image)" :width="imageHeight">
                    <template v-slot:placeholder>
                        <TheLoader/>
                    </template>
                </v-img>
                <v-btn v-if="download" class="mt-2">
                    <a
                        :href="createUrl(image)"
                        class="default-text"
                        download
                    >
                        Скачать
                    </a>
                </v-btn>
            </v-col>
        </v-row>
    </v-container>
</template>

<style lang="scss" scoped>
.image-cell {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.default-text {
    text-decoration: none;
    color: var(--tg-theme-text-color, rgb(var(--v-theme-text-base)));
}
</style>