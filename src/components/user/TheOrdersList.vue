<script lang="ts" setup>
import TheOrdersListItem from "~/components/user/TheOrdersListItem.vue";
import {getUserArchivedOrders, getUserPreorders} from "~/utils/api.ts";
import {onMounted, ref, watch} from "vue";
import TheLoader from "~/components/user/TheLoader.vue";
import {ORDERS_PAGE_SIZE} from "~/config/constants.ts";
import {useScreenStore} from "~/stores/screen.ts";
import {storeToRefs} from "pinia";
import {convertKeysToCamelCase} from "~/utils/converters.ts";
import {PaginatedApiData} from "~/interfaces/apiData.ts";
import {type Order} from "~/interfaces/order.ts";

// Common section
const props = defineProps<{
    archive?: boolean,
}>();

// Stores section
const screenStore = useScreenStore();
const {isWideScreen} = storeToRefs(screenStore);

// Orders section
const isLoading = ref<boolean>(false);
const total = ref<number>(0);

const ordersPage = ref<number>(1);
const paginatedOrders = ref<Order[] | undefined>(undefined);

const onFetchOrders = async () => {
    isLoading.value = true;
    let response;
    if (!props.archive) {
        response = await getUserPreorders(ordersPage.value);
    } else {
        response = await getUserArchivedOrders(ordersPage.value);
    }
    if (!response.ok) {
        isLoading.value = false;
        console.error(response);
    } else {
        const pagedResult = convertKeysToCamelCase(await response.json()) as PaginatedApiData<Order>;
        paginatedOrders.value = pagedResult.results;
        ordersPage.value = pagedResult.page;
        total.value = pagedResult.total;
        isLoading.value = false;
    }
};

const onArchiveUpdate = async () => {
    location.reload();
};

watch(ordersPage, async () => {
    isLoading.value = true;
    await onFetchOrders();
    isLoading.value = false;
});

// On mounted actions
onMounted(onFetchOrders);
</script>

<template>
    <v-list v-if="paginatedOrders">
        <v-divider></v-divider>
        <TheOrdersListItem
            v-for="order in paginatedOrders"
            :key="order.id"
            :archive="archive"
            :order="order"
            @archive:order-id="onArchiveUpdate"
            @unarchive:order-id="onArchiveUpdate"
        />
        <v-pagination
            v-if="total / ORDERS_PAGE_SIZE > 1"
            v-model="ordersPage"
            :length="Math.ceil(total / ORDERS_PAGE_SIZE)"
            :size="!isWideScreen ? 'small' : 'default'"
            :total-visible="4"
        ></v-pagination>
    </v-list>
    <TheLoader v-else/>
</template>

<style lang="scss" scoped>
.v-list {
    background-color: var(--tg-theme-secondary-bg-color, rgb(var(--v-theme-background)));
    color: var(--tg-theme-text-color, rgb(var(--v-theme-on-surface)));
}
</style>
