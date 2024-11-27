<script lang="ts" setup>
import {BASE_URL} from "~/config/constants.ts";
import {useScreenStore} from "~/stores/screen.ts";
import {storeToRefs} from "pinia";
import {AdminArticle} from "~/interfaces/admin/article.ts";
import {type FastPreorderDraft} from "~/interfaces/admin/fastPreorders.ts";
import {computed, onBeforeUnmount, onMounted, ref} from "vue";
import TheImageGrid from "~/components/TheImageGrid.vue";
import {timeDifferenceWithNow} from "~/utils/time.ts";

// Common section
const props = defineProps<{
    article: AdminArticle | FastPreorderDraft,
    isDraft: boolean;
}>();

const imageSrcs = ref<string[]>([]);

if (props.isDraft) {
    (props.article as FastPreorderDraft).media.forEach((media) => {
        imageSrcs.value.push(BASE_URL + `/articles/additional_photo/${media.fileId}`);
    });
} else {
    (props.article as AdminArticle).colors.forEach((color) => {
        imageSrcs.value.push(BASE_URL + `/articles/colors/photo/${color.id}`);
    });
}

// Stores section
const screenStore = useScreenStore();
const {isWideScreen} = storeToRefs(screenStore);

// Timer section
const days = ref<number>(0);
const hours = ref<number>(0);
const minutes = ref<number>(0);
const seconds = ref<number>(0);
const timer = ref<any>(null);
const timeLeft = ref<string>('');

const articleExpiredAt = computed(() => props.article.expiredAt ? new Date(props.article.expiredAt as Date).getTime() : Infinity);

const updateTimer = () => {
    const difference = timeDifferenceWithNow(articleExpiredAt.value);

    if (difference <= 0) {
        clearInterval(timer.value);
        timeLeft.value = 'Время действия истекло';
    } else {
        days.value = Math.floor(difference / (1000 * 60 * 60 * 24));
        hours.value = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        minutes.value = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        seconds.value = Math.floor((difference % (1000 * 60)) / 1000);
        timeLeft.value = '';
        if (days.value > 0) {
            timeLeft.value = `${days.value} дн., `;
        }
        timeLeft.value += `${hours.value.toString().padStart(2, "0")}:${minutes.value.toString().padStart(2, "0")}:${seconds.value.toString().padStart(2, "0")}`
    }
};

// On mounted actions
onMounted(async () => {
    if (!props.article.expiredAt) {
        return;
    }
    updateTimer();
    timer.value = setInterval(updateTimer, 1000);
});

// On unmounted actions
onBeforeUnmount(() => {
    if (timer.value) {
        clearInterval(timer.value);
    }
});
</script>

<template>
    <v-list-item>
        <div class="d-flex justify-space-between float-left w-100">
            <div v-if="article.expiredAt" class="on-image-markers">
                <v-chip
                    :color="days === 0 && hours === 0 && minutes < 5 ? 'red' : ''"
                    class="timer" density="comfortable"
                    size="x-large"
                    variant="elevated"
                >
                    <b>{{ timeLeft }}</b>
                    <v-icon v-if="days === 0 && hours === 0 && minutes < 5" :end="true"
                            icon="mdi-clock-alert"></v-icon>
                    <v-icon v-else :end="true" icon="mdi-clock"></v-icon>
                </v-chip>
            </div>

            <div>
                <TheImageGrid
                    v-if="imageSrcs.length > 0"
                    :height-px="isWideScreen ? 200 : 100"
                    :srcs="imageSrcs"
                />
            </div>

            <v-card class="ml-1 align-self-center" variant="flat">
                <v-card-text v-if="isDraft">{{ (article as FastPreorderDraft).description }}</v-card-text>
                <v-card-text v-else>{{
                        `ID ${(article as AdminArticle).id}. ${(article as AdminArticle).name}`
                    }}
                </v-card-text>
            </v-card>
        </div>
    </v-list-item>
</template>

<style lang="scss" scoped>
.v-list-item, .v-list-item *:not(.v-chip__content *, .on-image-markers *) {
    background-color: var(--tg-theme-secondary-bg-color, rgb(var(--v-theme-background)));
    color: var(--tg-theme-text-color, rgb(var(--v-theme-text-base)));
}

.on-image-markers {
    position: absolute;
    top: 1%;
    right: 1%;
    z-index: 1001;
}

.timer {
    opacity: 0.85;
    user-select: none;
}
</style>
