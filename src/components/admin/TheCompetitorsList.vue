<script lang="ts" setup>
import {CompetitorArticleCard} from "~/interfaces/admin/competitor.ts";
import TheCompetitorsListItem from "./TheCompetitorsListItem.vue";

// Common section
const props = defineProps<{
    competitors: CompetitorArticleCard[];
}>();
</script>

<template>
    <v-card class="d-flex flex-column pa-5 mx-auto" variant="flat">
        <v-divider></v-divider>
        <div v-for="competitor in competitors">
            <TheCompetitorsListItem :key="competitor.id" :competitor-article-card="competitor"/>
            <v-divider></v-divider>
        </div>
    </v-card>
</template>