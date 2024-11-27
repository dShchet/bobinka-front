<script lang="ts" setup>
import TheLoader from "~/components/user/TheLoader.vue";
import {onMounted, ref} from "vue";
import {useRoute, useRouter} from "vue-router";
import {userConfirmAuthViaTelegram} from "~/utils/api.ts";
import {convertKeysToCamelCase} from "~/utils/converters.ts";
import {UserAuthDataResponse} from "~/interfaces/authData.ts";
import {useUserInfoStore} from "~/stores/userInfo.ts";

// Common section
const route = useRoute();
const router = useRouter();

const authCode = ref<string>(route.query.code as string);

const onUserConfirmAuth = async () => {
    const response = await userConfirmAuthViaTelegram(authCode.value);

    if (response.ok) {
        const result = convertKeysToCamelCase(await response.json()) as UserAuthDataResponse;
        if (!result) {
            location.reload();
        }
        await userInfoStore.get();

        showSuccessDialog.value = true;

        await new Promise(r => setTimeout(r, 3000));
        await router.push({name: 'article-colors'});
    } else {
        const text = await response.text();
        if (text.includes('Auth code expired')) {
            failureText.value = 'Срок действия кода авторизации истек.\nПопробуйте авторизоваться еще раз.';
        } else if (text.includes('Auth code invalid')) {
            failureText.value = 'Найден более новый код авторизации.\nПопробуйте авторизоваться еще раз, используя ПОСЛЕДНИЙ код.';
        } else {
            failureText.value = 'Что-то пошло не так.\nПопробуйте авторизоваться еще раз.';
        }
        showFailureDialog.value = true;

        await new Promise(r => setTimeout(r, 3000));
        await router.push({name: 'login'});
    }
};

// Stores section
const userInfoStore = useUserInfoStore();

// Dialogs section
const showSuccessDialog = ref<boolean>(false);
const showFailureDialog = ref<boolean>(false);

const failureText = ref<string>('');

// On mounted actions
onMounted(onUserConfirmAuth);
</script>

<template>
    <div class="mx-auto mt-5 d-flex justify-center">
        <TheLoader/>
    </div>

    <v-dialog
        v-model="showSuccessDialog"
        max-width="fit-content"
    >
        <v-alert
            text="Сейчас Вы будете перенаправлены на страницу с артикулами..."
            title="Авторизация прошла успешно!"
            type="success"
        ></v-alert>
    </v-dialog>

    <v-dialog
        v-model="showFailureDialog"
        max-width="fit-content"
    >
        <v-alert
            class="multi-line"
            title="Ошибка авторизации"
            type="error"
        >
            {{ failureText }}
        </v-alert>
    </v-dialog>
</template>

<style lang="scss" scoped>
.multi-line {
    white-space: pre-line;
}
</style>