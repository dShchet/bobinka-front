<script lang="ts" setup>
import {useCartStore} from "~/stores/cart.ts";
import {storeToRefs} from "pinia";
import {onMounted, ref, watch} from "vue";
import {BASE_URL} from "~/config/constants.ts";
import {getMetaFromRef, openArticlePage} from "~/utils/navigation.ts";
import TheLoader from "~/components/user/TheLoader.vue";
import TheHeader from "~/components/user/TheHeader.vue";
import {useRoute, useRouter} from "vue-router";
import {onFetchUserCart} from "~/utils/common.ts";
import {removeItemFromCart} from "~/utils/api.ts";
import {useUserInfoStore} from "~/stores/userInfo.ts";
import {useScreenStore} from "~/stores/screen.ts";
import {BackButton, MainButton, useWebApp, useWebAppTheme} from "vue-tg";
import TheMobileFooter from "~/components/user/TheMobileFooter.vue";
import {CartItem} from "~/interfaces/cart.ts";
import {mapQuantity} from "~/utils/mappers.ts";

// Common section
const route = useRoute();
const router = useRouter();

const from = getMetaFromRef(route);
if (from.value.name === 'checkout') {
    from.value = {name: 'article-colors', params: {}, query: {}};
}

const {isPlatformUnknown} = useWebApp();
const {themeParams} = useWebAppTheme();

// Stores section
const cartStore = useCartStore();
const {cart, selectedItemIds} = storeToRefs(cartStore);

const userInfoStore = useUserInfoStore();
const {isAuthenticated} = storeToRefs(userInfoStore);

const screenStore = useScreenStore();
const {isWideScreen} = storeToRefs(screenStore);

// Selected items section
const allSelected = ref<boolean>(false);

const switchSelectAll = () => {
    if (selectedItemIds.value.length === cart.value.filter(cartItem => cartItem.enough && !cartItem.color.article.expired).length) {
        selectedItemIds.value = [];
    } else {
        selectedItemIds.value = cart.value.filter(cartItem => cartItem.enough && !cartItem.color.article.expired).map(cartItem => cartItem.id);
    }
};

watch(selectedItemIds, () => {
    allSelected.value = selectedItemIds.value.length === cart.value.filter(cartItem => cartItem.enough && !cartItem.color.article.expired).length;
    if (selectedItemIds.value.length === 0) {
        allSelected.value = false;
    }
});

// Actions section
const removeFromCart = async (cartItemId: number) => {
    const response = await removeItemFromCart(cartItemId);
    if (!response.ok) {
        console.error(response);
    } else {
        selectedItemIds.value = selectedItemIds.value.filter(id => id !== cartItemId);
        cart.value = cart.value.filter(cartItem => cartItem.id !== cartItemId);
    }
};

const goToCheckout = async () => {
    await router.push({name: 'checkout'});
};

// Overlay section
const overlayText = (cartItem: CartItem) => {
    if (!cartItem.enough && !cartItem.color.article.expired) {
        return 'Нет в наличии';
    } else if (cartItem.enough && cartItem.color.article.expired) {
        return 'Время действия артикула истекло';
    } else if (!cartItem.enough && cartItem.color.article.expired) {
        return 'Нет в наличии и время действия артикула истекло';
    }
};

// Telegram section
const handleTgBackButton = async () => {
    await router.push({name: from.value.name, params: from.value.params, query: from.value.query});
};

// On mounted actions
onMounted(async () => {
    if (isAuthenticated.value) {
        await onFetchUserCart();
        if (cart.value.length !== 0) {
            setTimeout(() => {
                switchSelectAll();
            }, 500)
        }
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
            bar-title="Корзина"
        />
    </v-layout>
    <BackButton
        v-if="!isPlatformUnknown"
        @click="handleTgBackButton"
    ></BackButton>

    <v-container
        v-if="isAuthenticated"
        :class="{'mb-75px': selectedItemIds.length > 0, 'mb-35': !isWideScreen, 'mt-10': isWideScreen, 'mb-15': !isPlatformUnknown}"
    >
        <h1>Корзина</h1>
        <v-card
            class="mx-auto mt-3"
            max-width="100%"
        >
            <v-checkbox
                v-model="allSelected"
                :color="themeParams.button_color ?? 'primary'"
                hide-details
                label="Выбрать все"
                @input="switchSelectAll"
            ></v-checkbox>
            <v-divider></v-divider>
        </v-card>
        <v-card
            class="mx-auto mt-2"
            max-width="100%"
        >
            <v-card v-for="(cartItem, index) in cart" :key="cartItem.id" variant="flat">
                <v-overlay
                    v-if="!cartItem.enough || cartItem.color.article.expired"
                    :contained="true"
                    :model-value="true"
                    :persistent="true"
                    class="align-center justify-center"
                    scrim="#bfbfbf"
                >
                    <v-card class="d-flex flex-column mx-auto" color="transparent" variant="flat">
                        <v-card-title
                            style="
                            color: #fff;
                            background-color: rgba(0,0,0,0.5);
                            border-radius: 10px;
                            cursor: pointer;
                            "
                            @click="openArticlePage($router, {
                                id: cartItem.color.article.id,
                                colors: [{...cartItem.color}]
                            })"
                        >
                            <b>
                                {{ overlayText(cartItem) }}
                            </b>
                        </v-card-title>
                        <v-btn
                            class="align-self-center mt-2 not-primary"
                            color="red"
                            size="small"
                            @click="removeFromCart(cartItem.id)"
                        >
                            Удалить
                        </v-btn>
                    </v-card>
                </v-overlay>

                <v-container
                    class="d-inline-flex pa-0 ma-0"
                    variant="flat"
                >
                    <v-card class="d-flex-column pa-0 w-100" variant="flat">
                        <v-checkbox
                            v-model="selectedItemIds"
                            :color="themeParams.button_color ?? 'primary'"
                            :disabled="!cartItem.enough"
                            :indeterminate="!cartItem.enough"
                            :value="cartItem.id"
                            class="align-self-center"
                            hide-details
                        >
                        </v-checkbox>

                        <v-card class="d-inline-flex justify-start pa-0 ml-5 mb-5" variant="flat">
                            <v-img
                                :src="BASE_URL + `/articles/colors/photo/${cartItem.color.id}`"
                                class="align-self-center"
                                height="100px"
                                style="cursor: pointer;"
                                width="100px"
                                @click="openArticlePage($router, {
                                id: cartItem.color.article.id,
                                colors: [{...cartItem.color}]
                            })"
                            >
                                <template v-slot:placeholder>
                                    <TheLoader/>
                                </template>
                            </v-img>
                            <v-card class="ml-1" variant="flat">
                                <v-card-title>{{ cartItem.color.article.name }}</v-card-title>
                                <v-card-subtitle>{{ cartItem.color.name }}</v-card-subtitle>
                                <v-card-subtitle>
                                    Количество: {{ mapQuantity(cartItem.quantity) }}
                                </v-card-subtitle>
                                <v-card-title
                                    v-if="!cartItem.color.article.priceSale"
                                >
                                    {{ cartItem.color.article.priceRetail }} ₽ / г
                                </v-card-title>
                                <v-card-title v-else>
                                    <span class="not-sale-price">{{ cartItem.color.article.priceRetail }}</span>
                                    <b>&nbsp;{{ cartItem.color.article.priceSale }}</b> ₽ / г
                                </v-card-title>
                            </v-card>
                        </v-card>
                        <v-divider v-if="cartItem.enough"></v-divider>
                        <v-card
                            v-if="cartItem.enough"
                            class="d-flex ma-2"
                            variant="flat"
                            width="fit-content"
                        >
                            <v-btn
                                class="align-self-center not-primary"
                                color="red"
                                size="small"
                                @click="removeFromCart(cartItem.id)"
                            >
                                Удалить
                            </v-btn>
                        </v-card>
                    </v-card>
                </v-container>
                <v-divider v-if="index + 1 !== cart.length"></v-divider>
            </v-card>
        </v-card>
    </v-container>
    <div v-else class="mt-15 text-center">
        <h1>Чтобы просмотреть корзину, авторизуйтесь!</h1>
        <v-btn color="green" size="x-large" @click="$router.push({name: 'login', query: {from: $route.path}})">
            Авторизоваться
        </v-btn>
    </div>
    <v-scroll-y-reverse-transition>
        <v-layout
            v-if="selectedItemIds.length > 0 && isPlatformUnknown"
            :class="{'mb-15': !isWideScreen}"
            class="checkout-layout d-flex justify-center align-content-center position-fixed"
        >
            <v-btn
                class="align-self-center mx-auto my-2"
                color="primary"
                size="x-large"
                z-index="2000"
                @click="goToCheckout"
            >
                Перейти к оформлению
            </v-btn>
        </v-layout>
        <MainButton
            v-else
            :color="themeParams.button_color"
            :visible="selectedItemIds.length > 0"
            text="Перейти к оформлению"
            @click="goToCheckout"
        ></MainButton>
    </v-scroll-y-reverse-transition>
    <TheMobileFooter v-if="!isWideScreen"/>
</template>

<style lang="scss" scoped>
.v-container {
    background-color: var(--tg-theme-bg-color, rgb(var(--v-theme-background)));
    color: var(--tg-theme-text-color, rgb(var(--v-theme-on-surface)));

    .v-card, .v-input {
        background-color: var(--tg-theme-secondary-bg-color, rgb(var(--v-theme-background)));
        color: var(--tg-theme-text-color, rgb(var(--v-theme-on-surface)));

        .v-card-subtitle {
            color: var(--tg-theme-hint-color, rgb(var(--v-theme-on-surface))) !important;
            opacity: 1 !important;
        }
    }
}

.v-label {
    font-weight: bold;
}

.checkout-layout {
    width: 100%;
    bottom: 0;
    background-color: rgba(77, 66, 66, 0.57);
    border-top-left-radius: 10px;
    border-top-right-radius: 10px;
}

.mb-75px {
    margin-bottom: 75px;
}

.mb-35 {
    margin-bottom: 35%;
}
</style>
