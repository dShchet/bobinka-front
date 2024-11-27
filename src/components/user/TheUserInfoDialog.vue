<script lang="ts" setup>
import {User} from "~/interfaces/user.ts";
import {useWebAppTheme} from "vue-tg";
import {setUserAddress, setUserPhone} from "~/utils/api.ts";
import {useUserInfoStore} from "~/stores/userInfo.ts";
import {ref, watch} from "vue";
import {useScreenStore} from "~/stores/screen.ts";
import {storeToRefs} from "pinia";

// Common section
const props = defineProps<{
    modelValue: boolean,
    user: User,
}>();

const emit = defineEmits<{
    'update:modelValue': [value: boolean],
    'update:user': [value: User],
}>();

const {colorScheme, themeParams} = useWebAppTheme();

const localModelValue = ref<boolean>(props.modelValue);
const localUser = ref<User>(props.user);

watch(() => props.modelValue, (newValue) => {
    localModelValue.value = newValue;
});

watch(localModelValue, (newValue) => {
    emit('update:modelValue', newValue);
});

watch(() => props.user, (newValue) => {
    localUser.value = newValue;
});

watch(localUser, (newValue) => {
    emit('update:user', newValue);
});

// Stores section
const userInfoStore = useUserInfoStore();
const screenStore = useScreenStore();
const {isWideScreen} = storeToRefs(screenStore);

// Form section
const form = ref<boolean>(false);

const requiredInputRule = [
    (v: string) => !!v || 'Обязательно',
];

const onSubmit = () => {
    if (!form.value) {
        return;
    }
};

const onSave = async () => {
    let phoneErrorFlag = false;
    let addressErrorFlag = false;

    if (inputtedPhoneNumber.value) {
        const response = await setUserPhone(inputtedPhoneNumber.value as string);
        if (response.ok) {
            localUser.value = await userInfoStore.get(true) as User;
        } else {
            console.error('Failed to change phone');
            phoneErrorFlag = true;
        }
    }

    if (inputtedAddress.value) {
        const address = inputtedAddress.value?.trim() || null;
        const response = await setUserAddress(address);
        if (response.ok) {
            localUser.value = await userInfoStore.get(true) as User;
        } else {
            console.error('Failed to change address');
            addressErrorFlag = true;
        }
    }

    if (phoneErrorFlag && !addressErrorFlag) {
        snackbarText.value = 'Не удалось изменить номер телефона';
    } else if (!phoneErrorFlag && addressErrorFlag) {
        snackbarText.value = 'Не удалось изменить адрес';
    } else if (phoneErrorFlag && addressErrorFlag) {
        snackbarText.value = 'Не удалось изменить номер телефона и адрес';
    } else {
        snackbarText.value = 'Данные успешно изменены';
    }

    showSnackbar.value = true;
    localModelValue.value = false;
};

// Snackbar section
const showSnackbar = ref<boolean>(false);
const snackbarText = ref<string>('');

// Phone number section
const inputtedPhoneNumber = ref<string>('');

const phoneNumberLengthRule = (phoneNumber: string): boolean | string => {
    if (phoneNumber.startsWith('+7')) {
        return phoneNumber.length === 12 || 'Полный номер телефона';
    } else if (phoneNumber.startsWith('8')) {
        return phoneNumber.length === 11 || 'Полный номер телефона';
    } else {
        return 'Полный номер телефона';
    }
};

const phoneNumberValidationRule = (phoneNumber: string): boolean | string => {
    const phoneRegex = /^[0-9+]+$/;
    return phoneRegex.test(phoneNumber) || 'Только цифры и знак +';
};

const phoneNumberRules = [
    (v: string) => phoneNumberValidationRule(v),
    (v: string) => phoneNumberLengthRule(v),
];

// Address section
const inputtedAddress = ref<string>('');
</script>

<template>
    <v-dialog
        v-model="localModelValue"
        :persistent="true"
        max-width="450px"
    >
        <v-card class="d-flex">
            <div class="d-flex justify-space-between pr-3">
                <v-card-title><b>Введите контактные данные</b></v-card-title>
                <v-btn
                    :dark="colorScheme === 'light'"
                    class="not-primary align-self-center"
                    color="transparent"
                    icon
                    size="small"
                    variant="flat"
                    @click="localModelValue = false;"
                >
                    <v-icon>mdi-close</v-icon>
                </v-btn>
            </div>

            <v-divider></v-divider>

            <div class="pa-3">
                <v-form v-model="form" @submit.prevent="onSubmit">
                    <v-text-field
                        v-if="!user.phone"
                        v-model="inputtedPhoneNumber"
                        :clearable="true"
                        :rules="[...requiredInputRule, ...phoneNumberRules]"
                        :theme="colorScheme"
                        label="Номер телефона"
                        variant="solo-filled"
                    >
                    </v-text-field>

                    <v-text-field
                        v-if="!user.address"
                        v-model="inputtedAddress"
                        :clearable="true"
                        :rules="requiredInputRule"
                        :theme="colorScheme"
                        inputmode="numeric"
                        label="Адрес"
                        variant="solo-filled"
                    ></v-text-field>
                </v-form>
            </div>

            <v-divider></v-divider>

            <v-card-actions class="mx-auto">
                <v-btn :disabled="!form" @click="onSave">
                    Сохранить
                </v-btn>
                <v-btn
                    :color="themeParams.button_color ?? 'primary'"
                    class="not-primary"
                    variant="tonal"
                    @click="localModelValue = false;"
                >
                    Закрыть
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

    <v-snackbar
        v-model="showSnackbar"
        :class="{'mb-20': !isWideScreen}"
        :color="themeParams.bg_color ?? 'grey-lighten-5'"
        timeout="3000"
    >
        {{ snackbarText }}
        <template v-slot:actions>
            <v-btn
                :color="themeParams.button_color ?? 'primary'"
                class="not-primary"
                variant="text"
                @click="showSnackbar = false"
            >
                Закрыть
            </v-btn>
        </template>
    </v-snackbar>
</template>

<style lang="scss" scoped>

</style>