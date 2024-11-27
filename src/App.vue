<script lang="ts" setup>
import {onMounted, onUnmounted} from 'vue'
import {storeToRefs} from 'pinia';
import {useScreenStore} from '~/stores/screen';
import {useUserInfoStore} from '~/stores/userInfo';
import {useWebApp, useWebAppViewport} from 'vue-tg'
import TheContactWithMeDialog from "~/components/user/TheContactWithMeDialog.vue";
import TheEULADialog from "~/components/user/TheEULADialog.vue";
import {useCookiesStore} from "~/stores/cookies.ts";
import {onFetchUserCart, onUserTelegramWebAppLogin} from '~/utils/common';
import {useRoute} from "vue-router";
import {useAdminInfoStore} from "~/stores/adminInfo.ts";

// Common section
const route = useRoute();

const {isPlatformUnknown, initDataUnsafe, isPlatform} = useWebApp();
const {expand} = useWebAppViewport();

const onScroll = () => {
    scrollY.value = window.scrollY;
};

const onChangeWindowWidth = () => {
    windowWidth.value = window.innerWidth;
    isWideScreen.value = window.innerWidth > 600;
    isExtraSmallScreen.value = window.innerWidth <= 370;
};

const closeKeyboard = (event: Event) => {
    const inputElements = document.querySelectorAll('.v-input');

    const isClickedOnInput = Array.from(inputElements).some((input) =>
        input.contains(event.target as Node)
    );

    if (!isClickedOnInput) {
        (document.activeElement as HTMLElement).blur();
    }
};

// Stores section
const screenStore = useScreenStore();
const {windowWidth, isWideScreen, scrollY, isExtraSmallScreen} = storeToRefs(screenStore);

const userInfoStore = useUserInfoStore();
const {isAuthenticated} = storeToRefs(userInfoStore);

const adminInfoStore = useAdminInfoStore();

const cookiesStore = useCookiesStore();

// On mounted actions
onMounted(async () => {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
    .v-btn:not(.not-primary):not(.v-carousel .v-btn):not(.v-pagination .v-btn) {
        background-color: var(--tg-theme-button-color, rgb(var(--v-theme-primary)));
        color: var(--tg-theme-button-text-color, rgb(var(--v-theme-on-primary)));
    }

    body {
        background-color: var(--tg-theme-bg-color, rgb(var(--v-theme-background)));
    }
    `;
    document.head.appendChild(styleElement);

    onChangeWindowWidth();
    onScroll();

    if (!route.path.includes('admin')) {
        if (!isPlatformUnknown) {
            expand();
            await onUserTelegramWebAppLogin(initDataUnsafe);
        }
        if (isAuthenticated.value) {
            await onFetchUserCart();
        }
    }

    if (!cookiesStore.getCookie('bobinka_access_token')) {
        userInfoStore.clear();
    }
    if (!cookiesStore.getCookie('bobinka_admin_access_token')) {
        adminInfoStore.clear();
    }

    window.addEventListener('resize', onChangeWindowWidth);
    window.addEventListener('scroll', onScroll);

    if (isPlatform('ios')) {
        document.addEventListener('click', closeKeyboard);
    }
});

// On unmounted actions
onUnmounted(() => {
    window.removeEventListener('resize', onChangeWindowWidth);
    window.removeEventListener('scroll', onScroll);
    document.removeEventListener('click', closeKeyboard);
});
</script>

<template>
    <router-view/>
    <TheEULADialog v-if="!$route.path.includes('admin')"/>
    <TheContactWithMeDialog v-if="!$route.path.includes('admin')"/>
</template>
