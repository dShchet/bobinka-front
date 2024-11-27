<script lang="ts" setup>
import TheTelegramLogin from "~/components/user/TheTelegramLogin.vue";
import {TG_BOT_NAME} from "~/config/constants.ts";
import {useUserInfoStore} from "~/stores/userInfo.ts";
import {storeToRefs} from "pinia";
import {onMounted} from "vue";
import {useRoute, useRouter} from "vue-router";
import TheHeader from "~/components/user/TheHeader.vue";
import {useScreenStore} from "~/stores/screen.ts";
import {getMetaFromRef} from "~/utils/navigation.ts";
import TheMobileFooter from "~/components/user/TheMobileFooter.vue";
import {useEULAStore} from "~/stores/eula.ts";

// Common section
const route = useRoute();
const router = useRouter();

const params = new URLSearchParams(route.query.fromQuery as Record<any, any>);
const query: Record<any, any> = {};
for (const [key, value] of params) {
    query[key] = value;
}
const from = getMetaFromRef(route);

// Stores section
const userInfoStore = useUserInfoStore();
const {isAuthenticated} = storeToRefs(userInfoStore);

const screenStore = useScreenStore();
const {isWideScreen} = storeToRefs(screenStore);

const EULAStore = useEULAStore();

// User data section
const payloadData = {
    'isEulaChoiceRemembered': EULAStore.getChoiceFromLocalStorage(),
};

// On mounted actions
onMounted(async () => {
    if (isAuthenticated.value) {
        await router.push({path: route.query.from as string ?? "/articles", query: query});
    }
})
</script>

<template>
    <v-layout>
        <TheHeader
            v-if="isWideScreen"
            :previous-view-name="from.name"
            :previous-view-params="from.params"
            :previous-view-query="from.query"
            bar-title="Авторизация"
        />
    </v-layout>
    <v-card
        :class="{'mt-15': isWideScreen, 'mb-15': !isWideScreen}"
        class="mx-auto d-flex flex-column text-center"
        height="300px"
        max-width="800px"
        variant="flat"
    >
        <h1>Авторизация</h1>
        <v-card class="mt-5 d-flex justify-center h-100">
            <div class="d-flex flex-column justify-start">
                <h2>Telegram</h2>
                <div class="pa-2 w-75 mx-auto">
                    Если при открытии Telegram ничего не происходит,
                    то закройте его, откройте снова и нажмите на кнопку еще раз.
                </div>
                <TheTelegramLogin
                    :payload-data="payloadData"
                    :telegram-login="TG_BOT_NAME"
                    class="mx-auto mt-3"
                />
            </div>
        </v-card>
    </v-card>
    <TheMobileFooter v-if="!isWideScreen"/>
</template>

<style scoped>

</style>
