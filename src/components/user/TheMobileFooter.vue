<script lang="ts" setup>
import {useCartStore} from "~/stores/cart.ts";
import {storeToRefs} from "pinia";
import {useRoute, useRouter} from "vue-router";
import {useUserInfoStore} from "~/stores/userInfo.ts";
import {WEB_URL} from "~/config/constants.ts";
import {computed, ref} from "vue";
import {useWebApp, useWebAppTheme} from "vue-tg";

// Common section
const route = useRoute();
const router = useRouter();

const {isPlatformUnknown} = useWebApp();
const {themeParams, colorScheme} = useWebAppTheme();

const mapSchemeToColor = computed(() => {
    if (isPlatformUnknown) {
        return 'white'
    }
    if (colorScheme.value === 'light') {
        return 'black';
    } else {
        return 'white';
    }
});

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
};

// Login section
const onLoginClick = async () => {
    const queryString = new URLSearchParams(route.query as Record<string, string>).toString();
    await router.push({name: 'login', query: {from: route.path, fromQuery: '?' + queryString}});
};
</script>

<template>
    <v-layout>
        <v-app-bar :color="themeParams.bg_color ?? 'primary'" location="bottom">
            <div class="d-flex justify-space-between w-100">
                <v-btn class="not-primary" icon size="x-large" @click="$router.push({name: 'article-colors'})">
                    <v-icon size="x-large">mdi-home-outline</v-icon>
                </v-btn>

                <v-btn class="not-primary" icon size="x-large" @click="$router.push({name: 'cart'})">
                    <v-badge
                        :color="mapSchemeToColor"
                        :content="cart.length"
                        :dot="cart.length === 0"
                    >
                        <v-icon size="x-large">mdi-cart-outline</v-icon>
                    </v-badge>
                </v-btn>

                <v-fade-transition>
                    <v-btn v-if="isArticlePage" class="not-primary" icon size="x-large" @click="copyCurrentURL">
                        <v-icon size="x-large">mdi-share-variant</v-icon>
                    </v-btn>
                </v-fade-transition>

                <v-btn
                    v-if="isAuthenticated"
                    class="not-primary"
                    icon
                    size="x-large"
                    @click="$router.push({name: 'profile'});"
                >
                    <v-icon size="x-large">mdi-account-outline</v-icon>
                </v-btn>
                <v-btn
                    v-else
                    class="not-primary"
                    icon
                    size="x-large"
                    @click="onLoginClick"
                >
                    <v-icon size="x-large">mdi-login-variant</v-icon>
                </v-btn>
            </div>

            <v-snackbar
                v-model="showCopySnackbar"
                :color="themeParams.secondary_bg_color ?? 'white'"
                class="mb-20"
                timeout="2000"
            >
                {{ copySnackbarText }}
                <template v-slot:actions>
                    <v-btn
                        :color="themeParams.button_color ?? 'primary'"
                        class="not-primary"
                        variant="text"
                        @click="showCopySnackbar = false"
                    >
                        Закрыть
                    </v-btn>
                </template>
            </v-snackbar>
        </v-app-bar>
    </v-layout>
</template>
