<script lang="ts" setup>
import {ref, watchEffect} from 'vue';

// Common section
interface Props {
    items: any[],
    selectedId: string | number,
    cols: string | number,
}

const props = withDefaults(defineProps<Props>(), {
    cols: () => 3,
})

// Item section
const localSelectedId = ref(props.selectedId);

watchEffect(() => {
    localSelectedId.value = props.selectedId;
});
</script>

<template>
    <v-card variant="flat">
        <v-container class="pa-1">
            <v-item-group mandatory>
                <v-row>
                    <v-col v-for="item in items" :key="item.id ?? item.number" :cols="cols">
                        <v-card class="selector-card" style="cursor: pointer;">
                            <v-item>
                                <v-fade-transition :class="{ selected: localSelectedId === (item.id ?? item.number) }">
                                    <slot :item="item"></slot>
                                </v-fade-transition>
                            </v-item>
                        </v-card>
                    </v-col>
                </v-row>
            </v-item-group>
        </v-container>
    </v-card>
</template>

<style lang="scss" scoped>
.selector-card, .selector-card * {
    background-color: var(--tg-theme-secondary-bg-color, rgb(var(--v-theme-background)));
    color: var(--tg-theme-text-color, rgb(var(--v-theme-on-surface)));
}

.selected {
    border: 2px solid var(--tg-theme-button-color, rgb(var(--v-theme-primary)));
}

</style>
