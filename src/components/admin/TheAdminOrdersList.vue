<script lang="ts" setup>
import {AdminOrder} from "~/interfaces/admin/order.ts";
import {useRouter} from "vue-router";
import {useScreenStore} from "~/stores/screen.ts";
import {storeToRefs} from "pinia";
import TheAdminOrdersListItem from "~/components/admin/TheAdminOrdersListItem.vue";

// Common section
const props = defineProps<{
    orders: AdminOrder[];
}>();

const router = useRouter();

const navigateToOrder = async (id: number, middleClick: boolean = false) => {
    if (middleClick) {
        const routeData = router.resolve({name: 'admin-order', params: {id: id}});
        window.open(routeData.href, '_blank');
        return;
    }
    await router.push({name: 'admin-order', params: {id: id}});
};

// Stores section
const screenStore = useScreenStore();
const {isWideScreen} = storeToRefs(screenStore);
</script>

<template>
    <v-card :class="{'w-75': isWideScreen, 'w-100': !isWideScreen}" class="d-flex flex-column pa-5 mx-auto"
            variant="flat">
        <v-divider></v-divider>
        <div v-for="order in orders">
            <TheAdminOrdersListItem
                :key="order.id"
                :order="order"
                @click="navigateToOrder(order.id, false)"
                @click.middle="navigateToOrder(order.id, true)"
                @mousedown.middle.prevent.stop
            />
            <v-divider></v-divider>
        </div>
    </v-card>
</template>

<style lang="scss" scoped>
.v-card, .v-card * {
    background-color: var(--tg-theme-bg-color, rgb(var(--v-theme-background)));
    color: var(--tg-theme-text-color, rgb(var(--v-theme-text-base)));
}
</style>