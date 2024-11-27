<script lang="ts" setup>
import {AdminOrder} from "~/interfaces/admin/order.ts";
import {formatDate} from "~/utils/time.ts";
import {
    mapArticleStatus,
    mapColorStatus,
    mapDeliveryType,
    mapOrderStatus,
    mapOrderStatusString,
    mapPreorderType,
    mapQuantity
} from "~/utils/mappers.ts";
import {computed, ref, watch} from "vue";
import {BASE_URL} from "~/config/constants.ts";
import {ArticleStatus, OrderStatus} from "~/enums/statuses.ts";
import {convertKeysToCamelCase} from "~/utils/converters.ts";
import {useWebAppTheme} from "vue-tg";
import {setWeightForBobbin, updateOrderStatus} from "~/utils/api.ts";
import {AdminBobbinInColor} from "~/interfaces/admin/bobbin.ts";
import {useRouter} from "vue-router";

// Common section
interface Props {
    order: AdminOrder,
    inArticle?: boolean,
}

const props = withDefaults(defineProps<Props>(), {
    inArticle: () => false,
});

const emit = defineEmits<{
    'update:status': [value: OrderStatus],
    'update:bobbin': [value: AdminBobbinInColor],
}>();

const router = useRouter();

const {colorScheme} = useWebAppTheme();

const requiredInputRule = [
    (v: string) => !!v || 'Обязательно',
];

const numberRule = [
    (v: string) => /^(\d+([.,]\d*)?|\.\d+)$/.test(v) || 'Введите число',
];

const localOrder = ref<AdminOrder>(props.order);

watch(() => props.order, async (newVal) => {
    localOrder.value = newVal;
});

// Expansion panel section
const panel = ref<number[]>([]);

// Order status section
const orderStatuses = computed(() => {
    return Object.values(OrderStatus).map(status => mapOrderStatus(status));
});

const showOrderStatus = ref<boolean>(true);
const showOrderStatusEdit = ref<boolean>(false);
const selectedOrderStatusName = ref<string>(mapOrderStatus(localOrder.value.status));
const orderStatusLoading = ref<boolean>(false);

const onOrderStatusEditClick = () => {
    showOrderStatus.value = false;
    showOrderStatusEdit.value = true;
};

const onOrderStatusEditFocusOut = () => {
    showOrderStatusEdit.value = false;
    showOrderStatus.value = true;
};

const onSubmitOrderStatusEdit = async () => {
    const selectedOrderStatus = mapOrderStatusString(selectedOrderStatusName.value);
    if (selectedOrderStatus === localOrder.value.status) {
        showOrderStatusEdit.value = false;
        showOrderStatus.value = true;
        return;
    }
    orderStatusLoading.value = true;
    const response = await updateOrderStatus(localOrder.value.id, selectedOrderStatus);
    if (response.ok) {
        const result = convertKeysToCamelCase(await response.json()) as AdminOrder;
        showOrderStatusEdit.value = false;
        showOrderStatus.value = true;
        emit('update:status', result.status);
    } else {
        console.error('Failed to change order status')
    }
    orderStatusLoading.value = false;
};

// Bobbin weight section
const showWeights = ref<boolean[]>(localOrder.value.matchedBobbins.map(() => true));
const showWeightEdits = ref<boolean[]>(localOrder.value.matchedBobbins.map(() => false));
const inputtedWeights = ref<string[]>(localOrder.value.matchedBobbins.map((bobbin) => bobbin.weight?.toString() || ''));
const weightLoadings = ref<boolean[]>(localOrder.value.matchedBobbins.map(() => false));

const getBobbinWeightText = (bobbin: AdminBobbinInColor) => {
    return bobbin.weight ? `${bobbin.weight} грамм` : 'Нет'
};

const onWeightEditClick = (index: number) => {
    showWeights.value[index] = false;
    inputtedWeights.value[index] = localOrder.value.matchedBobbins[index].weight?.toString() || '';
    showWeightEdits.value[index] = true;
};

const onWeightEditFocusOut = (index: number) => {
    if (!inputtedWeights.value[index]) {
        showWeightEdits.value[index] = false;
    }
    showWeights.value[index] = true;
};

const onSubmitWeightEdit = async (index: number) => {
    if (
        !inputtedWeights.value[index]
        || requiredInputRule[0](inputtedWeights.value[index]) !== true
        || numberRule[0](inputtedWeights.value[index]) !== true
    ) {
        return;
    }
    const bobbin = localOrder.value.matchedBobbins[index];
    if (inputtedWeights.value[index] && parseFloat(inputtedWeights.value[index]) === bobbin.weight) {
        showWeightEdits.value[index] = false;
        showWeights.value[index] = true;
        return;
    }
    weightLoadings.value[index] = true;
    const response = await setWeightForBobbin(bobbin.id, parseFloat(inputtedWeights.value[index]));
    if (response.ok) {
        const result = convertKeysToCamelCase(await response.json()) as AdminBobbinInColor;
        showWeightEdits.value[index] = false;
        emit('update:bobbin', result);
    } else {
        console.error('Failed to change weight for bobbin')
    }
    weightLoadings.value[index] = false;
};

// Navigation section
const navigateToArticle = async (articleId: number, middleClick: boolean = false) => {
    if (middleClick) {
        const routeData = router.resolve({name: 'admin-edit-article', params: {id: articleId}});
        window.open(routeData.href, '_blank');
        return;
    }
    await router.push({name: 'admin-edit-article', params: {id: articleId}});
};
</script>

<template>
    <v-card class="pa-3 w-100" variant="flat">
        <v-card-title><b>ID Заказа</b></v-card-title>
        <v-card-text>{{ localOrder.id }}</v-card-text>

        <v-divider></v-divider>

        <v-card-title><b>Создан</b></v-card-title>
        <v-card-text>{{ formatDate(localOrder.createdAt) }}</v-card-text>

        <v-divider></v-divider>

        <v-card-title><b>Статус</b></v-card-title>
        <v-card-text>
            {{ showOrderStatus ? mapOrderStatus(localOrder.status) : '' }}
            <v-fade-transition>
                <v-btn
                    v-if="showOrderStatus"
                    color="transparent"
                    fab
                    icon
                    size="small"
                    variant="flat"
                    @click="onOrderStatusEditClick"
                >
                    <v-icon>mdi-pencil</v-icon>
                </v-btn>

                <div v-else-if="showOrderStatusEdit">
                    <v-select
                        v-model="selectedOrderStatusName"
                        :items="orderStatuses"
                        :loading="orderStatusLoading"
                        :rules="requiredInputRule"
                        :theme="colorScheme"
                        class="my-2"
                        density="compact"
                        hide-details
                        label="Предзаказ"
                        @keydown.esc="onOrderStatusEditFocusOut"
                    ></v-select>

                    <v-card-actions>
                        <v-btn
                            :disabled="selectedOrderStatusName === mapOrderStatus(localOrder.status)"
                            @click="onSubmitOrderStatusEdit"
                        >
                            Сохранить
                        </v-btn>

                        <v-btn
                            class="not-primary"
                            color="info"
                            variant="tonal"
                            @click="onOrderStatusEditFocusOut"
                        >
                            Отменить
                        </v-btn>
                    </v-card-actions>
                </div>
            </v-fade-transition>
        </v-card-text>

        <v-divider></v-divider>

        <v-card-title><b>Количество</b></v-card-title>
        <v-card-text>{{ mapQuantity(localOrder.quantity) }}</v-card-text>

        <v-divider></v-divider>

        <v-card-title><b>Комментарий</b></v-card-title>
        <v-card-text>{{ localOrder.comment ?? 'Нет' }}</v-card-text>

        <v-divider></v-divider>

        <v-card-title><b>Образец</b></v-card-title>
        <v-card-text>{{ localOrder.sample ?? 'Нет' }}</v-card-text>

        <v-divider></v-divider>

        <v-card-title><b>ФИО</b></v-card-title>
        <v-card-text>{{ localOrder.fullname }}</v-card-text>

        <v-divider></v-divider>

        <v-card-title><b>Статус доставки</b></v-card-title>
        <v-card-text>{{ localOrder.deliveryState ?? 'Нет' }}</v-card-text>

        <v-divider></v-divider>

        <v-card-title><b>Тип доставки</b></v-card-title>
        <v-card-text>{{ mapDeliveryType(localOrder.deliveryType) }}</v-card-text>

        <v-divider></v-divider>

        <v-card-title><b>Ссылка на оплату</b></v-card-title>
        <v-card-text>{{ localOrder.payLink ?? 'Нет' }}</v-card-text>

        <v-divider></v-divider>

        <v-card-title><b>Трек-код</b></v-card-title>
        <v-card-text>{{ localOrder.trackNumber ?? 'Нет' }}</v-card-text>

        <v-divider></v-divider>

        <v-card-title><b>В архиве</b></v-card-title>
        <v-card-text>{{ localOrder.isArchived ? 'Да' : 'Нет' }}</v-card-text>

        <v-divider></v-divider>

        <v-expansion-panels v-model="panel" :multiple="true" class="mt-3">
            <!-- User -->
            <v-expansion-panel class="mb-3">
                <v-expansion-panel-title>
                    <v-card-title class="pa-0 ma-0 title">Пользователь</v-card-title>
                </v-expansion-panel-title>

                <v-expansion-panel-text class="pa-0">
                    <v-card-title><b>ID пользователя</b></v-card-title>
                    <v-card-text>{{ localOrder.user.id }}</v-card-text>

                    <v-divider></v-divider>

                    <v-card-title><b>Имя</b></v-card-title>
                    <v-card-text>{{ localOrder.user.firstName }}</v-card-text>

                    <v-divider></v-divider>

                    <v-card-title><b>Фамилия</b></v-card-title>
                    <v-card-text>{{ localOrder.user.lastName ?? 'Нет' }}</v-card-text>

                    <v-divider></v-divider>

                    <v-card-title><b>Username</b></v-card-title>
                    <v-card-text>{{ localOrder.user.username ?? 'Нет' }}</v-card-text>

                    <v-divider></v-divider>

                    <v-card-title><b>Номер телефона</b></v-card-title>
                    <v-card-text>{{ localOrder.user.phone ? `+${localOrder.user.phone}` : 'Нет' }}</v-card-text>

                    <v-divider></v-divider>

                    <v-card-title><b>Адрес</b></v-card-title>
                    <v-card-text>{{ localOrder.user.address ? `+${localOrder.user.address}` : 'Нет' }}</v-card-text>

                    <v-divider></v-divider>

                    <v-card-text class="ma-0 py-2 px-4 title"><b>Запомнен выбор пользовательского соглашения</b>
                    </v-card-text>
                    <v-card-text>{{ localOrder.user.isEulaChoiceRemembered ? 'Да' : 'Нет' }}</v-card-text>

                    <v-divider></v-divider>

                    <v-card-text class="ma-0 py-2 px-4 title"><b>Доступна рассылка</b></v-card-text>
                    <v-card-text>{{ localOrder.user.isDistributeAvailable ? 'Да' : 'Нет' }}</v-card-text>

                    <v-divider></v-divider>

                    <v-card-text class="ma-0 py-2 px-4 title"><b>Хочет горячие артикулы</b></v-card-text>
                    <v-card-text>{{ localOrder.user.wantsHotArticles ? 'Да' : 'Нет' }}</v-card-text>

                    <v-divider></v-divider>

                    <v-card-title><b>Баллы</b></v-card-title>
                    <v-card-text>{{ localOrder.user.pointsBalance }}</v-card-text>

                    <v-divider></v-divider>

                    <v-card-title><b>Роль</b></v-card-title>
                    <v-card-text>{{ localOrder.user.role.name }}</v-card-text>

                    <v-divider></v-divider>

                    <v-card-title><b>Рефералы</b></v-card-title>
                    <v-card-text>
                        <span
                            v-for="referral in localOrder.user.referrals"
                            v-if="localOrder.user.referrals.length > 0"
                            :key="referral.id"
                        >
                            {{ referral.referrerId }} → {{ referral.referredId }}<br>
                        </span>
                        <span v-else>Нет</span>
                    </v-card-text>
                </v-expansion-panel-text>
            </v-expansion-panel>

            <v-divider></v-divider>

            <!-- Article -->
            <v-expansion-panel v-if="!inArticle" class="my-3">
                <v-expansion-panel-title>
                    <v-card-title class="pa-0 ma-0 title">Артикул</v-card-title>
                </v-expansion-panel-title>

                <v-expansion-panel-text class="pa-0">
                    <v-card-title><b>ID артикула</b></v-card-title>
                    <v-card-text>{{ localOrder.article.id }}</v-card-text>

                    <v-divider></v-divider>

                    <v-card-title><b>Название артикула</b></v-card-title>
                    <v-card-text>{{ localOrder.article.name }}</v-card-text>

                    <v-divider></v-divider>

                    <v-card-title><b>Предзаказ</b></v-card-title>
                    <v-card-text>{{ localOrder.article.preorder.name }}</v-card-text>

                    <v-divider></v-divider>

                    <v-card-title><b>Тип предзаказа</b></v-card-title>
                    <v-card-text>{{ mapPreorderType(localOrder.article.preorder.type) }}</v-card-text>

                    <v-divider></v-divider>

                    <v-card-title><b>Статус</b></v-card-title>
                    <v-card-text>{{
                            mapArticleStatus(localOrder.article.status ?? ArticleStatus.INACTIVE)
                        }}
                    </v-card-text>

                    <v-card-title><b>Состав</b></v-card-title>
                    <v-card-text>{{ localOrder.article.structure }}</v-card-text>

                    <v-divider></v-divider>

                    <v-card-title><b>Метраж</b></v-card-title>
                    <v-card-text>{{ localOrder.article.footage }}</v-card-text>

                    <v-divider></v-divider>

                    <v-card-title><b>Цена опт</b></v-card-title>
                    <v-card-text>{{ localOrder.article.priceOpt }} &#8381;</v-card-text>

                    <v-divider></v-divider>

                    <v-card-title><b>Цена розничная</b></v-card-title>
                    <v-card-text>{{ localOrder.article.priceRetail }} &#8381;</v-card-text>

                    <v-divider></v-divider>

                    <v-card-title><b>Скидка</b></v-card-title>
                    <v-card class="mb-3">
                        <v-card-title><b>Цена по скидке</b></v-card-title>
                        <v-card-text>{{
                                localOrder.article.priceSale ? `${localOrder.article.priceSale} &#8381;` : 'Нет'
                            }}
                        </v-card-text>
                        <v-card-title><b>Название скидки</b></v-card-title>
                        <v-card-text>{{ localOrder.article.saleName ?? 'Нет' }}</v-card-text>
                    </v-card>

                    <v-divider></v-divider>

                    <v-card-title><b>Действует до</b></v-card-title>
                    <v-card-text>{{
                            localOrder.article.expiredAt ? formatDate(localOrder.article.expiredAt) : 'Без времени жизни'
                        }}
                    </v-card-text>

                    <v-divider></v-divider>

                    <v-card-title><b>В наличии</b></v-card-title>
                    <v-card-text>{{ localOrder.article.inStock ? 'Да' : 'Нет' }}</v-card-text>

                    <v-divider></v-divider>

                    <v-card-actions class="d-flex justify-center" width="fit-content">
                        <v-btn
                            width="fit-content"
                            @click="navigateToArticle(localOrder.article.id, true)"
                            @click.middle="navigateToArticle(localOrder.article.id, true)"
                            @mousedown.middle.prevent.stop
                        >
                            К артикулу
                        </v-btn>
                    </v-card-actions>
                </v-expansion-panel-text>
            </v-expansion-panel>

            <v-divider></v-divider>

            <!-- Color -->
            <v-expansion-panel class="my-3">
                <v-expansion-panel-title>
                    <img
                        :alt="localOrder.color.name"
                        :src="BASE_URL + `/articles/colors/photo/${localOrder.color.id}`"
                        :style="{height: '50px'}"
                        class="mr-2"
                    />
                    <v-card-title class="pa-0 ma-0 title">Цвет</v-card-title>
                </v-expansion-panel-title>

                <v-expansion-panel-text class="pa-0">
                    <v-card-title><b>ID цвета</b></v-card-title>
                    <v-card-text>{{ localOrder.color.id }}</v-card-text>

                    <v-divider></v-divider>

                    <v-card-title><b>Название</b></v-card-title>
                    <v-card-text>{{ localOrder.color.name }}</v-card-text>

                    <v-divider></v-divider>

                    <v-card-title><b>Номер в артикуле</b></v-card-title>
                    <v-card-text>{{ localOrder.color.numInArticle }}</v-card-text>

                    <v-divider></v-divider>

                    <v-card-title><b>Multicolor</b></v-card-title>
                    <v-card-text>{{ localOrder.color.multicolor }}</v-card-text>

                    <v-divider></v-divider>

                    <v-card-title><b>1C ID</b></v-card-title>
                    <v-card-text>{{ localOrder.color.id1c ?? 'Нет' }}</v-card-text>

                    <v-divider></v-divider>

                    <v-card-title><b>Статус</b></v-card-title>
                    <v-card-text>{{ mapColorStatus(localOrder.color.status) }}</v-card-text>

                    <v-divider></v-divider>

                    <v-card-text class="ma-0 py-2 px-4 title"><b>Количество не заматченных бобин</b></v-card-text>
                    <v-card-text class="pt-0">{{ localOrder.color.quantity }}</v-card-text>
                </v-expansion-panel-text>
            </v-expansion-panel>

            <v-divider></v-divider>

            <!-- Matched bobbins -->
            <v-expansion-panel class="my-3">
                <v-expansion-panel-title>
                    <v-card-title class="pa-0 ma-0 title">Заматченные бобины</v-card-title>
                </v-expansion-panel-title>

                <v-expansion-panel-text class="pa-0">
                    <v-card
                        v-for="(bobbin, index) in localOrder.matchedBobbins"
                        :key="bobbin.id"
                        :class="{'mb-3': index !== localOrder.matchedBobbins.length - 1}"
                    >
                        <v-card-title><b>ID бобины</b></v-card-title>
                        <v-card-text>{{ bobbin.id }}</v-card-text>

                        <v-divider></v-divider>

                        <v-card-title><b>Номер в цвете</b></v-card-title>
                        <v-card-text>{{ bobbin.numInColor }}</v-card-text>

                        <v-divider></v-divider>

                        <v-card-title><b>Количество</b></v-card-title>
                        <v-card-text>{{ bobbin.quantity }}</v-card-text>

                        <v-divider></v-divider>

                        <v-card-text class="ma-0 py-2 px-4 title"><b>Доступное количество</b></v-card-text>
                        <v-card-text>{{ bobbin.availableQuantity }}</v-card-text>

                        <v-divider></v-divider>

                        <v-card-title><b>Вес</b></v-card-title>
                        <v-card-text>
                            {{ showWeights[index] ? getBobbinWeightText(bobbin) : '' }}
                            <v-fade-transition>
                                <v-btn
                                    v-if="bobbin.weight && showWeights[index]"
                                    color="transparent"
                                    fab
                                    icon
                                    size="small"
                                    variant="flat"
                                    @click="onWeightEditClick(index)"
                                >
                                    <v-icon>mdi-pencil</v-icon>
                                </v-btn>
                                <v-btn
                                    v-else-if="!bobbin.weight && !showWeightEdits[index]"
                                    color="transparent"
                                    fab
                                    variant="flat"
                                    @click="showWeightEdits[index] = true"
                                >
                                    Проставить
                                    <v-icon>mdi-plus</v-icon>
                                </v-btn>
                                <v-text-field
                                    v-else-if="showWeightEdits[index]"
                                    v-model="inputtedWeights[index]"
                                    :autofocus="true"
                                    :clearable="true"
                                    :loading="weightLoadings[index]"
                                    :rules="[...requiredInputRule, ...numberRule]"
                                    append-inner-icon="mdi-check"
                                    density="compact"
                                    label="Вес"
                                    single-line
                                    @focusout="onWeightEditFocusOut(index)"
                                    @click:append-inner="onSubmitWeightEdit(index)"
                                    @keydown.esc="onWeightEditFocusOut(index)"
                                    @keydown.enter="onSubmitWeightEdit(index)"
                                ></v-text-field>
                            </v-fade-transition>
                        </v-card-text>
                    </v-card>
                </v-expansion-panel-text>
            </v-expansion-panel>

            <v-divider></v-divider>

            <!-- Matches -->
            <v-expansion-panel class="mt-3">
                <v-expansion-panel-title>
                    <v-card-title class="pa-0 ma-0 title">Матчи</v-card-title>
                </v-expansion-panel-title>

                <v-expansion-panel-text class="pa-0">
                    <v-card
                        v-for="(match, index) in localOrder.matches"
                        :key="match.id"
                        :class="{'mb-3': index !== localOrder.matchedBobbins.length - 1}"
                    >
                        <v-card-title><b>ID матча</b></v-card-title>
                        <v-card-text>{{ match.id }}</v-card-text>

                        <v-divider></v-divider>

                        <v-card-title><b>Количество</b></v-card-title>
                        <v-card-text>{{ match.quantity }}</v-card-text>

                        <v-divider></v-divider>

                        <v-card-title><b>Дата матча</b></v-card-title>
                        <v-card-text>{{ formatDate(match.matchedAt) }}</v-card-text>
                    </v-card>
                </v-expansion-panel-text>
            </v-expansion-panel>
        </v-expansion-panels>
    </v-card>
</template>

<style lang="scss" scoped>
.title {
    font-size: 1.2rem;
    line-height: 2rem !important;
}

.v-card, .v-card *:not(.v-expansion-panel, .v-expansion-panel *) {
    background-color: var(--tg-theme-bg-color, rgb(var(--v-theme-background)));
    color: var(--tg-theme-text-color, rgb(var(--v-theme-text-base)));
}

.v-expansion-panel, .v-expansion-panel * {
    background-color: var(--tg-theme-secondary-bg-color, rgb(var(--v-theme-background)));
    color: var(--tg-theme-text-color, rgb(var(--v-theme-text-base)));
}
</style>