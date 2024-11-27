<script lang="ts" setup>
import {useArticleColorsStore} from "~/stores/articles.ts";
import {storeToRefs} from "pinia";
import {User} from "~/interfaces/user.ts";
import TheArticleColorPreview from "~/components/user/TheArticleColorPreview.vue";

// Common section
const props = defineProps<{
    user?: User,
}>();

// Stores section
const articlesStore = useArticleColorsStore();
const {paginatedColors} = storeToRefs(articlesStore);
</script>

<template>
    <v-container class="ma-0 pa-0 mb-5">
        <v-row class="justify-center mt-2">
            <v-col
                v-for="articleColor in paginatedColors"
                :key="articleColor.id"
                style="max-width: 355px;"
            >
                <TheArticleColorPreview
                    :article-color="articleColor"
                    :user="user"
                    @expired="articlesStore.remove(articleColor.id)"
                />
            </v-col>
        </v-row>
    </v-container>
</template>

<style lang="scss" scoped>
.v-container, .v-row, .v-col {
    background-color: var(--tg-theme-bg-color, rgb(var(--v-theme-background)));
}
</style>
