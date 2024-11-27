<script lang="ts" setup>
import {onMounted, ref} from "vue";
import {storeToRefs} from "pinia";
import {useCartStore} from "~/stores/cart.ts";
import {onFetchUserCart} from "~/utils/common.ts";
import TheCartListItem from "~/components/user/TheCartListItem.vue";
import {type CartItem} from "~/interfaces/cart.ts";

// Common section
const props = defineProps<{
    itemIds: number[],
}>();

// Stores section
const cartStore = useCartStore();
const {cart} = storeToRefs(cartStore);

// Cart items section
const cartItems = ref<CartItem[]>([]);

// On mounted actions
onMounted(async () => {
    await onFetchUserCart();
    cartItems.value = cart.value.filter(cartItem => props.itemIds.includes(cartItem.id));
});
</script>

<template>
    <v-list>
        <v-divider></v-divider>
        <TheCartListItem v-for="(cartItem) in cartItems" :key="cartItem.id" :cart-item="cartItem"/>
    </v-list>
</template>

<style lang="scss" scoped>
.v-list {
    background-color: var(--tg-theme-secondary-bg-color, rgb(var(--v-theme-background)));
    color: var(--tg-theme-text-color, rgb(var(--v-theme-on-surface)));
}
</style>
