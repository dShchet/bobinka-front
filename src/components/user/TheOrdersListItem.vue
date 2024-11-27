<script lang="ts" setup>
import {BASE_URL} from "~/config/constants.ts";
import {openArticlePage} from "~/utils/navigation.ts";
import TheLoader from "~/components/user/TheLoader.vue";
import {ref} from "vue";
import {useScreenStore} from "~/stores/screen.ts";
import {storeToRefs} from "pinia";
import {archiveOrder, unarchiveOrder} from "~/utils/api.ts";
import {useWebAppTheme} from "vue-tg";
import {type Order} from "~/interfaces/order.ts";

// Common section
const props = defineProps<{
    order: Order,
    archive?: boolean,
}>();

const emit = defineEmits(['archive:orderId', 'unarchive:orderId']);

const {themeParams} = useWebAppTheme();

const showInfo = ref<boolean>(false);

// Stores section
const screenStore = useScreenStore();
const {isWideScreen} = storeToRefs(screenStore);

// Actions section
const onArchive = async () => {
    const response = await archiveOrder(props.order.id);
    if (!response.ok) {
        console.error(response);
    } else {
        emit('archive:orderId', props.order.id);
    }
};

const onUnarchive = async () => {
    const response = await unarchiveOrder(props.order.id);
    if (!response.ok) {
        console.error(response);
    } else {
        emit('unarchive:orderId', props.order.id);
    }
};
</script>

<template>
    <v-list-item class="mb-1 pa-3">
        <div class="d-flex flex-column">
            <div :class="{'flex-column': !isWideScreen}" class="d-flex justify-space-between">
                <div class="d-flex">
                    <v-img
                        :src="BASE_URL + `/articles/colors/photo/${order.color.id}`"
                        class="align-self-center"
                        height="65px"
                        style="cursor: pointer;"
                        width="65px"
                        @click="openArticlePage($router, {
                                id: order.article.id,
                                colors: [{...order.color}]
                            })"
                    >
                        <template v-slot:placeholder>
                            <TheLoader/>
                        </template>
                    </v-img>
                    <div class="ml-1 align-self-center">
                        <v-card-text><b>{{ order.article.name }}</b>: {{ order.article.preorderStatus }}
                            ({{ order.quantity }})
                        </v-card-text>
                    </div>
                </div>

                <div class="d-flex align-content-center">
                    <v-card-text v-if="order.article.priceSale" class="pa-0 align-self-center mr-3">
                        <span class="not-sale-price">{{ order.article.priceRetail }}</span>
                        <b>&nbsp;{{ order.article.priceSale }}</b> ₽ / г
                    </v-card-text>
                    <v-card-text v-else class="pa-0 align-self-center mr-3"><b>{{ order.article.priceRetail }} ₽ / г</b>
                    </v-card-text>
                    <v-btn class="align-self-center not-primary" color="transparent" icon variant="flat"
                           @click="showInfo = !showInfo">
                        <v-icon>mdi-chevron-down</v-icon>
                    </v-btn>
                </div>
            </div>

            <v-fade-transition>
                <v-card v-if="showInfo" class="mt-3">
                    <v-card-text class="mb-3"><b>Заказ {{ order.id }}</b></v-card-text>

                    <v-card-text><b>Статус:</b> {{ order.status }}</v-card-text>
                    <v-card-text><b>Артикул:</b> {{ order.article.name }}</v-card-text>
                    <v-card-text><b>Состав:</b> {{ order.article.structure }}</v-card-text>
                    <v-card-text><b>Метраж:</b> {{ order.article.footage }}</v-card-text>
                    <v-card-text><b>Цвет:</b> {{ order.color.name }}</v-card-text>
                    <v-card-text><b>Количество:</b> {{ order.quantity == 0.5 ? 'Половина' : 'Целая' }}</v-card-text>
                    <v-card-text class="mb-3"><b>Стоимость за грамм:</b>
                        <span v-if="!order.article.priceSale">&nbsp;{{ order.article.priceRetail }} ₽</span>
                        <span v-else>
                            <span class="not-sale-price">&nbsp;{{ order.article.priceRetail }}</span>
                            <b>&nbsp;{{ order.article.priceSale }}</b> ₽
                        </span>
                    </v-card-text>

                    <v-card-text><b>Фактический вес:</b> {{ order.bobbinWeight ?? 'Отсутствует' }}</v-card-text>
                    <v-card-text class="mb-3">
                        <b>Стоимость окончательная:</b> {{
                            order.bobbinPrice ? `${order.bobbinPrice} ₽` : 'Отсутствует'
                        }}
                    </v-card-text>

                    <v-card-text><b>Статус доставки:</b> {{ order.deliveryState ?? 'Отсутствует' }}</v-card-text>
                    <v-card-text><b>Ссылка для оплаты:</b> {{ order.payLink ?? 'Отсутствует' }}</v-card-text>
                    <v-card-text><b>Трек номер:</b> {{ order.trackNumber ?? 'Отсутствует' }}</v-card-text>

                    <v-btn
                        v-if="!archive"
                        :color="themeParams.button_color ?? 'primary'"
                        class="mt-3 w-100 not-primary"
                        size="large"
                        variant="tonal"
                        @click="onArchive"
                    >
                        В архив
                    </v-btn>
                    <v-btn
                        v-else
                        :color="themeParams.button_color ?? 'primary'"
                        class="mt-3 w-100 not-primary"
                        size="large"
                        variant="tonal"
                        @click="onUnarchive"
                    >
                        Из архива
                    </v-btn>
                </v-card>
            </v-fade-transition>
        </div>
    </v-list-item>
    <v-divider></v-divider>
</template>

<style lang="scss" scoped>
.v-card-text {
    padding: 0;

    @media only screen and (min-width: 600px) {
        font-size: 20px;
        padding-top: 5px;
        padding-bottom: 5px;
    }
}

.v-card {
    background-color: var(--tg-theme-secondary-bg-color, rgb(var(--v-theme-background)));
    color: var(--tg-theme-text-color, rgb(var(--v-theme-on-surface)));
}
</style>
