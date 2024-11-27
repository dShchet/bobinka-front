<script lang="ts" setup>
import {BackButton, useWebApp} from "vue-tg";
import TheAdminNavigation from "~/components/admin/TheAdminNavigation.vue";
import {useRouter} from "vue-router";
import {useAdminOrdersStore} from "~/stores/admin/orders.ts";
import {onMounted, ref} from "vue";
import {AdminOrder} from "~/interfaces/admin/order.ts";
import TheAdminOrderInfoCard from "~/components/admin/TheAdminOrderInfoCard.vue";

// Common section
const props = defineProps<{
    id: string,
}>();

const router = useRouter();

const {isPlatformUnknown} = useWebApp();

// Stores section
const ordersStore = useAdminOrdersStore();

// Order section
const order = ref<AdminOrder | undefined>(ordersStore.get(parseInt(props.id)) || undefined);

// Telegram section
const handleTgBackButton = () => {
    router.go(-1);
};

// On mounted actions
onMounted(async () => {
    if (!order.value) {
        order.value = await ordersStore.fetch(parseInt(props.id));
    }
});
</script>

<template>
    <TheAdminNavigation/>
    <BackButton
        v-if="!isPlatformUnknown"
        @click="handleTgBackButton"
    ></BackButton>

    <v-card
        v-if="order"
        class="mt-15 mb-10 d-flex flex-column pa-5 main-container mx-auto align-center"
        variant="flat"
    >
        <h1 class="mb-3">Информация о заказе №{{ order.id }}</h1>

        <TheAdminOrderInfoCard
            v-if="order"
            :order="order"
            @update:status="order.status = $event"
            @update:bobbin="order.matchedBobbins.find(bobbin => bobbin.id === $event.id)!.weight = $event.weight"
        />
    </v-card>
</template>

<style lang="scss" scoped>
.v-card, .v-card * {
    background-color: var(--tg-theme-bg-color, rgb(var(--v-theme-background)));
    color: var(--tg-theme-text-color, rgb(var(--v-theme-text-base)));
}
</style>