<script lang="ts" setup>
import {BASE_URL} from "~/config/constants.ts";
import {openArticlePage} from "~/utils/navigation.ts";
import TheLoader from "~/components/user/TheLoader.vue";
import {type CartItem} from "~/interfaces/cart.ts";

const props = defineProps<{
    cartItem: CartItem,
}>();
</script>

<template>
    <v-list-item class="mb-1">
        <v-card class="d-flex justify-start float-left" variant="flat">
            <v-img
                :src="BASE_URL + `/articles/colors/photo/${cartItem.color.id}`"
                class="align-self-center"
                height="65px"
                style="cursor: pointer;"
                width="65px"
                @click="openArticlePage($router, {
                                id: cartItem.color.article.id,
                                colors: [{...cartItem.color}]
                            })"
            >
                <template v-slot:placeholder>
                    <TheLoader/>
                </template>
            </v-img>
            <v-card class="ml-1 align-self-center" variant="flat">
                <v-card-title><b>{{ cartItem.color.article.name }}</b></v-card-title>
                <v-card-subtitle>{{ cartItem.color.name }}</v-card-subtitle>
                <v-card-subtitle>Количество: {{ cartItem.quantity }}</v-card-subtitle>
            </v-card>
        </v-card>
        <v-card-title
            v-if="!cartItem.color.article.priceSale"
            class="float-right"
        >
            {{ cartItem.color.article.priceRetail }} ₽ / г
        </v-card-title>
        <v-card-title v-else class="float-right">
            <span class="not-sale-price">{{ cartItem.color.article.priceRetail }}</span>
            <b>&nbsp;{{ cartItem.color.article.priceSale }}</b> ₽ / г
        </v-card-title>
    </v-list-item>
    <v-divider></v-divider>
</template>

<style lang="scss" scoped>
.v-card {
    background-color: var(--tg-theme-secondary-bg-color, rgb(var(--v-theme-background)));
    color: var(--tg-theme-text-color, rgb(var(--v-theme-on-surface)));
}
</style>
