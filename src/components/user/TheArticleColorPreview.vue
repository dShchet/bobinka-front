<script lang="ts" setup>
import {BASE_URL} from "~/config/constants.ts";
import TheLoader from "~/components/user/TheLoader.vue";
import {openArticlePageFromColor} from "~/utils/navigation.ts";
import {useWebAppTheme} from "vue-tg";
import {addItemToCart, processCheckout} from "~/utils/api.ts";
import {convertKeysToCamelCase} from "~/utils/converters.ts";
import {CartItem} from "~/interfaces/cart.ts";
import {useRoute, useRouter} from "vue-router";
import {useUserInfoStore} from "~/stores/userInfo.ts";
import {storeToRefs} from "pinia";
import {onBeforeUnmount, onMounted, ref} from "vue";
import {useCartStore} from "~/stores/cart.ts";
import {useScreenStore} from "~/stores/screen.ts";
import {colorAvailableQuantityWithCart} from "~/utils/common.ts";
import {User} from "~/interfaces/user.ts";
import {CheckoutData} from "~/interfaces/checkoutData.ts";
import {DeliveryTypeValue} from "~/enums/deliveryType.ts";
import TheFastCheckoutSuccessDialog from "~/components/user/TheFastCheckoutSuccessDialog.vue";
import TheFastCheckoutWarningDialog from "~/components/user/TheFastCheckoutWarningDialog.vue";
import TheUserInfoDialog from "~/components/user/TheUserInfoDialog.vue";
import {Color} from "~/interfaces/color.ts";

// Common section
const props = defineProps<{
    articleColor: Color,
    user?: User,
}>();

const emit = defineEmits(['expired']);

const route = useRoute();
const router = useRouter();

const {themeParams} = useWebAppTheme();

// Stores section
const cartStore = useCartStore();
const {cart} = storeToRefs(cartStore);

const userInfoStore = useUserInfoStore();
const {isAuthenticated} = storeToRefs(userInfoStore);

const screenStore = useScreenStore();
const {isWideScreen} = storeToRefs(screenStore);

// Article color card section
const trimmedComment = props.articleColor.article.comment
    ? (
        props.articleColor.article.comment.length > 100
            ? props.articleColor.article.comment.substring(0, 100) + '...'
            : props.articleColor.article.comment
    )
    : '';

// Snackbar section
const showSnackbar = ref<boolean>(false);
const snackbarText = ref<string>('');

// Fast checkout section
const showFastCheckoutDialog = ref<boolean>(false);

// Add to cart section
const addColorToCart = async ({quantity, fast}: {
    quantity: number,
    fast?: boolean
}): Promise<CartItem | undefined> => {
    const queryString = new URLSearchParams(route.query as Record<string, string>).toString();
    if (!isAuthenticated.value) {
        await router.push({name: 'login', query: {from: route.fullPath, fromQuery: queryString}});
        return;
    }
    try {
        const response = await addItemToCart(props.articleColor.id, quantity);
        if (response.status === 403) {
            await router.push({name: 'login', query: {from: route.fullPath, fromQuery: queryString}});
        }
        if (!response.ok) {
            snackbarText.value = 'Не удалось добавить товар!';
            showSnackbar.value = true;
        } else {
            const result = convertKeysToCamelCase(await response.json()) as CartItem;
            cart.value.push(result);
            if (!fast) {
                snackbarText.value = 'Артикул добавлен в корзину!\nЧтобы оформить заказ, перейдите в нее';
                showSnackbar.value = true;
            }
            return result;
        }
    } catch (error) {
        if (error instanceof TypeError) {
            await router.push({name: 'login', query: {from: route.fullPath, fromQuery: queryString}});
        }
    }
};

// Process fast checkout section
const showFastCheckoutWarningDialog = ref<boolean>(false);
const fastCheckoutQuantity = ref<number>();

const colorFastCheckoutInit = (quantity: number) => {
    showFastCheckoutWarningDialog.value = true;
    fastCheckoutQuantity.value = quantity;
};

const processColorFastCheckout = async (quantity: number) => {
    const user = await userInfoStore.get();
    if (!user?.address || !user?.phone) {
        showUserInfoDialog.value = true;
        return;
    }

    showFastCheckoutWarningDialog.value = false;
    const cartItem = await addColorToCart({quantity: quantity, fast: true});
    if (!cartItem) {
        return;
    }
    const response = await processCheckout({
        fullname: (user?.firstName + ' ' + user?.firstName + ' ' + user?.firstName) as string,
        sample: undefined,
        comment: undefined,
        phone: '+' + user?.phone,
        deliveryType: DeliveryTypeValue.CDEK,
        index: undefined,
        address: user?.address,
        cartItemsIds: [cartItem.id],
    } as CheckoutData);
    if (response.ok) {
        showFastCheckoutDialog.value = true;
    } else {
        snackbarText.value = 'Не удалось оформить заказ!';
        showSnackbar.value = true;
    }
};

// User info dialog section
const showUserInfoDialog = ref<boolean>(false);

// Timer section
const days = ref<number>(0);
const hours = ref<number>(0);
const minutes = ref<number>(0);
const seconds = ref<number>(0);
const timer = ref<any>(null);
const timeLeft = ref<string>('');

const updateTimer = () => {
    const expiredTime = new Date(props.articleColor.article.expiredAt as Date).getTime();
    const now = new Date().getTime();
    const difference = expiredTime - now;

    if (difference <= 0) {
        clearInterval(timer.value);
        emit('expired');
    } else {
        days.value = Math.floor(difference / (1000 * 60 * 60 * 24));
        hours.value = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        minutes.value = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        seconds.value = Math.floor((difference % (1000 * 60)) / 1000);
        timeLeft.value = '';
        if (days.value > 0) {
            timeLeft.value = `${days.value} дн., `;
        }
        timeLeft.value += `${hours.value.toString().padStart(2, "0")}:${minutes.value.toString().padStart(2, "0")}:${seconds.value.toString().padStart(2, "0")}`
    }
};

// On mounted actions
onMounted(() => {
    if (!props.articleColor.article.expiredAt) {
        return;
    }
    updateTimer();
    timer.value = setInterval(updateTimer, 1000);
})

// On unmounted actions
onBeforeUnmount(() => {
    if (timer.value) {
        clearInterval(timer.value);
    }
});
</script>

<template>
    <div
        :class="{'fire': articleColor.article.isHot, 'sale-backlight': articleColor.article.priceSale && articleColor.article.saleName}"
        class="preview-wrapper"
    >
        <v-card
            class="mb-2 pa-1 d-flex flex-column position-relative justify-space-between"
            height="100%"
            width="100%"
        >
            <v-overlay
                :contained="true"
                :model-value="articleColor.article.isHot && (!user || !user.wantsHotArticles)"
                :persistent="true"
                class="align-center justify-center"
            >
                <v-card class="d-flex flex-column mx-auto" color="transparent" variant="flat">
                    <v-card-title class="mb-3 overlay-text">
                        <b>Функционал недоступен</b>
                    </v-card-title>

                    <v-btn
                        v-if="!user"
                        @click="$router.push({name: 'login', query: {from: $route.fullPath}})"
                    >Авторизоваться
                    </v-btn>

                    <v-btn
                        v-else-if="!user.wantsHotArticles"
                        @click="$router.push({name: 'profile'})"
                    >
                        Изменить настройки
                    </v-btn>
                </v-card>
            </v-overlay>
            <div v-if="articleColor.article.expiredAt" class="on-image-markers">
                <v-chip
                    :color="days === 0 && hours === 0 && minutes < 5 ? 'red' : ''"
                    class="timer" density="comfortable"
                    size="x-large"
                    variant="elevated"
                >
                    <b>{{ timeLeft }}</b>
                    <v-icon v-if="days === 0 && hours === 0 && minutes < 5" :end="true" icon="mdi-clock-alert"></v-icon>
                    <v-icon v-else :end="true" icon="mdi-clock"></v-icon>
                </v-chip>
            </div>
            <v-img
                :src="BASE_URL + `/articles/colors/photo/${articleColor.id}`"
                :style="{height: '300px', cursor: 'pointer'}"
                class="preview-image"
                height="300px"
                @click="openArticlePageFromColor($router, props.articleColor)"
            >
                <template v-slot:placeholder>
                    <TheLoader/>
                </template>
            </v-img>
            <div class="text-wrapper" @click="openArticlePageFromColor($router, props.articleColor)">
                <v-card-title class="card-title"><b>{{ articleColor.article.name }}</b></v-card-title>
                <v-card-subtitle>Артикул: {{ articleColor.article.id }}</v-card-subtitle>
                <v-card-subtitle>Состав: {{ articleColor.article.structure }}. Метраж: {{
                        articleColor.article.footage
                    }}
                </v-card-subtitle>
                <v-card-text>{{ trimmedComment }}</v-card-text>
            </div>

            <div class="mt-auto">
                <div class="price-markers-wrapper d-flex justify-space-between">
                    <v-card-title v-if="!articleColor.article.priceSale">{{ articleColor.article.priceRetail }} ₽ / г
                    </v-card-title>
                    <v-card-title v-else>
                        <span class="not-sale-price">{{ articleColor.article.priceRetail }}</span>
                        <b>{{ articleColor.article.priceSale }}</b> ₽ /
                        г
                    </v-card-title>
                    <div class="markers d-flex flex-column text-center">
                        <v-chip
                            v-if="articleColor.article.inStock"
                            class="chip"
                            color="green"
                            density="comfortable"
                            size="large"
                        >
                            В наличии
                        </v-chip>
                        <v-chip
                            v-if="articleColor.article.priceSale && articleColor.article.saleName"
                            class="chip"
                            color="red"
                            density="comfortable"
                            size="large"
                        >
                            {{ articleColor.article.saleName }}
                        </v-chip>
                    </div>
                </div>
                <v-card-actions>
                    <div class="d-flex w-100 justify-space-between">
                        <v-btn
                            :disabled="colorAvailableQuantityWithCart(articleColor) < 1 ||
                            articleColor.article.isHot && (!user || !user.wantsHotArticles)"
                            @click="articleColor.article.isHot ? colorFastCheckoutInit(1) : addColorToCart({quantity: 1})"
                        >
                            {{ articleColor.article.isHot ? 'Беру' : 'Хочу' }} целую
                        </v-btn>
                        <v-btn
                            :disabled="colorAvailableQuantityWithCart(articleColor) < 0.5 ||
                            articleColor.article.isHot && (!user || !user.wantsHotArticles)"
                            @click="articleColor.article.isHot ? colorFastCheckoutInit(0.5) : addColorToCart({quantity: 0.5})"
                        >
                            {{ articleColor.article.isHot ? 'Беру' : 'Хочу' }} половину
                        </v-btn>
                    </div>
                </v-card-actions>
            </div>

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
        </v-card>
    </div>

    <TheUserInfoDialog
        v-if="user"
        v-model="showUserInfoDialog"
        v-model:user="user as User"
    />

    <TheFastCheckoutWarningDialog
        v-model="showFastCheckoutWarningDialog"
        v-model:fast-checkout-quantity="fastCheckoutQuantity"
        @process-fast-checkout="processColorFastCheckout"
    />

    <TheFastCheckoutSuccessDialog v-model="showFastCheckoutDialog"/>
</template>

<style lang="scss" scoped>
.preview-wrapper {
    width: 100%;
    height: 100%;
    z-index: 2;
}

.text-wrapper:hover {
    cursor: pointer;
}

.card-title {
    &:hover {
        text-decoration: underline;
    }
}

.v-card {
    background-color: var(--tg-theme-secondary-bg-color, rgb(var(--v-theme-background)));
    color: var(--tg-theme-text-color, rgb(var(--v-theme-on-surface)));
}

.price-markers-wrapper {
    align-items: center;
}

.markers {
    align-items: end;
    margin-right: 3%;
}

.on-image-markers {
    position: absolute;
    top: 1%;
    right: 1%;
    z-index: 1001;
}

.chip {
    cursor: text;
}

.chip:not(:last-child) {
    margin-bottom: 2%;
}

.timer {
    opacity: 0.85;
    user-select: none;
}

.preview-image, .preview-image img {
    height: 300px !important;
    padding: 0 !important;
    flex: 0 0 auto !important;
}

.preview-image .v-responsive__sizer {
    padding: 0 !important;
    height: 300px !important;
}

.overlay-text {
    color: #fff;
    background-color: rgba(0, 0, 0, 0.7);
    border-radius: 10px;
}
</style>
