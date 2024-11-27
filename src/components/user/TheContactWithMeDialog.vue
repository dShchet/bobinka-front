<script lang="ts" setup>
import {useWebApp, useWebAppTheme} from "vue-tg";
import {computed, onMounted, Ref, ref, watch} from "vue";
import {useScreenStore} from "~/stores/screen.ts";
import {storeToRefs} from "pinia";
import {useUserInfoStore} from "~/stores/userInfo.ts";
import {convertKeysToCamelCase} from "~/utils/converters.ts";
import {type UserCheckoutSavedData} from "~/interfaces/checkoutSavedData.ts";
import {getUserCheckoutSavedData, processContactWithMe} from "~/utils/api.ts";

// Common section
const {themeParams, colorScheme} = useWebAppTheme();
const {isPlatformUnknown} = useWebApp();

const showMainDialog = ref<boolean>(false);
const showSuccessDialog = ref<boolean>(false);
const showFailureDialog = ref<boolean>(false);
const form = ref<boolean>(false);

const successText = computed(
    () => `Спасибо за Вашу заявку!
    \nМы скоро с Вами свяжемся по указанному номеру:
    \n${inputtedPhoneNumber.value}`
);

const onSubmit = () => {
    if (!form.value) {
        return;
    }
};

const onProcessContactWithMe = async () => {
    showMainDialog.value = false;
    if (inputtedPhoneNumber.value?.charAt(0) === "8") {
        inputtedPhoneNumber.value = "+7" + inputtedPhoneNumber.value.slice(1);
    }
    if (inputtedPhoneNumber.value?.charAt(0) === "7") {
        inputtedPhoneNumber.value = "+" + inputtedPhoneNumber.value;
    }
    const response = await processContactWithMe({
        name: inputtedName.value as string,
        phone: inputtedPhoneNumber.value as string,
        comment: inputtedComment.value,
    });
    if (!response.ok) {
        showFailureDialog.value = true;
    } else {
        showSuccessDialog.value = true;
    }
    setTimeout(() => {
        showSuccessDialog.value = false;
        showFailureDialog.value = false;
        inputtedName.value = undefined;
        inputtedPhoneNumber.value = undefined;
        inputtedComment.value = undefined;
    }, 2000);
};

// Stores section
const screenStore = useScreenStore();
const {isWideScreen} = storeToRefs(screenStore);

const userInfoStore = useUserInfoStore();
const {isAuthenticated} = storeToRefs(userInfoStore);

// Checkout saved data section
const userCheckoutSavedData: Ref<{
    fullname?: string,
    phone?: string,
}> = ref({fullname: undefined, phone: undefined});

const onFetchUserCheckoutSavedData = async () => {
    const response = await getUserCheckoutSavedData();
    if (!response.ok) {
        console.error(response);
    } else {
        const result = convertKeysToCamelCase(await response.json()) as UserCheckoutSavedData;
        userCheckoutSavedData.value.fullname = result.fullname;
        userCheckoutSavedData.value.phone = result.phone;
        if (userCheckoutSavedData.value.phone?.startsWith('7')) {
            userCheckoutSavedData.value.phone = '+' + userCheckoutSavedData.value.phone;
        }
    }
};

// Inputted name section
const inputtedName = ref<string | undefined>(undefined);

const nameRules = [
    (v: string) => !!v || 'Это поле обязательно к заполнению',
];

// Inputted phone number section
const inputtedPhoneNumber = ref<string | undefined>(undefined);

const phoneNumberLengthRule = (phoneNumber: string): boolean | string => {
    if (phoneNumber.startsWith('+7')) {
        return phoneNumber.length === 12 || 'Введите полный номер телефона';
    } else if (phoneNumber.startsWith('8')) {
        return phoneNumber.length === 11 || 'Введите полный номер телефона';
    } else {
        return 'Введите полный номер телефона';
    }
};

const phoneNumberValidationRule = (phoneNumber: string): boolean | string => {
    const phoneRegex = /^[0-9+]+$/;
    return phoneRegex.test(phoneNumber) || 'Номер телефона может содержать только цифры и знак +';
};

const phoneNumberRules = [
    (v: string) => !!v || 'Это поле обязательно к заполнению',
    (v: string) => phoneNumberLengthRule(v),
    (v: string) => phoneNumberValidationRule(v),
];

watch(inputtedPhoneNumber, (newValue) => {
    if (!newValue) {
        return;
    }
    if (inputtedPhoneNumber.value?.length === 1 && newValue) {
        if (newValue.startsWith('8')) {
            return;
        }
        if (!newValue.startsWith('+')) {
            inputtedPhoneNumber.value = '+7' + newValue;
        }
    }
});

// Inputted comment section
const inputtedComment = ref<string | undefined>(undefined);

// On mounted actions
onMounted(async () => {
    if (isAuthenticated.value) {
        await onFetchUserCheckoutSavedData();
    }
});
</script>

<template>
    <v-dialog
        v-model="showMainDialog"
        max-width="fit-content"
    >
        <template v-slot:activator="{ props }">
            <v-layout
                :class="{
                'mb-17-5': !isWideScreen,
                'contact-with-me-button-layout-in-cart': !isWideScreen && $route.path === '/cart',
                'contact-with-me-button-layout': $route.path !== '/cart' || isWideScreen && $route.path === '/cart',
            }"
                class="d-flex justify-start position-fixed"
            >
                <v-menu location="end" open-on-hover>
                    <template v-slot:activator="{ props }">
                        <v-btn
                            :size="isPlatformUnknown ? 'large' : 'small'"
                            class="mt-auto"
                            fab
                            icon
                            v-bind="props"
                            z-index="2000"
                            @click="showMainDialog = true"
                        >
                            <v-icon>mdi-comment-question-outline</v-icon>
                        </v-btn>
                    </template>

                    <v-btn v-bind="props">Связаться со мной</v-btn>
                </v-menu>
            </v-layout>
        </template>
        <v-card>
            <div class="d-flex justify-space-between pr-3">
                <v-card-text><b>Заполните данные, и с Вами скоро свяжутся</b></v-card-text>
                <v-btn
                    :dark="colorScheme === 'light'"
                    class="not-primary align-self-center"
                    color="transparent"
                    icon
                    size="small"
                    variant="flat"
                    @click="showMainDialog = false"
                >
                    <v-icon>mdi-close</v-icon>
                </v-btn>
            </div>
            <v-divider></v-divider>
            <v-container class="pa-5">
                <v-form v-model="form" @submit.prevent="onSubmit">
                    <v-slide-x-transition>
                        <v-card-text
                            v-if="inputtedName !== userCheckoutSavedData.fullname"
                            class="pa-2 link"
                            @click="inputtedName=userCheckoutSavedData.fullname"
                        >
                            {{ userCheckoutSavedData.fullname }}
                        </v-card-text>
                    </v-slide-x-transition>
                    <v-text-field
                        v-model="inputtedName"
                        :clearable="true"
                        :rules="nameRules"
                        :theme="colorScheme"
                        label="Имя"
                        variant="solo-filled"
                    >
                    </v-text-field>

                    <v-slide-x-transition>
                        <v-card-text
                            v-if="inputtedPhoneNumber !== userCheckoutSavedData.phone"
                            class="pa-2 link"
                            @click="inputtedPhoneNumber=userCheckoutSavedData.phone"
                        >
                            {{ userCheckoutSavedData.phone }}
                        </v-card-text>
                    </v-slide-x-transition>
                    <v-text-field
                        v-model="inputtedPhoneNumber"
                        :clearable="true"
                        :rules="phoneNumberRules"
                        :theme="colorScheme"
                        inputmode="numeric"
                        label="Номер телефона"
                        outlined
                        variant="solo-filled"
                    ></v-text-field>

                    <v-text-field
                        v-model="inputtedComment"
                        :clearable="true"
                        :theme="colorScheme"
                        class="my-3"
                        hint="Необязательно"
                        label="Комментарий"
                        persistent-hint
                        variant="solo-filled"
                    >
                    </v-text-field>
                </v-form>
            </v-container>

            <v-divider></v-divider>
            <v-card-actions>
                <v-btn
                    :color="themeParams.button_color ?? 'primary'"
                    class="not-primary w-100"
                    size="large"
                    variant="tonal"
                    @click="onProcessContactWithMe"
                >
                    Оставить заявку
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

    <v-dialog
        v-model="showSuccessDialog"
        max-width="fit-content"
    >
        <v-alert
            class="multi-line"
            title="Заказ успешно оформлен!"
            type="success"
        >
            {{ successText }}
        </v-alert>
    </v-dialog>

    <v-dialog
        v-model="showFailureDialog"
        max-width="fit-content"
    >
        <v-alert
            title="Что-то пошло не так! Попробуйте еще раз"
            type="error"
        ></v-alert>
    </v-dialog>
</template>

<style lang="scss" scoped>
.link {
    cursor: pointer;
    width: fit-content;
    font-weight: bold;
    color: var(--tg-theme-button-color, rgb(var(--v-theme-primary)));

    &:hover {
        text-decoration: underline;
    }
}

.v-card {
    background-color: var(--tg-theme-bg-color, rgb(var(--v-theme-background)));
    color: var(--tg-theme-text-color, rgb(var(--v-theme-on-surface)));
}

.v-card-actions .v-btn {
    background-color: var(--tg-theme-secondary-bg-color, rgb(var(--v-theme-background)));
}

.contact-with-me-button-layout {
    bottom: 0;
    left: 0;
    padding: 0 0 7px 7px;
}

.contact-with-me-button-layout-in-cart {
    top: 0;
    right: 0;
    padding: 7px 7px 0 0;
}

.contact-with-me-button {
    border: 2px solid #fff;
}

.mb-17-5 {
    margin-bottom: 17.5%;
}
</style>
