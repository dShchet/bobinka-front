<script lang="ts" setup>
import {useRoute, useRouter} from "vue-router";
import {WEB_URL} from "~/config/constants.ts";
import {computed, ref} from "vue";
import {useCartStore} from "~/stores/cart.ts";
import {storeToRefs} from "pinia";
import {useUserInfoStore} from "~/stores/userInfo.ts";
import {useWebAppTheme} from "vue-tg";

// Common section
const props = defineProps<{
    barTitle: string,
    previousViewName?: string,
    previousViewParams?: object,
    previousViewQuery?: object,
}>();

const route = useRoute();
const router = useRouter();

const {themeParams} = useWebAppTheme();

const isArticlePage = computed(() => {
    return route.path.includes('/article/');
});

// Stores section
const cartStore = useCartStore();
const {cart} = storeToRefs(cartStore);

const userInfoStore = useUserInfoStore();
const {isAuthenticated} = storeToRefs(userInfoStore);

// Copy snackbar section
const showCopySnackbar = ref<boolean>(false);
const copySnackbarText = ref<string>('');

const copyCurrentURL = async () => {
    try {
        await navigator.clipboard.writeText(WEB_URL + route.fullPath);
        copySnackbarText.value = 'Ссылка скопирована!';
        showCopySnackbar.value = true;
    } catch ($e) {
        copySnackbarText.value = 'Не удалось скопировать ссылку!';
        showCopySnackbar.value = true;
    }
}

// Login section
const onLoginClick = async () => {
    const queryString = new URLSearchParams(route.query as Record<string, string>).toString();
    await router.push({name: 'login', query: {from: route.path, fromQuery: '?' + queryString}});
};
</script>

<template>
    <v-app-bar :color="themeParams.button_color ?? 'primary'" density="compact">
        <template v-slot:prepend>
            <v-btn
                v-if="previousViewName && $route.name !== 'article-colors'"
                @click="$router.push({name: previousViewName, params: previousViewParams as any, query: previousViewQuery as any})"
            >
                <v-icon size="x-large">mdi-arrow-left</v-icon>
            </v-btn>
            <v-btn class="text-none" @click="$router.push({name: 'article-colors'})">
                <v-icon size="x-large">mdi-home-outline</v-icon>
            </v-btn>
        </template>
        <span>{{ barTitle }}</span>
        <v-spacer></v-spacer>
        <template v-slot:append>
            <v-btn v-if="isArticlePage" icon="mdi-share-variant" size="x-large" @click="copyCurrentURL"></v-btn>
            <v-btn
                :stacked="true"
                class="text-none"
                size="x-large"
                @click="$router.push({name: 'cart'})"
            >
                <v-badge :content="cart.length" :dot="cart.length === 0" class="d-flex" color="white">
                    <span class="align-self-center">Корзина</span>
                    <v-icon>mdi-cart-outline</v-icon>
                </v-badge>
            </v-btn>
            <v-btn
                v-if="!isAuthenticated"
                class="text-none"
                size="x-large"
                @click="onLoginClick"
            >
                <span class="align-self-center">Войти</span>
                <v-icon size="x-large">mdi-login-variant</v-icon>
            </v-btn>
            <v-btn v-else class="text-none" size="x-large" @click="$router.push({name: 'profile'});">
                <span class="align-self-center">Профиль</span>
                <v-icon size="x-large">mdi-account-outline</v-icon>
            </v-btn>
        </template>
        <v-snackbar
            v-model="showCopySnackbar"
            color="white"
            timeout="2000"
        >
            {{ copySnackbarText }}
            <template v-slot:actions>
                <v-btn
                    color="primary"
                    variant="text"
                    @click="showCopySnackbar = false"
                >
                    Закрыть
                </v-btn>
            </template>
        </v-snackbar>
    </v-app-bar>
</template>
