<script lang="ts" setup>
import {ref, watch} from "vue";
import {useWebAppTheme} from "vue-tg";

// Common section
const props = defineProps<{
    modelValue: boolean,
    fastCheckoutQuantity: number | undefined,
}>();

const emit = defineEmits<{
    'update:modelValue': [value: boolean],
    'update:fastCheckoutQuantity': [value: number | undefined],
    'processFastCheckout': [quantity: number],
}>();

const {themeParams} = useWebAppTheme();

const localModelValue = ref<boolean>(props.modelValue);
const localFastCheckoutQuantity = ref<number | undefined>(props.fastCheckoutQuantity);

const fastCheckoutClose = async () => {
    localModelValue.value = false;
    localFastCheckoutQuantity.value = undefined;
};

watch(() => props.modelValue, (newValue) => {
    localModelValue.value = newValue;
});

watch(localModelValue, (newValue) => {
    emit('update:modelValue', newValue);
});

watch(() => props.fastCheckoutQuantity, (newValue) => {
    localFastCheckoutQuantity.value = newValue;
});

watch(localFastCheckoutQuantity, (newValue) => {
    emit('update:fastCheckoutQuantity', newValue);
});
</script>

<template>
    <v-dialog
        v-model="localModelValue"
        :persistent="true"
        max-width="450px"
    >
        <v-card class="d-flex">
            <v-card-text class="text-center">
                <b>Нажимая на кнопку "Заказать", вы оформляете заказ, минуя корзину.
                    Это необходимо для быстрого отклика поставщику.</b>
            </v-card-text>
            <v-card-actions class="mx-auto">
                <v-btn @click="$emit('processFastCheckout', localFastCheckoutQuantity as number)">
                    Согласен
                </v-btn>
                <v-btn
                    :color="themeParams.button_color ?? 'primary'"
                    class="not-primary"
                    @click="fastCheckoutClose"
                >
                    Отменить
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<style lang="scss" scoped>

</style>