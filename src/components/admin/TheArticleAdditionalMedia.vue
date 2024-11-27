<script lang="ts" setup>
import TheCarousel from "~/components/user/TheCarousel.vue";
import {AdminAdditionalMediaInArticle, AdminArticle} from "~/interfaces/admin/article.ts";
import {useScreenStore} from "~/stores/screen.ts";
import {storeToRefs} from "pinia";
import {computed, onMounted, ref, watch} from "vue";
import {BASE_URL} from "~/config/constants.ts";
import {createUrl} from "~/utils/common.ts";
import {MediaType} from "~/enums/mediaType.ts";
import {convertKeysToCamelCase} from "~/utils/converters.ts";
import {
    addArticleAdditionalMedia,
    deleteArticleAdditionalMedia,
    deleteArticleAdditionalMediaItem,
    getAdminArticle,
} from "~/utils/api.ts";
import {useWebAppTheme} from "vue-tg";

// Common section
const props = defineProps<{
    article: AdminArticle,
}>();

const emit = defineEmits<{
    'update:additionalMedia': [value: AdminAdditionalMediaInArticle[]],
}>();

const {colorScheme, themeParams} = useWebAppTheme();

const localArticle = ref<AdminArticle>(props.article);

const articleAdditionalMedia = computed<AdminAdditionalMediaInArticle[]>(() =>
    localArticle.value.additionalMedia
);

const additionalMediaFiles = ref<{ id: number, file: File, fileType: MediaType }[]>([]);

const additionalMediaSrcs = computed(() => {
    const srcs: string[] = [];
    additionalMediaFiles.value.forEach((item: { id: number, file: File, fileType: MediaType }) => {
        if (item.fileType === MediaType.PHOTO) {
            srcs.push(createUrl(item.file));
        } else if (item.fileType === MediaType.VIDEO) {
            srcs.push(BASE_URL + `/articles/additional_video/${item.file.name.split('.').shift()}`)
        }
    });
    return srcs;
});

watch(() => props.article, async (newVal) => {
    localArticle.value = newVal;
    additionalMediaFiles.value = await fetchAdditionalMedia();
});

// Stores section
const screenStore = useScreenStore();
const {isWideScreen} = storeToRefs(screenStore);

const fetchAdditionalMedia = async () => {
    const files: { id: number, file: File, fileType: MediaType }[] = [];
    const filesInfo: { id: number, src: string, fileType: MediaType }[] = articleAdditionalMedia.value.map(
        (media: AdminAdditionalMediaInArticle) => {
            if (media.fileType === MediaType.VIDEO && media.telegramFileId) {
                return {
                    id: media.id,
                    src: BASE_URL + `/articles/additional_video/${media.telegramFileId}`,
                    fileType: media.fileType
                };
            }
            return {
                id: media.id,
                src: BASE_URL + `/articles/additional_photo/${media.telegramFileId}`,
                fileType: media.fileType
            };
        }
    );

    try {
        await Promise.all(filesInfo.map(async (item: { id: number, src: string, fileType: MediaType }) => {
            const response = await fetch(item.src);
            if (response.ok) {
                const blob = await response.blob();
                if (item.fileType === MediaType.VIDEO) {
                    const file = new File([blob], `${item.src.split('/').pop()}.mp4` as string);
                    files.push({id: item.id, file, fileType: item.fileType});
                } else if (item.fileType === MediaType.PHOTO) {
                    const file = new File([blob], `${item.src.split('/').pop()}.png` as string);
                    files.push({id: item.id, file: file, fileType: item.fileType});
                }
            }
        }));
    } catch (error) {
        console.error("Error while loading additional media:", error);
    }
    return files;
}

// Edit mode section
const editMode = ref<boolean>(false);

const onEditClick = () => {
    editMode.value = true;
};

const onDeleteAllMedia = async () => {
    const response = await deleteArticleAdditionalMedia(localArticle.value.id);
    if (!response.ok) {
        console.error(response);
    } else {
        additionalMediaFiles.value = [];
        emit('update:additionalMedia', []);
    }
};

const onSaveClick = () => {
    editMode.value = false;
    inputtedMediaFiles.value = [];
};

const deleteMediaItem = async (additionalMediaItemId: number) => {
    const response = await deleteArticleAdditionalMediaItem(additionalMediaItemId);

    if (response.ok) {
        const result = convertKeysToCamelCase(await response.json()) as AdminArticle;
        additionalMediaFiles.value.filter(item => item.id !== additionalMediaItemId);
        emit('update:additionalMedia', result.additionalMedia);
    } else {
        console.error('Failed to delete media', response);
    }
};

const downloadMediaItem = (media: File) => {
    const url = URL.createObjectURL(media);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', media.name || 'media');

    link.click();

    URL.revokeObjectURL(url);
};

// Add photo dialog section
const showAddMediaDialog = ref<boolean>(false);
const inputtedMediaFiles = ref<File[]>([]);

const form = ref<boolean>(false);

const onSubmit = () => {
    if (!form.value) {
        return;
    }
};

const onAddMediaDialogClose = () => {
    showAddMediaDialog.value = false;
    inputtedMediaFiles.value = [];
};

const onAddMediaSubmit = async () => {
    const response = await addArticleAdditionalMedia(localArticle.value.id, inputtedMediaFiles.value);
    if (response.ok) {
        const result = convertKeysToCamelCase(await response.json()) as AdminArticle;
        const articleResponse = await getAdminArticle(result.id);
        if (!articleResponse.ok) {
            console.error(articleResponse);
        } else {
            const result = convertKeysToCamelCase(await articleResponse.json()) as AdminArticle;
            emit('update:additionalMedia', result.additionalMedia);
            localArticle.value = result;
            additionalMediaFiles.value = await fetchAdditionalMedia();
            onAddMediaDialogClose();
        }
    } else {
        console.error('Failed to add photos', response);
    }
};

// On mounted actions
onMounted(async () => {
    additionalMediaFiles.value = await fetchAdditionalMedia();
});
</script>

<template>
    <v-expand-transition>
        <div v-if="!editMode">
            <div v-if="articleAdditionalMedia.length > 0" class="text-center">
                <TheCarousel
                    :height="isWideScreen ? '400px' : '200px'"
                    :srcs="additionalMediaSrcs"
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
                v-if="additionalMediaFiles && additionalMediaFiles.length > 0"
                class="d-flex flex-wrap justify-center photos-container"
                variant="flat"
            >
                <div
                    v-for="item in additionalMediaFiles"
                    :key="item.id"
                >
                    <v-img
                        v-if="item.fileType === MediaType.PHOTO"
                        :src="createUrl(item.file)"
                        max-height="200px"
                    >
                        <div class="d-flex float-right photo-actions">
                            <v-btn
                                class="not-primary"
                                color="transparent"
                                icon
                                size="x-small"
                                variant="flat"
                                @click="downloadMediaItem(item.file)"
                            >
                                <v-icon>mdi-download</v-icon>
                            </v-btn>
                            <v-btn
                                class="not-primary"
                                color="transparent"
                                icon
                                size="x-small"
                                variant="flat"
                                @click="deleteMediaItem(item.id)"
                            >
                                <v-icon>mdi-close</v-icon>
                            </v-btn>
                        </div>
                    </v-img>
                    <div
                        v-else-if="item.fileType === MediaType.VIDEO"
                        class="video-wrapper d-flex align-content-center justify-center position-relative"
                    >
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
                                @click="downloadMediaItem(item.file)"
                            >
                                <v-icon>mdi-download</v-icon>
                            </v-btn>
                            <v-btn
                                class="not-primary"
                                color="transparent"
                                icon
                                size="x-small"
                                variant="flat"
                                @click="deleteMediaItem(item.id)"
                            >
                                <v-icon>mdi-close</v-icon>
                            </v-btn>
                        </div>
                        <video
                            :src="createUrl(item.file)"
                            :style="{ 'max-height': '300px', 'max-width': '300px' }"
                        ></video>
                    </div>
                </div>
            </v-card>

            <v-divider></v-divider>

            <div class="w-100 d-flex flex-column align-center">
                <v-btn
                    v-if="additionalMediaFiles.length > 0"
                    class="w-100 my-3 not-primary"
                    color="red-accent-4"
                    size="large"
                    variant="tonal"
                    @click="onDeleteAllMedia"
                >
                    Удалить все
                </v-btn>

                <v-btn
                    class="w-100 mb-3 not-primary"
                    color="info"
                    size="large"
                    variant="tonal"
                    @click="showAddMediaDialog = true"
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
    </v-expand-transition>

    <v-dialog
        v-model="showAddMediaDialog"
        max-width="600px"
    >
        <v-card variant="flat">
            <div class="d-flex justify-space-between align-center pr-3">
                <p class="pa-3"><b>Добавление медиа</b></p>
                <v-btn
                    :dark="colorScheme === 'light'"
                    class="not-primary align-self-center"
                    color="transparent"
                    icon
                    size="small"
                    variant="flat"
                    @click="onAddMediaDialogClose"
                >
                    <v-icon>mdi-close</v-icon>
                </v-btn>
            </div>

            <v-divider></v-divider>

            <v-card class="pa-5" variant="flat">
                <v-form v-model="form" @submit.prevent="onSubmit">
                    <v-file-input
                        v-model="inputtedMediaFiles"
                        :clearable="true"
                        :error="!inputtedMediaFiles || inputtedMediaFiles.length === 0"
                        :multiple="true"
                        accept="image/*,video/*"
                        label="Дополнительные медиа"
                        prepend-icon="mdi-camera-enhance"
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
                    @click="onAddMediaSubmit"
                >
                    Загрузить
                </v-btn>

                <v-btn
                    class="not-primary"
                    color="info"
                    size="large"
                    variant="tonal"
                    @click="onAddMediaDialogClose"
                >
                    Отменить
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<style lang="scss" scoped>
.photos-container {
    width: 100%;
}

.photos-container > * {
    --gap: 15px;
    margin: calc(var(--gap) / 2) calc(var(--gap) / 2);
}

.photo-actions, .video-actions {
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