<script lang="ts" setup>
import {BackButton, useWebApp} from "vue-tg";
import TheAdminNavigation from "~/components/admin/TheAdminNavigation.vue";
import {useRoute, useRouter} from "vue-router";
import TheSearch from "~/components/user/TheSearch.vue";
import {computed, onMounted, ref, watch} from "vue";
import {AdminOrder} from "~/interfaces/admin/order.ts";
import {AdminArticlesQuery} from "~/interfaces/admin/article.ts";
import {PAGE_SIZE} from "~/config/constants.ts";
import {useScreenStore} from "~/stores/screen.ts";
import {storeToRefs} from "pinia";
import TheLoader from "~/components/user/TheLoader.vue";
import {getAdminOrders} from "~/utils/api.ts";
import {convertKeysToCamelCase, convertOrderDatesFromApi} from "~/utils/converters.ts";
import {PaginatedApiData} from "~/interfaces/apiData.ts";
import TheAdminOrdersList from "~/components/admin/TheAdminOrdersList.vue";
import {useAdminOrdersStore} from "~/stores/admin/orders.ts";

// Common section
const route = useRoute();
const router = useRouter();

const {isPlatformUnknown} = useWebApp();

const query = computed(() => {
    const _query: AdminArticlesQuery = {
        page: ordersPage.value,
    };
    if (localSearch.value) {
        _query.search = localSearch.value as string;
    }
    return _query;
});

const onScrollToTop = () => {
    const app = document.getElementById('app') as HTMLElement
    app.scrollIntoView({behavior: "smooth", block: "start", inline: "nearest"});
};

// Stores section
const ordersStore = useAdminOrdersStore();
const {paginatedOrders} = storeToRefs(ordersStore);

const screenStore = useScreenStore();
const {scrollY, isWideScreen} = storeToRefs(screenStore);

// Orders section
const isLoading = ref<boolean>(false);
const isServiceUnavailable = ref<boolean>(false);
const total = ref<number>(0);

const onFetchOrders = async () => {
    isLoading.value = true;
    const response = await getAdminOrders(
        localSearch.value,
        ordersPage.value,
    );
    if (!response.ok) {
        isLoading.value = false;
        isServiceUnavailable.value = true;
        console.error(response);
    } else {
        const pagedResult = convertKeysToCamelCase(await response.json()) as PaginatedApiData<AdminOrder>;
        paginatedOrders.value = pagedResult.results;
        paginatedOrders.value.forEach((order) => {
            convertOrderDatesFromApi(order);
        });
        ordersPage.value = pagedResult.page;
        total.value = pagedResult.total;
        isLoading.value = false;
    }
};

// Page section
const ordersPage = ref<number>(parseInt(route.query.page as string) || 1);

watch(ordersPage, async () => {
    await router.push({name: 'admin-orders', query: query.value});
    await onFetchOrders();
});

// Search section
const localSearch = ref<string>(route.query.search as string || '');

const handleSearch = async (searchValue: string) => {
    localSearch.value = searchValue;
    ordersPage.value = 1;
    await router.push({name: 'admin-orders', query: query.value});
    await onFetchOrders();
};

const handleClearSearch = async () => {
    localSearch.value = '';
    ordersPage.value = 1;
    await router.push({name: 'admin-orders', query: query.value});
    await onFetchOrders();
};

watch(localSearch, async (newValue) => {
    if (newValue === '') {
        await handleClearSearch();
    }
});

// Telegram section
const handleTgBackButton = () => {
    router.go(-1);
};

// On mounted actions
onMounted(onFetchOrders);
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

        <v-card
            v-if="paginatedOrders !== undefined && paginatedOrders?.length != 0 && !isLoading && !isServiceUnavailable"
            class="w-100"
            variant="flat">
            <TheAdminOrdersList
                :orders="paginatedOrders"
            />
            <v-pagination
                v-if="total / PAGE_SIZE > 1"
                v-model="ordersPage"
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
        <div v-else-if="!isLoading && paginatedOrders?.length == 0 && !isServiceUnavailable">
            <span class="d-flex justify-center"><br>Нет заказов по заданным параметрам</span>
        </div>
        <div v-else-if="!isLoading && !paginatedOrders && isServiceUnavailable">
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