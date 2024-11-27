<script lang="ts" setup>
import TheLoader from "~/components/user/TheLoader.vue";
import {computed, onMounted, ref, watch} from "vue";
import {useScreenStore} from "~/stores/screen.ts";
import {storeToRefs} from "pinia";
import {openArticlePage} from "~/utils/navigation.ts";
import {useWebApp, useWebAppTheme} from "vue-tg";
import {type Article} from "~/interfaces/article.ts";

// Common section
const props = defineProps<{
    srcs: string[],
    height: string,
    article?: Article,
}>();

const emit = defineEmits(['update:indexOfColor']);

const {isPlatform} = useWebApp();
const {colorScheme} = useWebAppTheme();

const isTelegramVideo = (index: number) => props.srcs[index].includes('additional_video');
const isYoutubeVideo = (index: number) => props.srcs[index].includes('youtube.com') || props.srcs[index].includes('youtu.be');

// Stores section
const screenStore = useScreenStore();
const {isWideScreen} = storeToRefs(screenStore);

// Carousel section
const slideIndex = ref<number>(0);
const hideDelimiters = ref<boolean>(false);

const onSlideChange = (newIndex: number, oldIndex: number) => {
    // If some of srcs is video
    if (props.srcs.some(src => src.includes('additional_video'))) {
        // Hide delimiters if video and show if image
        hideDelimiters.value = isTelegramVideo(newIndex);

        // Pause video on slide change and seek to start
        if (isTelegramVideo(oldIndex)) {
            const oldVideoElement = document.getElementById(`video-${oldIndex}`) as HTMLVideoElement;
            oldVideoElement.pause();
            oldVideoElement.currentTime = 0;
        } else if (isYoutubeVideo(oldIndex)) {
            const oldVideoElement = document.getElementById(`video-${oldIndex}`) as HTMLIFrameElement;
            oldVideoElement.contentWindow?.postMessage('{"event":"command","func":"' + 'pauseVideo' + '","args":""}', '*');
        }
    } else if (props.srcs.some(src => src.includes('youtube.com') || src.includes('youtu.be'))) {
        hideDelimiters.value = isYoutubeVideo(newIndex);

        if (isYoutubeVideo(oldIndex)) {
            const oldVideoElement = document.getElementById(`video-${oldIndex}`) as HTMLIFrameElement;
            oldVideoElement.contentWindow?.postMessage('{"event":"command","func":"' + 'pauseVideo' + '","args":""}', '*');
        } else if (isTelegramVideo(oldIndex)) {
            const oldVideoElement = document.getElementById(`video-${oldIndex}`) as HTMLVideoElement;
            oldVideoElement.pause();
            oldVideoElement.currentTime = 0;
        }
    } else {
        emit('update:indexOfColor', newIndex);
    }
};

const showArrows = computed(() => {
    if (isWideScreen.value || isPlatform('tdesktop')) {
        return 'hover';
    } else {
        return false;
    }
});

watch(slideIndex, (newIndex, oldIndex) => {
    onSlideChange(newIndex, oldIndex);
});

// Sizes section
const youtubeContainerWidth = ref<number>(0);
const youtubeContainerHeight = ref<number>(0);


// On mounted actions
onMounted(() => {
    const windowElements = document.getElementsByClassName('v-window__container');
    const lastElementIndex = windowElements.length - 1;
    const youtubeContainer = ref<Element | null>(windowElements[lastElementIndex]);
    youtubeContainerWidth.value = youtubeContainer.value?.clientWidth || 1280;
    youtubeContainerHeight.value = youtubeContainer.value?.clientHeight || 720;
});
</script>

<template>
    <v-carousel
        v-model="slideIndex"
        :hide-delimiters="hideDelimiters"
        :show-arrows="showArrows"
        :style="{height: height}"
        :theme="colorScheme ?? 'light'"
    >
        <v-carousel-item
            v-for="(src, index) in srcs"
            :key="src"
            style="height: 100%"
        >
            <v-img
                v-if="!src.includes('additional_video') && !src.includes('youtube.com') && !src.includes('youtu.be') && !article"
                :id="'img-' + index"
                :src="src"
                height="100%"
                width="100%"
            >
            </v-img>
            <v-img
                v-else-if="!src.includes('additional_video') && !src.includes('youtube.com') && !src.includes('youtu.be') && article"
                :id="'img-' + index"
                :src="src"
                class="clickable"
                height="100%"
                width="100%"
                @click="openArticlePage($router, article)"
            >
            </v-img>
            <div v-else-if="src.includes('additional_video')"
                 class="video-wrapper d-flex align-content-center justify-center">
                <video
                    :id="'video-' + index"
                    :src="src"
                    :style="{ 'max-height': '100%', 'max-width': '100%' }"
                    class="clickable"
                    controls
                ></video>
            </div>
            <div
                v-else-if="src.includes('youtube.com') || src.includes('youtu.be')"
                id="youtube"
                class="video-wrapper d-flex align-content-center justify-center"
            >
                <iframe
                    :id="'video-' + index"
                    :height="youtubeContainerHeight"
                    :src="src"
                    :style="{ 'max-height': '100%', 'max-width': '100%' }"
                    :width="youtubeContainerWidth"
                    class="clickable"
                ></iframe>
            </div>
            <template v-slot:placeholder>
                <TheLoader/>
            </template>
        </v-carousel-item>
    </v-carousel>
</template>

<style scoped>
.video-wrapper {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 100%;
    background-color: black;
}

.clickable {
    cursor: pointer;
}
</style>
