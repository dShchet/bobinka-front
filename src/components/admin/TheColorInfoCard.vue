<script lang="ts" setup>
import {AdminArticle} from "~/interfaces/admin/article.ts";
import {AdminColorInArticle} from "~/interfaces/admin/color.ts";
import {mapColorStatus} from "~/utils/mappers.ts";
import {BASE_URL} from "~/config/constants.ts";
import TheLoader from "~/components/user/TheLoader.vue";
import {computed, onMounted, ref} from "vue";
import {getColorOrdersCount, getFreeBobbinsQuantity, updateColorName, updateColorPhoto} from "~/utils/api.ts";
import {ColorStatus} from "~/enums/statuses.ts";
import {useWebAppTheme} from "vue-tg";
import {useScreenStore} from "~/stores/screen.ts";
import {storeToRefs} from "pinia";
import {convertKeysToCamelCase} from "~/utils/converters.ts";

// Common section
const props = defineProps<{
    article: AdminArticle,
    color: AdminColorInArticle,
}>();

const emit = defineEmits<{
    delete: [value: number],
    deactivate: [value: number],
    activate: [value: number],
    'update:colorName': [value: string],
    'update:color': [value: AdminColorInArticle],
}>();

const {colorScheme, themeParams} = useWebAppTheme();

// Stores section
const screenStore = useScreenStore();
const {isWideScreen} = storeToRefs(screenStore);

// Color name section
const showColorName = ref<boolean>(true);
const showColorNameEdit = ref<boolean>(false);
const inputtedColorName = ref<string>('');
const colorNameLoading = ref<boolean>(false);

const requiredInputRule = [
    (v: string) => !!v || 'Обязательно',
];

const onColorNameEditClick = () => {
    showColorName.value = false;
    inputtedColorName.value = props.color.name || '';
    showColorNameEdit.value = true;
};

const onColorNameEditFocusOut = () => {
    if (!inputtedColorName.value) {
        showColorNameEdit.value = false;
    }
    showColorName.value = true;
};

const onSubmitColorNameEdit = async () => {
    if (
        !inputtedColorName.value
        || requiredInputRule[0](inputtedColorName.value) !== true
    ) {
        return;
    }
    if (inputtedColorName.value && inputtedColorName.value === props.color.name) {
        showColorNameEdit.value = false;
        showColorName.value = true;
        return;
    }
    colorNameLoading.value = true;
    const response = await updateColorName(props.color.id, inputtedColorName.value);
    if (response.ok) {
        const result = convertKeysToCamelCase(await response.json()) as AdminColorInArticle;
        showColorNameEdit.value = false;
        emit('update:colorName', result.name);
    } else {
        console.error('Failed to change color name')
    }
    colorNameLoading.value = false;
};

// Color photo section
const showPhotoUploadDialog = ref<boolean>(false);
const form = ref<boolean>(false);

const inputtedPhoto = ref<File[]>();

const onSubmit = () => {
    if (!form.value) {
        return;
    }
};

const onUploadPhoto = async () => {
    if (!inputtedPhoto.value || inputtedPhoto.value.length === 0) {
        return;
    }
    const response = await updateColorPhoto(props.color.id, inputtedPhoto.value[0]);
    if (!response.ok) {
        console.error(response);
    } else {
        const result = convertKeysToCamelCase(await response.json()) as AdminColorInArticle;
        showPhotoUploadDialog.value = false;
        emit('update:color', result);
    }
};

// Orders section
const ordersCount = ref<number>();

const onFetchColorOrdersCount = async () => {
    const response = await getColorOrdersCount(props.color.id);
    if (!response.ok) {
        console.error(response);
    } else {
        ordersCount.value = await response.json() as number;
    }
};

// Quantities section
const freeBobbinsQuantity = ref<number>();

const onFetchFreeBobbinsQuantity = async () => {
    const response = await getFreeBobbinsQuantity(props.color.id);
    if (!response.ok) {
        console.error(response);
    } else {
        freeBobbinsQuantity.value = await response.json() as number;
    }
};

const totalBobbinsQuantity = computed(() => {
    const bobbins = props.color.bobbins ?? [];
    return bobbins.reduce((acc, b) => acc + b.quantity, 0);
});

const bobbinsQuantityPercentage = computed(() => {
    const total = totalBobbinsQuantity.value;
    const free = freeBobbinsQuantity.value ?? 0;
    return Math.round(free / total * 100);
});

const progressBarColor = computed(() => {
    const percentage = bobbinsQuantityPercentage.value;
    if (percentage >= 50) {
        return 'light-green-accent-4';
    } else if (percentage < 50 && percentage >= 25) {
        return 'amber-lighten-1';
    } else {
        return 'red-accent-4';
    }
});

// On mounted actions
onMounted(async () => {
    await onFetchFreeBobbinsQuantity();
    await onFetchColorOrdersCount();
});
</script>

<template>
    <v-card class="pa-3" variant="flat">
        <v-img
            :src="BASE_URL + `/articles/colors/photo/${color.id}`"
            :style="{height: '300px'}"
        >
            <template v-slot:placeholder>
                <TheLoader/>
            </template>
        </v-img>

        <div class="d-flex w-100 justify-center mb-3">
            <v-btn :size="isWideScreen ? 'default' : 'small'" @click="showPhotoUploadDialog = true;">
                Редактировать изображение
            </v-btn>
        </div>

        <v-divider></v-divider>

        <v-card-title><b>ID Цвета</b></v-card-title>
        <v-card-text>{{ color.id }}</v-card-text>

        <v-divider></v-divider>

        <v-card-title><b>Название</b></v-card-title>
        <v-card-text>
            {{ showColorName ? color.name : '' }}
            <v-fade-transition>
                <v-btn
                    v-if="color.name && showColorName"
                    color="transparent"
                    fab
                    icon
                    size="small"
                    variant="flat"
                    @click="onColorNameEditClick"
                >
                    <v-icon>mdi-pencil</v-icon>
                </v-btn>
                <v-btn
                    v-else-if="!color.name && !showColorName"
                    color="transparent"
                    fab
                    variant="flat"
                    @click="showColorNameEdit = true"
                >
                    Добавить
                    <v-icon>mdi-plus</v-icon>
                </v-btn>
                <v-text-field
                    v-else-if="showColorNameEdit"
                    v-model="inputtedColorName"
                    :autofocus="true"
                    :clearable="true"
                    :loading="colorNameLoading"
                    :rules="[...requiredInputRule]"
                    append-inner-icon="mdi-check"
                    density="compact"
                    label="Название"
                    single-line
                    @focusout="onColorNameEditFocusOut"
                    @click:append-inner="onSubmitColorNameEdit"
                    @keydown.esc="onColorNameEditFocusOut"
                    @keydown.enter="onSubmitColorNameEdit"
                ></v-text-field>
            </v-fade-transition>
        </v-card-text>

        <v-divider></v-divider>

        <v-card-title><b>ID Артикула</b></v-card-title>
        <v-card-text>{{ article.id }}</v-card-text>

        <v-divider></v-divider>

        <v-card-title><b>Предзаказ</b></v-card-title>
        <v-card-text>{{ article.preorder.name }}</v-card-text>

        <v-divider></v-divider>

        <v-card-title><b>Multicolor</b></v-card-title>
        <v-card-text>{{ color.multicolor }}</v-card-text>

        <v-divider></v-divider>

        <v-card-title><b>1C ID</b></v-card-title>
        <v-card-text>{{ color.id1c ?? 'Нет' }}</v-card-text>

        <v-divider></v-divider>

        <v-card-title><b>Статус</b></v-card-title>
        <v-card-text>{{ mapColorStatus(color.status) }}</v-card-text>

        <v-divider></v-divider>

        <v-card-text class="ma-0 py-2 px-4 title"><b>Количество всех бобин</b></v-card-text>
        <v-card-text class="pt-0">{{ totalBobbinsQuantity }}</v-card-text>

        <v-divider></v-divider>

        <v-card-text class="ma-0 py-2 px-4 title"><b>Количество свободных бобин</b></v-card-text>
        <v-card-text v-if="freeBobbinsQuantity !== undefined" class="pt-0">{{ freeBobbinsQuantity }}</v-card-text>

        <v-divider></v-divider>

        <v-card-text class="ma-0 py-2 px-4 title"><b>Количество заказов</b></v-card-text>
        <v-card-text v-if="ordersCount !== undefined" class="pt-0">{{ ordersCount }}</v-card-text>

        <v-divider></v-divider>

        <v-card-title class="text-center"><b>Наличие</b></v-card-title>
        <v-progress-linear
            v-model="bobbinsQuantityPercentage"
            :color="progressBarColor"
            class="mb-4"
            height="20"
            rounded
        >
            <template v-slot:default="{ value }">
                <strong>{{ value }}%</strong>
            </template>
        </v-progress-linear>

        <v-divider></v-divider>

        <v-card-actions class="mt-2 w-100 d-flex justify-center">
            <v-btn
                v-if="color.status === ColorStatus.INACTIVE"
                @click="$emit('activate', color.id)"
            >
                Активировать
            </v-btn>

            <v-btn
                v-else-if="color.status === ColorStatus.ACTIVE"
                :color="themeParams.button_color ?? 'primary'"
                class="not-primary"
                variant="tonal"
                @click="$emit('deactivate', color.id)"
            >
                Деактивировать
            </v-btn>

            <v-btn
                class="not-primary"
                color="red"
                variant="tonal"
                @click="$emit('delete', color.id)"
            >
                Удалить
            </v-btn>
        </v-card-actions>
    </v-card>

    <v-dialog
        v-model="showPhotoUploadDialog"
        max-width="fit-content"
    >
        <v-card>
            <div class="d-flex justify-space-between pr-3">
                <v-card-text><b>Загрузите новое фото</b></v-card-text>
                <v-btn
                    :dark="colorScheme === 'light'"
                    class="not-primary align-self-center"
                    color="transparent"
                    icon
                    size="small"
                    variant="flat"
                    @click="showPhotoUploadDialog = false"
                >
                    <v-icon>mdi-close</v-icon>
                </v-btn>
            </div>
            <v-divider></v-divider>
            <v-container class="pa-5">
                <v-form v-model="form" @submit.prevent="onSubmit">
                    <v-file-input
                        v-model="inputtedPhoto"
                        :clearable="true"
                        :error="!inputtedPhoto || inputtedPhoto.length === 0"
                        accept="image/*"
                        label="Новое фото"
                        prepend-icon="mdi-camera"
                        show-size
                    >
                        <template v-slot:selection="{ fileNames }">
                            <template v-for="fileName in fileNames" :key="fileName">
                                <v-chip
                                    :color="themeParams.button_color ?? 'primary'"
                                    class="me-2"
                                    size="small"
                                >
                                    {{ fileName }}
                                </v-chip>
                            </template>
                        </template>
                    </v-file-input>
                </v-form>
            </v-container>

            <v-divider></v-divider>

            <v-card-actions class="w-100 justify-center">
                <v-btn
                    :disabled="!form"
                    size="large"
                    @click="onUploadPhoto"
                >
                    Сохранить
                </v-btn>

                <v-btn
                    class="not-primary"
                    color="info"
                    size="large"
                    variant="tonal"
                    @click="showPhotoUploadDialog = false"
                >
                    Отменить
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<style lang="scss" scoped>
.title {
    font-size: 1.2rem;
    line-height: 2rem !important;
}

.v-card, .v-card *:not(.v-progress-linear, .v-progress-linear *) {
    background-color: var(--tg-theme-bg-color, rgb(var(--v-theme-background)));
    color: var(--tg-theme-text-color, rgb(var(--v-theme-text-base)));
}
</style>