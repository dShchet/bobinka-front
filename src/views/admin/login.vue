<script lang="ts" setup>
import TheTelegramLogin from "~/components/user/TheTelegramLogin.vue";
import {TG_BOT_NAME} from "~/config/constants.ts";
import {storeToRefs} from "pinia";
import {onMounted} from "vue";
import {useRoute, useRouter} from "vue-router";
import {useScreenStore} from "~/stores/screen.ts";
import {useAdminInfoStore} from "~/stores/adminInfo.ts";

// Common section
const route = useRoute();
const router = useRouter();

const params = new URLSearchParams(route.query.fromQuery as Record<any, any>);
const query: Record<any, any> = {};
for (const [key, value] of params) {
    query[key] = value;
}

// Stores section
const adminInfoStore = useAdminInfoStore();
const {isAdminAuthenticated} = storeToRefs(adminInfoStore);

const screenStore = useScreenStore();
const {isWideScreen} = storeToRefs(screenStore);

// On mounted actions
onMounted(async () => {
    if (isAdminAuthenticated.value) {
        await router.push({path: route.query.from as string ?? "/admin", query: query});
    }
})
</script>

<template>
    <v-card
        :class="{'mt-15': isWideScreen, 'mb-15': !isWideScreen}"
        class="mx-auto d-flex flex-column text-center"
        height="300px"
        max-width="800px"
        variant="flat"
    >
        <h1>Авторизация как администратор</h1>
        <v-card class="mt-5 d-flex justify-center h-100">
            <div class="d-flex flex-column justify-start">
                <h2>Telegram</h2>
                <div class="pa-2 w-75 mx-auto">
                    Если при открытии Telegram ничего не происходит, то закройте его, откройте снова и нажмите на кнопку
                    еще раз.
                </div>
                <TheTelegramLogin
                    :admin-login="true"
                    :telegram-login="TG_BOT_NAME"
                    class="mx-auto mt-3"
                />
            </div>
        </v-card>
    </v-card>
</template>

<style scoped>

</style>
