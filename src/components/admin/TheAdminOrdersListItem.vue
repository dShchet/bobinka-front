<script lang="ts" setup>
import {AdminOrder} from "~/interfaces/admin/order.ts";
import {mapOrderStatus} from "~/utils/mappers.ts";

// Common section
const props = defineProps<{
    order: AdminOrder,
}>();
</script>

<template>
    <v-list-item>
        <v-card variant="flat">
            <v-card-text>
                <b>ID {{ order.id }}.</b> {{ mapOrderStatus(order.status) }}<br>
                <b>Пользователь:</b> {{ order.user.phone }}
            </v-card-text>
        </v-card>
    </v-list-item>
</template>

<style lang="scss" scoped>
.v-list-item, .v-list-item * {
    background-color: var(--tg-theme-secondary-bg-color, rgb(var(--v-theme-background)));
    color: var(--tg-theme-text-color, rgb(var(--v-theme-text-base)));
}
</style>