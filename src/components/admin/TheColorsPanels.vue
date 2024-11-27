<script lang="ts" setup>
import {ref, watch} from "vue";
import {AdminArticle} from "~/interfaces/admin/article.ts";
import {AdminColorInArticle} from "~/interfaces/admin/color.ts";
import TheColorInfoCard from "~/components/admin/TheColorInfoCard.vue";
import {BASE_URL} from "~/config/constants.ts";
import {useWebAppTheme} from "vue-tg";
import TheBobbinsPanels from "~/components/admin/TheBobbinsPanels.vue";
import {useScreenStore} from "~/stores/screen.ts";
import {storeToRefs} from "pinia";
import {VueDraggable} from "vue-draggable-plus";
import {updateColorsOrder} from "~/utils/api.ts";
import {convertKeysToSnakeCase} from "~/utils/converters.ts";

// Common section
const props = defineProps<{
    article: AdminArticle,
}>();

const emit = defineEmits<{
    delete: [value: number],
    deactivate: [value: number],
    activate: [value: number],
    'update:color': [value: AdminColorInArticle],
    'update:colors': [value: AdminColorInArticle[]],
}>();

const {colorScheme, themeParams} = useWebAppTheme();

const localArticle = ref<AdminArticle>(props.article);
const colors = ref<AdminColorInArticle[]>(localArticle.value.colors ?? []);

watch(() => props.article, (newVal) => {
    localArticle.value = newVal;
    colors.value = localArticle.value.colors ?? [];
});

const initialNumInArticle = colors.value.map(color => ({
    id: color.id,
    numInArticle: color.numInArticle,
}));

// Stores section
const screenStore = useScreenStore();
const {isWideScreen} = storeToRefs(screenStore);

// Panel section
const panel = ref<number[]>([]);

// Tabs section
const tab = ref<number>(0);

// Snackbar section
const showSnackbar = ref<boolean>(false);
const snackbarText = ref<string>('');

// Bobbins section
const rerenderKey = ref<number>(0);

const onUpdateColor = (index: number, color: AdminColorInArticle) => {
    colors.value[index] = color;
    snackbarText.value = 'Веса бобин успешно изменены';
    showSnackbar.value = true;
};

watch(colors, (updatedColors) => {
    if (updatedColors.length > 0) {
        rerenderKey.value += 1;
        colors.value.forEach((color) => {
            color.bobbins.sort((a, b) => a.id - b.id);
        });
    }
}, {deep: true});

// Color order change section
const showColorOrderChangeDialog = ref<boolean>(false);

const onSaveColorsOrder = async () => {
    const newOrder = colors.value.map(color => ({
        id: color.id,
        numInArticle: color.numInArticle
    }));

    if (JSON.stringify(newOrder) === JSON.stringify(initialNumInArticle)) {
        showColorOrderChangeDialog.value = false;
        return;
    }

    const response = await updateColorsOrder(props.article.id, convertKeysToSnakeCase(newOrder));
    if (response.ok) {
        emit('update:colors', colors.value);
        showColorOrderChangeDialog.value = false;
        snackbarText.value = 'Порядок цветов успешно изменен';
        showSnackbar.value = true;
    } else {
        console.error('Error while updating colors order', response);
    }
}

const onColorsOrderUpdate = () => {
    colors.value.forEach((color, index) => {
        color.numInArticle = index + 1;
    });
};

const onCancelOrderChange = () => {
    colors.value.forEach((color) => {
        const colorIndex = initialNumInArticle.findIndex((item) => item.id === color.id);
        color.numInArticle = initialNumInArticle[colorIndex].numInArticle;
    });
    colors.value.sort((a, b) => a.numInArticle - b.numInArticle);
    showColorOrderChangeDialog.value = false;
};
</script>

<template>
    <v-card>
        <div class="w-100 d-flex justify-center my-3">
            <v-btn
                v-if="colors.length > 1"
                @click="showColorOrderChangeDialog = true;"
            >
                Изменить порядок
            </v-btn>
        </div>

        <v-expansion-panels v-model="panel" :multiple="true">
            <v-expansion-panel
                v-for="(color, index) in colors"
                :key="color.id"
                :value="index"
            >
                <v-expansion-panel-title>
                    <img
                        :alt="color.name"
                        :src="BASE_URL + `/articles/colors/photo/${color.id}?${Date.now()}`"
                        :style="{height: '75px'}"
                    />
                    <v-card-title class="pa-0 ma-0 title">{{ color.name }}</v-card-title>
                </v-expansion-panel-title>

                <v-expansion-panel-text class="pa-0">
                    <v-tabs
                        v-model="tab"
                        :bg-color="themeParams.button_color ?? 'primary'"
                        class="w-100"
                        show-arrows
                    >
                        <v-tab value="1">Общее</v-tab>
                        <v-tab value="2">Бобины</v-tab>
                    </v-tabs>

                    <v-window v-model="tab" class="w-100">
                        <v-window-item class="my-3" value="1">
                            <v-card-title class="text-center pa-0"><b>Общее</b></v-card-title>

                            <v-divider></v-divider>

                            <TheColorInfoCard
                                :article="article"
                                :color="color"
                                @activate="$emit('activate', color.id)"
                                @deactivate="$emit('deactivate', color.id)"
                                @delete="$emit('delete', color.id)"
                                @update:color-name="color.name = $event"
                                @update:color="$emit('update:color', $event)"
                            />
                        </v-window-item>

                        <v-window-item class="my-3" value="2">
                            <v-card-text class="text-center pa-0 py-2" style="font-size: 1.2rem;">
                                <b>Бобины цвета "{{ color.name }}"</b>
                            </v-card-text>

                            <v-divider></v-divider>

                            <v-card class="pa-3" variant="flat">
                                <TheBobbinsPanels
                                    :key="rerenderKey"
                                    :color="color"
                                    @update:color="onUpdateColor(index, $event);"
                                />
                            </v-card>
                        </v-window-item>
                    </v-window>
                </v-expansion-panel-text>
            </v-expansion-panel>
        </v-expansion-panels>
    </v-card>

    <v-snackbar
        v-model="showSnackbar"
        :class="{'mb-20': !isWideScreen}"
        :color="themeParams.bg_color ?? 'grey-lighten-5'"
        timeout="3000"
    >
        {{ snackbarText }}
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

    <v-dialog
        v-model="showColorOrderChangeDialog"
        :scrollable="true"
        max-width="fit-content"
    >
        <v-card variant="flat">
            <div class="d-flex justify-space-between align-center pr-3">
                <p class="pa-3"><b>Измените порядок, перетаскивая цвета</b></p>
                <v-btn
                    :dark="colorScheme === 'light'"
                    class="not-primary align-self-center"
                    color="transparent"
                    icon
                    size="small"
                    variant="flat"
                    @click="onCancelOrderChange"
                >
                    <v-icon>mdi-close</v-icon>
                </v-btn>
            </div>

            <v-divider></v-divider>

            <v-card-text height="fit-content">
                <VueDraggable
                    v-model="colors"
                    :animation="150"
                    :on-update="onColorsOrderUpdate"
                    class="d-flex flex-column justify-center colors-drag-container"
                    ghostClass="ghost"
                    scroll
                >
                    <div v-for="color in colors" :key="color.id" class="d-flex flex-column w-100">
                        <v-card class="mb-2 mx-auto pa-3" width="max-content">
                            <v-card-text class="text-center pa-0">
                                <b>Название:</b> {{ color.name }}<br>
                                <b>Порядок:</b> {{ color.numInArticle }}
                            </v-card-text>

                            <v-divider></v-divider>

                            <v-img
                                :key="color.id"
                                :src="BASE_URL + `/articles/colors/photo/${color.id}?${Date.now()}`"
                                max-height="100px"
                            >
                            </v-img>
                        </v-card>
                    </div>
                </VueDraggable>
            </v-card-text>

            <v-divider></v-divider>

            <v-card-actions class="w-100 justify-center">
                <v-btn
                    size="large"
                    @click="onSaveColorsOrder"
                >
                    Сохранить
                </v-btn>

                <v-btn
                    class="not-primary"
                    color="info"
                    size="large"
                    variant="tonal"
                    @click="onCancelOrderChange"
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
    margin-bottom: 2%;
    margin-top: 2%;
    line-height: 1.5rem !important;
}

.v-card, .v-card * {
    background-color: var(--tg-theme-bg-color, rgb(var(--v-theme-background)));
    color: var(--tg-theme-text-color, rgb(var(--v-theme-text-base)));
}

.colors-drag-container {
    cursor: move;
}
</style>