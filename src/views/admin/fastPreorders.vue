<script lang="ts" setup>
import TheAdminNavigation from "~/components/admin/TheAdminNavigation.vue";
import TheArticlesList from "~/components/admin/TheArticlesList.vue";
import {BackButton, useWebApp} from "vue-tg";
import {useRouter} from "vue-router";
import {onMounted, ref} from "vue";
import {FastPreorderDraft} from "~/interfaces/admin/fastPreorders.ts";
import {getFastPreorderDrafts} from "~/utils/api.ts";
import {convertDateFromApi, convertKeysToCamelCase} from "~/utils/converters.ts";
import TheLoader from "~/components/user/TheLoader.vue";
import {PaginatedApiData} from "~/interfaces/apiData.ts";

// Common section
const router = useRouter();

const {isPlatformUnknown} = useWebApp();

// Fast preorders section
const isLoading = ref<boolean>(false);
const isServiceUnavailable = ref<boolean>(false);
const total = ref<number>(0);

const draftsPage = ref<number>(1);
const paginatedDrafts = ref<FastPreorderDraft[] | undefined>(undefined);

const onFetchDrafts = async () => {
    isLoading.value = true;
    const response = await getFastPreorderDrafts(draftsPage.value);
    if (!response.ok) {
        isLoading.value = false;
        isServiceUnavailable.value = true;
        console.error(response);
    } else {
        const pagedResult = convertKeysToCamelCase(await response.json()) as PaginatedApiData<FastPreorderDraft>;
        paginatedDrafts.value = pagedResult.results;
        paginatedDrafts.value.forEach((draft) => {
            if (draft.expiredAt) {
                draft.expiredAt = convertDateFromApi(draft.expiredAt);
            }
        });
        draftsPage.value = pagedResult.page;
        total.value = pagedResult.total;
        isLoading.value = false;
    }
};

// Telegram section
const handleTgBackButton = () => {
    router.go(-1);
};

// On mounted actions
onMounted(onFetchDrafts);
</script>

<template>
    <TheAdminNavigation/>
    <BackButton
        v-if="!isPlatformUnknown"
        @click="handleTgBackButton"
    ></BackButton>
    <v-card class="d-flex flex-column align-center mt-15" variant="flat">
        <TheArticlesList
            v-if="paginatedDrafts !== undefined && paginatedDrafts?.length != 0 && !isLoading && !isServiceUnavailable"
            :articles="paginatedDrafts"
            :is-draft="true"
        />
        <div v-else-if="!isLoading && paginatedDrafts?.length == 0 && !isServiceUnavailable">
            <span class="d-flex justify-center"><br>Нет черновиков</span>
        </div>
        <div v-else-if="!isLoading && !paginatedDrafts && isServiceUnavailable">
            <span class="d-flex justify-center"><br>Сервис временно недоступен.<br>Приносим извинения за предоставленные неудобства</span>
        </div>
        <div v-else>
            <TheLoader/>
        </div>
    </v-card>
</template>

<style lang="scss" scoped>
.v-card, .v-card * {
    background-color: var(--tg-theme-bg-color, rgb(var(--v-theme-background)));
    color: var(--tg-theme-text-color, rgb(var(--v-theme-on-surface)));
}
</style>
