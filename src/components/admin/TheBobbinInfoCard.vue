<script lang="ts" setup>
import {AdminBobbinInColor} from "~/interfaces/admin/bobbin.ts";
import {computed, onMounted, ref} from "vue";
import {getOrdersByBobbinId, setWeightForBobbin} from "~/utils/api.ts";
import {AdminOrder, AdminOrderMatchInOrder, AdminOrderWithMatches} from "~/interfaces/admin/order.ts";
import {convertKeysToCamelCase} from "~/utils/converters.ts";
import {flatMap} from "lodash";
import {mapQuantity} from "~/utils/mappers.ts";
import {useAdminOrdersStore} from "~/stores/admin/orders.ts";
import TheAdminOrderInfoCard from "~/components/admin/TheAdminOrderInfoCard.vue";
import {useWebAppTheme} from "vue-tg";

// Common section
const props = defineProps<{
    bobbin: AdminBobbinInColor,
}>();

const emit = defineEmits<{
    'update:weight': [value: number | undefined],
}>();

const {colorScheme} = useWebAppTheme();

const bobbinOrders = ref<AdminOrderWithMatches[]>([]);
const matchedOrders = ref<AdminOrderMatchInOrder[]>([]);

const onFetchBobbinOrders = async () => {
    const response = await getOrdersByBobbinId(props.bobbin.id);
    if (!response.ok) {
        console.error(response);
    } else {
        bobbinOrders.value = convertKeysToCamelCase(await response.json()) as AdminOrderWithMatches[];
        matchedOrders.value = flatMap(bobbinOrders.value, (order: AdminOrderWithMatches) => order.matches);
    }
};

const requiredInputRule = [
    (v: string) => !!v || 'Обязательно',
];

const numberRule = [
    (v: string) => /^(\d+([.,]\d*)?|\.\d+)$/.test(v) || 'Введите число',
];

// Stores section
const ordersStore = useAdminOrdersStore();

// Weight section
const showWeight = ref<boolean>(true);
const showWeightEdit = ref<boolean>(false);
const inputtedWeight = ref<string>('');
const weightLoading = ref<boolean>(false);

const bobbinWeight = computed(() => {
    return props.bobbin.weight ? `${props.bobbin.weight} грамм` : 'Нет'
});

const onWeightEditClick = () => {
    showWeight.value = false;
    inputtedWeight.value = props.bobbin.weight?.toString() || '';
    showWeightEdit.value = true;
};

const onWeightEditFocusOut = () => {
    if (!inputtedWeight.value) {
        showWeightEdit.value = false;
    }
    showWeight.value = true;
};

const onSubmitWeightEdit = async () => {
    if (
        !inputtedWeight.value
        || requiredInputRule[0](inputtedWeight.value) !== true
        || numberRule[0](inputtedWeight.value) !== true
    ) {
        return;
    }
    if (inputtedWeight.value && parseFloat(inputtedWeight.value) === props.bobbin.weight) {
        showWeightEdit.value = false;
        showWeight.value = true;
        return;
    }
    weightLoading.value = true;
    const response = await setWeightForBobbin(props.bobbin.id, parseFloat(inputtedWeight.value));
    if (response.ok) {
        const result = convertKeysToCamelCase(await response.json()) as AdminBobbinInColor;
        showWeightEdit.value = false;
        emit('update:weight', result.weight);
    } else {
        console.error('Failed to change weight for bobbin')
    }
    weightLoading.value = false;
};

// Order info section
const order = ref<AdminOrder>();
const showOrderInfoDialog = ref<boolean>(false);

const onShowOrderInfo = async (orderId: number) => {
    order.value = await ordersStore.fetch(orderId);
    showOrderInfoDialog.value = true;
};

const onCloseOrderInfo = async () => {
    order.value = undefined;
    showOrderInfoDialog.value = false;
};

const onUpdateBobbinFromOrder = (bobbin: AdminBobbinInColor) => {
    order.value!.matchedBobbins.find(b => b.id === bobbin.id)!.weight = bobbin.weight
    emit('update:weight', bobbin.weight);
};

// On mounted actions
onMounted(async () => {
    await onFetchBobbinOrders();
});
</script>

<template>
    <v-card-title><b>ID Бобины</b></v-card-title>
    <v-card-text>{{ bobbin.id }}</v-card-text>

    <v-divider></v-divider>

    <v-card-title><b>Вес</b></v-card-title>
    <v-card-text>
        {{ showWeight ? bobbinWeight : '' }}
        <v-fade-transition>
            <v-btn
                v-if="bobbin.weight && showWeight"
                color="transparent"
                fab
                icon
                size="small"
                variant="flat"
                @click="onWeightEditClick"
            >
                <v-icon>mdi-pencil</v-icon>
            </v-btn>
            <v-btn
                v-else-if="!bobbin.weight && !showWeightEdit"
                color="transparent"
                fab
                variant="flat"
                @click="showWeightEdit = true"
            >
                Проставить
                <v-icon>mdi-plus</v-icon>
            </v-btn>
            <v-text-field
                v-else-if="showWeightEdit"
                v-model="inputtedWeight"
                :autofocus="true"
                :clearable="true"
                :loading="weightLoading"
                :rules="[...requiredInputRule, ...numberRule]"
                append-inner-icon="mdi-check"
                density="compact"
                label="Вес"
                single-line
                @focusout="onWeightEditFocusOut"
                @click:append-inner="onSubmitWeightEdit"
                @keydown.esc="onWeightEditFocusOut"
                @keydown.enter="onSubmitWeightEdit"
            ></v-text-field>
        </v-fade-transition>
    </v-card-text>

    <v-divider></v-divider>

    <v-card-title><b>Заказы</b></v-card-title>
    <v-list v-if="matchedOrders && matchedOrders.length > 0" class="pt-0 px-4 pb-4">
        <v-list-item
            v-for="(order, index) in matchedOrders"
            :key="index"
            class="pa-0"
        >
            <v-btn
                @click="onShowOrderInfo(order.requestId)"
            >
                <b>ID {{ order.requestId }}:</b> {{ mapQuantity(order.quantity) }}
            </v-btn>
        </v-list-item>
    </v-list>
    <v-card-text v-else>Нет</v-card-text>

    <v-dialog
        v-model="showOrderInfoDialog"
        :scrollable="true"
        max-width="600px"
    >
        <v-card v-if="order" variant="flat">
            <div class="d-flex justify-space-between align-center pr-3">
                <p class="pa-5"><b>Информация о заказе №{{ order.id }}</b></p>
                <v-btn
                    :dark="colorScheme === 'light'"
                    class="not-primary align-self-center"
                    color="transparent"
                    icon
                    size="small"
                    variant="flat"
                    @click="onCloseOrderInfo"
                >
                    <v-icon>mdi-close</v-icon>
                </v-btn>
            </div>

            <v-divider></v-divider>

            <v-card-text class="pa-1" height="fit-content">
                <v-card variant="flat">
                    <TheAdminOrderInfoCard
                        v-if="order"
                        :order="order"
                        in-article
                        @update:status="order.status = $event"
                        @update:bobbin="onUpdateBobbinFromOrder($event)"
                    />
                </v-card>
            </v-card-text>

            <v-divider></v-divider>

            <v-card-actions class="w-100 justify-center">
                <v-btn
                    size="large"
                    @click="onCloseOrderInfo"
                >
                    Сохранить
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<style lang="scss" scoped>
.v-card, .v-card *:not(.v-btn b) {
    background-color: var(--tg-theme-bg-color, rgb(var(--v-theme-background)));
    color: var(--tg-theme-text-color, rgb(var(--v-theme-text-base)));
}
</style>