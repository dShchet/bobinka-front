<script lang="ts" setup>
import TheAdminNavigation from "~/components/admin/TheAdminNavigation.vue";
import {BackButton, useWebApp, useWebAppTheme} from "vue-tg";
import {useRouter} from "vue-router";
import TheImageGrid from "~/components/TheImageGrid.vue";
import {computed, onMounted, ref, watch} from "vue";
import {AdminAdditionalMediaInArticle, AdminArticle, AdminVideoInArticle} from "~/interfaces/admin/article.ts";
import {convertArticleDatesFromApi, convertKeysToCamelCase} from "~/utils/converters.ts";
import {
    activateArticle,
    activateColor,
    deactivateArticle,
    deactivateColor,
    deleteColor,
    getAdminArticle,
    getArticleOrdersCount,
} from "~/utils/api.ts";
import {useScreenStore} from "~/stores/screen.ts";
import {storeToRefs} from "pinia";
import {BASE_URL} from "~/config/constants.ts";
import TheArticleInfoCard from "~/components/admin/TheArticleInfoCard.vue";
import TheColorsPanels from "~/components/admin/TheColorsPanels.vue";
import {ArticleStatus, ColorStatus} from "~/enums/statuses.ts";
import {AdminColorInArticle} from "~/interfaces/admin/color.ts";
import TheArticleAdditionalMedia from "~/components/admin/TheArticleAdditionalMedia.vue";
import TheArticleVideos from "~/components/admin/TheArticleVideos.vue";

// Common section
const props = defineProps<{
    id: string,
}>();

const {isPlatformUnknown} = useWebApp();
const {themeParams} = useWebAppTheme();

const router = useRouter();

const isLoading = ref(false);
const isServiceUnavailable = ref(false);

// Stores section
const screenStore = useScreenStore();
const {isWideScreen} = storeToRefs(screenStore);

// Article section
const article = ref<AdminArticle | undefined>(undefined);
const ordersCount = ref<number>();

const onFetchArticle = async () => {
    isLoading.value = true;
    const response = await getAdminArticle(parseInt(props.id));
    if (!response.ok) {
        isLoading.value = false;
        isServiceUnavailable.value = true;
        console.error(response);
    } else {
        article.value = convertKeysToCamelCase(await response.json()) as AdminArticle;
        if (article.value) {
            convertArticleDatesFromApi(article.value)
        }

        article.value.colors.sort((a, b) => a.numInArticle - b.numInArticle);
        article.value.colors.forEach((color) => {
            color.bobbins.sort((a, b) => a.id - b.id);
        });

        localExpiredAt.value = article.value?.expiredAt ?? undefined;
        localAdditionalMedia.value = article.value?.additionalMedia ?? [];
        localVideos.value = article.value?.videos ?? [];
        isLoading.value = false;
    }
};

const onFetchArticleOrdersCount = async () => {
    const response = await getArticleOrdersCount(parseInt(props.id));
    if (!response.ok) {
        console.error(response);
    } else {
        ordersCount.value = await response.json() as number;
    }
};

const colorsSrcs = computed(() => {
    const srcs: string[] = [];
    article.value?.colors.forEach((color) => {
        srcs.push(BASE_URL + `/articles/colors/photo/${color.id}`);
    });
    return srcs;
});

// Tabs section
const tab = ref<number>(0);

// Article status section
const onActivateArticle = async () => {
    const response = await activateArticle(article.value?.id ?? parseInt(props.id));
    if (!response.ok) {
        console.error(response);
    } else {
        article.value!.status = ArticleStatus.ACTIVE;
    }
};

const onDeactivateArticle = async () => {
    const response = await deactivateArticle(article.value?.id ?? parseInt(props.id));
    if (!response.ok) {
        console.error(response);
    } else {
        article.value!.status = ArticleStatus.INACTIVE;
        article.value!.colors.forEach((color) => {
            color.status = ColorStatus.INACTIVE;
        });
        colorsToUpdate.value = article.value!.colors.map((c) => c.id);
    }
};

// Color status section
const onActivateColor = async (colorId: number) => {
    const color = article.value?.colors.find((c) => c.id === colorId);
    if (!color) {
        return;
    }
    const response = await activateColor(color.id);
    if (!response.ok) {
        console.error(response);
    } else {
        color.status = ColorStatus.ACTIVE;
    }
};

const onDeactivateColor = async (colorId: number) => {
    const color = article.value?.colors.find((c) => c.id === colorId);
    if (!color) {
        return;
    }
    const response = await deactivateColor(color.id);
    if (!response.ok) {
        console.error(response);
    } else {
        color.status = ColorStatus.INACTIVE;
    }
};

// Colors section
const colorsToUpdate = ref<number[]>([]);
const colorsRerenderKey = ref<number>(0);

const onDeleteColor = async (colorId: number) => {
    const color = article.value?.colors.find((c) => c.id === colorId);
    if (!color) {
        return;
    }
    const response = await deleteColor(color.id);
    if (!response.ok) {
        console.error(response);
    } else {
        colorsToUpdate.value.push(colorId);
        article.value!.colors = article.value!.colors.filter((c) => c.id !== colorId);
    }
};

const onUpdateColor = (color: AdminColorInArticle) => {
    const index = article.value?.colors.findIndex((c) => c.id === color.id);
    if (index === undefined || index === -1) {
        return;
    }
    colorsToUpdate.value.push(color.id);
    article.value!.colors[index] = color;
};

const onUpdateColors = (colors: AdminColorInArticle[]) => {
    colorsToUpdate.value = colorsToUpdate.value.concat(colors.map((c) => c.id));
    article.value!.colors = colors;
};

watch(colorsToUpdate, (updatedColors) => {
    if (updatedColors.length > 0) {
        colorsRerenderKey.value += 1;
        article.value?.colors.sort((a, b) => a.numInArticle - b.numInArticle);
        colorsToUpdate.value = [];
    }
}, {deep: true});

// Additional media section
const localAdditionalMedia = ref<AdminAdditionalMediaInArticle[]>(article.value?.additionalMedia || []);
const mediaRerenderKey = ref<number>(0);

const onUpdateAdditionalMedia = (media: AdminAdditionalMediaInArticle[]) => {
    localAdditionalMedia.value = media;
};

watch(localAdditionalMedia, (updatedMedia) => {
    article.value!.additionalMedia = updatedMedia;
    mediaRerenderKey.value += 1;
}, {deep: true});

// Videos section
const localVideos = ref<AdminVideoInArticle[]>(article.value?.videos || []);
const videosRerenderKey = ref<number>(0);

const onUpdateVideos = (videos: AdminVideoInArticle[]) => {
    localVideos.value = videos;
};

watch(localVideos, (updatedVideos) => {
    article.value!.videos = updatedVideos;
    videosRerenderKey.value += 1;
}, {deep: true});

// In stock section
// const isInStock = ref<boolean>(false);
//
// const onToggleArticleInStock = async () => {
//     const response = await toggleArticleInStock(article.value?.id ?? parseInt(props.id));
//     if (!response.ok) {
//         console.error(response);
//     } else {
//         article.value!.inStock = !article.value!.inStock;
//     }
// };
//
// watch(isInStock, async () => {
//     await onToggleArticleInStock();
// });

// Expired at section
const localExpiredAt = ref<Date | undefined>(undefined);

watch(localExpiredAt, () => {
    article.value!.expiredAt = localExpiredAt.value;
});

// Telegram section
const handleTgBackButton = () => {
    router.go(-1);
};

// On mounted actions
onMounted(async () => {
    await onFetchArticle();
    await onFetchArticleOrdersCount();
});
</script>

<template>
    <TheAdminNavigation/>
    <BackButton
        v-if="!isPlatformUnknown"
        @click="handleTgBackButton"
    ></BackButton>
    <v-card
        v-if="!isLoading && !isServiceUnavailable && article"
        class="mt-15 mb-10 d-flex flex-column pa-5 main-container mx-auto"
    >
        <h1 class="mb-3">Информация об артикуле "{{ article.name }}"</h1>

        <v-tabs
            v-model="tab"
            :bg-color="themeParams.button_color ?? 'primary'"
            class="w-100"
            show-arrows
        >
            <v-tab value="1">Общее</v-tab>
            <v-tab value="2">Цвета</v-tab>
            <v-tab value="3">Дополнительные медиа</v-tab>
            <v-tab value="4">Видео</v-tab>
        </v-tabs>

        <v-window v-model="tab" :touch="false" class="w-100">
            <v-window-item class="my-3" value="1">
                <v-card-title class="text-center pa-0"><b>Общее</b></v-card-title>

                <v-divider></v-divider>

                <div class="text-center">
                    <v-card-title><b>Фото цветов</b></v-card-title>
                    <TheImageGrid
                        v-if="colorsSrcs.length > 0"
                        :key="colorsRerenderKey"
                        :height-px="isWideScreen ? 400 : 200"
                        :srcs="colorsSrcs"
                    />
                </div>

                <v-divider></v-divider>

                <TheArticleInfoCard
                    :article="article"
                    @activate="onActivateArticle"
                    @deactivate="onDeactivateArticle"
                    @update:is-in-stock="article.inStock = $event"
                    @update:expired-at="localExpiredAt = $event"
                    @update:name="article.name = $event"
                    @update:preorder="article.preorder = $event"
                    @update:preorder-type="article.preorder.type = $event"
                    @update:structure="article.structure = $event"
                    @update:footage="article.footage = $event"
                    @update:price-opt="article.priceOpt = $event"
                    @update:price-retail="article.priceRetail = $event"
                    @update:price-sale="article.priceSale = $event"
                    @update:sale-name="article.saleName = $event"
                />
            </v-window-item>

            <v-window-item class="my-3" value="2">
                <v-card-text class="text-center pa-0 py-2" style="font-size: 1.2rem;">
                    <b>Цвета артикула</b>
                </v-card-text>

                <v-divider></v-divider>

                <v-card variant="flat">
                    <TheColorsPanels
                        :key="colorsRerenderKey"
                        :article="article"
                        @activate="onActivateColor($event)"
                        @deactivate="onDeactivateColor($event)"
                        @delete="onDeleteColor($event)"
                        @update:color="onUpdateColor($event)"
                        @update:colors="onUpdateColors($event)"
                    />
                </v-card>
            </v-window-item>

            <v-window-item class="my-3" value="3">
                <v-card-text class="text-center pa-0 title"><b>Дополнительные медиа артикула</b></v-card-text>

                <v-divider></v-divider>

                <v-card class="pa-3" variant="flat">
                    <TheArticleAdditionalMedia
                        :key="mediaRerenderKey"
                        :article="article"
                        @update:additional-media="onUpdateAdditionalMedia($event)"
                    />
                </v-card>
            </v-window-item>

            <v-window-item class="my-3" value="4">
                <v-card-title class="text-center pa-0"><b>Видео артикула</b></v-card-title>

                <v-divider></v-divider>

                <v-card class="pa-3" variant="flat">
                    <TheArticleVideos
                        :key="videosRerenderKey"
                        :article="article"
                        @update:videos="onUpdateVideos($event)"
                    />
                </v-card>
            </v-window-item>
        </v-window>
    </v-card>
</template>

<style lang="scss" scoped>
.main-container {
    align-items: center;
    max-width: 1000px;
}

.v-divider {
    align-self: stretch;
}

.v-card, .v-card * {
    background-color: var(--tg-theme-bg-color, rgb(var(--v-theme-background)));
    color: var(--tg-theme-text-color, rgb(var(--v-theme-text-base)));
}

.title {
    font-size: 1.2rem;
    line-height: 2rem !important;
}
</style>