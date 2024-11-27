<script lang="ts" setup>
import {getRefLink, logout, setUserAddress, setUserPhone, setWantsHotArticles} from "~/utils/api.ts";
import {useUserInfoStore} from "~/stores/userInfo.ts";
import {useRoute, useRouter} from "vue-router";
import {computed, onMounted, ref} from "vue";
import TheHeader from "~/components/user/TheHeader.vue";
import TheOrdersList from "~/components/user/TheOrdersList.vue";
import {useScreenStore} from "~/stores/screen.ts";
import {storeToRefs} from "pinia";
import {useCartStore} from "~/stores/cart.ts";
import {BackButton, useWebApp, useWebAppTheme} from "vue-tg";
import {type User} from "~/interfaces/user.ts";
import {getMetaFromRef} from "~/utils/navigation.ts";
import {useCookiesStore} from "~/stores/cookies.ts";
import {convertKeysToCamelCase} from "~/utils/converters.ts";
import TheMobileFooter from "~/components/user/TheMobileFooter.vue";
import TheYarnCalculatorDialog from "~/components/user/TheYarnCalculatorDialog.vue";

// Common section
const route = useRoute();
const router = useRouter();

const from = getMetaFromRef(route);

const {isPlatformUnknown} = useWebApp();
const {themeParams} = useWebAppTheme();

const tab = ref<number>(0);
const user = ref<User>();

const requiredInputRule = [
    (v: string) => !!v || 'Обязательно',
];

// Stores section
const userInfoStore = useUserInfoStore();

const screenStore = useScreenStore();
const {isWideScreen} = storeToRefs(screenStore);

const cartStore = useCartStore();
const {cart} = storeToRefs(cartStore);

const cookiesStore = useCookiesStore();

// Phone section
const showPhone = ref<boolean>(true);
const inputtedPhone = ref<string>('');
const showPhoneEdit = ref<boolean>(false);
const phoneLoading = ref<boolean>(false);

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

const onPhoneEditClick = () => {
    showPhone.value = false;
    inputtedPhone.value = userPhone.value || '';
    showPhoneEdit.value = true;
};

const onPhoneEditFocusOut = () => {
    if (!inputtedPhone.value) {
        showPhoneEdit.value = false;
    }
    showPhone.value = true;
};

const onSubmitPhoneEdit = async () => {
    if (
        !inputtedPhone.value
        || phoneNumberLengthRule(inputtedPhone.value) !== true
        || phoneNumberValidationRule(inputtedPhone.value) !== true
    ) {
        return;
    }
    if (inputtedPhone && inputtedPhone.value === userPhone.value) {
        showPhoneEdit.value = false;
        showPhone.value = true;
        return;
    }
    phoneLoading.value = true;
    const response = await setUserPhone(inputtedPhone.value as string);
    if (response.ok) {
        user.value = await userInfoStore.get(true);
        showPhoneEdit.value = false;
    } else {
        console.error('Failed to change phone')
    }
    phoneLoading.value = false;
};

const userPhone = computed(() => {
    if (user.value?.phone) {
        if (user.value.phone.startsWith('7')) {
            return '+' + user.value.phone;
        } else if (user.value.phone.startsWith('8')) {
            return '+7' + user.value.phone.slice(1);
        }
    }
    return user.value?.phone;
});

// Address section
const showAddress = ref<boolean>(true);
const inputtedAddress = ref<string>('');
const showAddressEdit = ref<boolean>(false);
const showInfoEditDialog = ref<boolean>(false);
const addressLoading = ref<boolean>(false);

const onAddressEditClick = () => {
    showAddress.value = false;
    inputtedAddress.value = user.value?.address ?? '';
    showAddressEdit.value = true;
};

const onAddressEditFocusOut = () => {
    if (!inputtedAddress.value) {
        showAddressEdit.value = false;
    }
    showAddress.value = true;
};

const onSubmitAddressEdit = async () => {
    if (inputtedAddress.value && inputtedAddress.value === user.value?.address) {
        showAddressEdit.value = false;
        showAddress.value = true;
        return;
    }
    const address = inputtedAddress.value?.trim() || null;
    addressLoading.value = true;
    const response = await setUserAddress(address);
    if (response.ok) {
        user.value = await userInfoStore.get(true);
        showAddressEdit.value = false;
        if (!address) {
            wantsHotArticlesCheckbox.value = false;
        }
    } else {
        console.error('Failed to change address')
    }
    addressLoading.value = false;
};

// Hot articles agreement section
const showHotArticlesAgreementDialog = ref<boolean>(false);

const onAgreeHotArticlesAgreement = async () => {
    showHotArticlesAgreementDialog.value = false;
    await onChangeWantsHotArticles();
};

const onDisagreeHotArticlesAgreement = async () => {
    showHotArticlesAgreementDialog.value = false;
    wantsHotArticlesCheckbox.value = false;
};

// Wants hot articles section
const wantsHotArticlesCheckbox = ref<boolean>();

const onChangeWantsHotArticles = async () => {
    const response = await setWantsHotArticles(wantsHotArticlesCheckbox.value as boolean);
    if (response.ok) {
        user.value = await userInfoStore.get(true);
    } else {
        console.error('Failed to change wants hot articles')
    }
};

const onChangeWantsHotArticlesCheckbox = async (newValue: boolean) => {
    if (newValue && (!user.value?.address || !user.value?.phone)) {
        showInfoEditDialog.value = true;
        return;
    }
    if (newValue) {
        showHotArticlesAgreementDialog.value = true;
        return;
    }
    await onChangeWantsHotArticles();
}

// Copy snackbar section
const showCopySnackbar = ref<boolean>(false);
const copySnackbarText = ref<string>('');

// Ref link section
const refLink = ref<string>('');

const onFetchRefLink = async () => {
    const response = await getRefLink();
    if (response.ok) {
        const result = convertKeysToCamelCase(await response.json()) as { refLink: string };
        refLink.value = result.refLink;
    }
};

const copyRefLink = async () => {
    try {
        await navigator.clipboard.writeText(refLink.value);
        copySnackbarText.value = 'Ссылка скопирована!';
        showCopySnackbar.value = true;
    } catch ($e) {
        copySnackbarText.value = 'Не удалось скопировать ссылку!';
        showCopySnackbar.value = true;
    }
};

// Actions section
const onLogout = async () => {
    const response = await logout();
    if (response.ok) {
        userInfoStore.clear();
        cart.value = [];
        cookiesStore.deleteCookie('bobinka_access_token')
        await router.push({name: 'article-colors'});
    }
    location.reload();
};

// Telegram section
const handleTgBackButton = async () => {
    await router.push({name: from.value.name, params: from.value.params, query: from.value.query});
};

// On mounted actions
onMounted(async () => {
    if (!userInfoStore.isAuthenticated) {
        await router.push({name: 'login'});
    } else {
        user.value = await userInfoStore.get(true);
        wantsHotArticlesCheckbox.value = user.value?.wantsHotArticles as boolean;
        await onFetchRefLink();
    }
});
</script>

<template>
    <v-layout>
        <TheHeader
            v-if="isWideScreen"
            :previous-view-name="from.name"
            :previous-view-params="from.params"
            :previous-view-query="from.query"
            bar-title="Личный кабинет"
        />
    </v-layout>
    <BackButton
        v-if="!isPlatformUnknown"
        @click="handleTgBackButton"
    ></BackButton>
    <v-card
        :class="{'mt-15 mb-15': isWideScreen, 'mb-40': !isWideScreen}"
        class="mx-auto d-flex justify-center"
        max-width="800px"
        variant="flat"
    >
        <v-card
            v-if="user"
            class="mx-3 d-flex flex-column"
            variant="flat"
            width="100%"
        >
            <h1 class="text-center">Профиль</h1>
            <v-card class="pa-3" variant="flat">
                <v-card-title><b>Имя:</b> {{ user.firstName }}</v-card-title>

                <v-card-title>
                    <b>Телефон:</b> {{ showPhone ? userPhone : '' }}
                    <v-fade-transition>
                        <v-btn
                            v-if="user.phone && showPhone"
                            color="transparent"
                            fab
                            icon
                            size="small"
                            variant="flat"
                            @click="onPhoneEditClick();"
                        >
                            <v-icon>mdi-pencil</v-icon>
                        </v-btn>
                        <v-btn
                            v-else-if="!user.phone && !showPhoneEdit"
                            color="transparent"
                            fab
                            variant="flat"
                            @click="showPhoneEdit = true"
                        >
                            Добавить
                            <v-icon>mdi-plus</v-icon>
                        </v-btn>
                        <v-text-field
                            v-else-if="showPhoneEdit"
                            v-model="inputtedPhone"
                            :autofocus="true"
                            :clearable="true"
                            :loading="phoneLoading"
                            :rules="[...requiredInputRule, ...phoneNumberRules]"
                            :single-line="true"
                            append-inner-icon="mdi-check"
                            density="compact"
                            label="Телефон"
                            @focusout="onPhoneEditFocusOut();"
                            @click:append-inner="onSubmitPhoneEdit"
                        ></v-text-field>
                    </v-fade-transition>
                </v-card-title>

                <v-card-text class="title">
                    <b>Адрес:</b> {{ showAddress ? user.address : '' }}
                    <v-fade-transition>
                        <v-btn
                            v-if="user.address && showAddress"
                            color="transparent"
                            fab
                            icon
                            size="small"
                            variant="flat"
                            @click="onAddressEditClick();"
                        >
                            <v-icon>mdi-pencil</v-icon>
                        </v-btn>
                        <v-btn
                            v-else-if="!user.address && !showAddressEdit"
                            color="transparent"
                            fab
                            variant="flat"
                            @click="showAddressEdit = true"
                        >
                            Добавить
                            <v-icon>mdi-plus</v-icon>
                        </v-btn>
                        <v-text-field
                            v-else-if="showAddressEdit"
                            v-model="inputtedAddress"
                            :autofocus="true"
                            :clearable="true"
                            :loading="addressLoading"
                            :single-line="true"
                            append-inner-icon="mdi-check"
                            class="mt-2"
                            density="compact"
                            label="Адрес"
                            @focusout="onAddressEditFocusOut();"
                            @click:append-inner="onSubmitAddressEdit"
                        ></v-text-field>
                    </v-fade-transition>
                </v-card-text>

                <v-checkbox-btn
                    v-model="wantsHotArticlesCheckbox"
                    :color="themeParams.button_color ?? 'primary'"
                    class="ml-3 mt-0 mb-3 pa-0 profile-checkbox"
                    density="compact"
                    hide-details
                    @update:modelValue="onChangeWantsHotArticlesCheckbox($event)"
                >
                    <template v-slot:label>
                        <div>
                            Хочу горячие артикулы
                            <v-tooltip location="bottom">
                                <template v-slot:activator="{ props }">
                                    <v-icon v-bind="props">mdi-information-outline</v-icon>
                                </template>
                                Горячие артикулы — это артикулы, которые доступны для заказа в течение короткого времени
                            </v-tooltip>
                        </div>
                    </template>
                </v-checkbox-btn>

                <v-card-title><b>Баллы:</b> {{ user.pointsBalance }}</v-card-title>

                <TheYarnCalculatorDialog/>

                <v-card-text class="ref-link-wrapper">
                    <b>Приведи друга, получи бонус: <span class="ref-link" @click="copyRefLink">ссылка</span></b>
                </v-card-text>
            </v-card>

            <v-tabs v-model="tab" :bg-color="themeParams.button_color ?? 'primary'">
                <v-tab value="1"><b>Активные</b></v-tab>
                <v-tab value="2"><span style="font-size: 12px;">Архив</span></v-tab>
            </v-tabs>

            <v-window v-model="tab">
                <v-window-item value="1">
                    <v-card class="mt-3" variant="flat">
                        <v-card-title class="text-center pa-0"><b>Статусы по предзаказам</b></v-card-title>
                        <TheOrdersList/>
                    </v-card>
                </v-window-item>

                <v-window-item value="2">
                    <v-card class="mt-3" variant="flat">
                        <v-card-title class="text-center pa-0"><b>Архивные заказы</b></v-card-title>
                        <TheOrdersList :archive="true"/>
                    </v-card>
                </v-window-item>
            </v-window>

            <v-btn
                v-if="isPlatformUnknown"
                class="text-none not-primary"
                color="info"
                size="x-large"
                @click="onLogout"
            >
                <span class="align-self-center">Выйти</span>
                <v-icon size="x-large">mdi-logout-variant</v-icon>
            </v-btn>
        </v-card>
    </v-card>

    <v-dialog
        v-model="showInfoEditDialog"
        max-width="450px"
    >
        <v-card class="d-flex">
            <v-card-text class="text-center">
                <b>Чтобы получить доступ к функционалу с горячими артикулами, введите адрес и телефон</b>
            </v-card-text>
            <v-card-actions class="mx-auto">
                <v-btn @click="showInfoEditDialog = false; wantsHotArticlesCheckbox = false;">
                    Понятно
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

    <v-dialog
        v-model="showHotArticlesAgreementDialog"
        :persistent="true"
        max-width="450px"
    >
        <v-card class="d-flex">
            <v-card-text class="text-center">
                <b>Горячие артикулы заказываются моментально, минуя корзину,
                    поскольку требуется быстрый отклик для поставщика.</b>
            </v-card-text>
            <v-card-actions class="mx-auto">
                <v-btn @click="onAgreeHotArticlesAgreement">
                    Согласен
                </v-btn>
                <v-btn
                    :color="themeParams.button_color ?? 'primary'"
                    class="not-primary"
                    @click="onDisagreeHotArticlesAgreement"
                >
                    Не согласен
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

    <v-snackbar
        v-model="showCopySnackbar"
        :class="{'mb-17-5': !isWideScreen}"
        :color="themeParams.secondary_bg_color ?? 'white'"
        class="mt-auto"
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

    <TheMobileFooter v-if="!isWideScreen"/>
</template>

<style lang="scss" scoped>
.v-card, v-card * {
    background-color: var(--tg-theme-bg-color, rgb(var(--v-theme-background)));
    color: var(--tg-theme-text-color, rgb(var(--v-theme-on-surface)));
}

.v-window, .v-window-item, .v-window-item .v-card {
    background-color: var(--tg-theme-secondary-bg-color, rgb(var(--v-theme-background)));
    color: var(--tg-theme-text-color, rgb(var(--v-theme-on-surface)));
}

.ref-link-wrapper {
    font-size: 1.2rem;
}

.ref-link {
    text-decoration: underline;
    cursor: pointer;
    color: var(--tg-theme-button-color, rgb(var(--v-theme-primary)));
}

.mb-17-5 {
    margin-bottom: 17.5%;
}

.mb-40 {
    margin-bottom: 40%;
}

.title {
    font-size: 1.2rem;
}
</style>
