<script lang="ts" setup>
import {BackButton, useWebApp, useWebAppTheme} from "vue-tg";
import {useRoute, useRouter} from "vue-router";
import {computed, onMounted, ref} from "vue";
import {CompetitorArticleCard, CompetitorArticleCardsQuery} from "~/interfaces/admin/competitor.ts";
import TheAdminNavigation from "~/components/admin/TheAdminNavigation.vue";
import TheSearch from "~/components/user/TheSearch.vue";
import TheCompetitorsList from "~/components/admin/TheCompetitorsList.vue";
import {getCompetitorArticleCards} from "~/utils/api.ts";
import {convertKeysToCamelCase} from "~/utils/converters.ts";
import TheLoader from "~/components/user/TheLoader.vue";

// Common section
const route = useRoute();
const router = useRouter();

const {themeParams} = useWebAppTheme();
const {isPlatformUnknown} = useWebApp();

const query = computed(() => {
    const _query: CompetitorArticleCardsQuery = {};
    if (localSearch.value) {
        _query.search = localSearch.value as string;
    }
    if (showInactive.value) {
        _query.inactive = 'true';
    }
    return _query;
});

// Search section
const localSearch = ref<string>(route.query.search as string || '');

const handleClearSearch = () => {
    localSearch.value = '';
};

const handleSearch = async (searchValue: string) => {
    localSearch.value = searchValue;
    await router.push({name: 'admin-competitors', query: query.value});
    await onFetchArticleCards();
};

// Filters section
const showInactive = ref<boolean>(Boolean(route.query.inactive as string) || false);

// Articles section
const isLoading = ref<boolean>(false);
const isServiceUnavailable = ref<boolean>(false);

const articleCards = ref<CompetitorArticleCard[] | undefined>(undefined);

const onFetchArticleCards = async () => {
    if (localSearch.value === '') {
        return;
    }

    isLoading.value = true;
    const response = await getCompetitorArticleCards(localSearch.value, showInactive.value);
    if (!response.ok) {
        isLoading.value = false;
        isServiceUnavailable.value = true;
        console.error(response);
    } else {
        articleCards.value = convertKeysToCamelCase(await response.json()) as CompetitorArticleCard[];
        isLoading.value = false;
    }
}

// Telegram section
const handleTgBackButton = () => {
    router.go(-1);
};

// On mounted actions
onMounted(onFetchArticleCards);
</script>

<template>
    <TheAdminNavigation/>
    <BackButton
        v-if="!isPlatformUnknown"
        @click="handleTgBackButton"
    ></BackButton>
    <v-card class="d-flex flex-column mt-15 mx-auto mb-15" max-width="900px" variant="flat">
        <TheSearch
            :loading="isLoading"
            :search-query="localSearch"
            class="mt-3 pa-3"
            @clearSearch="handleClearSearch"
            @search="handleSearch"
            @update:search-query="localSearch = $event"
        />

        <v-container>
            <v-row no-gutters>
                <v-col>
                    <v-checkbox
                        v-model="showInactive"
                        :color="themeParams.button_color ?? 'primary'"
                        density="compact"
                        hide-details
                        label="Показывать неактивные"
                    />
                </v-col>
            </v-row>
        </v-container>

        <v-card
            v-if="articleCards !== undefined && articleCards?.length != 0 && !isLoading && !isServiceUnavailable"
            variant="flat"
        >
            <TheCompetitorsList :competitors="articleCards"/>
        </v-card>

        <div v-else-if="!isLoading && articleCards === undefined && !isServiceUnavailable">
            <span class="d-flex justify-center"><br>Введите запрос</span>
        </div>

        <div v-else-if="!isLoading && articleCards?.length === 0 && !isServiceUnavailable">
            <span class="d-flex justify-center"><br>Список пуст</span>
        </div>

        <div v-else-if="!isLoading && !articleCards && isServiceUnavailable">
            <span class="d-flex justify-center"><br>Сервис временно недоступен.<br>Приносим извинения за предоставленные неудобства</span>
        </div>

        <div v-else>
            <TheLoader/>
        </div>
    </v-card>
</template>

<style lang="scss" scoped>
.v-card, .v-card *:not(.scroll-to-top-button-layout):not(.scroll-icon) {
    background-color: var(--tg-theme-bg-color, rgb(var(--v-theme-background)));
    color: var(--tg-theme-text-color, rgb(var(--v-theme-on-surface)));
}
</style>