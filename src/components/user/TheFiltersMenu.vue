<script lang="ts" setup>
import {computed, onMounted, ref, watch} from "vue";
import {useArticleColorsStore} from "~/stores/articles.ts";
import {storeToRefs} from "pinia";
import {useScreenStore} from "~/stores/screen.ts";
import {getArticleTags, getUniqueColorsNames} from "~/utils/api.ts";
import {useWebAppTheme} from "vue-tg";
import {useTheme} from "vuetify";
import {convertKeysToCamelCase} from "~/utils/converters.ts";
import {type ArticleTag} from "~/interfaces/articletag.ts";
import {mapColorNameToHex} from "~/utils/mappers.ts";

// Common section
const props = defineProps<{
    selectedTags: number[],
    selectedColorsNames: string[],
}>();

const emit = defineEmits<{
    'update:selectedTags': [value: number[]],
    'update:selectedColorsNames': [value: string[]],
}>();

const theme = useTheme();
const {themeParams, colorScheme} = useWebAppTheme();

// Stores section
const articlesStore = useArticleColorsStore();
const {tags, colorsNames} = storeToRefs(articlesStore);

const screenStore = useScreenStore();
const {isWideScreen} = storeToRefs(screenStore);

const showDialog = ref<boolean>(false);
const isLoading = ref<boolean>(false);
const isServiceUnavailable = ref<boolean>(false);

// Filters section
const onFiltersApply = () => {
    showDialog.value = false;

    emit('update:selectedTags', localSelectedTags.value)
    emit('update:selectedColorsNames', localSelectedColorsNames.value)
};

const onFiltersReset = () => {
    localSelectedTags.value = [];
    localSelectedColorsNames.value = [];

    emit('update:selectedTags', localSelectedTags.value)
    emit('update:selectedColorsNames', localSelectedColorsNames.value)
};

const filtersApplied = computed(() => {
    return localSelectedTags.value.length > 0 || localSelectedColorsNames.value.length > 0;
});

// Tags section
const localSelectedTags = ref<number[]>(props.selectedTags || []);

const onFetchArticleTags = async () => {
    isLoading.value = true
    const response = await getArticleTags();
    if (!response.ok) {
        isLoading.value = false;
        isServiceUnavailable.value = true;
        console.error(response);
    } else {
        tags.value = convertKeysToCamelCase(await response.json()) as ArticleTag[];
        isLoading.value = false;
    }
};

watch(localSelectedTags, (newTags) => {
    emit('update:selectedTags', newTags);
});

// Colors section
const localSelectedColorsNames = ref<string[]>(props.selectedColorsNames || []);

const onFetchUniqueColorsNames = async () => {
    isLoading.value = true
    const response = await getUniqueColorsNames();
    if (!response.ok) {
        isLoading.value = false;
        isServiceUnavailable.value = true;
        console.error(response);
    } else {
        colorsNames.value = await response.json();
        isLoading.value = false;
    }
};

const hasMappedColor = (colorName: string) => {
    return mapColorNameToHex(colorName) !== undefined;
};

watch(localSelectedColorsNames, (newColors) => {
    emit('update:selectedColorsNames', newColors);
});

// On mounted actions
onMounted(async () => {
    await onFetchArticleTags();
    await onFetchUniqueColorsNames();
});
</script>

<template>
    <v-dialog
        v-model="showDialog"
        :max-width="isWideScreen ? '50%' : '100%'"
        :scrollable="true"
    >
        <template v-slot:activator="{ props }">
            <div class="d-flex justify-center align-content-center pt-5">
                <v-icon
                    v-if="filtersApplied"
                    :class="{'mdi-light': colorScheme === 'dark' || theme.global.current.value.dark}"
                    :theme="colorScheme ?? 'light'"
                    class="align-self-center mr-3"
                >
                    mdi-checkbox-marked
                </v-icon>
                <v-btn
                    :color="themeParams.button_color ?? 'primary'"
                    class="not-primary align-self-center"
                    size="x-large"
                    v-bind="props"
                    variant="tonal"
                >
                    Фильтры
                </v-btn>
            </div>
        </template>
        <v-card>
            <v-card-title>Фильтры</v-card-title>

            <v-divider></v-divider>

            <v-card-text style="height: 500px;">
                <v-card-text class="pa-0"><b>Составы (теги)</b></v-card-text>
                <v-checkbox
                    v-for="tag in tags"
                    :key="tag.id"
                    v-model="localSelectedTags"
                    :color="themeParams.button_color ?? 'primary'"
                    :label="tag.name"
                    :value="tag.id"
                    class="pa-0 ma-0"
                    hide-details
                ></v-checkbox>

                <v-divider></v-divider>

                <v-card-text class="mt-3 pa-0"><b>Цвета</b></v-card-text>
                <div
                    v-for="(colorName, index) in colorsNames"
                    :key="index"
                    class="d-flex align-center"
                >
                    <v-checkbox
                        v-model="localSelectedColorsNames"
                        :color="themeParams.button_color ?? 'primary'"
                        :label="colorName"
                        :value="colorName"
                        class="pa-0 ma-0"
                        hide-details
                    ></v-checkbox>
                    <div
                        v-if="hasMappedColor(colorName)"
                        :style="{ backgroundColor: mapColorNameToHex(colorName) }"
                        class="color-preview"
                    ></div>
                </div>
            </v-card-text>

            <v-divider></v-divider>

            <v-card-actions>
                <v-btn
                    class="not-primary"
                    color="blue-darken-1"
                    variant="text"
                    @click="onFiltersApply"
                >
                    Применить
                </v-btn>
                <v-btn
                    class="not-primary"
                    color="red-darken-1"
                    variant="text"
                    @click="onFiltersReset"
                >
                    Сбросить
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<style lang="scss" scoped>
.v-card {
    background-color: var(--tg-theme-bg-color, rgb(var(--v-theme-background)));
    color: var(--tg-theme-text-color, rgb(var(--v-theme-on-surface)));
}

.v-card-actions .v-btn {
    background-color: var(--tg-theme-secondary-bg-color, rgb(var(--v-theme-background)));
}

.color-preview {
    width: 20px;
    height: 20px;
    border-radius: 50%;
}
</style>
