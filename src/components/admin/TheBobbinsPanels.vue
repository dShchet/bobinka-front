<script lang="ts" setup>
import {AdminColorInArticle} from "~/interfaces/admin/color.ts";
import {computed, ref} from "vue";
import {AdminBobbinInColor} from "~/interfaces/admin/bobbin.ts";
import {useWebAppTheme} from "vue-tg";
import TheBobbinInfoCard from "~/components/admin/TheBobbinInfoCard.vue";
import {useScreenStore} from "~/stores/screen.ts";
import {storeToRefs} from "pinia";
import {setWeightsForBobbins} from "~/utils/api.ts";
import {convertKeysToCamelCase} from "~/utils/converters.ts";

// Common section
const props = defineProps<{
    color: AdminColorInArticle,
}>();

const emit = defineEmits<{
    'update:color': [value: AdminColorInArticle],
}>();

const {colorScheme} = useWebAppTheme();

const bobbins = ref<AdminBobbinInColor[]>(props.color.bobbins ?? []);

// Stores section
const screenStore = useScreenStore();
const {isWideScreen} = storeToRefs(screenStore);

// Pagination section
const currentPage = ref<number>(1);
const itemsPerPage = 10;

// Создадим вычисляемое свойство для разделения бобин на страницы.
const paginatedBobbins = computed(() => {
    const startIndex = (currentPage.value - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return bobbins.value.slice(startIndex, endIndex);
});

// Bobbins weight section
const inputtedWeight = ref<string>('');

const showBobbinWeightDialog = ref<boolean>(false);
const form = ref<boolean>(false);

const numberRule = [
    (v: string) => /^(\d+([.,]\d*)?|\.\d+)$/.test(v) || 'Введите число',
];

const onSubmit = () => {
    if (!form.value) {
        return;
    }
};

const onSetBobbinsWeight = async () => {
    if (!inputtedWeight.value) {
        return;
    }
    const weight = parseFloat(inputtedWeight.value.replace(',', '.'));
    const response = await setWeightsForBobbins(props.color.id, [weight]);
    if (!response.ok) {
        console.error(response);
    } else {
        const result = convertKeysToCamelCase(await response.json()) as AdminColorInArticle;
        showBobbinWeightDialog.value = false;
        emit('update:color', result);
    }
};

// Panel section
const panel = ref<number[]>([]);
</script>

<template>
    <v-card>
        <v-expansion-panels v-model="panel" :multiple="true">
            <v-btn
                :size="isWideScreen ? 'default' : 'x-small'"
                class="mb-3"
                @click="showBobbinWeightDialog = true"
            >
                Проставить всем бобинам вес
            </v-btn>
            <v-expansion-panel
                v-for="(bobbin, index) in paginatedBobbins"
                :key="index + (currentPage - 1) * itemsPerPage"
                :value="index"
            >
                <v-expansion-panel-title>
                    <v-card-title class="pa-0 ma-0 title">Бобина {{ bobbin.numInColor }}</v-card-title>
                </v-expansion-panel-title>

                <v-expansion-panel-text class="pa-0">
                    <TheBobbinInfoCard
                        :bobbin="bobbin"
                        @update:weight="bobbin.weight = $event"
                    />
                </v-expansion-panel-text>
            </v-expansion-panel>
        </v-expansion-panels>

        <v-pagination
            v-model="currentPage"
            :length="Math.ceil(bobbins.length / itemsPerPage)"
            class="mt-3"
            @input="currentPage = $event"
        />
    </v-card>

    <v-dialog
        v-model="showBobbinWeightDialog"
        max-width="fit-content"
    >
        <v-card>
            <div class="d-flex justify-space-between pr-3">
                <v-card-text><b>Введите вес для всех бобин</b></v-card-text>
                <v-btn
                    :dark="colorScheme === 'light'"
                    class="not-primary align-self-center"
                    color="transparent"
                    icon
                    size="small"
                    variant="flat"
                    @click="showBobbinWeightDialog = false"
                >
                    <v-icon>mdi-close</v-icon>
                </v-btn>
            </div>
            <v-divider></v-divider>
            <v-container class="pa-5">
                <v-form v-model="form" @submit.prevent="onSubmit">
                    <v-text-field
                        v-model="inputtedWeight"
                        :clearable="true"
                        :rules="numberRule"
                        :theme="colorScheme"
                        label="Вес в граммах"
                        variant="solo-filled"
                    >
                    </v-text-field>
                </v-form>
            </v-container>

            <v-divider></v-divider>

            <v-card-actions class="w-100 justify-center">
                <v-btn
                    :disabled="!form"
                    size="large"
                    @click="onSetBobbinsWeight"
                >
                    Сохранить
                </v-btn>

                <v-btn
                    class="not-primary"
                    color="info"
                    size="large"
                    variant="tonal"
                    @click="showBobbinWeightDialog = false"
                >
                    Отменить
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<style lang="scss" scoped>
.v-card, .v-card * {
    background-color: var(--tg-theme-bg-color, rgb(var(--v-theme-background)));
    color: var(--tg-theme-text-color, rgb(var(--v-theme-text-base)));
}
</style>