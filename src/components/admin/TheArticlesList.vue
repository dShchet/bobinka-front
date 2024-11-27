<script lang="ts" setup>
import TheArticlesListItem from "~/components/admin/TheArticlesListItem.vue";
import {useScreenStore} from "~/stores/screen.ts";
import {storeToRefs} from "pinia";
import {FastPreorderDraft} from "~/interfaces/admin/fastPreorders.ts";
import {useRouter} from "vue-router";
import {AdminArticle} from "~/interfaces/admin/article.ts";

// Common section
const props = defineProps<{
    articles: AdminArticle[] | FastPreorderDraft[];
    isDraft: boolean;
}>();

const router = useRouter();

const navigateToArticleCreate = async (id: number, middleClick: boolean = false) => {
    if (middleClick) {
        const routeData = router.resolve({name: 'admin-create-article', params: {fastPreorderId: id}});
        window.open(routeData.href, '_blank');
        return;
    }
    await router.push({name: 'admin-create-article', params: {fastPreorderId: id}});
};

const navigateToArticleEdit = async (id: number, middleClick: boolean = false) => {
    if (middleClick) {
        const routeData = router.resolve({name: 'admin-edit-article', params: {id: id}});
        window.open(routeData.href, '_blank');
        return;
    }
    await router.push({name: 'admin-edit-article', params: {id: id}});
};

// Stores section
const screenStore = useScreenStore();
const {isWideScreen} = storeToRefs(screenStore);
</script>

<template>
    <v-card :class="{'w-75': isWideScreen, 'w-100': !isWideScreen}" class="d-flex flex-column pa-5 mx-auto"
            variant="flat">
        <v-divider></v-divider>
        <div v-for="article in articles">
            <TheArticlesListItem
                :key="article.id"
                :article="article"
                :is-draft="isDraft"
                @click="isDraft ? navigateToArticleCreate(article.id) : navigateToArticleEdit(article.id)"
                @click.middle="isDraft ? navigateToArticleCreate(article.id, true) : navigateToArticleEdit(article.id, true)"
                @mousedown.middle.prevent.stop
            />
            <v-divider></v-divider>
        </div>
    </v-card>
</template>

<style lang="scss" scoped>
.v-card, .v-card * {
    background-color: var(--tg-theme-bg-color, rgb(var(--v-theme-background)));
    color: var(--tg-theme-text-color, rgb(var(--v-theme-text-base)));
}
</style>
