<script lang="ts" setup>
import {computed, onMounted, ref, watch} from 'vue';
import {useArticleColorsStore} from '~/stores/articles.ts';
import {storeToRefs} from 'pinia';
import TheLoader from "~/components/user/TheLoader.vue";
import TheArticleColorsGrid from "~/components/user/TheArticleColorsGrid.vue";
import {useRoute, useRouter} from 'vue-router';
import {PAGE_SIZE} from "~/config/constants.ts";
import TheSearch from "~/components/user/TheSearch.vue";
import TheFiltersMenu from "~/components/user/TheFiltersMenu.vue";
import TheHeader from "~/components/user/TheHeader.vue";
import {useScreenStore} from "~/stores/screen.ts";
import {getColors} from "~/utils/api.ts";
import {useWebApp, useWebAppTheme} from "vue-tg";
import {convertArticleDatesFromApi, convertKeysToCamelCase} from "~/utils/converters.ts";
import {getMetaFromRef} from "~/utils/navigation.ts";
import {PaginatedApiData} from "~/interfaces/apiData.ts";
import {type ArticlesQuery} from "~/interfaces/article.ts";
import {PreorderType} from "~/enums/preorderType.ts";
import {useCookiesStore} from "~/stores/cookies.ts";
import TheMobileFooter from "~/components/user/TheMobileFooter.vue";
import {User} from "~/interfaces/user.ts";
import {useUserInfoStore} from "~/stores/userInfo.ts";
import {Color} from "~/interfaces/color.ts";

// Common section
const route = useRoute();
const router = useRouter();

const from = getMetaFromRef(route);

const {isPlatformUnknown} = useWebApp();
const {themeParams} = useWebAppTheme();

const isLoading = ref<boolean>(false);
const isServiceUnavailable = ref<boolean>(false);

const query = computed(() => {
    const _query: ArticlesQuery = {
        page: localPage.value,
    };
    if (localSearch.value) {
        _query.search = localSearch.value as string;
    }
    if (localTagsIds.value.length !== 0) {
        _query.article_tags = localTagsIds.value.join(',');
    }
    if (localSelectedColorsNames.value.length !== 0) {
        _query.colors_names = localSelectedColorsNames.value.join(',');
    }
    if (onlyPreorder.value) {
        _query.only_preorder = 'true';
    } else if (onlyInStock.value) {
        _query.only_in_stock = 'true';
    } else if (onlyHot.value) {
        _query.only_hot = 'true';
    }
    if (onlySale.value) {
        _query.only_sale = 'true';
    }
    return _query;
});

const onScrollToTop = () => {
    const app = document.getElementById('app') as HTMLElement
    app.scrollIntoView({behavior: "smooth", block: "start", inline: "nearest"});
};

// Stores section
const articleColorsStore = useArticleColorsStore();
const {paginatedColors} = storeToRefs(articleColorsStore);

const screenStore = useScreenStore();
const {scrollY, isWideScreen} = storeToRefs(screenStore);

const userInfoStore = useUserInfoStore();
const {isAuthenticated} = storeToRefs(userInfoStore);

const cookiesStore = useCookiesStore();

// Search section
const localSearch = ref<string>(route.query.search as string || '');

const handleSearch = async (searchValue: string) => {
    localSearch.value = searchValue;
    localPage.value = 1;
    await router.push({name: 'article-colors', query: query.value});
    await onFetchArticleColors();
};

const handleClearSearch = async () => {
    localSearch.value = '';
    localPage.value = 1;
    await router.push({name: 'article-colors', query: query.value});
    await onFetchArticleColors();
};

watch(localSearch, async (newValue) => {
    if (newValue === '') {
        await handleClearSearch();
    }
});

// Page section
const localPage = ref<number>(parseInt(route.query.page as string) || 1);

watch(localPage, async (newPage) => {
    isLoading.value = true;
    localPage.value = newPage;
    await router.push({name: 'article-colors', query: query.value});
    await onFetchArticleColors();
    isLoading.value = false;
});

// Tags section
const queryArticleTags = route.query.article_tags as string;

const localTagsIds = ref<number[]>([]);
if (queryArticleTags) {
    localTagsIds.value = queryArticleTags.split(',').map(Number);
}

const handleTagsUpdate = async (newTagsIds: number[]) => {
    localPage.value = 1;
    localTagsIds.value = newTagsIds;
    await router.push({name: 'article-colors', query: query.value});
    await onFetchArticleColors();
};

watch(localTagsIds, async (newTagsIds) => {
    await handleTagsUpdate(newTagsIds);
});

// Colors filter section
const queryColorsNames = route.query.colors_names as string;

const localSelectedColorsNames = ref<string[]>([]);
if (queryColorsNames) {
    localSelectedColorsNames.value = queryColorsNames.split(',');
}

const handleColorsNamesUpdate = async (newColorsNames: string[]) => {
    localPage.value = 1;
    localSelectedColorsNames.value = newColorsNames;
    await router.push({name: 'article-colors', query: query.value});
    await onFetchArticleColors();
};

watch(localSelectedColorsNames, async (newColorsNames) => {
    await handleColorsNamesUpdate(newColorsNames);
});

// Articles section
const total = ref<number>(0);
const onlyPreorder = ref<boolean>(Boolean(route.query.only_preorder as string) || false);
const onlyInStock = ref<boolean>(Boolean(route.query.only_in_stock as string) || false);
const onlySale = ref<boolean>(Boolean(route.query.only_sale as string) || false);
const onlyHot = ref<boolean>(Boolean(route.query.only_hot as string) || false);

const colsSize = '5';

const onFetchArticleColors = async () => {
    isLoading.value = true;
    const preorderTypesToFetch = [PreorderType.PREORDER, PreorderType.IN_STOCK, PreorderType.SALE, PreorderType.FAST_PREORDER];
    const response = await getColors(
        preorderTypesToFetch,
        onlyInStock.value,
        onlyPreorder.value,
        onlySale.value,
        onlyHot.value,
        localSearch.value as string,
        localTagsIds.value.join(','),
        localSelectedColorsNames.value.join(','),
        localPage.value,
        PAGE_SIZE,
    );
    if (!response.ok) {
        isLoading.value = false;
        isServiceUnavailable.value = true;
        console.error(response);
    } else {
        const result = convertKeysToCamelCase(await response.json()) as PaginatedApiData<Color>;
        paginatedColors.value = result.results;
        paginatedColors.value.forEach((color) => {
            convertArticleDatesFromApi(color.article);
        });
        localPage.value = result.page;
        total.value = result.total;
        isLoading.value = false;
    }
};

const handleFastFilters = async () => {
    localPage.value = 1;
    await router.push({name: 'article-colors', query: query.value});
    await onFetchArticleColors();
};

watch(onlyPreorder, async () => {
    if (onlyPreorder.value) {
        onlyInStock.value = false;
        onlyHot.value = false;
    }
    await handleFastFilters();
});

watch(onlyInStock, async () => {
    if (onlyInStock.value) {
        onlyPreorder.value = false;
        onlyHot.value = false;
    }
    await handleFastFilters();
});

watch(onlySale, async () => {
    await handleFastFilters();
});

watch(onlyHot, async () => {
    if (onlyHot.value) {
        if (!user.value || !user.value?.wantsHotArticles) {
            showHotAriclesDialog.value = true;
        }
        onlyInStock.value = false;
        onlyPreorder.value = false;
    }
    await handleFastFilters();
});

// Expansion panel section
let showPanelFromCookies: any = cookiesStore.getCookie('show_panel');
if (showPanelFromCookies === 'undefined') {
    showPanelFromCookies = undefined;
} else {
    showPanelFromCookies = 0;
}
const showPanel = ref<number | undefined>(showPanelFromCookies);

watch(showPanel, () => {
    cookiesStore.setCookie('show_panel', String(showPanel.value), 30);
});

// Hot articles dialog section
const showHotAriclesDialog = ref<boolean>(false);

// User section
const user = ref<User>();

// On mounted actions
onMounted(async () => {
    await onFetchArticleColors();
    if (isAuthenticated.value) {
        user.value = await userInfoStore.get();
    }
});
</script>

<template>
    <v-layout>
        <TheHeader
            v-if="isWideScreen"
            :previous-view-name="from.name"
            :previous-view-params="from.params"
            :previous-view-query="from.query"
            bar-title="Артикулы"
        />
    </v-layout>

    <v-container
        :class="{'mt-15': isWideScreen, 'mb-30': !isWideScreen}"
        class="pa-5 mb-10 mx-auto d-flex flex-column"
    >
        <v-expansion-panels class="mb-5">
            <v-expansion-panel class="pa-0">
                <v-expansion-panel-title>
                    <v-card-title class="pa-0 ma-0 list-item-title"><b>Наши преимущества:</b></v-card-title>
                </v-expansion-panel-title>
                <v-expansion-panel-text class="pa-0">
                    <v-list class="pa-0">
                        <v-list-item class="pa-0">
                            <v-card-text class="pa-0 list-item-title"><b>1. Оптовая цена уже от половинки бобины (около
                                500 гр).</b>
                            </v-card-text>
                            <v-card-text class="pa-0">
                                - Ассортимент стоковых складов Италии по предзаказу. Предзаказ открыт всегда
                            </v-card-text>
                        </v-list-item>
                        <v-list-item class="pa-0">
                            <v-card-text class="pa-0 list-item-title"><b>2. Защита от мошенников</b>
                            </v-card-text>
                            <v-card-text class="pa-0">
                                - Только надежные способы оплаты!
                            </v-card-text>
                        </v-list-item>
                        <v-list-item class="pa-0">
                            <v-card-text class="pa-0 list-item-title"><b>3. Высылаем бесплатные образцы по запросу.</b>
                            </v-card-text>
                            <v-card-text class="pa-0">
                                - Вы можете добавить к Вашему заказу до 5 бесплатных образцов любой пряжи на пробу.
                            </v-card-text>
                        </v-list-item>
                        <v-list-item class="pa-0">
                            <v-card-text class="pa-0 list-item-title"><b>4. Предзаказ без предоплаты</b></v-card-text>
                            <v-card-text class="pa-0">
                                - Смотри условия предзаказа
                            </v-card-text>
                        </v-list-item>
                        <v-list-item class="pa-0">
                            <v-card-text class="pa-0 list-item-title"><b>5. Удобный Телеграм бот</b></v-card-text>
                            <v-card-text class="pa-0">
                                - Личный кабинет с историей заказов, отзывами и другими полезными материалами! Рассылки
                                новинок, скидок и акций
                            </v-card-text>
                        </v-list-item>
                    </v-list>
                </v-expansion-panel-text>
            </v-expansion-panel>
        </v-expansion-panels>
        <TheSearch
            :loading="isLoading"
            :search-query="localSearch"
            @clearSearch="handleClearSearch"
            @search="handleSearch"
            @update:search-query="localSearch = $event"
        />
        <TheFiltersMenu
            :selected-colors-names="localSelectedColorsNames"
            :selected-tags="localTagsIds"
            @update:selected-tags="localTagsIds = $event"
            @update:selected-colors-names="localSelectedColorsNames = $event"
        />

        <v-container
            :class="{'justify-center': !isWideScreen, 'justify-space-around': isWideScreen}"
        >
            <div v-if="isWideScreen">
                <v-row :no-gutters="true" class="justify-center">
                    <v-col>
                        <v-checkbox
                            v-model="onlyPreorder"
                            :color="themeParams.button_color ?? 'primary'"
                            class="fast-filter-checkbox"
                            density="compact"
                            hide-details
                            label="Предзаказы"
                        ></v-checkbox>
                    </v-col>
                    <v-col>
                        <v-checkbox
                            v-model="onlyInStock"
                            :color="themeParams.button_color ?? 'primary'"
                            class="fast-filter-checkbox"
                            density="compact"
                            hide-details
                            label="В наличии"
                        ></v-checkbox>
                    </v-col>
                    <v-col>
                        <v-checkbox
                            v-model="onlySale"
                            :color="themeParams.button_color ?? 'primary'"
                            class="fast-filter-checkbox"
                            density="compact"
                            hide-details
                            label="Со скидкой"
                        ></v-checkbox>
                    </v-col>
                    <v-col>
                        <v-checkbox
                            v-model="onlyHot"
                            :color="themeParams.button_color ?? 'primary'"
                            class="fast-filter-checkbox"
                            density="compact"
                            hide-details
                            label="Горячие"
                        ></v-checkbox>
                    </v-col>
                </v-row>
            </div>
            <div v-else>
                <v-row :no-gutters="true" class="justify-center">
                    <v-col :cols="colsSize">
                        <v-checkbox
                            v-model="onlyPreorder"
                            :color="themeParams.button_color ?? 'primary'"
                            class="fast-filter-checkbox"
                            density="compact"
                            hide-details
                            label="Предзаказы"
                        ></v-checkbox>
                    </v-col>
                    <v-col :cols="colsSize">
                        <v-checkbox
                            v-model="onlyInStock"
                            :color="themeParams.button_color ?? 'primary'"
                            class="fast-filter-checkbox"
                            density="compact"
                            hide-details
                            label="В наличии"
                        ></v-checkbox>
                    </v-col>
                </v-row>

                <v-row :no-gutters="true" class="justify-center">
                    <v-col :cols="colsSize">
                        <v-checkbox
                            v-model="onlySale"
                            :color="themeParams.button_color ?? 'primary'"
                            class="fast-filter-checkbox"
                            density="compact"
                            hide-details
                            label="Со скидкой"
                        ></v-checkbox>
                    </v-col>
                    <v-col :cols="colsSize">
                        <v-checkbox
                            v-model="onlyHot"
                            :color="themeParams.button_color ?? 'primary'"
                            class="fast-filter-checkbox"
                            density="compact"
                            hide-details
                            label="Горячие"
                        ></v-checkbox>
                    </v-col>
                </v-row>
            </div>
        </v-container>

        <v-card
            v-if="!isServiceUnavailable && paginatedColors.length !== 0"
            variant="flat"
        >
            <div class="position-relative">
                <v-overlay
                    :contained="true"
                    :model-value="isLoading"
                    class="align-center justify-center"
                    scroll-strategy="reposition"
                >
                    <v-progress-circular indeterminate></v-progress-circular>
                </v-overlay>
                <TheArticleColorsGrid :user="user"/>
            </div>
            <v-pagination
                v-if="total / PAGE_SIZE > 1"
                v-model="localPage"
                :length="Math.ceil(total / PAGE_SIZE)"
                :size="!isWideScreen ? 'small' : 'default'"
                :total-visible="4"
                @update:modelValue="onScrollToTop"
            ></v-pagination>
        </v-card>
        <TheLoader v-else-if="isLoading && !isServiceUnavailable"/>
        <span v-else-if="!isServiceUnavailable && paginatedColors.length === 0" class="d-flex justify-center"><br>Товаров по заданным параметрам не найдено</span>
        <span v-else class="d-flex justify-center"><br>Сервис временно недоступен.<br>Приносим извинения за предоставленные неудобства</span>

        <v-dialog
            v-model="showHotAriclesDialog"
            max-width="450px"
        >
            <v-card class="d-flex">
                <v-card-text class="text-center">
                    <b>
                        {{ user ? 'Измените в профиле настройку "Хочу горячие артикулы"' : 'Авторизуйтесь' }}, чтобы
                        получить доступ к функционалу с горячими артикулами, а также получать рассылку в Telegram
                    </b>
                </v-card-text>
                <v-card-actions class="mx-auto">
                    <v-btn
                        v-if="!user"
                        @click="$router.push({name: 'login', query: {from: $route.fullPath}});"
                    >
                        Авторизоваться
                    </v-btn>
                    <v-btn
                        v-else-if="!user.wantsHotArticles"
                        @click="$router.push({name: 'profile'})"
                    >
                        Настройки
                    </v-btn>

                    <v-btn
                        :color="themeParams.button_color ?? 'primary'"
                        class="not-primary"
                        variant="tonal"
                        @click="showHotAriclesDialog = false;"
                    >
                        Понятно
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </v-container>
    <v-fade-transition>
        <v-layout
            v-if="scrollY >= 300"
            :class="{'mb-17-5': !isWideScreen}"
            class="scroll-to-top-button-layout d-flex justify-end position-fixed"
        >
            <v-btn
                :size="isPlatformUnknown ? 'large' : 'small'"
                class="mt-auto"
                fab
                icon
                z-index="2000"
                @click="onScrollToTop"
            >
                <v-icon>mdi-chevron-up</v-icon>
            </v-btn>
        </v-layout>
    </v-fade-transition>
    <TheMobileFooter v-if="!isWideScreen"/>
</template>

<style lang="scss" scoped>
.list-item-title {
    font-size: 1.2rem;
    margin-bottom: 2%;
    margin-top: 2%;
    line-height: 1.5rem !important;
}

.scroll-to-top-button-layout {
    bottom: 0;
    right: 0;
    padding: 0 7px 7px 0;
}

.v-pagination, .v-card, .v-list, .v-list *, .v-expansion-panels, .v-expansion-panels * {
    background-color: var(--tg-theme-bg-color, rgb(var(--v-theme-background)));
    color: var(--tg-theme-text-color, rgb(var(--v-theme-on-surface)));
}

.mb-17-5 {
    margin-bottom: 17.5%;
}

span {
    color: var(--tg-theme-text-color, rgb(var(--v-theme-on-surface)));
}

.v-checkbox {
    color: var(--tg-theme-text-color, rgb(var(--v-theme-on-surface)));
}

.mb-30 {
    margin-bottom: 30% !important;
}

.fast-filter-checkbox {
    flex: none !important;
}
</style>
