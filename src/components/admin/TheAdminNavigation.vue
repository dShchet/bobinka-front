<script lang="ts" setup>
import {ref} from "vue";
import {useWebApp, useWebAppTheme} from "vue-tg";
import {useRouter} from "vue-router";
import {adminLogout} from "~/utils/api.ts";
import {useAdminInfoStore} from "~/stores/adminInfo.ts";
import {useCookiesStore} from "~/stores/cookies.ts";

// Common section
const router = useRouter();

const {themeParams} = useWebAppTheme();
const {isPlatformUnknown} = useWebApp();

const items = [
    {
        title: 'Главная',
        viewName: 'admin-home',
    },
    {
        title: 'Быстрые предзаказы',
        viewName: 'admin-fast-preorders',
    },
    // {
    //     title: 'Поставщики',
    //     viewName: 'admin-suppliers',
    // },
    {
        title: 'Артикулы',
        viewName: 'admin-articles',
    },
    // {
    //     title: 'Мастерклассы',
    //     viewName: 'admin-master-classes',
    // },
    // {
    //     title: 'Поддержка',
    //     viewName: 'admin-support',
    // },
    // {
    //     title: 'Рассылка',
    //     viewName: 'admin-mailing',
    // },
    // {
    //     title: 'Отчеты',
    //     viewName: 'admin-reports',
    // },
    {
        title: 'Заказы',
        viewName: 'admin-orders',
    },
    // {
    //     title: 'Цвета в 1С',
    //     viewName: 'admin-colors',
    // },
    // {
    //     title: 'Рейтинги',
    //     viewName: 'admin-ratings',
    // },
    // {
    //     title: 'Экспорт из ПР',
    //     viewName: 'admin-export-from-pr',
    // },
    // {
    //     title: 'Рефералы',
    //     viewName: 'admin-referrals',
    // },
]

const drawer = ref<boolean>(false);

const navigateToView = async (viewName: string, middleClick: boolean = false) => {
    if (middleClick) {
        const routeData = router.resolve({name: viewName});
        window.open(routeData.href, '_blank');
        return;
    }
    await router.push({name: viewName});
};

// Stores section
const adminInfoStore = useAdminInfoStore();

const cookiesStore = useCookiesStore();

// Actions section
const onLogout = async () => {
    const response = await adminLogout();
    if (response.ok) {
        adminInfoStore.clear();
        cookiesStore.deleteCookie('bobinka_admin_access_token')
        await router.push({name: 'admin-login'});
    }
    location.reload();
};
</script>

<template>
    <v-layout>
        <v-app-bar
            :color="themeParams.button_color ?? 'primary'"
            density="compact"
            prominent
        >
            <v-app-bar-nav-icon variant="text" @click.stop="drawer = !drawer"></v-app-bar-nav-icon>
            <v-btn
                v-if="!['/admin', '/admin/login'].includes($route.path) && isPlatformUnknown"
                icon
                @click="$router.go(-1)"
            >
                <v-icon size="large">mdi-arrow-left</v-icon>
            </v-btn>

            <v-toolbar-title>Панель админа</v-toolbar-title>

            <template v-slot:append>
                <v-btn
                    v-if="isPlatformUnknown"
                    class="not-primary"
                    prepend-icon="mdi-logout-variant"
                    size="large"
                    variant="text"
                    @click="onLogout"
                >
                    <template v-slot:prepend>
                        <v-icon></v-icon>
                    </template>
                    <span class="align-self-center">Выйти</span>
                </v-btn>
            </template>
        </v-app-bar>

        <v-navigation-drawer
            v-model="drawer"
            :temporary="true"
            location="left"
        >
            <v-list>
                <v-list-item v-for="item in items" @click="$router.push({name: item.viewName})">
                    <span
                        class="link"
                        @click="navigateToView(item.viewName, false)"
                        @click.middle="navigateToView(item.viewName, true)"
                        @mousedown.middle.prevent.stop
                    >
                        {{ item.title }}
                    </span>
                </v-list-item>
            </v-list>
        </v-navigation-drawer>
    </v-layout>
</template>

<style lang="scss" scoped>
.v-app-bar * {
    color: var(--tg-theme-button-text-color, rgb(var(--v-theme-text-base)));
}

.v-navigation-drawer, .v-navigation-drawer * {
    background-color: var(--tg-theme-bg-color, rgb(var(--v-theme-background)));
    color: var(--tg-theme-text-color, rgb(var(--v-theme-text-base)));
}

.link {
    cursor: pointer;
    text-decoration: underline;
}
</style>
