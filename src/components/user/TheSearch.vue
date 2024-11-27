<script lang="ts" setup>
import {onMounted, ref, watch} from 'vue';
import {useWebAppTheme} from "vue-tg";

// Common section
const props = defineProps<{
    searchQuery?: string,
    loading: boolean,
}>();

const emit = defineEmits(['search', 'clearSearch', 'update:searchQuery']);

const {colorScheme, themeParams} = useWebAppTheme();

// Search section
const localSearch = ref(props.searchQuery);

const onSearch = async () => {
    emit('search', localSearch.value);
};

const onClearSearch = async () => {
    emit('clearSearch');
};

watch(localSearch, () => {
    emit('update:searchQuery', localSearch.value);
});

// On mounted actions
onMounted(() => {
    const clearableElement = document.querySelector('.v-field__clearable') as HTMLElement;
    const iconElement = clearableElement.querySelector('.v-icon') as HTMLElement;

    if (colorScheme.value === 'dark') {
        iconElement.classList.remove('v-theme--light');
        iconElement.classList.add('v-theme--dark');
        iconElement.classList.add('mdi-light');
    }
})
</script>

<template>
    <v-form>
        <v-container class="ma-0 pa-0">
            <v-row>
                <v-col cols="100">
                    <v-text-field
                        v-model="localSearch"
                        :clearable="true"
                        hide-details
                        label="Поиск..."
                        type="text"
                        variant="outlined"
                        @click:clear="onClearSearch"
                        @keydown.enter.prevent="onSearch"
                    >
                        <template v-slot:append-inner>
                            <v-fade-transition leave-absolute>
                                <v-progress-circular
                                    v-if="loading"
                                    :theme="colorScheme ?? 'light'"
                                    indeterminate
                                    size="24"
                                ></v-progress-circular>
                            </v-fade-transition>
                        </template>

                        <template v-slot:append>
                            <v-menu>
                                <template v-slot:activator="{ props }">
                                    <v-btn
                                        :color="themeParams.button_color ?? 'primary'"
                                        class="not-primary"
                                        size="large"
                                        v-bind="props"
                                        variant="tonal"
                                        @click="onSearch"
                                    >
                                        Найти
                                    </v-btn>
                                </template>
                            </v-menu>
                        </template>
                    </v-text-field>
                </v-col>
            </v-row>
        </v-container>
    </v-form>
</template>

<style lang="scss">
.v-field__outline, .v-field-label {
    color: var(--tg-theme-hint-color) !important;
}

.v-field__input {
    color: var(--tg-theme-hint-color) !important;
}

.v-field__input:focus {
    color: var(--tg-theme-text-color) !important;
}
</style>
