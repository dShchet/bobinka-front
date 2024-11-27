<script lang="ts" setup>
import {useScreenStore} from "~/stores/screen.ts";
import {storeToRefs} from "pinia";
import TheAdminNavigation from "~/components/admin/TheAdminNavigation.vue";
import {onMounted} from "vue";
import {onAdminTelegramWebAppLogin} from "~/utils/common.ts";
import {useWebApp, useWebAppViewport} from "vue-tg";
import {useAdminInfoStore} from "~/stores/adminInfo.ts";
import {useRoute, useRouter} from "vue-router";

// Common section
const route = useRoute();
const router = useRouter();

const {isPlatformUnknown, initDataUnsafe} = useWebApp();
const {expand} = useWebAppViewport();

// Stores section
const screenStore = useScreenStore();
const {isWideScreen} = storeToRefs(screenStore);

const adminInfoStore = useAdminInfoStore();
const {isAdminAuthenticated} = storeToRefs(adminInfoStore);

// Navigation section
const navigateToAdminArticles = async (middleClick: boolean = false) => {
    if (middleClick) {
        const routeData = router.resolve({name: 'admin-articles'});
        window.open(routeData.href, '_blank');
        return;
    }
    await router.push({name: 'admin-articles'});
};

const navigateToAdminFastPreorders = async (middleClick: boolean = false) => {
    if (middleClick) {
        const routeData = router.resolve({name: 'admin-fast-preorders'});
        window.open(routeData.href, '_blank');
        return;
    }
    await router.push({name: 'admin-fast-preorders'});
};

const navigateToAdminOrders = async (middleClick: boolean = false) => {
    if (middleClick) {
        const routeData = router.resolve({name: 'admin-orders'});
        window.open(routeData.href, '_blank');
        return;
    }
    await router.push({name: 'admin-orders'});
};

const navigateToAdminCompetitors = async (middleClick: boolean = false) => {
    if (middleClick) {
        const routeData = router.resolve({name: 'admin-competitors'});
        window.open(routeData.href, '_blank');
        return;
    }
    await router.push({name: 'admin-competitors'});
};

// On mounted actions
onMounted(async () => {
    if (!isPlatformUnknown) {
        expand();
        await onAdminTelegramWebAppLogin(initDataUnsafe);
    } else if (isPlatformUnknown && !isAdminAuthenticated.value) {
        const queryString = new URLSearchParams(route.query as Record<string, string>).toString();
        await router.push({path: "/admin/login", query: {from: route.fullPath, fromQuery: queryString}});
    }
});
</script>

<template>
    <TheAdminNavigation/>
    <v-container
        :class="{'w-75': isWideScreen, 'w-100': !isWideScreen}"
        class="navigation d-flex flex-column align-center mt-15"
    >
        <div class="button-group">
            <v-btn :disabled="true">Предзаказы</v-btn>
            <v-btn :disabled="true">Поставщики</v-btn>
        </div>

        <div class="button-group">
            <v-btn
                @click="navigateToAdminArticles(false)"
                @click.middle="navigateToAdminArticles(true)"
                @mousedown.middle.prevent.stop
            >
                Артикулы
            </v-btn>
            <v-btn :disabled="true">Мастерклассы</v-btn>
        </div>

        <div class="button-group">
            <v-btn :disabled="true">Поддержка</v-btn>
            <v-btn :disabled="true">Рассылка</v-btn>
        </div>

        <div class="button-group">
            <v-btn :disabled="true">Отчеты</v-btn>
            <v-btn
                @click="navigateToAdminOrders(false)"
                @click.middle="navigateToAdminOrders(true)"
                @mousedown.middle.prevent.stop
            >
                Заказы
            </v-btn>
        </div>

        <div class="button-group">
            <v-btn :disabled="true">Цвета в 1С</v-btn>
            <v-btn :disabled="true">Рейтинги</v-btn>
        </div>

        <div class="button-group">
            <v-btn :disabled="true">Экспорт из ПР</v-btn>
            <v-btn :disabled="true">Рефералы</v-btn>
        </div>

        <div class="button-group">
            <v-btn
                @click="navigateToAdminFastPreorders(false)"
                @click.middle="navigateToAdminFastPreorders(true)"
                @mousedown.middle.prevent.stop
            >
                Быстрые предзаказы
            </v-btn>
            <v-btn
                @click="navigateToAdminCompetitors(false)"
                @click.middle="navigateToAdminCompetitors(true)"
            >
                Конкуренты
            </v-btn>
        </div>
    </v-container>
</template>

<style lang="scss" scoped>
.v-btn {
    padding: 1%;
}

.button-group {
    display: flex;
    width: 100%;
    padding: 0;
    justify-content: space-between;
    margin-bottom: 10px;

    &:last-of-type {
        margin-bottom: 0;
    }

    @for $i from 1 through 4 {
        .v-btn:first-child:nth-last-child(#{$i}),
        .v-btn:first-child:nth-last-child(#{$i}) ~ .v-btn {
            @if $i == 1 {
                width: 100%;
            } @else {
                width: calc(100% / $i) - 1%;
            }
        }
    }
}
</style>
