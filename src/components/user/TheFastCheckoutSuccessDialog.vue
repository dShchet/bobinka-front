<script lang="ts" setup>
import {useWebAppTheme} from "vue-tg";
import {ref, watch} from "vue";
import {useRouter} from "vue-router";

// Common section
const props = defineProps<{
    modelValue: boolean,
}>();

const emit = defineEmits<{
    'update:modelValue': [value: boolean],
}>();

const router = useRouter();

const {colorScheme} = useWebAppTheme();

const localModelValue = ref<boolean>(props.modelValue);

watch(() => props.modelValue, (newValue) => {
    localModelValue.value = newValue;
});

watch(localModelValue, (value) => {
    emit('update:modelValue', value);
});

// Actions section
const onProfileClick = async () => {
    await router.push({name: 'profile'});
    location.reload();
};

const onCloseClick = async () => {
    location.reload();
};
</script>

<template>
    <v-dialog
        v-model="localModelValue"
        :persistent="true"
        max-width="500px"
        @update:modelValue="$emit('update:modelValue', $event)"
    >
        <v-card variant="flat">
            <div class="d-flex justify-space-between pr-3">
                <v-card-title><b>Заказ оформлен</b></v-card-title>
                <v-btn
                    :dark="colorScheme === 'light'"
                    class="not-primary align-self-center"
                    color="transparent"
                    icon
                    size="small"
                    variant="flat"
                    @click="onCloseClick"
                >
                    <v-icon>mdi-close</v-icon>
                </v-btn>
            </div>

            <v-divider></v-divider>

            <v-card-text>
                Заказ успешно оформлен! Просмотреть информацию о нем можно в профиле
            </v-card-text>

            <v-divider></v-divider>

            <v-card-actions class="d-flex justify-center">
                <v-btn @click="onProfileClick">Профиль</v-btn>
                <v-btn @click="onCloseClick">Закрыть</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>
