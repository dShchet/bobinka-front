<script lang="ts" setup>
import {computed, onMounted, ref, watch} from "vue";
import {FastPreorderDraft} from "~/interfaces/admin/fastPreorders.ts";
import {
    createArticle,
    deleteFastPreorderDraft,
    getArticleTags,
    getFastPreorderDraft,
    getPreorders
} from "~/utils/api.ts";
import {convertKeysToCamelCase} from "~/utils/converters.ts";
import {BASE_URL} from "~/config/constants.ts";
import {useScreenStore} from "~/stores/screen.ts";
import {storeToRefs} from "pinia";
import {BackButton, useWebApp, useWebAppTheme} from "vue-tg";
import router from "~/router";
import {Article} from "~/interfaces/article.ts";
import {ArticleCreateData} from "~/interfaces/admin/article.ts";
import TheAdminNavigation from "~/components/admin/TheAdminNavigation.vue";
import {AdminPreorder} from "~/interfaces/admin/preorder.ts";
import {ArticleTag} from "~/interfaces/articletag.ts";
import TheImageGrid from "~/components/TheImageGrid.vue";
import {createUrl} from "~/utils/common.ts";
import _ from 'lodash';
import {VueDraggable} from "vue-draggable-plus";
import {YOUTUBE_URL_REGEX} from "~/utils/regex.ts";
import {PreorderType} from "~/enums/preorderType.ts";

// Common section
const props = defineProps<{
    fastPreorderId?: string,
}>();

const {isPlatformUnknown} = useWebApp();
const {themeParams, colorScheme} = useWebAppTheme();

const isLoading = ref<boolean>(false);
const isServiceUnavailable = ref<boolean>(false);

const showSubmitDialog = ref<boolean>(false);
const showSuccessDialog = ref<boolean>(false);
const showFailureDialog = ref<boolean>(false);
const form = ref<boolean>(false);

const requiredInputRule = [
    (v: string) => !!v || 'Это поле обязательно к заполнению',
];

const shortRequiredInputRule = [
    (v: string) => !!v || 'Обязательно',
];

const numberRule = [
    (v: string) => /^(\d+([.,]\d*)?|\.\d+)$/.test(v) || 'Введите число',
];

const notRequiredNumberRule = [
    (v: string) => /^$|^(\d+([.,]\d*)?|\.\d+)$/.test(v) || 'Введите число',
];

const onSubmit = () => {
    if (!form.value) {
        return;
    }
    if (!inputtedPhotos.value) {
        return;
    }
};

// Stores section
const screenStore = useScreenStore();
const {isWideScreen} = storeToRefs(screenStore);

// Fast preorder section
const draft = ref<FastPreorderDraft>();
const draftSrcs = ref<string[]>([]);

const onFetchDraft = async () => {
    isLoading.value = true;
    const response = await getFastPreorderDraft(parseInt(props.fastPreorderId as string));
    if (!response.ok) {
        isLoading.value = false;
        isServiceUnavailable.value = true;
        console.error(response);
    } else {
        draft.value = convertKeysToCamelCase(await response.json()) as FastPreorderDraft;
        inputtedComment.value = draft.value?.description !== null ? draft.value?.description : '';
        isLoading.value = false;
    }
};

// Article section
const article = ref<Article | undefined>(undefined);

const onCreateArticle = async () => {
    showSubmitDialog.value = false;
    const response = await createArticle({
        preorderId: selectedPreorderId.value as number,
        name: inputtedName.value,
        structure: inputtedStructure.value,
        footage: inputtedFootage.value,
        priceOpt: inputtedPriceOpt.value.replace(',', '.'),
        priceRetail: inputtedPriceRetail.value.replace(',', '.'),
        priceSale: inputtedPriceSale.value.replace(',', '.'),
        saleName: inputtedSaleName.value,
        quantities: inputtedQuantities.value,
        ttlDelta: ttlDelta.value,
        comment: inputtedComment.value,
        photos: inputtedPhotos.value,
        videos: inputtedVideos.value,
        videosUrls: inputtedYoutubeUrls.value.filter(link => link.trim() !== ''),
        additionalMedia: inputtedAdditionalMedia.value,
        articleTagsIds: selectedTagsIds.value,
        isHot: isHotArticle.value,
        isDistribute: isDistribute.value,
    } as ArticleCreateData);
    if (!response.ok) {
        showFailureDialog.value = true;
    } else {
        if (draft.value) {
            const deleteResponse = await deleteFastPreorderDraft(draft.value?.id as number);
            if (!deleteResponse.ok) {
                showFailureDialog.value = true;
            }
        }
        article.value = convertKeysToCamelCase(await response.json()) as Article;
        showSuccessDialog.value = true;
    }
    setTimeout(async () => {
        await router.push({name: props.fastPreorderId ? 'admin-fast-preorders' : 'admin-articles'});
        location.reload();
    }, 2000);
}

// Comment section
const inputtedComment = ref<string>('');

// Preorder section
const selectedPreorderName = ref<string>();
const selectedPreorderId = ref<number>();
const preorders = ref<AdminPreorder[]>([]);

const onFetchPreorders = async () => {
    const response = await getPreorders();
    if (!response.ok) {
        console.error(response);
    } else {
        preorders.value = convertKeysToCamelCase(await response.json()) as AdminPreorder[];
    }
};

watch(selectedPreorderName, (newVal: string | undefined) => {
    if (!newVal) {
        selectedPreorderId.value = undefined;
        return;
    }
    const selectedPreorder = preorders.value.find(preorder => preorder.name === newVal);
    selectedPreorderId.value = selectedPreorder?.id;

    if (selectedPreorder?.type === PreorderType.IN_STOCK) {
        days.value = 0;
        hours.value = 0;
        minutes.value = 0;
    }
});

// Name section
const inputtedName = ref<string>('');

// Price opt section
const inputtedPriceOpt = ref<string>('');

// Price retail section
const inputtedPriceRetail = ref<string>('');

// Sale section
const inputtedPriceSale = ref<string>('');
const inputtedSaleName = ref<string>('');

watch(inputtedPriceSale, (newVal: string) => {
    if (!newVal) {
        inputtedSaleName.value = '';
    } else {
        inputtedSaleName.value = 'Скидка';
    }
});

// Structure section
const inputtedStructure = ref<string>('');

// Footage section
const inputtedFootage = ref<string>('');

// Quantity section
const inputtedQuantities = ref<number[]>([]);

// Time delta section
const days = ref(0);
const hours = ref(0);
const minutes = ref(props.fastPreorderId ? 10 : 0);

const blockTtlFlag = computed(() => {
    return preorders.value.find(preorder => preorder.name === selectedPreorderName.value)?.type === PreorderType.IN_STOCK;
});

const deltaResult = ref('');

const ttlDelta = computed(() => {
    return (days.value * 24 * 60 * 60) + (hours.value * 60 * 60) + (minutes.value * 60);
});

watch(days, (newVal: number) => {
    if (newVal > 31) {
        days.value = 31;
    } else if (newVal < 0) {
        days.value = 0;
    } else if (!newVal) {
        days.value = 0;
    }
});

watch(hours, (newVal: number) => {
    if (newVal > 24) {
        hours.value = 24;
    } else if (newVal < 0) {
        hours.value = 0;
    } else if (!newVal) {
        hours.value = 0;
    }
});

watch(minutes, (newVal: number) => {
    if (newVal > 60) {
        minutes.value = 60;
    } else if (newVal < 0) {
        minutes.value = 0;
    } else if (!newVal) {
        minutes.value = 0;
    }
});

const formattedExpirationDate = computed(() => {
    const currentDate = new Date();

    currentDate.setDate(currentDate.getDate() + days.value);
    currentDate.setHours(currentDate.getHours() + hours.value);
    currentDate.setMinutes(currentDate.getMinutes() + minutes.value);

    return currentDate.toLocaleString('ru-RU', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
});

// Photos section
const inputtedPhotos = ref<File[]>();
const fetchedDraftPhotos = ref<File[]>();

const removePhoto = (index: number) => {
    inputtedPhotos.value?.splice(index, 1);
    inputtedQuantities.value?.splice(index, 1);
};

const shortenedPhotosNames = computed(() => {
    if (!inputtedPhotos.value) {
        return '';
    }
    const shortenedPhotosNamesArray = inputtedPhotos.value.map(photo => {
        const photoName = photo.name;
        if (photoName.length > 23) {
            const splittedFilename = photoName.split('.');
            const name = splittedFilename[0];
            const extension = splittedFilename[splittedFilename.length - 1];

            const shortenedName = name.slice(0, 18);
            return `${shortenedName}...${extension}`;
        }
        return photoName;
    });

    return shortenedPhotosNamesArray.join('; \n');
});

const useAllDraftPhotos = () => {
    inputtedPhotos.value = _.cloneDeep(fetchedDraftPhotos.value);
};

watch(inputtedPhotos, (newVal: any) => {
    if (props.fastPreorderId) {
        inputtedQuantities.value = newVal.map(() => 6);
    } else {
        inputtedQuantities.value = newVal.map(() => 1);
    }
});

// Videos section
// Files
const inputtedVideos = ref<File[]>();

const shortenedVideosNames = computed(() => {
    if (!inputtedVideos.value) {
        return '';
    }
    const shortenedVideosNamesArray = inputtedVideos.value.map(video => {
        const videoName = video.name;
        if (videoName.length > 23) {
            const splittedFilename = videoName.split('.');
            const name = splittedFilename[0];
            const extension = splittedFilename[splittedFilename.length - 1];

            const shortenedName = name.slice(0, 18);
            return `${shortenedName}...${extension}`;
        }
        return videoName;
    });

    return shortenedVideosNamesArray.join('; \n');
});
// Youtube urls
const inputtedYoutubeUrls = ref<string[]>(['']);

const addUrl = () => {
    inputtedYoutubeUrls.value.push('');
};

const removeUrl = (index: number) => {
    inputtedYoutubeUrls.value.splice(index, 1);
};

const youtubeUrlRule = [
    (v: string) => !v || YOUTUBE_URL_REGEX.test(v) || 'Введите ссылку на YouTube видео',
];

// Additional media section
const inputtedAdditionalMedia = ref<File[]>();

const shortenedAdditionalMediaNames = computed(() => {
    if (!inputtedAdditionalMedia.value) {
        return '';
    }
    const shortenedAdditionalMediaNamesArray = inputtedAdditionalMedia.value.map(media => {
        const mediaName = media.name;
        if (mediaName.length > 23) {
            const splittedFilename = mediaName.split('.');
            const name = splittedFilename[0];
            const extension = splittedFilename[splittedFilename.length - 1];

            const shortenedName = name.slice(0, 18);
            return `${shortenedName}...${extension}`;
        }
        return mediaName;
    });

    return shortenedAdditionalMediaNamesArray.join('; \n');
});

// Tags section
const selectedTagsNames = ref<string[]>([]);
const selectedTagsIds = ref<number[]>([]);
const tags = ref<ArticleTag[]>([]);

const onFetchTags = async () => {
    const response = await getArticleTags();
    if (!response.ok) {
        console.error(response);
    } else {
        tags.value = convertKeysToCamelCase(await response.json()) as ArticleTag[];
    }
};

watch(selectedTagsNames, (newVal: string[]) => {
    selectedTagsIds.value = [];
    newVal.forEach((name: string) => {
        const selectedTag = tags.value.find(tag => tag.name === name);
        selectedTagsIds.value.push(selectedTag?.id as number);
    });
});

// Is hot article section
const isHotArticle = ref<boolean>(!!props.fastPreorderId);

// Distribute section
const isDistribute = ref<boolean>(true);

// Telegram section
const handleTgBackButton = () => {
    router.go(-1);
};

// On mounted actions
onMounted(async () => {
    if (props.fastPreorderId) {
        await onFetchDraft();
        draftSrcs.value = draft.value?.media.map(media => {
            return BASE_URL + `/articles/additional_photo/${media.fileId}`;
        }) as string[];
    }
    await onFetchPreorders();
    await onFetchTags();
});
</script>

<template>
    <TheAdminNavigation/>
    <BackButton
        v-if="!isPlatformUnknown"
        @click="handleTgBackButton"
    ></BackButton>
    <v-card
        v-if="fastPreorderId && draft || !fastPreorderId && !draft"
        class="mt-15 d-flex flex-column pa-5"
    >
        <div v-if="draft" class="my-3">
            <TheImageGrid
                v-if="draftSrcs.length > 0"
                :height-px="300"
                :srcs="draftSrcs"
                download
                @fetched="fetchedDraftPhotos = $event"
            />
            <v-btn @click="useAllDraftPhotos">
                Использовать все фото
            </v-btn>
            <v-card-title class="pa-0 ma-0"><b>Предоставленное описание:</b></v-card-title>
            <v-card-text class="pa-0 ma-0 mb-2">{{ draft?.description }}</v-card-text>
        </div>

        <v-form v-model="form" @submit.prevent="onSubmit">
            <v-autocomplete
                v-model="selectedPreorderName"
                :class="{'mb-3': !selectedPreorderName}"
                :clearable="true"
                :color="themeParams.button_color ?? 'primary'"
                :items="preorders.map(preorder => preorder.name)"
                :rules="requiredInputRule"
                :theme="colorScheme"
                label="Предзаказ"
            ></v-autocomplete>

            <v-text-field
                v-model="inputtedName"
                :clearable="true"
                :rules="requiredInputRule"
                class="mb-3"
                label="Наименование *"
            ></v-text-field>

            <v-text-field
                v-model="inputtedPriceOpt"
                :clearable="true"
                :rules="[...requiredInputRule, ...numberRule]"
                class="mb-3"
                inputmode="numeric"
                label="Оптовая цена *"
            ></v-text-field>

            <v-text-field
                v-model="inputtedPriceRetail"
                :clearable="true"
                :rules="[...requiredInputRule, ...numberRule]"
                class="mb-3"
                inputmode="numeric"
                label="Розничная цена *"
            ></v-text-field>

            <v-text-field
                v-model="inputtedPriceSale"
                :clearable="true"
                :rules="[...notRequiredNumberRule]"
                class="mb-3"
                hint="Необязательно"
                inputmode="numeric"
                label="Цена по скидке"
                persistent-hint
            ></v-text-field>

            <v-fade-transition>
                <v-text-field
                    v-if="inputtedPriceSale"
                    v-model="inputtedSaleName"
                    :clearable="true"
                    :rules="[...requiredInputRule]"
                    class="mb-3"
                    label="Название скидки"
                ></v-text-field>
            </v-fade-transition>

            <v-text-field
                v-model="inputtedStructure"
                :clearable="true"
                :rules="requiredInputRule"
                class="mb-3"
                label="Состав *"
            ></v-text-field>

            <v-text-field
                v-model="inputtedFootage"
                :clearable="true"
                :rules="requiredInputRule"
                class="mb-3"
                label="Метраж *"
            ></v-text-field>

            <v-text-field
                v-model="inputtedComment"
                :clearable="true"
                class="mb-3"
                hint="Необязательно"
                label="Комментарий"
                persistent-hint
            ></v-text-field>

            <h4 class="pa-1 mb-5">Время, через которое артикул будет неактивен</h4>
            <v-slider
                v-model="days"
                :disabled="blockTtlFlag"
                :max="31"
                :tick-size="isWideScreen ? 4 : 1"
                label="Дни"
                show-ticks="always"
                step="1"
                thumb-label="always"
            >
                <template v-slot:append>
                    <v-text-field
                        v-model="days"
                        :disabled="blockTtlFlag"
                        density="compact"
                        hide-details
                        single-line
                        style="width: 70px"
                        type="number"
                    ></v-text-field>
                </template>
            </v-slider>
            <v-slider
                v-model="hours"
                :disabled="blockTtlFlag"
                :max="24"
                :tick-size="isWideScreen ? 4 : 1"
                label="Часы"
                show-ticks="always"
                step="1"
                thumb-label="always"
            >
                <template v-slot:append>
                    <v-text-field
                        v-model="hours"
                        :disabled="blockTtlFlag"
                        density="compact"
                        hide-details
                        single-line
                        style="width: 70px"
                        type="number"
                    ></v-text-field>
                </template>
            </v-slider>
            <v-slider
                v-model="minutes"
                :disabled="blockTtlFlag"
                :max="60"
                :tick-size="isWideScreen ? 4 : 1"
                label="Минуты"
                show-ticks="always"
                step="1"
                thumb-label="always"
            >
                <template v-slot:append>
                    <v-text-field
                        v-model="minutes"
                        :disabled="blockTtlFlag"
                        density="compact"
                        single-line
                        style="width: 70px"
                        type="number"
                    ></v-text-field>
                </template>
            </v-slider>
            <div v-if="deltaResult" class="my-3">{{ deltaResult }}</div>

            <v-file-input
                v-model="inputtedPhotos"
                :clearable="true"
                :error="!inputtedPhotos || inputtedPhotos.length === 0"
                :multiple="true"
                accept="image/*"
                label="Фото артикула *"
                prepend-icon="mdi-camera"
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
            <div v-if="inputtedPhotos && inputtedPhotos.length > 0">
                <h4 class="pa-1">Введите количество бобин каждого цвета</h4>
                <VueDraggable
                    v-model="inputtedPhotos"
                    :animation="150"
                    class="d-flex flex-wrap justify-center photos-container"
                    filter=".bobbin-input"
                    ghostClass="ghost"
                >
                    <div v-for="(photo, index) in inputtedPhotos" class="d-flex flex-column">
                        <v-img
                            :key="photo.name"
                            :src="createUrl(photo)"
                            max-height="100px"
                        >
                            <v-btn
                                class="float-right not-primary"
                                color="transparent"
                                icon
                                size="x-small"
                                variant="flat"
                                @click="removePhoto(index)"
                            >
                                <v-icon>mdi-close</v-icon>
                            </v-btn>
                        </v-img>
                        <v-text-field
                            v-model="inputtedQuantities[index]"
                            :rules="[...shortRequiredInputRule, ...numberRule]"
                            class="bobbin-input"
                            density="compact"
                            inputmode="numeric"
                            label="*"
                            persistent-hint
                            single-line
                            type="number"
                        ></v-text-field>
                    </div>
                </VueDraggable>
            </div>

            <div v-if="!fastPreorderId">
                <div class="d-flex flex-column">
                    <h4 class="pa-1">Либо загрузите видео, либо введите ссылки на YouTube видео</h4>
                    <v-file-input
                        v-if="inputtedYoutubeUrls.length === 1 && inputtedYoutubeUrls[0] === ''"
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
                    <v-container v-if="inputtedVideos === undefined || inputtedVideos?.length === 0">
                        <VueDraggable
                            v-model="inputtedYoutubeUrls"
                            :animation="150"
                            class="links-container"
                            ghostClass="ghost"
                        >

                            <!--suppress JSUnusedLocalSymbols -->
                            <v-row v-for="(link, index) in inputtedYoutubeUrls" :key="index">
                                <v-col cols="10">
                                    <v-text-field
                                        v-model="inputtedYoutubeUrls[index]"
                                        :rules="youtubeUrlRule"
                                        label="Ссылка на YouTube"
                                        outlined
                                        prepend-icon="mdi-video"
                                    ></v-text-field>
                                </v-col>
                                <v-col cols="2">
                                    <v-btn
                                        v-if="inputtedYoutubeUrls.length > 1"
                                        color="error"
                                        fab
                                        icon
                                        size="x-small"
                                        @click="removeUrl(index)"
                                    >
                                        <v-icon class="icon">mdi-close</v-icon>
                                    </v-btn>
                                </v-col>
                            </v-row>
                        </VueDraggable>
                        <v-btn class="add-link-button" fab icon size="x-small" @click="addUrl">
                            <v-icon class="icon">mdi-plus</v-icon>
                        </v-btn>
                    </v-container>
                </div>

                <v-file-input
                    v-model="inputtedAdditionalMedia"
                    :clearable="true"
                    :multiple="true"
                    accept="image/*,video/*"
                    label="Дополнительные фото и видео артикула"
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
            </div>

            <v-autocomplete
                v-model="selectedTagsNames"
                :clearable="true"
                :color="themeParams.button_color ?? 'primary'"
                :items="tags.map(tag => tag.name)"
                :multiple="true"
                :theme="colorScheme"
                label="Теги"
            ></v-autocomplete>

            <v-checkbox
                v-model="isHotArticle"
                :color="themeParams.button_color ?? 'primary'"
                label="Горячий артикул"
            ></v-checkbox>

            <v-checkbox
                v-model="isDistribute"
                :color="themeParams.button_color ?? 'primary'"
                label="Разослать артикул"
            ></v-checkbox>

            <v-dialog
                v-model="showSubmitDialog"
                max-width="fit-content"
            >
                <template v-slot:activator="{ props }">
                    <v-btn
                        :block="true"
                        :color="themeParams.button_color ?? 'primary'"
                        :disabled="!form"
                        class="not-primary"
                        size="large"
                        v-bind="props"
                        variant="tonal"
                    >
                        Подтвердить
                    </v-btn>
                </template>
                <v-card class="text-center mx-auto" max-width="800px">
                    <div class="d-flex justify-space-between pr-3 mt-2">
                        <v-card-title><b>Все верно?</b></v-card-title>
                        <v-btn
                            :dark="colorScheme === 'light'"
                            class="not-primary align-self-center"
                            color="transparent"
                            icon
                            size="small"
                            variant="flat"
                            @click="showSubmitDialog = false"
                        >
                            <v-icon>mdi-close</v-icon>
                        </v-btn>
                    </div>

                    <v-card-text class="text-start">
                        <b>Наименование:</b> {{ inputtedName }}<br>
                        <b>Оптовая цена:</b> {{ inputtedPriceOpt }}<br>
                        <b>Розничная цена:</b> {{ inputtedPriceRetail }}<br>
                        <b>Состав:</b> {{ inputtedStructure }}<br>
                        <b>Метраж:</b> {{ inputtedFootage }}<br>
                        <b>Количество бобин:</b> {{ inputtedQuantities.join(', ') }}<br>
                        <br>
                        <span v-if="inputtedComment"><b>Комментарий:</b> {{ inputtedComment }}<br></span>
                        <b>Действует до:</b> {{ formattedExpirationDate }}<br>
                        <br>
                        <b>Фото:</b> {{ shortenedPhotosNames }}<br>
                        <span v-if="inputtedVideos ? inputtedVideos.length > 0 : false">
                            <b>Видео:</b> {{ shortenedVideosNames }}<br>
                        </span>
                        <span v-if="inputtedAdditionalMedia ? inputtedAdditionalMedia.length > 0 : false">
                            <b>Информационные медиа:</b>{{ shortenedAdditionalMediaNames }}<br>
                        </span>
                        <br>
                        <b>Теги:</b> {{ selectedTagsNames.join(', ') }}<br>
                        <b>Горячий артикул:</b> {{ isHotArticle ? 'Да' : 'Нет' }}<br>
                        <b>Разослать артикул:</b> {{ isDistribute ? 'Да' : 'Нет' }}<br>
                    </v-card-text>
                    <v-card-actions class="mx-auto mb-3">
                        <v-btn class="not-primary" color="blue" variant="tonal" @click="showSubmitDialog = false;">
                            Изменить
                        </v-btn>
                        <v-btn class="not-primary" color="green" variant="elevated" @click="onCreateArticle">
                            Создать
                        </v-btn>
                    </v-card-actions>
                </v-card>
            </v-dialog>

            <v-dialog
                v-model="showSuccessDialog"
                max-width="fit-content"
            >
                <v-alert
                    class="multi-line"
                    title="Заказ успешно оформлен!"
                    type="success"
                >
                    Артикул {{ article?.id }} успешно создан!<br>
                    Сейчас Вы будете перенаправлены на страницу с
                    {{ fastPreorderId ? ' быстрыми предзаказами' : ' артикулами' }}...
                </v-alert>
            </v-dialog>
            <v-dialog
                v-model="showFailureDialog"
                max-width="fit-content"
            >
                <v-alert
                    title="Что-то пошло не так! Попробуйте еще раз"
                    type="error"
                >
                    Сейчас Вы будете перенаправлены на страницу с
                    {{ fastPreorderId ? ' быстрыми предзаказами' : ' артикулами' }}...
                </v-alert>
            </v-dialog>
        </v-form>
    </v-card>
</template>

<style lang="scss" scoped>
.default-text {
    text-decoration: none;
    color: var(--tg-theme-text-color, rgb(var(--v-theme-text-base)));
}

.v-card, .v-card *:not(a, .icon) {
    background-color: var(--tg-theme-bg-color, rgb(var(--v-theme-background)));
    color: var(--tg-theme-text-color, rgb(var(--v-theme-text-base)));
}

.photos-container > *, .links-container > *:not(.add-link-button) {
    --gap: 15px;
    margin: calc(var(--gap) / 2) calc(var(--gap) / 2);
    cursor: move;
}
</style>
