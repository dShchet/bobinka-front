<script lang="ts" setup>
import {computed, onBeforeMount, onMounted, ref, watch} from "vue";
import {useRoute, useRouter} from "vue-router";
import {getUserCheckoutSavedData, getUserRuPostSavedData, processCheckout} from "~/utils/api.ts";
import TheHeader from "~/components/user/TheHeader.vue";
import {useCartStore} from "~/stores/cart.ts";
import {storeToRefs} from "pinia";
import {useScreenStore} from "~/stores/screen.ts";
import {BackButton, useWebApp, useWebAppTheme} from "vue-tg";
import {type DeliveryType} from "~/interfaces/delivery.ts";
import {DeliveryTypeValue} from "~/enums/deliveryType.ts";
import {getMetaFromRef} from "~/utils/navigation.ts";
import {type UserCheckoutSavedData, type UserRuPostSavedData} from "~/interfaces/checkoutSavedData.ts";
import {convertKeysToCamelCase} from "~/utils/converters.ts";
import TheCartItemsList from "~/components/user/TheCartItemsList.vue";
import {onFetchUserCart} from "~/utils/common.ts";
import TheMobileFooter from "~/components/user/TheMobileFooter.vue";

// Common section
const route = useRoute();
const router = useRouter();

const from = getMetaFromRef(route);

const {isPlatform, isPlatformUnknown} = useWebApp();
const {themeParams, colorScheme} = useWebAppTheme();

const showSubmitDialog = ref<boolean>(false);
const showSuccessDialog = ref<boolean>(false);
const showFailureDialog = ref<boolean>(false);
const form = ref<boolean>(false);

const successText = computed(
    () => `Мы скоро с Вами свяжемся по указанному номеру:
    \n${inputtedPhoneNumber.value}
    \nСейчас Вы будете перенаправлены на страницу с артикулами...`
);

const onSubmit = () => {
    if (!form.value) {
        return;
    }
};

const onProcessCheckout = async () => {
    showSubmitDialog.value = false;
    if (inputtedPhoneNumber.value?.charAt(0) === "8") {
        inputtedPhoneNumber.value = "+7" + inputtedPhoneNumber.value?.slice(1);
    }
    if (inputtedPhoneNumber.value?.charAt(0) === "7") {
        inputtedPhoneNumber.value = "+" + inputtedPhoneNumber.value;
    }
    const response = await processCheckout({
        fullname: inputtedFullname.value as string,
        sample: inputtedSample.value as string,
        comment: inputtedComment.value as string,
        phone: inputtedPhoneNumber.value as string,
        deliveryType: selectedDeliveryTypeValue.value as DeliveryTypeValue,
        index: parseInt(inputtedIndex.value as string),
        address: inputtedAddress.value as string,
        cartItemsIds: selectedItemIds.value,
    });
    if (!response.ok) {
        showFailureDialog.value = true;
    } else {
        showSuccessDialog.value = true;
    }
    setTimeout(async () => {
        await router.push({name: 'article-colors'});
        location.reload();
    }, 2000);
};

const requiredInputRule = [
    (v: string) => !!v || 'Это поле обязательно к заполнению',
];

// Stores section
const cartStore = useCartStore();
const {cart, selectedItemIds} = storeToRefs(cartStore);

const screenStore = useScreenStore();
const {isWideScreen} = storeToRefs(screenStore);

// Selected articles section
const showOverlay = computed(() => {
    return cart.value.length === 0 || selectedItemIds.value.length === 0;
});

// User saved data section
const userCheckoutSavedData = ref<UserCheckoutSavedData>();
const userRuPostSavedData = ref<UserRuPostSavedData>();

const onFetchUserCheckoutSavedData = async () => {
    const response = await getUserCheckoutSavedData();
    if (!response.ok) {
        console.error(response);
    } else {
        userCheckoutSavedData.value = convertKeysToCamelCase(await response.json()) as UserCheckoutSavedData;
        if (userCheckoutSavedData.value.phone?.startsWith('7')) {
            userCheckoutSavedData.value.phone = '+' + userCheckoutSavedData.value.phone;
        }
    }
};

const onFetchUserRuPostSavedData = async () => {
    const response = await getUserRuPostSavedData();
    if (!response.ok) {
        console.error(response);
    } else {
        userRuPostSavedData.value = convertKeysToCamelCase(await response.json()) as UserRuPostSavedData;
    }
};

// Inputted fullname section
const inputtedFullname = ref<string | undefined>(undefined);

const fullnameValidationRule = (fullname: string) => {
    const words = fullname.trim().split(' ');
    return words.length === 3 || 'ФИО должно состоять из трех слов';
};

const fullnameRules = [
    (v: string) => !!v || 'Это поле обязательно к заполнению',
    (v: string) => fullnameValidationRule(v),
];

// Selected delivery type section
const deliveryTypes: DeliveryType[] = [
    {
        value: DeliveryTypeValue.RUPOSTOFFICE,
        name: 'Почта России',
    },
    {
        value: DeliveryTypeValue.CDEK,
        name: 'СДЭК',
    },
    {
        value: DeliveryTypeValue.PICKUP,
        name: 'Самовывоз',
    }
];
const selectedDeliveryTypeValue = ref<DeliveryTypeValue>();
const selectedDeliveryTypeName = ref<string>();

watch(selectedDeliveryTypeName, (newValue) => {
    const foundDeliveryType = deliveryTypes.find(type => type.name === newValue as string);
    if (foundDeliveryType) {
        selectedDeliveryTypeValue.value = foundDeliveryType.value;
    }
});

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

// Inputted index section
const inputtedIndex = ref<string | undefined>(undefined);

const indexInputRules = [
    (v: string) => !!v || 'Это поле обязательно к заполнению',
    (v: string) => /^\d+$/.test(v) || 'Введите число',
    (v: string) => parseInt(v) >= 100000 && parseInt(v) <= 999999 || 'Индекс может быть от 100000 до 999999',
];

// Inputted address section
const inputtedAddress = ref<string | undefined>(undefined);

// Inputted sample section
const inputtedSample = ref<string | undefined>(undefined);

// Inputted comment section
const inputtedComment = ref<string | undefined>(undefined);

// Telegram section
const handleTgBackButton = async () => {
    await router.push({name: from.value.name, params: from.value.params, query: from.value.query});
};

onBeforeMount(async () => {
    await onFetchUserCart();
});

// On mounted actions
onMounted(async () => {
    await onFetchUserCheckoutSavedData();
    await onFetchUserRuPostSavedData();
});
</script>

<template>
    <v-layout>
        <TheHeader
            v-if="isWideScreen"
            bar-title="Оформление"
            previous-view-name="cart"
        />
    </v-layout>
    <BackButton
        v-if="!isPlatformUnknown"
        @click="handleTgBackButton"
    ></BackButton>
    <v-card
        :class="{'mt-15': isWideScreen, 'mb-20 mt-3': !isWideScreen, 'mb-70': isPlatform('ios')}"
        class="mx-auto"
        max-width="800px"
        variant="flat"
    >
        <v-overlay
            :contained="true"
            :model-value="showOverlay"
            :persistent="true"
            class="d-flex align-center justify-center"
            scrim="#bfbfbf"
        >
            <div class="overlay-content d-flex flex-column bg-grey-darken-2 pa-5">
                <h2 v-if="cart.length === 0" class="text-center mb-2">
                    В корзине пусто!
                </h2>
                <h2 v-else-if="cart.length !== 0 && selectedItemIds.length === 0" class="text-center mb-2">
                    Не выбраны позиции для заказа!
                </h2>
                <h2 v-else class="text-center mb-2">
                    Что-то пошло не так! Попробуйте заново перейти в корзину, а затем к оформлению
                </h2>
                <v-btn class="mx-auto" color="green" size="large" width="fit-content"
                       @click="$router.push({name: 'cart'})">В корзину
                </v-btn>
            </div>
        </v-overlay>
        <h1 class="text-center mb-5">Оформление</h1>
        <h2 class="text-center">Артикулы:</h2>
        <TheCartItemsList :item-ids="selectedItemIds"/>
        <v-form v-model="form" class="pa-3" @submit.prevent="onSubmit">
            <h2 class="text-center">Ваши данные:</h2>
            <v-slide-x-transition>
                <v-card-text
                    v-if="inputtedFullname !== userCheckoutSavedData?.fullname"
                    class="pa-2 link"
                    @click="inputtedFullname=userCheckoutSavedData?.fullname"
                >
                    {{ userCheckoutSavedData?.fullname }}
                </v-card-text>
            </v-slide-x-transition>
            <v-text-field
                v-model="inputtedFullname"
                :autofocus="!showOverlay"
                :clearable="true"
                :rules="fullnameRules"
                :theme="colorScheme"
                label="ФИО"
                variant="solo-filled"
            >
            </v-text-field>

            <v-slide-x-transition>
                <v-card-text
                    v-if="inputtedPhoneNumber !== userCheckoutSavedData?.phone"
                    class="pa-2 link"
                    @click="inputtedPhoneNumber=userCheckoutSavedData?.phone"
                >
                    {{ userCheckoutSavedData?.phone }}
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

            <v-select
                v-model="selectedDeliveryTypeName"
                :class="{'mb-3': !selectedDeliveryTypeName}"
                :hint="selectedDeliveryTypeValue === DeliveryTypeValue.PICKUP ? 'г. Санкт-Петербург, Полюстровский проспект 32В' : ''"
                :items="deliveryTypes.map(deliveryType => deliveryType.name)"
                :persistent-hint="true"
                :rules="requiredInputRule"
                :theme="colorScheme"
                class="mt-3"
                label="Тип доставки"
                variant="solo-filled"
            ></v-select>

            <v-slide-x-transition>
                <div v-if="selectedDeliveryTypeValue === DeliveryTypeValue.RUPOSTOFFICE" class="mb-3">
                    <v-slide-x-transition>
                        <v-card-text
                            v-if="inputtedIndex !== userRuPostSavedData?.index?.toString()"
                            class="pa-2 link"
                            @click="inputtedIndex=userRuPostSavedData?.index?.toString()"
                        >
                            {{ userRuPostSavedData?.index }}
                        </v-card-text>
                    </v-slide-x-transition>

                    <v-text-field
                        v-model="inputtedIndex"
                        :clearable="true"
                        :rules="indexInputRules"
                        :theme="colorScheme"
                        label="Индекс"
                        variant="solo-filled"
                    ></v-text-field>

                    <v-slide-x-transition>
                        <v-card-text
                            v-if="inputtedAddress !== userCheckoutSavedData?.address"
                            class="pa-2 link"
                            @click="inputtedAddress=userCheckoutSavedData?.address"
                        >
                            {{ userCheckoutSavedData?.address }}
                        </v-card-text>
                    </v-slide-x-transition>

                    <v-text-field
                        v-model="inputtedAddress"
                        :clearable="true"
                        :rules="requiredInputRule"
                        :theme="colorScheme"
                        label="Адрес"
                        variant="solo-filled"
                    ></v-text-field>
                </div>

                <div v-else-if="selectedDeliveryTypeValue === DeliveryTypeValue.CDEK">
                    <v-slide-x-transition>
                        <v-card-text
                            v-if="inputtedAddress !== userCheckoutSavedData?.address"
                            class="pa-2 link"
                            @click="inputtedAddress=userCheckoutSavedData?.address"
                        >
                            {{ userCheckoutSavedData?.address }}
                        </v-card-text>
                    </v-slide-x-transition>

                    <v-text-field
                        v-model="inputtedAddress"
                        :clearable="true"
                        :rules="requiredInputRule"
                        :theme="colorScheme"
                        label="Адрес"
                        variant="solo-filled"
                    ></v-text-field>
                </div>
            </v-slide-x-transition>

            <v-text-field
                v-model="inputtedSample"
                :clearable="true"
                :persistent-hint="true"
                :theme="colorScheme"
                hint="Необязательно"
                label="Образец"
                variant="solo-filled"
            >
            </v-text-field>

            <v-text-field
                v-model="inputtedComment"
                :clearable="true"
                :persistent-hint="true"
                :theme="colorScheme"
                class="my-3"
                hint="Необязательно"
                label="Комментарий"
                variant="solo-filled"
            >
            </v-text-field>

            <v-dialog
                v-model="showSubmitDialog"
                max-width="fit-content"
            >
                <template v-slot:activator="{ props }">
                    <v-btn
                        :block="true"
                        :color="themeParams.button_color ?? 'primary'"
                        :disabled="!form"
                        class="not-primary"
                        size="large"
                        v-bind="props"
                        variant="tonal"
                    >
                        Подтвердить
                    </v-btn>
                </template>
                <v-card class="text-center mx-auto" max-width="800px">
                    <v-card-title class="mt-2">Все верно?</v-card-title>
                    <v-card-text class="text-start">
                        <b>ФИО:</b> {{ inputtedFullname }}<br>
                        <b>Телефон:</b> {{ inputtedPhoneNumber }}<br>
                        <span v-if="inputtedSample"><b>Образец:</b> {{ inputtedSample }}<br></span>
                        <span v-if="inputtedComment"><b>Комментарий:</b> {{ inputtedComment }}<br></span>
                        <br>
                        <b>Доставка:</b> {{ selectedDeliveryTypeName }}<br>
                        <span v-if="(selectedDeliveryTypeValue as DeliveryTypeValue) === 'RUPOSTOFFICE'"><b>Индекс:</b> {{
                                inputtedIndex
                            }}<br></span>
                        <span
                            v-if="['RUPOSTOFFICE', 'CDEK'].includes(selectedDeliveryTypeValue ?? '')"><b>Адрес:</b> {{
                                inputtedAddress
                            }}</span>
                    </v-card-text>
                    <v-card-actions class="mx-auto mb-3">
                        <v-btn class="not-primary" color="blue" variant="tonal" @click="showSubmitDialog = false;">
                            Изменить
                        </v-btn>
                        <v-btn class="not-primary" color="green" variant="elevated" @click="onProcessCheckout">
                            Оформить
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
                    text="Сейчас Вы будете перенаправлены на страницу с артикулами..."
                    title="Что-то пошло не так! Попробуйте еще раз"
                    type="error"
                ></v-alert>
            </v-dialog>
        </v-form>
    </v-card>
    <TheMobileFooter v-if="!isWideScreen"/>
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

.overlay-content {
    border-radius: 15px;
}

.multi-line {
    white-space: pre-line;
}

.v-card {
    background-color: var(--tg-theme-bg-color, rgb(var(--v-theme-background)));
    color: var(--tg-theme-text-color, rgb(var(--v-theme-on-surface)));
}
</style>
