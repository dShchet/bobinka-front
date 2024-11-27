<script lang="ts" setup>
import {CompetitorArticleCard} from "~/interfaces/admin/competitor.ts"
import {ref} from "vue";
import {competitorArticleCardStatus} from "~/enums/competitor.ts";
import {updateCompetitorArticleCardStatus} from "~/utils/api.ts";

// Common section
const props = defineProps<{
    competitorArticleCard: CompetitorArticleCard
}>();

const competitorArticleCardDialog = ref<boolean>(false);
const classActive = {active: !props.competitorArticleCard.isActive};
const articleCardStatus = ref<competitorArticleCardStatus>(props.competitorArticleCard.isActive ?
    competitorArticleCardStatus.ACTIVE : competitorArticleCardStatus.INACTIVE);

// ArticleCard section
const onSaveArticleCardStatus = async () => {
    await updateCompetitorArticleCardStatus(props.competitorArticleCard.id, articleCardStatus.value);
    window.location.reload();
}

</script>

<template>
    <v-list-item :class="classActive">
        <v-card
            :class="classActive"
            class="ml-1 align-self-center d-flex justify-space-between"
            variant="flat"
        >
            <v-card-text class="w-50">
                {{ competitorArticleCard.title }}
            </v-card-text>
            <v-card-text>{{ competitorArticleCard.price }}</v-card-text>
            <v-card-text>{{ competitorArticleCard.shop }}</v-card-text>
            <v-card-item>
                <v-icon class="mb-10 ml-10" icon="mdi-magnify" size="x-small"></v-icon>
            </v-card-item>
        </v-card>
        <v-dialog
            v-model="competitorArticleCardDialog"
            activator="parent"
            class="w-50"
        >
            <v-card :title="competitorArticleCard.shop">
                <v-card-text>
                    <a :href="competitorArticleCard.link" target="_blank">ССЫЛКА</a>
                </v-card-text>

                <v-card-actions class="d-flex flex-column mb-6 align-start">
                    <v-combobox
                        v-model="articleCardStatus"
                        :items="Object.values(competitorArticleCardStatus)"
                        class="w-100"
                        label="Статус"
                    >
                    </v-combobox>
                    <v-btn class="w-100" @click="onSaveArticleCardStatus">сохранить</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </v-list-item>
</template>

<style lang="scss" scoped>
.v-list-item.active, .v-card.active {
    background-color: #FFEBEE;
}

.v-list-item:hover, .v-card:hover {
    cursor: pointer;
}
</style>