<script lang="ts" setup>
import TheAdminNavigation from "~/components/admin/TheAdminNavigation.vue";
import TheArticlesList from "~/components/admin/TheArticlesList.vue";
import {BackButton, useWebApp, useWebAppTheme} from "vue-tg";
import {useRoute, useRouter} from "vue-router";
import {computed, onMounted, ref, watch} from "vue";
import {getAdminArticles} from "~/utils/api.ts";
import {convertArticleDatesFromApi, convertKeysToCamelCase} from "~/utils/converters.ts";
import TheLoader from "~/components/user/TheLoader.vue";
import {PaginatedApiData} from "~/interfaces/apiData.ts";
import {AdminArticle, AdminArticlesQuery} from "~/interfaces/admin/article.ts";
import {PAGE_SIZE} from "~/config/constants.ts";
import {useScreenStore} from "~/stores/screen.ts";
import {storeToRefs} from "pinia";
import TheSearch from "~/components/user/TheSearch.vue";

// Common section
const route = useRoute();
const router = useRouter();

const {isPlatformUnknown} = useWebApp();
const {themeParams} = useWebAppTheme();

const query = computed(() => {
    const _query: AdminArticlesQuery = {
        page: articlesPage.value,
    };
    if (localSearch.value) {
        _query.search = localSearch.value as string;
    }
    if (onlyActive.value) {
        _query.active = 'true';
    }
    return _query;
});


const onScrollToTop = () => {
    const app = document.getElementById('app') as HTMLElement
    app.scrollIntoView({behavior: "smooth", block: "start", inline: "nearest"});
};

// Stores section
const screenStore = useScreenStore();
const {scrollY, isWideScreen} = storeToRefs(screenStore);

// Page section
const articlesPage = ref<number>(parseInt(route.query.page as string) || 1);

watch(articlesPage, async () => {
    await router.push({name: 'admin-articles', query: query.value});
    await onFetchArticles();
});

// Search section
const localSearch = ref<string>(route.query.search as string || '');

const handleSearch = async (searchValue: string) => {
    localSearch.value = searchValue;
    articlesPage.value = 1;
    await router.push({name: 'admin-articles', query: query.value});
    await onFetchArticles();
};

const handleClearSearch = async () => {
    localSearch.value = '';
    articlesPage.value = 1;
    await router.push({name: 'admin-articles', query: query.value});
    await onFetchArticles();
};

watch(localSearch, async (newValue) => {
    if (newValue === '') {
        await handleClearSearch();
    }
});

// Articles section
const isLoading = ref<boolean>(false);
const isServiceUnavailable = ref<boolean>(false);
const total = ref<number>(0);

const paginatedArticles = ref<AdminArticle[] | undefined>(undefined);

const onFetchArticles = async () => {
    isLoading.value = true;
    const response = await getAdminArticles(
        localSearch.value,
        articlesPage.value,
        onlyActive.value,
    );
    if (!response.ok) {
        isLoading.value = false;
        isServiceUnavailable.value = true;
        console.error(response);
    } else {
        const pagedResult = convertKeysToCamelCase(await response.json()) as PaginatedApiData<AdminArticle>;
        paginatedArticles.value = pagedResult.results;
        paginatedArticles.value.forEach((article) => {
            convertArticleDatesFromApi(article);
        });
        articlesPage.value = pagedResult.page;
        total.value = pagedResult.total;
        isLoading.value = false;
    }
};

// Filters section
const onlyActive = ref<boolean>(Boolean(route.query.active as string) || false);

const handleFastFilters = async () => {
    articlesPage.value = 1;
    await router.push({name: 'admin-articles', query: query.value});
    await onFetchArticles();
};

watch(onlyActive, async () => {
    await handleFastFilters();
});

// Telegram section
const handleTgBackButton = () => {
    router.go(-1);
};

// On mounted actions
onMounted(onFetchArticles);
</script>

<template>
    <TheAdminNavigation/>
    <BackButton
        v-if="!isPlatformUnknown"
        @click="handleTgBackButton"
    ></BackButton>
    <v-card class="d-flex flex-column mt-15 mx-auto mb-15" max-width="900px" variant="flat">
        <v-btn
            class="mx-3 mt-2"
            @click="$router.push({name: 'admin-create-article'});"
        >
            Добавить
        </v-btn>
        <TheSearch
            :loading="isLoading"
            :search-query="localSearch"
            class="mt-3 pa-3"
            @clearSearch="handleClearSearch"
            @search="handleSearch"
            @update:search-query="localSearch = $event"
        />

        <v-container
            :class="{'justify-center': !isWideScreen, 'justify-space-around': isWideScreen}"
        >
            <div v-if="isWideScreen">
                <v-row class="justify-center" no-gutters>
                    <v-col>
                        <v-checkbox
                            v-model="onlyActive"
                            :color="themeParams.button_color ?? 'primary'"
                            class="fast-filter-checkbox"
                            density="compact"
                            hide-details
                            label="Только активные"
                        ></v-checkbox>
                    </v-col>
                </v-row>
            </div>
        </v-container>

        <v-card
            v-if="paginatedArticles !== undefined && paginatedArticles?.length != 0 && !isLoading && !isServiceUnavailable"
            class="w-100"
            variant="flat">
            <TheArticlesList
                :articles="paginatedArticles"
                :is-draft="false"
            />
            <v-pagination
                v-if="total / PAGE_SIZE > 1"
                v-model="articlesPage"
                :length="Math.ceil(total / PAGE_SIZE)"
                :size="!isWideScreen ? 'small' : 'default'"
                :total-visible="4"
                @update:modelValue="onScrollToTop"
            ></v-pagination>
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
                        <v-icon class="scroll-icon">mdi-chevron-up</v-icon>
                    </v-btn>
                </v-layout>
            </v-fade-transition>
        </v-card>
        <div v-else-if="!isLoading && paginatedArticles?.length == 0 && !isServiceUnavailable">
            <span class="d-flex justify-center"><br>Нет артикулов</span>
        </div>
        <div v-else-if="!isLoading && !paginatedArticles && isServiceUnavailable">
            <span class="d-flex justify-center"><br>Сервис временно недоступен.<br>Приносим извинения за предоставленные неудобства</span>
        </div>
        <div v-else>
            <TheLoader/>
        </div>
    </v-card>
</template>

<style lang="scss" scoped>
.scroll-to-top-button-layout {
    bottom: 0;
    right: 0;
    padding: 0 7px 7px 0;
}

.v-card, .v-card *:not(.scroll-to-top-button-layout):not(.scroll-icon) {
    background-color: var(--tg-theme-bg-color, rgb(var(--v-theme-background)));
    color: var(--tg-theme-text-color, rgb(var(--v-theme-on-surface)));
}
</style>
