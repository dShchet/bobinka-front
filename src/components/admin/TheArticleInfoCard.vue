<script lang="ts" setup>
import {mapArticleStatus, mapBoolean, mapPreorderType, mapPreorderTypeString} from "~/utils/mappers.ts";
import {AdminArticle} from "~/interfaces/admin/article.ts";
import {useWebAppTheme} from "vue-tg";
import {computed, onMounted, ref, watch} from "vue";
import {
    changeArticleExpiredAt,
    getArticleOrdersCount,
    getPreorders,
    toggleArticleInStock,
    updateArticleFootage,
    updateArticleName,
    updateArticleOptPrice,
    updateArticlePreorder,
    updateArticleRetailPrice,
    updateArticleSaleInfo,
    updateArticleStructure,
    updatePreorderType
} from "~/utils/api.ts";
import {ArticleStatus} from "~/enums/statuses.ts";
import VueDatePicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css'
import {ru} from "date-fns/locale";
import {useScreenStore} from "~/stores/screen.ts";
import {storeToRefs} from "pinia";
import {convertDateToGMT, convertKeysToCamelCase} from "~/utils/converters.ts";
import {PreorderType} from "~/enums/preorderType.ts";
import {AdminPreorder} from "~/interfaces/admin/preorder.ts";
import {formatDate} from "~/utils/time.ts";

// Common section
const props = defineProps<{
    article: AdminArticle,
}>();

const emit = defineEmits<{
    'update:isInStock': [value: boolean],
    'update:expiredAt': [value: Date | undefined],
    'update:name': [value: string],
    'update:preorder': [value: AdminPreorder],
    'update:preorderType': [value: PreorderType],
    'update:structure': [value: string],
    'update:footage': [value: string],
    'update:priceOpt': [value: number],
    'update:priceRetail': [value: number],
    'update:priceSale': [value: number | undefined],
    'update:saleName': [value: string | undefined],
    deactivate: [],
    activate: [],
}>();

const {colorScheme, themeParams} = useWebAppTheme();

const requiredInputRule = [
    (v: string) => !!v || 'Обязательно',
];

const numberRule = [
    (v: string) => /^(\d+([.,]\d*)?|\.\d+)$/.test(v) || 'Введите число',
];

const notRequiredNumberRule = [
    (v: string | undefined) => /^$|^(\d+([.,]\d*)?|\.\d+)?$/.test(v || '') || 'Введите число',
];

const footageRule = [
    (v: string) => /.*?\d+.*?\D+.*?\d+.*?/.test(v) || 'Формат метража <*><число><*><число><*>',
];

const localArticle = ref<AdminArticle>(props.article);

watch(() => props.article, async (newVal) => {
    localArticle.value = newVal;
});

// Stores section
const screenStore = useScreenStore();
const {isWideScreen} = storeToRefs(screenStore);

// In stock section
const isInStock = ref<boolean>(localArticle.value.inStock);
const showInStock = ref<boolean>(true);

const onInStockEditClick = () => {
    showInStock.value = false;
};

const onInStockEditCancel = () => {
    isInStock.value = localArticle.value.inStock;
    showInStock.value = true;
};

const onInStockEditFocusOut = () => {
    if (isInStock.value === localArticle.value.inStock) {
        showInStock.value = true;
    }
};

const onSubmitInStockEdit = async () => {
    if (isInStock.value === localArticle.value.inStock) {
        showInStock.value = true;
        return;
    }
    const response = await toggleArticleInStock(localArticle.value.id);
    if (!response.ok) {
        console.error(response);
    } else {
        const result = convertKeysToCamelCase(await response.json()) as AdminArticle
        emit('update:isInStock', result.inStock);
        if (result.inStock) {
            withoutExpiredAt.value = true;
            localExpiredAt.value = undefined;
            await onSubmitExpiredAtEdit();
        }
    }
    showInStock.value = true;
};

// const onInStockUpdate = async (newValue: boolean) => {
//     emit('update:isInStock', newValue);
//     if (newValue) {
//         withoutExpiredAt.value = true;
//         localExpiredAt.value = undefined;
//         await onSubmitExpiredAtEdit();
//     }
// };

// watch(isInStock, async (newValue) => {
//     emit('update:isInStock', newValue);
//     if (newValue) {
//         withoutExpiredAt.value = true;
//         localExpiredAt.value = undefined;
//         await onSubmitExpiredAtEdit();
//     }
// });

// Article name section
const showArticleName = ref<boolean>(true);
const showArticleNameEdit = ref<boolean>(false);
const inputtedArticleName = ref<string>('');
const articleNameLoading = ref<boolean>(false);

const onArticleNameEditClick = () => {
    showArticleName.value = false;
    inputtedArticleName.value = localArticle.value.name.toString() || '';
    showArticleNameEdit.value = true;
};

const onArticleNameEditFocusOut = () => {
    if (!inputtedArticleName.value) {
        showArticleNameEdit.value = false;
    }
    showArticleName.value = true;
};

const onSubmitArticleNameEdit = async () => {
    if (
        !inputtedArticleName.value
        || requiredInputRule[0](inputtedArticleName.value) !== true
    ) {
        return;
    }
    if (inputtedArticleName.value && inputtedArticleName.value === localArticle.value.name) {
        showArticleNameEdit.value = false;
        showArticleName.value = true;
        return;
    }
    articleNameLoading.value = true;
    const response = await updateArticleName(localArticle.value.id, inputtedArticleName.value);
    if (response.ok) {
        const result = convertKeysToCamelCase(await response.json()) as AdminArticle;
        showArticleNameEdit.value = false;
        emit('update:name', result.name);
    } else {
        console.error('Failed to change article name')
    }
    articleNameLoading.value = false;
};

// Preorder section
const preorders = ref<AdminPreorder[]>([]);
const preorderNames = computed(() => {
    return preorders.value.map((preorder) => preorder.name);
});

const onFetchPreorders = async () => {
    const response = await getPreorders();
    if (!response.ok) {
        console.error(response);
    } else {
        preorders.value = convertKeysToCamelCase(await response.json()) as AdminPreorder[];
    }
};

const showArticlePreorder = ref<boolean>(true);
const showArticlePreorderEdit = ref<boolean>(false);
const selectedArticlePreorderName = ref<string>('');
const selectedArticlePreorderId = ref<number>(0);
const articlePreorderLoading = ref<boolean>(false);

const onArticlePreorderEditClick = () => {
    showArticlePreorder.value = false;
    selectedArticlePreorderName.value = localArticle.value.preorder.name || '';
    selectedArticlePreorderId.value = localArticle.value.preorder.id;
    showArticlePreorderEdit.value = true;
};

const onArticlePreorderEditFocusOut = () => {
    if (!selectedArticlePreorderName.value) {
        showArticlePreorderEdit.value = false;
    }
    showArticlePreorder.value = true;
};

const onSubmitArticlePreorderEdit = async () => {
    if (
        !selectedArticlePreorderName.value
        || requiredInputRule[0](selectedArticlePreorderName.value) !== true
    ) {
        return;
    }
    const selectedPreorder = preorders.value.find(preorder => preorder.name === selectedArticlePreorderName.value);
    selectedArticlePreorderId.value = selectedPreorder?.id || 0;
    if (selectedArticlePreorderId.value && selectedArticlePreorderId.value === localArticle.value.preorder.id) {
        showArticlePreorderEdit.value = false;
        showArticlePreorder.value = true;
        return;
    }
    articlePreorderLoading.value = true;
    const response = await updateArticlePreorder(localArticle.value.id, selectedArticlePreorderId.value);
    if (response.ok) {
        const result = convertKeysToCamelCase(await response.json()) as AdminArticle;
        showArticlePreorderEdit.value = false;
        emit('update:preorder', result.preorder);
    } else {
        console.error('Failed to change preorder')
    }
    articlePreorderLoading.value = false;
};

watch(selectedArticlePreorderName, async (newValue) => {
    const selectedPreorder = preorders.value.find(preorder => preorder.name === newValue);
    if (selectedPreorder?.type === PreorderType.IN_STOCK) {
        withoutExpiredAt.value = true;
        localExpiredAt.value = undefined;
        await onSubmitExpiredAtEdit();
    }
});

// Preorder type section
const showPreorderType = ref<boolean>(true);
const showPreorderTypeEdit = ref<boolean>(false);
const selectedPreorderType = ref<string>('');
const preorderTypeLoading = ref<boolean>(false);

const preorderTypes = computed(() => {
    return Object.values(PreorderType).map((type) => mapPreorderType(type));
});

const onPreorderTypeEditClick = () => {
    showPreorderType.value = false;
    selectedPreorderType.value = mapPreorderType(localArticle.value.preorder.type) || '';
    showPreorderTypeEdit.value = true;
};

const onPreorderTypeEditFocusOut = () => {
    if (!selectedPreorderType.value) {
        showPreorderTypeEdit.value = false;
    }
    showPreorderType.value = true;
};

const onSubmitPreorderTypeEdit = async () => {
    if (
        !selectedPreorderType.value
        || requiredInputRule[0](selectedPreorderType.value) !== true
    ) {
        return;
    }
    if (selectedPreorderType.value && selectedPreorderType.value === localArticle.value.preorder.type) {
        showPreorderTypeEdit.value = false;
        showPreorderType.value = true;
        return;
    }
    preorderTypeLoading.value = true;
    const response = await updatePreorderType(localArticle.value.preorder.id, mapPreorderTypeString(selectedPreorderType.value));
    if (response.ok) {
        const result = convertKeysToCamelCase(await response.json()) as AdminPreorder;
        showPreorderTypeEdit.value = false;
        emit('update:preorderType', result.type);
    } else {
        console.error('Failed to change preorder type')
    }
    preorderTypeLoading.value = false;
};

watch(selectedPreorderType, async (newValue) => {
    const preorderType = Object.values(PreorderType).find((type) => mapPreorderType(type) === newValue);
    if (preorderType === PreorderType.IN_STOCK) {
        withoutExpiredAt.value = true;
        localExpiredAt.value = undefined;
        await onSubmitExpiredAtEdit();
    }
});

// Structure section
const showStructure = ref<boolean>(true);
const showStructureEdit = ref<boolean>(false);
const inputtedStructure = ref<string>('');
const structureLoading = ref<boolean>(false);

const onStructureEditClick = () => {
    showStructure.value = false;
    inputtedStructure.value = localArticle.value.structure.toString() || '';
    showStructureEdit.value = true;
};

const onStructureEditFocusOut = () => {
    if (!inputtedStructure.value) {
        showStructureEdit.value = false;
    }
    showStructure.value = true;
};

const onSubmitStructureEdit = async () => {
    if (
        !inputtedStructure.value
        || requiredInputRule[0](inputtedStructure.value) !== true
    ) {
        return;
    }
    if (inputtedStructure.value && inputtedStructure.value === localArticle.value.structure) {
        showStructureEdit.value = false;
        showStructure.value = true;
        return;
    }
    structureLoading.value = true;
    const response = await updateArticleStructure(localArticle.value.id, inputtedStructure.value);
    if (response.ok) {
        const result = convertKeysToCamelCase(await response.json()) as AdminArticle;
        showStructureEdit.value = false;
        emit('update:structure', result.structure);
    } else {
        console.error('Failed to change structure')
    }
    structureLoading.value = false;
};

// Footage section
const showFootage = ref<boolean>(true);
const showFootageEdit = ref<boolean>(false);
const inputtedFootage = ref<string>('');
const footageLoading = ref<boolean>(false);

const onFootageEditClick = () => {
    showFootage.value = false;
    inputtedFootage.value = localArticle.value.footage.toString() || '';
    showFootageEdit.value = true;
};

const onFootageEditFocusOut = () => {
    if (!inputtedFootage.value) {
        showFootageEdit.value = false;
    }
    showFootage.value = true;
};

const onSubmitFootageEdit = async () => {
    if (
        !inputtedFootage.value
        || requiredInputRule[0](inputtedFootage.value) !== true
        || footageRule[0](inputtedFootage.value) !== true
    ) {
        return;
    }
    if (inputtedFootage.value && inputtedFootage.value === localArticle.value.footage) {
        showFootageEdit.value = false;
        showFootage.value = true;
        return;
    }
    footageLoading.value = true;
    const response = await updateArticleFootage(localArticle.value.id, inputtedFootage.value);
    if (response.ok) {
        const result = convertKeysToCamelCase(await response.json()) as AdminArticle;
        showFootageEdit.value = false;
        emit('update:footage', result.footage);
    } else {
        console.error('Failed to change footage')
    }
    footageLoading.value = false;
};

// Price opt section
const showPriceOpt = ref<boolean>(true);
const showPriceOptEdit = ref<boolean>(false);
const inputtedPriceOpt = ref<string>('');
const priceOptLoading = ref<boolean>(false);

const onPriceOptEditClick = () => {
    showPriceOpt.value = false;
    inputtedPriceOpt.value = localArticle.value.priceOpt.toString() || '';
    showPriceOptEdit.value = true;
};

const onPriceOptEditFocusOut = () => {
    if (!inputtedPriceOpt.value) {
        showPriceOptEdit.value = false;
    }
    showPriceOpt.value = true;
};

const onSubmitPriceOptEdit = async () => {
    if (
        !inputtedPriceOpt.value
        || requiredInputRule[0](inputtedPriceOpt.value) !== true
        || numberRule[0](inputtedPriceOpt.value) !== true
    ) {
        return;
    }
    if (inputtedPriceOpt.value && parseFloat(inputtedPriceOpt.value) === localArticle.value.priceOpt) {
        showPriceOptEdit.value = false;
        showPriceOpt.value = true;
        return;
    }
    priceOptLoading.value = true;
    const response = await updateArticleOptPrice(localArticle.value.id, parseFloat(inputtedPriceOpt.value));
    if (response.ok) {
        const result = convertKeysToCamelCase(await response.json()) as AdminArticle;
        showPriceOptEdit.value = false;
        emit('update:priceOpt', result.priceOpt);
    } else {
        console.error('Failed to change opt price')
    }
    priceOptLoading.value = false;
};

// Price retail section
const showPriceRetail = ref<boolean>(true);
const showPriceRetailEdit = ref<boolean>(false);
const inputtedPriceRetail = ref<string>('');
const priceRetailLoading = ref<boolean>(false);

const onPriceRetailEditClick = () => {
    showPriceRetail.value = false;
    inputtedPriceRetail.value = localArticle.value.priceRetail.toString() || '';
    showPriceRetailEdit.value = true;
};

const onPriceRetailEditFocusOut = () => {
    if (!inputtedPriceRetail.value) {
        showPriceRetailEdit.value = false;
    }
    showPriceRetail.value = true;
};

const onSubmitPriceRetailEdit = async () => {
    if (
        !inputtedPriceRetail.value
        || requiredInputRule[0](inputtedPriceRetail.value) !== true
        || numberRule[0](inputtedPriceRetail.value) !== true
    ) {
        return;
    }
    if (inputtedPriceRetail.value && parseFloat(inputtedPriceRetail.value) === localArticle.value.priceRetail) {
        showPriceRetailEdit.value = false;
        showPriceRetail.value = true;
        return;
    }
    priceRetailLoading.value = true;
    const response = await updateArticleRetailPrice(localArticle.value.id, parseFloat(inputtedPriceRetail.value));
    if (response.ok) {
        const result = convertKeysToCamelCase(await response.json()) as AdminArticle;
        showPriceRetailEdit.value = false;
        emit('update:priceRetail', result.priceRetail);
    } else {
        console.error('Failed to change retail price')
    }
    priceRetailLoading.value = false;
};

// Sale section
const showSaleInfo = ref<boolean>(true);
const inputtedPriceSale = ref<string>('');
const inputtedSaleName = ref<string>('');
const saleForm = ref<boolean>(false);
const priceSaleLoading = ref<boolean>(false);
const saleNameLoading = ref<boolean>(false);

const showSaleInfoWarningSnackbar = ref<boolean>(false);

const onSubmitSaleForm = () => {
    if (!saleForm.value) {
        return;
    }
};

const onSubmitSaleEdit = async () => {
    if (notRequiredNumberRule[0](inputtedPriceSale.value) !== true) {
        return;
    }
    if (inputtedPriceSale.value && !inputtedSaleName.value || !inputtedPriceSale.value && inputtedSaleName.value) {
        showSaleInfoWarningSnackbar.value = true;
        return;
    }
    if (
        (inputtedPriceSale.value && inputtedSaleName.value
            && parseFloat(inputtedPriceSale.value) === localArticle.value.priceSale
            && inputtedSaleName.value === localArticle.value.saleName)
        || (!inputtedPriceSale.value && !inputtedSaleName.value && !localArticle.value.priceSale && !localArticle.value.saleName)
    ) {
        showSaleInfo.value = true;
        return;
    }
    priceSaleLoading.value = true;
    saleNameLoading.value = true;
    const response = await updateArticleSaleInfo(
        localArticle.value.id,
        inputtedPriceSale.value ? parseFloat(inputtedPriceSale.value) : null,
        inputtedSaleName.value ? inputtedSaleName.value : null,
    );
    if (response.ok) {
        const result = convertKeysToCamelCase(await response.json()) as AdminArticle;
        emit('update:priceSale', result.priceSale);
        emit('update:saleName', result.saleName);
    } else {
        console.error('Failed to change sale price')
    }
    priceSaleLoading.value = false;
    saleNameLoading.value = false;
    showSaleInfo.value = true;
};

const onSaleEditClick = () => {
    showSaleInfo.value = false;
    inputtedPriceSale.value = localArticle.value.priceSale?.toString() || '';
    inputtedSaleName.value = localArticle.value.saleName || '';
};

const onSaleEditFocusOut = () => {
    showSaleInfo.value = true;
};

// Expired at section
const showExpiredAt = ref<boolean>(true);

const localExpiredAt = ref<Date | undefined>(localArticle.value.expiredAt);
const withoutExpiredAt = ref<boolean>(!localArticle.value.expiredAt);

const datePickerState = computed(() => {
    if (!localExpiredAt.value) {
        return undefined;
    }
    return localExpiredAt.value > new Date() ? undefined : false;
});

watch(withoutExpiredAt, async (newValue: boolean) => {
    if (newValue) {
        localExpiredAt.value = undefined;
    } else if (!newValue && !showExpiredAt.value) {
        localExpiredAt.value = new Date();
    } else {
        localExpiredAt.value = localArticle.value.expiredAt;
    }
});

const formattedExpiredAt = computed(() => {
    if (!localExpiredAt.value) {
        return 'Нет';
    }
    return formatDate(localExpiredAt.value);
});

const onExpiredAtEditCancel = () => {
    if (withoutExpiredAt.value !== !localArticle.value.expiredAt) {
        withoutExpiredAt.value = !localArticle.value.expiredAt;
    }
    if (localExpiredAt.value !== localArticle.value.expiredAt) {
        localExpiredAt.value = localArticle.value.expiredAt;
    }
    showExpiredAt.value = true;
};

const onSubmitExpiredAtEdit = async () => {
    if (localExpiredAt.value === localArticle.value.expiredAt) {
        showExpiredAt.value = true;
        return;
    }
    const response = await changeArticleExpiredAt(
        localArticle.value.id,
        localExpiredAt.value ? convertDateToGMT(localExpiredAt.value) : null,
    );
    if (!response.ok) {
        console.error(response);
    } else {
        const result = convertKeysToCamelCase(await response.json()) as AdminArticle;
        showExpiredAt.value = true;
        emit('update:expiredAt', result.expiredAt);
    }
};

// Orders count section
const ordersCount = ref<number>();

const onFetchArticleOrdersCount = async () => {
    const response = await getArticleOrdersCount(localArticle.value.id);
    if (!response.ok) {
        console.error(response);
    } else {
        ordersCount.value = await response.json() as number;
    }
};

// On mounted actions
onMounted(async () => {
    await onFetchPreorders();
    await onFetchArticleOrdersCount();
});
</script>

<template>
    <v-card class="pa-3" variant="flat">
        <v-card-title><b>ID артикула</b></v-card-title>
        <v-card-text>{{ article.id }}</v-card-text>

        <v-divider></v-divider>

        <v-card-title><b>Название артикула</b></v-card-title>
        <v-card-text>
            {{ showArticleName ? article.name : '' }}
            <v-fade-transition>
                <v-btn
                    v-if="article.name && showArticleName"
                    color="transparent"
                    fab
                    icon
                    size="small"
                    variant="flat"
                    @click="onArticleNameEditClick"
                >
                    <v-icon>mdi-pencil</v-icon>
                </v-btn>
                <v-btn
                    v-else-if="!article.name && !showArticleName"
                    color="transparent"
                    fab
                    variant="flat"
                    @click="showStructureEdit = true"
                >
                    Добавить
                    <v-icon>mdi-plus</v-icon>
                </v-btn>
                <v-text-field
                    v-else-if="showArticleNameEdit"
                    v-model="inputtedArticleName"
                    :autofocus="true"
                    :clearable="true"
                    :loading="articleNameLoading"
                    :rules="[...requiredInputRule]"
                    append-inner-icon="mdi-check"
                    density="compact"
                    label="Название"
                    single-line
                    @focusout="onArticleNameEditFocusOut"
                    @click:append-inner="onSubmitArticleNameEdit"
                    @keydown.esc="onArticleNameEditFocusOut"
                    @keydown.enter="onSubmitArticleNameEdit"
                ></v-text-field>
            </v-fade-transition>
        </v-card-text>

        <v-divider></v-divider>

        <v-card-title><b>Предзаказ</b></v-card-title>
        <v-card-text>
            {{ showArticlePreorder ? article.preorder.name : '' }}
            <v-fade-transition>
                <v-btn
                    v-if="article.preorder.name && showArticlePreorder"
                    color="transparent"
                    fab
                    icon
                    size="small"
                    variant="flat"
                    @click="onArticlePreorderEditClick"
                >
                    <v-icon>mdi-pencil</v-icon>
                </v-btn>

                <v-select
                    v-else-if="showArticlePreorderEdit"
                    v-model="selectedArticlePreorderName"
                    :items="preorderNames"
                    :loading="articlePreorderLoading"
                    :rules="requiredInputRule"
                    :theme="colorScheme"
                    density="compact"
                    hide-details
                    label="Предзаказ"
                    @focusout="onArticlePreorderEditFocusOut"
                    @update:model-value="onSubmitArticlePreorderEdit"
                    @keydown.esc="onArticlePreorderEditFocusOut"
                ></v-select>
            </v-fade-transition>
        </v-card-text>

        <v-card-title><b>Тип предзаказа</b></v-card-title>
        <v-card-text>
            {{ showPreorderType ? mapPreorderType(article.preorder.type) : '' }}
            <v-fade-transition>
                <v-btn
                    v-if="article.preorder.type && showPreorderType"
                    color="transparent"
                    fab
                    icon
                    size="small"
                    variant="flat"
                    @click="onPreorderTypeEditClick"
                >
                    <v-icon>mdi-pencil</v-icon>
                </v-btn>

                <v-select
                    v-else-if="showPreorderTypeEdit"
                    v-model="selectedPreorderType"
                    :items="preorderTypes"
                    :loading="preorderTypeLoading"
                    :rules="requiredInputRule"
                    :theme="colorScheme"
                    density="compact"
                    hide-details
                    label="Тип предзаказа"
                    @focusout="onPreorderTypeEditFocusOut"
                    @update:model-value="onSubmitPreorderTypeEdit"
                    @keydown.esc="onPreorderTypeEditFocusOut"
                ></v-select>
            </v-fade-transition>
        </v-card-text>

        <v-divider></v-divider>

        <v-card-title><b>Статус</b></v-card-title>
        <v-card-text>{{ mapArticleStatus(article.status ?? ArticleStatus.INACTIVE) }}</v-card-text>

        <v-divider></v-divider>

        <v-card-title><b>Состав</b></v-card-title>
        <v-card-text>
            {{ showStructure ? article.structure : '' }}
            <v-fade-transition>
                <v-btn
                    v-if="article.structure && showStructure"
                    color="transparent"
                    fab
                    icon
                    size="small"
                    variant="flat"
                    @click="onStructureEditClick"
                >
                    <v-icon>mdi-pencil</v-icon>
                </v-btn>
                <v-btn
                    v-else-if="!article.structure && !showStructure"
                    color="transparent"
                    fab
                    variant="flat"
                    @click="showStructureEdit = true"
                >
                    Добавить
                    <v-icon>mdi-plus</v-icon>
                </v-btn>
                <v-text-field
                    v-else-if="showStructureEdit"
                    v-model="inputtedStructure"
                    :autofocus="true"
                    :clearable="true"
                    :loading="structureLoading"
                    :rules="[...requiredInputRule]"
                    append-inner-icon="mdi-check"
                    density="compact"
                    label="Состав"
                    single-line
                    @focusout="onStructureEditFocusOut"
                    @click:append-inner="onSubmitStructureEdit"
                    @keydown.esc="onStructureEditFocusOut"
                    @keydown.enter="onSubmitStructureEdit"
                ></v-text-field>
            </v-fade-transition>
        </v-card-text>

        <v-divider></v-divider>

        <v-card-title><b>Метраж</b></v-card-title>
        <v-card-text>
            {{ showFootage ? article.footage : '' }}
            <v-fade-transition>
                <v-btn
                    v-if="article.footage && showFootage"
                    color="transparent"
                    fab
                    icon
                    size="small"
                    variant="flat"
                    @click="onFootageEditClick"
                >
                    <v-icon>mdi-pencil</v-icon>
                </v-btn>
                <v-btn
                    v-else-if="!article.footage && !showFootage"
                    color="transparent"
                    fab
                    variant="flat"
                    @click="showFootageEdit = true"
                >
                    Добавить
                    <v-icon>mdi-plus</v-icon>
                </v-btn>
                <v-text-field
                    v-else-if="showFootageEdit"
                    v-model="inputtedFootage"
                    :autofocus="true"
                    :clearable="true"
                    :loading="footageLoading"
                    :rules="[...requiredInputRule, ...footageRule]"
                    append-inner-icon="mdi-check"
                    density="compact"
                    label="Метраж"
                    single-line
                    @focusout="onFootageEditFocusOut"
                    @click:append-inner="onSubmitFootageEdit"
                    @keydown.esc="onFootageEditFocusOut"
                    @keydown.enter="onSubmitFootageEdit"
                ></v-text-field>
            </v-fade-transition>
        </v-card-text>

        <v-divider></v-divider>

        <v-card-title><b>Цена опт</b></v-card-title>
        <v-card-text>
            {{ showPriceOpt ? `${article.priceOpt} &#8381;` : '' }}
            <v-fade-transition>
                <v-btn
                    v-if="article.priceOpt && showPriceOpt"
                    color="transparent"
                    fab
                    icon
                    size="small"
                    variant="flat"
                    @click="onPriceOptEditClick"
                >
                    <v-icon>mdi-pencil</v-icon>
                </v-btn>
                <v-btn
                    v-else-if="!article.priceOpt && !showPriceOpt"
                    color="transparent"
                    fab
                    variant="flat"
                    @click="showPriceOptEdit = true"
                >
                    Добавить
                    <v-icon>mdi-plus</v-icon>
                </v-btn>
                <v-text-field
                    v-else-if="showPriceOptEdit"
                    v-model="inputtedPriceOpt"
                    :autofocus="true"
                    :clearable="true"
                    :loading="priceOptLoading"
                    :rules="[...requiredInputRule, ...numberRule]"
                    append-inner-icon="mdi-check"
                    density="compact"
                    label="Цена опт"
                    single-line
                    @focusout="onPriceOptEditFocusOut"
                    @click:append-inner="onSubmitPriceOptEdit"
                    @keydown.esc="onPriceOptEditFocusOut"
                    @keydown.enter="onSubmitPriceOptEdit"
                ></v-text-field>
            </v-fade-transition>
        </v-card-text>

        <v-divider></v-divider>

        <v-card-title><b>Цена розничная</b></v-card-title>
        <v-card-text>
            {{ showPriceRetail ? `${article.priceRetail} &#8381;` : '' }}
            <v-fade-transition>
                <v-btn
                    v-if="article.priceRetail && showPriceRetail"
                    color="transparent"
                    fab
                    icon
                    size="small"
                    variant="flat"
                    @click="onPriceRetailEditClick"
                >
                    <v-icon>mdi-pencil</v-icon>
                </v-btn>
                <v-btn
                    v-else-if="!article.priceRetail && !showPriceRetail"
                    color="transparent"
                    fab
                    variant="flat"
                    @click="showPriceRetailEdit = true"
                >
                    Добавить
                    <v-icon>mdi-plus</v-icon>
                </v-btn>
                <v-text-field
                    v-else-if="showPriceRetailEdit"
                    v-model="inputtedPriceRetail"
                    :autofocus="true"
                    :clearable="true"
                    :loading="priceRetailLoading"
                    :rules="[...requiredInputRule, ...numberRule]"
                    append-inner-icon="mdi-check"
                    density="compact"
                    label="Цена розничная"
                    single-line
                    @focusout="onPriceRetailEditFocusOut"
                    @click:append-inner="onSubmitPriceRetailEdit"
                    @keydown.esc="onPriceRetailEditFocusOut"
                    @keydown.enter="onSubmitPriceRetailEdit"
                ></v-text-field>
            </v-fade-transition>
        </v-card-text>

        <v-divider></v-divider>

        <div class="d-flex align-center">
            <v-card-title><b>Скидка</b></v-card-title>

            <v-btn
                color="transparent"
                fab
                icon
                size="small"
                variant="flat"
                @click="onSaleEditClick"
            >
                <v-icon>mdi-pencil</v-icon>
            </v-btn>
        </div>
        <v-fade-transition>
            <div v-if="showSaleInfo">
                <v-card>
                    <v-card-title><b>Цена по скидке</b></v-card-title>
                    <v-card-text>{{ article.priceSale ? `${article.priceSale} &#8381;` : 'Нет' }}</v-card-text>
                    <v-card-title><b>Название скидки</b></v-card-title>
                    <v-card-text>{{ article.saleName ?? 'Нет' }}</v-card-text>
                </v-card>
            </div>

            <div
                v-else
                @keydown.esc="onSaleEditFocusOut"
                @keydown.enter="onSubmitSaleEdit"
            >
                <v-form v-model="saleForm" @submit.prevent="onSubmitSaleForm">
                    <v-card-text>
                        <b>Введите и цену, и название скидки, или не вводите ничего в обоих полях</b>
                    </v-card-text>
                    <v-text-field
                        v-model="inputtedPriceSale"
                        :autofocus="true"
                        :clearable="true"
                        :loading="priceSaleLoading"
                        :rules="[...notRequiredNumberRule]"
                        density="compact"
                        label="Цена по скидке"
                        single-line
                    ></v-text-field>

                    <v-text-field
                        v-model="inputtedSaleName"
                        :clearable="true"
                        :loading="saleNameLoading"
                        density="compact"
                        label="Название скидки"
                        single-line
                    ></v-text-field>

                    <v-card-actions>
                        <v-btn
                            :disabled="!saleForm"
                            @click="onSubmitSaleEdit"
                        >
                            Сохранить
                        </v-btn>
                        <v-btn
                            class="not-primary"
                            color="info"
                            variant="tonal"
                            @click="onSaleEditFocusOut"
                        >
                            Отменить
                        </v-btn>
                    </v-card-actions>
                </v-form>
            </div>
        </v-fade-transition>

        <v-divider></v-divider>

        <v-card-title><b>Действует до</b></v-card-title>
        <v-fade-transition>
            <div v-if="showExpiredAt" class="d-flex align-center justify-start">
                <v-card-text style="flex: .2 0 0">{{ formattedExpiredAt ?? '' }}</v-card-text>

                <v-btn
                    v-if="formattedExpiredAt !== 'Нет' && formattedExpiredAt"
                    color="transparent"
                    fab
                    icon
                    size="small"
                    variant="flat"
                    @click="showExpiredAt = false"
                >
                    <v-icon>mdi-pencil</v-icon>
                </v-btn>

                <v-btn
                    v-else-if="formattedExpiredAt === 'Нет' || !formattedExpiredAt"
                    color="transparent"
                    fab
                    variant="flat"
                    @click="showExpiredAt = false"
                >
                    Проставить
                    <v-icon>mdi-plus</v-icon>
                </v-btn>
            </div>

            <div v-else>
                <VueDatePicker
                    v-model="localExpiredAt"
                    :action-row="{ showNow: true }"
                    :clearable="false"
                    :dark="colorScheme !== 'light'"
                    :disabled="withoutExpiredAt"
                    :enable-seconds="true"
                    :format-locale="ru"
                    :min-date="new Date()"
                    :position="isWideScreen ? 'left' : 'center'"
                    :state="datePickerState"
                    cancelText="Отменить"
                    class="mb-3"
                    format="dd.MM.yyyy HH:mm:ss"
                    now-button-label="Сейчас"
                    placeholder="Ввод даты"
                    selectText="Выбрать"
                >
                    <template #input-icon>
                        <v-icon class="ml-2">mdi-calendar-blank</v-icon>
                    </template>

                    <template #clock-icon>
                        <v-icon :color="colorScheme === 'light' ? 'black' : 'white'">mdi-timer</v-icon>
                    </template>

                    <template #calendar-icon>
                        <v-icon :color="colorScheme === 'light' ? 'black' : 'white'">mdi-calendar-blank</v-icon>
                    </template>

                    <template #action-row="{ internalModelValue, selectDate, closePicker }">
                        <div class="action-row d-flex flex-column">
                            <v-card-text class="current-selection">{{ formatDate(internalModelValue) }}</v-card-text>
                            <div>
                                <v-btn class="mr-2 not-primary" color="red" size="x-small" variant="tonal"
                                       @click="closePicker">
                                    Отменить
                                </v-btn>
                                <v-btn class="mr-2 not-primary" color="info" size="x-small" variant="tonal"
                                       @click="localExpiredAt = new Date()">Сейчас
                                </v-btn>
                                <v-btn size="x-small" @click="selectDate">Выбрать</v-btn>
                            </div>
                        </div>
                    </template>
                </VueDatePicker>

                <v-checkbox
                    v-model="withoutExpiredAt"
                    :color="themeParams.button_color ?? 'primary'"
                    class="ml-3 mt-3 mb-3 pa-0"
                    density="compact"
                    hide-details
                    label="Без времени жизни"
                ></v-checkbox>

                <v-card-actions>
                    <v-btn
                        @click="onSubmitExpiredAtEdit"
                    >
                        Сохранить
                    </v-btn>

                    <v-btn
                        class="not-primary"
                        color="info"
                        variant="tonal"
                        @click="onExpiredAtEditCancel"
                    >
                        Отменить
                    </v-btn>
                </v-card-actions>
            </div>
        </v-fade-transition>

        <v-divider></v-divider>

        <v-card-title><b>В наличии</b></v-card-title>
        <v-card-text>
            {{ showInStock ? mapBoolean(article.inStock) : '' }}
            <v-fade-transition>
                <v-btn
                    v-if="showInStock"
                    color="transparent"
                    fab
                    icon
                    size="small"
                    variant="flat"
                    @click="onInStockEditClick"
                >
                    <v-icon>mdi-pencil</v-icon>
                </v-btn>
                <div
                    v-else
                    @focusout="onInStockEditFocusOut"
                >
                    <v-checkbox
                        v-model="isInStock"
                        :color="themeParams.button_color ?? 'primary'"
                        class="ml-3 mt-3 mb-3 pa-0"
                        density="compact"
                        hide-details
                        label="В наличии"
                    ></v-checkbox>

                    <v-card-actions>
                        <v-btn
                            @click="onSubmitInStockEdit"
                        >
                            Сохранить
                        </v-btn>

                        <v-btn
                            class="not-primary"
                            color="info"
                            variant="tonal"
                            @click="onInStockEditCancel"
                        >
                            Отменить
                        </v-btn>
                    </v-card-actions>
                </div>
            </v-fade-transition>
        </v-card-text>

        <v-divider></v-divider>

        <div v-if="ordersCount !== undefined">
            <v-card-title><b>Количество заказов</b></v-card-title>
            <v-card-text>{{ ordersCount }}</v-card-text>
        </div>

        <v-divider></v-divider>

        <v-card-actions class="w-100 d-flex justify-center">
            <v-expand-transition>
                <v-btn
                    v-if="article.status === ArticleStatus.INACTIVE"
                    @click="$emit('activate')"
                >
                    Активировать
                </v-btn>

                <v-btn
                    v-else-if="article.status === ArticleStatus.ACTIVE"
                    :color="themeParams.button_color ?? 'primary'"
                    class="not-primary"
                    variant="tonal"
                    @click="$emit('deactivate')"
                >
                    Деактивировать
                </v-btn>
            </v-expand-transition>
        </v-card-actions>
    </v-card>

    <v-snackbar
        v-model="showSaleInfoWarningSnackbar"
        :class="{'mb-20': !isWideScreen}"
        :color="themeParams.bg_color ?? 'grey-lighten-5'"
        timeout="3000"
    >
        Введите и цену, и название скидки, или не вводите ничего в обоих полях
        <template v-slot:actions>
            <v-btn
                :color="themeParams.button_color ?? 'primary'"
                class="not-primary"
                variant="text"
                @click="showSaleInfoWarningSnackbar = false"
            >
                Закрыть
            </v-btn>
        </template>
    </v-snackbar>
</template>

<style lang="scss" scoped>
.action-row {
    align-items: center;
}
</style>