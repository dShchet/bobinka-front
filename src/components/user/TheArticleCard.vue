<script lang="ts" setup>
import TheHeader from "~/components/user/TheHeader.vue";
import TheCarousel from "~/components/user/TheCarousel.vue";
import {BASE_URL} from "~/config/constants.ts";
import {computed, onBeforeUnmount, onMounted, ref, watch} from "vue";
import TheLoader from "~/components/user/TheLoader.vue";
import {useRoute, useRouter} from "vue-router";
import {storeToRefs} from "pinia";
import {useScreenStore} from "~/stores/screen.ts";
import {addItemToCart, processCheckout} from "~/utils/api.ts";
import {useCartStore} from "~/stores/cart.ts";
import {useUserInfoStore} from "~/stores/userInfo.ts";
import {
    articleColorAvailableQuantityWithCart,
    extractYoutubeVideoId,
    isColorInCart,
    onFetchUserCart,
} from "~/utils/common.ts";
import {BackButton, useWebApp, useWebAppTheme} from "vue-tg";
import {type Article} from "~/interfaces/article.ts";
import {useArticleColorsStore} from "~/stores/articles.ts";
import {type Quantity} from "~/interfaces/quantity.ts";
import TheItemSelector from "~/components/user/TheItemSelector.vue";
import {type ColorInArticle} from "~/interfaces/color.ts";
import {type CartItem} from "~/interfaces/cart.ts";
import {convertKeysToCamelCase} from "~/utils/converters.ts";
import TheYarnCalculatorDialog from "~/components/user/TheYarnCalculatorDialog.vue";
import TheFastCheckoutSuccessDialog from "~/components/user/TheFastCheckoutSuccessDialog.vue";
import {CheckoutData} from "~/interfaces/checkoutData.ts";
import {DeliveryTypeValue} from "~/enums/deliveryType.ts";
import {timeDifferenceWithNow} from "~/utils/time.ts";
import {User} from "~/interfaces/user.ts";
import TheFastCheckoutWarningDialog from "~/components/user/TheFastCheckoutWarningDialog.vue";
import {YOUTUBE_URL_REGEX} from "~/utils/regex.ts";
import TheUserInfoDialog from "~/components/user/TheUserInfoDialog.vue";

// Common section
const props = defineProps<{
    article: Article,
    colorId: number,
    quantity: number,
    user?: User,
}>();

const route = useRoute();
const router = useRouter();

const {isPlatformUnknown} = useWebApp();
const {themeParams} = useWebAppTheme();

const characteristicsMap = {
    'Состав': props.article.structure,
    'Метраж': props.article.footage,
};

const addToCart = async ({fast}: { fast?: boolean } = {}): Promise<CartItem | undefined> => {
    const queryString = new URLSearchParams(route.query as Record<string, string>).toString();
    if (!isAuthenticated) {
        await router.push({name: 'login', query: {from: route.path, fromQuery: `?${queryString}`}});
        return;
    }
    try {
        const response = await addItemToCart(localColorId.value, localQuantity.value.number);
        if (response.status === 403) {
            await router.push({name: 'login', query: {from: route.path, fromQuery: `?${queryString}`}});
        }
        if (!response.ok) {
            console.error(response);
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
            await router.push({name: 'login', query: {from: route.path, fromQuery: '?' + queryString}});
        }
    }
};

// Stores section
const articlesStore = useArticleColorsStore();
const {quantities} = storeToRefs(articlesStore);

const screenStore = useScreenStore();
const {isWideScreen} = storeToRefs(screenStore);

const cartStore = useCartStore();
const {cart} = storeToRefs(cartStore);

const userInfoStore = useUserInfoStore();
const {isAuthenticated} = storeToRefs(userInfoStore);

// Process fast checkout section
const showFastCheckoutWarningDialog = ref<boolean>(false);

const processFastCheckout = async () => {
    const user = await userInfoStore.get();
    if (!user?.address || !user?.phone) {
        showUserInfoDialog.value = true;
        return;
    }

    const cartItem = await addToCart({fast: true});
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
        showFastCheckoutSuccessDialog.value = true;
    } else {
        snackbarText.value = 'Не удалось оформить заказ!';
        showSnackbar.value = true;
    }
};

// User info dialog section
const showUserInfoDialog = ref<boolean>(false);

// Snackbar section
const showSnackbar = ref<boolean>(false);
const snackbarText = ref<string>('');

// Color section
const localColorId = ref<number>(props.colorId ? props.colorId : props.article.colors[0].id);
const localColorName = ref<string>(props.article.colors.find(color => color.id === localColorId.value)?.name ?? props.article.colors[0].name);

const selectColor = (colorId: number, colorName: string) => {
    localColorId.value = colorId;
    localColorName.value = colorName;
};

watch(localColorId, async (newColorId: number) => {
    articleSources.value[0] = BASE_URL + `/articles/colors/photo/${newColorId}`;
    await router.push({
        name: 'article',
        query: {color: localColorId.value, quantity: localQuantity.value.number},
    });
});

const reserveButtonDisabled = computed(() => {
    return articleColorAvailableQuantityWithCart(props.article, localColorId.value) < localQuantity.value.number
        || timeDifferenceWithNow(articleExpiredAt.value) <= 0 || props.article.isHot
        && (!props.user || !props.user.wantsHotArticles);
});

const addToCardButtonDisabled = computed(() => {
    return articleColorAvailableQuantityWithCart(props.article, localColorId.value) < localQuantity.value.number
        || timeDifferenceWithNow(articleExpiredAt.value) <= 0;
});

// Quantity section
const localQuantity = ref<Quantity>(props.quantity ? quantities.value.filter(quantity => quantity.number === props.quantity)[0] : quantities.value[1]);

watch(localQuantity, async () => {
    await router.push({
        name: 'article',
        query: {color: localColorId.value, quantity: localQuantity.value.number},
    });
});

// Color images sources section
const articleSources = ref([BASE_URL + `/articles/colors/photo/${localColorId.value}`]);
articleSources.value.push(...props.article.additionalPhotos.map(fileId => BASE_URL + `/articles/additional_photo/${fileId}`));

props.article.additionalVideos.forEach(video => {
    if (YOUTUBE_URL_REGEX.test(video)) {
        articleSources.value.push(`https://www.youtube.com/embed/${extractYoutubeVideoId(video)}?enablejsapi=1`);
    } else {
        articleSources.value.push(BASE_URL + `/articles/additional_video/${video}`);
    }
});

// Expired dialog section
const showExpiredDialog = ref<boolean>(false);

// Timer section
const days = ref<number>(0);
const hours = ref<number>(0);
const minutes = ref<number>(0);
const seconds = ref<number>(0);
const timer = ref<any>(null);
const timeLeft = ref<string>('');

const articleExpiredAt = computed(() => props.article.expiredAt ? new Date(props.article.expiredAt as Date).getTime() : Infinity);

const updateTimer = () => {
    const difference = timeDifferenceWithNow(articleExpiredAt.value);

    if (difference <= 0) {
        clearInterval(timer.value);
        timeLeft.value = 'Время действия истекло';
        showExpiredDialog.value = true;
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

// Fast checkout dialog section
const showFastCheckoutSuccessDialog = ref<boolean>(false);

// Telegram section
const handleTgBackButton = async () => {
    await router.push({name: 'article-colors'});
};

// On mounted actions
onMounted(async () => {
    if (isAuthenticated.value) {
        await onFetchUserCart();
    }
    if (!props.article.expiredAt) {
        return;
    }
    updateTimer();
    timer.value = setInterval(updateTimer, 1000);
});

// On unmounted actions
onBeforeUnmount(() => {
    if (timer.value) {
        clearInterval(timer.value);
    }
});
</script>

<template>
    <v-card
        :class="{'mb-40': !isWideScreen, 'mb-15': isWideScreen}"
        class="mx-auto"
        max-width="800px"
        variant="flat"
    >
        <v-layout>
            <TheHeader
                v-if="isWideScreen"
                :bar-title="article.name"
                previous-view-name="articles"
            />
            <BackButton
                v-if="!isPlatformUnknown"
                @click="handleTgBackButton"
            ></BackButton>

            <div
                :class="{'fire': article.isHot, 'sale-backlight': article.priceSale && article.saleName, 'mt-15': isWideScreen}"
                class="article-wrapper position-relative"
            >
                <v-main
                    class="d-flex flex-column pa-5 article-content w-100 h-100"
                >
                    <v-overlay
                        v-if="article.isHot && (!user || !user.wantsHotArticles)"
                        :contained="true"
                        :model-value="true"
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
                    <div v-if="article.expiredAt" class="on-image-markers">
                        <v-chip
                            :color="days === 0 && hours === 0 && minutes < 5 ? 'red' : ''"
                            class="timer" density="comfortable"
                            size="x-large"
                            variant="elevated"
                        >
                            <b>{{ timeLeft }}</b>
                            <v-icon v-if="days === 0 && hours === 0 && minutes < 5" :end="true"
                                    icon="mdi-clock-alert"></v-icon>
                            <v-icon v-else :end="true" icon="mdi-clock"></v-icon>
                        </v-chip>
                    </div>
                    <TheCarousel
                        v-if="articleSources.length > 1"
                        :key="localColorId"
                        :srcs="articleSources"
                        height="500px"
                    />
                    <v-img
                        v-else
                        :src="BASE_URL + `/articles/colors/photo/${localColorId}`"
                        :style="{height: '500px'}"
                    >
                        <template v-slot:placeholder>
                            <TheLoader/>
                        </template>
                    </v-img>

                    <h1>{{ article.name }}</h1>

                    <div class="markers d-flex flex-wrap text-center">
                        <v-chip
                            v-if="article.inStock"
                            class="chip"
                            color="green"
                            density="comfortable"
                            size="x-large"
                        >
                            В наличии
                        </v-chip>
                        <v-chip
                            v-if="article.priceSale && article.saleName"
                            class="chip"
                            color="red"
                            density="comfortable"
                            size="x-large"
                        >
                            {{ article.saleName }}
                        </v-chip>
                        <v-chip
                            v-if="article.isHot"
                            class="chip fire"
                            density="comfortable"
                            size="x-large"
                            variant="elevated"
                        >
                            Горячий
                        </v-chip>
                    </div>

                    <h2 class="mt-3">Об артикуле</h2>
                    <v-card-text class="my-1 pa-0"><b>Комментарий</b>: {{ article.comment }}</v-card-text>
                    <h2 class="mt-1 mb-1">Характеристики:</h2>
                    <ul :class="{'w-75': isWideScreen}" class="characteristics-table">
                        <li v-for="(value, key) in characteristicsMap" :key="key">
                            <span class="title"><b>{{ key }}</b></span>
                            <span class="chapter">{{ value }}</span>
                        </li>
                        <li>
                            <span class="title"><b>Теги</b></span>
                            <span class="chapter">
                            <span
                                v-for="(tag, index) in article.tags"
                                :key="tag.id">
                                <router-link :to="{
                                    name: 'article-colors',
                                    query: {article_tags: tag.id}
                                }" class="tag-link">
                                    {{ tag.name }}
                                </router-link>{{ index + 1 !== article.tags.length ? ', ' : '' }}
                            </span>
                        </span>
                        </li>
                    </ul>

                    <TheYarnCalculatorDialog :footage="article.footage"/>

                    <h2 class="mb-1 mt-3">Выбранный цвет: {{ localColorName }}</h2>

                    <TheItemSelector
                        :items="article.colors"
                        :selected-id="localColorId"
                        cols="2"
                    >
                        <template #default="{ item }">
                            <v-img
                                :cover="true"
                                :src="BASE_URL + `/articles/colors/photo/${(item as ColorInArticle).id}`"
                                class="text-right pa-2"
                                @click="selectColor((item as ColorInArticle).id, (item as ColorInArticle).name)"
                            ></v-img>
                        </template>
                    </TheItemSelector>

                    <h2 class="mb-1 mt-3">Количество: {{ localQuantity.name }}</h2>

                    <TheItemSelector
                        :items="quantities"
                        :selected-id="localQuantity.number"
                        cols="auto"
                    >
                        <template #default="{ item }">
                            <v-card-title
                                class="text-center pa-2"
                                @click="localQuantity = (item as Quantity)"
                            >
                                {{ (item as Quantity).name }}
                            </v-card-title>
                        </template>
                    </TheItemSelector>

                    <v-card
                        class="pa-3 mt-3"
                        variant="tonal"
                        width="fit-content"
                    >
                        <h2 v-if="!article.priceSale" class="article-price ml-2">{{ article.priceRetail }}</h2>
                        <h2 v-else class="article-price ml-2">
                            <span class="not-sale-price">{{ article.priceRetail }}</span><b>{{ article.priceSale }}</b>
                        </h2>
                        <v-card-actions>
                            <div v-if="!article.isHot">
                                <v-btn
                                    v-if="!isColorInCart(localColorId, localQuantity.number)"
                                    :disabled="addToCardButtonDisabled"
                                    @click="addToCart"
                                >
                                    В корзину
                                </v-btn>

                                <v-btn-group
                                    v-else
                                >
                                    <v-btn
                                        @click="$router.push({name: 'cart'})"
                                    >
                                        <div class="d-flex flex-column button-text">
                                            <span>В корзине</span>
                                            <span style="font-size: 80%">Перейти</span>
                                        </div>
                                    </v-btn>
                                    <v-btn
                                        :color="themeParams.button_color ?? 'primary'"
                                        :disabled="addToCardButtonDisabled"
                                        class="not-primary"
                                        variant="tonal"
                                        @click="addToCart"
                                    >
                                        Добавить еще
                                    </v-btn>
                                </v-btn-group>
                            </div>
                            <v-btn
                                v-else
                                :disabled="reserveButtonDisabled"
                                @click="showFastCheckoutWarningDialog = true;"
                            >
                                Бронирую
                            </v-btn>
                        </v-card-actions>
                    </v-card>
                </v-main>
            </div>
        </v-layout>
    </v-card>

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

    <TheUserInfoDialog
        v-if="user"
        v-model="showUserInfoDialog"
        v-model:user="user as User"
    />

    <TheFastCheckoutWarningDialog
        v-model="showFastCheckoutWarningDialog"
        :fast-checkout-quantity="localQuantity.number"
        @update:fast-checkout-quantity="localQuantity.number = ($event as number)"
        @process-fast-checkout="processFastCheckout"
    />

    <TheFastCheckoutSuccessDialog v-model="showFastCheckoutSuccessDialog"/>

    <v-dialog
        v-model="showExpiredDialog"
        max-width="400px"
    >
        <v-card>
            <v-card-text
                :style="{'font-size': '1.2rem'}"
                class="text-center"
            >
                <b>Время действия артикула истекло!</b>
            </v-card-text>
            <v-card-actions class="d-flex justify-center">
                <v-btn @click="$router.push({name: 'article-colors'});">
                    К артикулам
                </v-btn>
                <v-btn
                    :color="themeParams.button_color ?? 'primary'"
                    class="not-primary"
                    variant="tonal"
                    @click="showExpiredDialog = false;"
                >
                    Закрыть
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<style lang="scss" scoped>
.article-wrapper {
    z-index: 2;
    width: 100%;
    height: 100%;
    padding: .5%;
    background-color: var(--tg-theme-bg-color, rgb(var(--v-theme-background)));
}

.mb-40 {
    margin-bottom: 40%;
}

.v-main, .v-main .v-card, .v-card *:not(.v-chip__content *, .v-btn div span, .on-image-markers *), .v-dialog .v-card {
    background-color: var(--tg-theme-bg-color, rgb(var(--v-theme-background)));
    color: var(--tg-theme-text-color, rgb(var(--v-theme-on-surface)));
}

.article-price {
    &:after {
        content: ' \20BD  / г.';
    }
}

.characteristics-table {
    li {
        display: flex;

        .title {
            order: 1;
        }

        .chapter {
            order: 3;
        }

        &:after {
            background-image: radial-gradient(circle, currentcolor .5px, transparent 1px);
            background-position: bottom;
            background-size: 1ex 1px;
            background-repeat: space no-repeat;
            content: "";
            flex-grow: 1;
            height: 1em;
            order: 2;
        }
    }
}

.tag-link {
    color: var(--tg-theme-text-color, rgb(var(--v-theme-on-surface)));
}

.v-snackbar__content {
    font-size: 1.2rem !important;
}

.not-sale-price {
    font-weight: normal;
}

.chip {
    width: fit-content;
    cursor: text;

    &:not(:last-child) {
        margin-right: 1%;
    }
}

.on-image-markers {
    position: absolute;
    top: 1%;
    right: 1%;
    z-index: 1001;
}

.timer {
    opacity: 0.85;
    user-select: none;
}

.calculator-button {
    width: fit-content;
}

.v-btn .button-text * {
    background-color: var(--tg-theme-button-color, rgb(var(--v-theme-primary)));
    color: var(--tg-theme-button-text-color, rgb(var(--v-theme-on-primary)));
}
</style>
