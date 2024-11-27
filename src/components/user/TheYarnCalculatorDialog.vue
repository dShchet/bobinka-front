<script lang="ts" setup>
import TheLoader from "~/components/user/TheLoader.vue";
import {useWebAppTheme} from "vue-tg";
import {ref} from "vue";
import {ItemType} from "~/enums/itemType.ts";
import {Gender} from "~/enums/gender.ts";
import {YarnWeightCalculationResult, YarnWeightCalculatorData} from "~/interfaces/calculatorData.ts";
import {calculateYarnWeight} from "~/utils/api.ts";
import {convertKeysToCamelCase} from "~/utils/converters.ts";

// Common section
const props = defineProps<{
    footage?: string;
    tonalButton?: boolean;
}>();

const {themeParams, colorScheme} = useWebAppTheme();

// Snackbar section
const showSnackbar = ref<boolean>(false);

// Tooltip section
const showTooltip = ref<boolean>(false);

// Calculator section
const showCalculatorDialog = ref<boolean>(false);
const showCalculatorResultsDialog = ref<boolean>(false);

const selectedSize = ref<number>();
const selectedItemType = ref<ItemType>(ItemType.SWEATER);
const inputtedFootageMeters = ref<string>('');
const selectedFoldingNumber = ref<number>(1);

const sizes = Array.from({length: (56 - 42) / 2 + 1}, (_, index) => 42 + index * 2);
const itemTypes = Object.values(ItemType);
const foldingNumbers = Array.from({length: 10}, (_, index) => index + 1);

const requiredInputRule = [
    (v: string) => !!v || 'Обязательно',
];

const numberValidationRule = (number: string): boolean | string => {
    const numberRegex = /^[0-9]+$/;
    return numberRegex.test(number) || 'Только цифры';
};

const numberRule = [
    (v: string) => numberValidationRule(v),
];

const calculationResult = ref<YarnWeightCalculationResult>();
const calculationOk = ref<boolean>(true);

const onCalculateYarnWeight = async () => {
    if (
        !selectedSize.value
        || !selectedItemType.value
        || !selectedFoldingNumber.value
        || (!props.footage && !inputtedFootageMeters.value)) {
        showSnackbar.value = true;
        return;
    }
    showCalculatorResultsDialog.value = true;
    const response = await calculateYarnWeight({
        size: selectedSize.value,
        itemType: selectedItemType.value,
        gender: Gender.FEMALE,
        footage: props.footage ?? `${inputtedFootageMeters.value}/100`,
        foldingNumber: selectedFoldingNumber.value,
    } as YarnWeightCalculatorData);
    if (!response.ok) {
        calculationOk.value = false;
        console.error(response);
    } else {
        calculationResult.value = convertKeysToCamelCase(await response.json()) as YarnWeightCalculationResult;
    }
};
</script>

<template>
    <v-dialog
        v-model="showCalculatorDialog"
        :scrollable="true"
        max-width="500px"
    >
        <template v-slot:activator="{ props }">
            <v-btn
                :class="{'not-primary': tonalButton}"
                :color="tonalButton ? (themeParams.button_color ?? 'primary') : 'default'"
                :size="tonalButton ? 'large' : 'default'"
                :variant="tonalButton? 'tonal' : 'elevated'"
                class="calculator-button mt-3"
                v-bind="props"
                @click="showCalculatorDialog = true"
            >
                Рассчитать вес пряжи
            </v-btn>
        </template>

        <v-card class="d-flex" variant="flat">
            <div class="d-flex justify-space-between pr-3">
                <v-card-title><b>Расчет веса пряжи</b></v-card-title>
                <v-btn
                    :dark="colorScheme === 'light'"
                    class="not-primary align-self-center"
                    color="transparent"
                    icon
                    size="small"
                    variant="flat"
                    @click="showCalculatorDialog = false;"
                >
                    <v-icon>mdi-close</v-icon>
                </v-btn>
            </div>

            <v-divider></v-divider>

            <div class="pa-3 d-flex">
                <span class="pa-0 ma-0 ml-1 calculator-tooltip-text" @click="showTooltip = !showTooltip;">
                    <b>Расчет примерный</b>
                </span>
                <v-tooltip v-model="showTooltip" location="bottom">
                    <template v-slot:activator="{ props }">
                        <v-icon v-bind="props">mdi-information-outline</v-icon>
                    </template>
                    Расчет зависит от длины изделия, узора, индивидуальной плотности, размера спиц и других факторов,
                    так что советуем брать пряжу с запасом. Расчет производится для женских вещей.
                </v-tooltip>
            </div>

            <v-divider></v-divider>

            <v-card-text class="pa-0 ma-0" style="height: fit-content;">
                <v-card class="pa-3" variant="flat">
                    <v-select
                        v-model="selectedSize"
                        :items="sizes"
                        :rules="requiredInputRule"
                        :theme="colorScheme"
                        class="mb-2"
                        hide-details
                        label="Размер"
                    ></v-select>

                    <v-select
                        v-model="selectedItemType"
                        :items="itemTypes"
                        :rules="requiredInputRule"
                        :theme="colorScheme"
                        class="mb-2"
                        hide-details
                        label="Тип изделия"
                    ></v-select>

                    <div v-if="!footage">
                        <v-text-field
                            v-model="inputtedFootageMeters"
                            :rules="[...requiredInputRule, ...numberRule]"
                            class="mb-2"
                            hint="Метры из метража на 100 грамм пряжи"
                            label="Метры"
                            persistent-hint
                        ></v-text-field>
                    </div>

                    <v-select
                        v-model="selectedFoldingNumber"
                        :items="foldingNumbers"
                        :rules="requiredInputRule"
                        :theme="colorScheme"
                        hide-details
                        label="Количество сложений"
                    ></v-select>
                </v-card>
            </v-card-text>

            <v-divider></v-divider>

            <v-card-actions class="d-flex justify-center">
                <v-btn class="calculator-button mr-2" @click="onCalculateYarnWeight">Рассчитать</v-btn>
                <v-btn
                    :color="themeParams.button_color ?? 'primary'"
                    class="calculator-button not-primary"
                    variant="tonal"
                    @click="showCalculatorDialog = false;"
                >
                    Закрыть
                </v-btn>
            </v-card-actions>
        </v-card>

        <v-dialog
            v-model="showCalculatorResultsDialog"
            max-width="500px"
        >
            <v-card variant="flat">
                <div class="d-flex justify-space-between pr-3">
                    <v-card-title><b>Результаты расчета</b></v-card-title>
                    <v-btn
                        :dark="colorScheme === 'light'"
                        class="not-primary align-self-center"
                        color="transparent"
                        icon
                        size="small"
                        variant="flat"
                        @click="showCalculatorResultsDialog = false;"
                    >
                        <v-icon>mdi-close</v-icon>
                    </v-btn>
                </div>

                <v-divider></v-divider>

                <div class="pa-3">
                    <div v-if="calculationResult && calculationOk">
                        <v-card-title><b>Метраж:</b> {{ calculationResult.meters }} м</v-card-title>
                        <v-card-title><b>Вес:</b> {{ calculationResult.grams }} г</v-card-title>
                    </div>
                    <div v-else-if="!calculationResult && calculationOk" class="d-flex justify-center my-3">
                        <TheLoader/>
                    </div>
                    <div v-else-if="!calculationResult && !calculationOk" class="d-flex justify-center my-3">
                        <v-card-title>Что-то пошло не так! Попробуйте еще раз.</v-card-title>
                    </div>
                </div>

                <v-divider></v-divider>

                <v-card-actions class="d-flex justify-center">
                    <v-btn @click="showCalculatorResultsDialog = false; calculationOk = true;">Закрыть</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </v-dialog>

    <v-snackbar
        v-model="showSnackbar"
        :color="themeParams.bg_color ?? 'grey-lighten-5'"
        timeout="3000"
    >
        Заполните все поля!
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
</template>

<style lang="scss" scoped>
.calculator-button {
    width: fit-content;
}

.v-card, .v-card *, .v-dialog .v-card {
    background-color: var(--tg-theme-bg-color, rgb(var(--v-theme-background)));
    color: var(--tg-theme-text-color, rgb(var(--v-theme-on-surface)));
}

.calculator-tooltip-text {
    width: fit-content;
    font-size: 1rem;
    text-decoration: underline;
    cursor: pointer;
}
</style>