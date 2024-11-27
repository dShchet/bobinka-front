<script lang="ts" setup>
import {AdminArticle, AdminVideoInArticle} from "~/interfaces/admin/article.ts";
import {computed, ref, watch} from "vue";
import {BASE_URL} from "~/config/constants.ts";
import {extractYoutubeVideoId} from "~/utils/common.ts";
import TheCarousel from "~/components/user/TheCarousel.vue";
import {useScreenStore} from "~/stores/screen.ts";
import {storeToRefs} from "pinia";
import {YOUTUBE_URL_REGEX} from "~/utils/regex.ts";
import {addArticleVideos, deleteArticleVideo, deleteArticleVideos, getAdminArticle} from "~/utils/api.ts";
import {convertKeysToCamelCase} from "~/utils/converters.ts";
import {useWebAppTheme} from "vue-tg";

// Common section
const props = defineProps<{
    article: AdminArticle,
}>();

const emit = defineEmits<{
    'update:videos': [value: AdminVideoInArticle[]],
}>();

const {colorScheme, themeParams} = useWebAppTheme();

const localArticle = ref<AdminArticle>(props.article);

watch(() => props.article, async (newVal) => {
    localArticle.value = newVal;
});

const videosItems = computed(() => {
    const items: { id: number, src: string }[] = [];

    localArticle.value?.videos.forEach((video: AdminVideoInArticle) => {
        let src: string;

        if (video.fileId) {
            src = BASE_URL + `/articles/additional_video/${video.fileId}`;
        } else if (video.youtubeUrl) {
            src = `https://www.youtube.com/embed/${extractYoutubeVideoId(video.youtubeUrl)}?enablejsapi=1`;
        } else {
            src = '';
        }

        items.push({
            id: video.id,
            src: src,
        });
    });

    return items;
});

// Stores section
const screenStore = useScreenStore();
const {isWideScreen} = storeToRefs(screenStore);

// Edit mode section
const editMode = ref<boolean>(false);
const inputtedVideos = ref<File[]>();
const inputtedYoutubeItems = ref<{ itemId?: number, url: string }[]>([{url: ''}]);

const newYoutubeUrls = computed(() => inputtedYoutubeItems.value
    .filter(item => !item.itemId)
    .map(item => item.url)
);

const filteredNewYoutubeUrls = computed(() => newYoutubeUrls.value.filter(link => link.trim() !== ''));

const youtubeVideosToRemove = ref<{ itemId?: number, url: string }[]>([]);

const showAddVideosDialog = ref<boolean>(false);

const onEditClick = () => {
    editMode.value = true;
    if (!localArticle.value.videos || localArticle.value.videos.length === 0) {
        return;
    }
    inputtedYoutubeItems.value = localArticle.value.videos.map(video => ({
        itemId: video.id,
        url: video.youtubeUrl as string
    }));
};

const downloadVideo = (src: string) => {
    const link = document.createElement('a');
    link.href = src;
    link.setAttribute('download', src.split('/').pop() + '.mp4' || 'video.mp4');

    link.click();

    URL.revokeObjectURL(src);
};

const deleteVideo = async (videoId: number) => {
    const response = await deleteArticleVideo(videoId);

    if (response.ok) {
        const result = convertKeysToCamelCase(await response.json()) as AdminArticle;
        emit('update:videos', result.videos);
    } else {
        console.error('Failed to delete video', response);
    }
};

const onDeleteAllVideos = async () => {
    const response = await deleteArticleVideos(localArticle.value.id);

    if (response.ok) {
        const result = convertKeysToCamelCase(await response.json()) as AdminArticle;
        const articleResponse = await getAdminArticle(result.id);
        if (!articleResponse.ok) {
            console.error(articleResponse);
        } else {
            const result = convertKeysToCamelCase(await articleResponse.json()) as AdminArticle;
            emit('update:videos', result.videos);
            localArticle.value = result;
        }
    } else {
        console.error('Failed to delete videos', response);
    }
};

const onAddArticleVideos = async () => {
    if (inputtedYoutubeItems.value.length === 1 && !inputtedYoutubeItems.value[0].url) {
        inputtedYoutubeItems.value = [];
    }

    const response = await addArticleVideos({
        articleId: localArticle.value.id,
        videos: inputtedVideos.value,
        videosUrls: filteredNewYoutubeUrls.value,
    });

    if (response.ok) {
        return true;
    } else {
        console.error('Failed to add videos', response);
        return false;
    }
};

const onDeleteArticleVideos = async () => {
    const response = await deleteArticleVideos(localArticle.value.id, youtubeVideosToRemove.value.map(item => item.itemId as number));

    if (response.ok) {
        return true;
    } else {
        console.error('Failed to delete videos', response);
        return false;
    }
};

const onSaveClick = async () => {
    if (filteredNewYoutubeUrls.value.length !== 0 || youtubeVideosToRemove.value.length !== 0) {
        let addedVideosFlag: boolean | undefined = true;
        let removedVideosFlag: boolean | undefined = true;

        if (filteredNewYoutubeUrls.value.length > 0) {
            addedVideosFlag = await onAddArticleVideos();
        }
        if (youtubeVideosToRemove.value.length > 0) {
            removedVideosFlag = await onDeleteArticleVideos();
        }

        if (addedVideosFlag && removedVideosFlag) {
            const articleResponse = await getAdminArticle(localArticle.value.id);
            if (!articleResponse.ok) {
                console.error(articleResponse);
            } else {
                const result = convertKeysToCamelCase(await articleResponse.json()) as AdminArticle;
                emit('update:videos', result.videos);
                localArticle.value = result;
            }
        } else {
            console.error('Failed to save videos');
        }
    }
    editMode.value = false;
    inputtedVideos.value = [];
    inputtedYoutubeItems.value = [{url: ''}];
};

const youtubeUrlRule = [
    (v: string) => !v || YOUTUBE_URL_REGEX.test(v) || 'Введите ссылку на YouTube видео',
];

const addUrlInExistingArray = () => {
    inputtedYoutubeItems.value.push({url: ''});
};

const removeExistingUrl = async (itemId?: number, index?: number) => {
    if (itemId !== undefined) {
        youtubeVideosToRemove.value.push(inputtedYoutubeItems.value.find(item => item.itemId === itemId) as {
            itemId?: number,
            url: string
        });
        inputtedYoutubeItems.value = inputtedYoutubeItems.value.filter(item => item.itemId !== itemId);
    } else if (index !== undefined) {
        inputtedYoutubeItems.value.splice(index, 1);
    }
};

// Add new videos section
const form = ref<boolean>(false);

const onSubmit = () => {
    if (!form.value) {
        return;
    }
};

const onAddVideosDialogClose = () => {
    showAddVideosDialog.value = false;
    inputtedVideos.value = [];
};

const onAddVideosSubmit = async () => {
    await onAddArticleVideos();
};
</script>

<template>
    <div v-if="!editMode">
        <div
            v-if="videosItems.length > 0"
            class="text-center w-100 mb-7"
        >
            <TheCarousel
                :height="isWideScreen ? '400px' : '200px'"
                :srcs="videosItems.map(item => item.src)"
            />
        </div>

        <v-card-text v-else class="text-center">Отсутствуют</v-card-text>

        <v-card-actions>
            <v-btn
                class="w-100"
                size="large"
                @click="onEditClick"
            >
                Редактировать
            </v-btn>
        </v-card-actions>
    </div>

    <div v-else>
        <v-card
            class="d-flex flex-wrap justify-center photos-container"
            variant="flat"
        >
            <div
                v-for="item in videosItems"
                v-if="videosItems && videosItems.length > 0 && !videosItems.some(i => i.src.includes('youtube.com') || i.src.includes('youtu.be'))"
                :key="item.src"
            >
                <div class="video-wrapper d-flex align-content-center justify-center position-relative">
                    <div class="d-flex float-right video-actions position-absolute">
                        <v-chip>
                            Видео
                        </v-chip>
                        <v-btn
                            class="not-primary"
                            color="transparent"
                            icon
                            size="x-small"
                            variant="flat"
                            @click="downloadVideo(item.src)"
                        >
                            <v-icon>mdi-download</v-icon>
                        </v-btn>
                        <v-btn
                            class="not-primary"
                            color="transparent"
                            icon
                            size="x-small"
                            variant="flat"
                            @click="deleteVideo(item.id)"
                        >
                            <v-icon>mdi-close</v-icon>
                        </v-btn>
                    </div>

                    <video
                        :src="item.src"
                        :style="{ 'max-height': '200px', 'max-width': '200px' }"
                    ></video>
                </div>
            </div>

            <v-container
                v-else
                class="links-container"
            >
                <v-row v-for="(item, index) in inputtedYoutubeItems" :key="index">
                    <v-col cols="10">
                        <v-text-field
                            v-model="inputtedYoutubeItems[index].url"
                            :disabled="!newYoutubeUrls.includes(item.url)"
                            :rules="youtubeUrlRule"
                            label="Ссылка на YouTube"
                            outlined
                            prepend-icon="mdi-video"
                        ></v-text-field>
                    </v-col>
                    <v-col cols="2">
                        <v-btn
                            :disabled="inputtedYoutubeItems.length === 1 && inputtedYoutubeItems[0].url === ''"
                            color="error"
                            fab
                            icon
                            size="x-small"
                            @click="removeExistingUrl(item.itemId, index)"
                        >
                            <v-icon class="icon">mdi-close</v-icon>
                        </v-btn>
                    </v-col>
                </v-row>

                <v-btn class="add-link-button" fab icon size="x-small" @click="addUrlInExistingArray">
                    <v-icon class="icon">mdi-plus</v-icon>
                </v-btn>
            </v-container>
        </v-card>

        <v-divider></v-divider>

        <div class="w-100 d-flex flex-column align-center">
            <v-btn
                v-if="videosItems.length > 0"
                class="w-100 my-3 not-primary"
                color="red-accent-4"
                size="large"
                variant="tonal"
                @click="onDeleteAllVideos"
            >
                Удалить все
            </v-btn>

            <v-btn
                v-if="!videosItems.some(item => item.src.includes('youtube.com') || item.src.includes('youtu.be'))"
                class="w-100 mb-3 not-primary"
                color="info"
                size="large"
                variant="tonal"
                @click="showAddVideosDialog = true"
            >
                Добавить
            </v-btn>

            <v-btn
                class="w-100"
                size="large"
                @click="onSaveClick"
            >
                Применить
            </v-btn>
        </div>
    </div>

    <v-dialog
        v-model="showAddVideosDialog"
        max-width="600px"
    >
        <v-card variant="flat">
            <div class="d-flex justify-space-between align-center pr-3">
                <p class="pa-3"><b>Добавление видео</b></p>
                <v-btn
                    :dark="colorScheme === 'light'"
                    class="not-primary align-self-center"
                    color="transparent"
                    icon
                    size="small"
                    variant="flat"
                    @click="onAddVideosDialogClose"
                >
                    <v-icon>mdi-close</v-icon>
                </v-btn>
            </div>

            <v-divider></v-divider>

            <v-card class="pa-5" variant="flat">
                <v-form v-model="form" @submit.prevent="onSubmit">
                    <v-file-input
                        v-model="inputtedVideos"
                        :clearable="true"
                        :multiple="true"
                        accept="video/*"
                        label="Видео артикула"
                        prepend-icon="mdi-video"
                        show-size
                    >
                        <template v-slot:selection="{ fileNames }">
                            <template v-for="fileName in fileNames" :key="fileName">
                                <v-chip
                                    :color="themeParams.button_color ?? 'primary'"
                                    class="me-2"
                                    size="small"
                                >
                                    {{ fileName }}
                                </v-chip>
                            </template>
                        </template>
                    </v-file-input>
                </v-form>
            </v-card>

            <v-divider></v-divider>

            <v-card-actions class="w-100 justify-center">
                <v-btn
                    :disabled="!form"
                    size="large"
                    @click="onAddVideosSubmit"
                >
                    Добавить
                </v-btn>

                <v-btn
                    class="not-primary"
                    color="info"
                    size="large"
                    variant="tonal"
                    @click="onAddVideosDialogClose"
                >
                    Отменить
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<style lang="scss" scoped>
.links-container > *:not(.add-link-button) {
    --gap: 15px;
    margin: calc(var(--gap) / 2) calc(var(--gap) / 2);
}

.video-actions {
    background-color: rgba(255, 255, 255, .75);
    border-radius: 25px;
    transition: all .3s ease-in-out;
}

.video-actions {
    top: 0;
    right: 0;
    z-index: 2000;
}
</style>