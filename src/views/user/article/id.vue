<script lang="ts" setup>
import {onMounted, ref} from "vue";
import TheLoader from "~/components/user/TheLoader.vue";
import TheArticleCard from "~/components/user/TheArticleCard.vue";
import {useRoute} from "vue-router";
import {getArticle} from "~/utils/api.ts";
import {convertKeysToCamelCase} from "~/utils/converters.ts";
import {type Article} from "~/interfaces/article.ts";
import TheMobileFooter from "~/components/user/TheMobileFooter.vue";
import {useScreenStore} from "~/stores/screen.ts";
import {storeToRefs} from "pinia";
import {User} from "~/interfaces/user.ts";
import {useUserInfoStore} from "~/stores/userInfo.ts";

// Common section
const props = defineProps<{
    id: string,
}>();

const route = useRoute();

const isLoading = ref(false);
const isServiceUnavailable = ref(false);

// Stores section
const screenStore = useScreenStore();
const {isWideScreen} = storeToRefs(screenStore);

const userInfoStore = useUserInfoStore();
const {isAuthenticated} = storeToRefs(userInfoStore);

// Article section
const article = ref<Article | undefined>(undefined);
const colorId = ref<number>(parseInt((route.query.color as string).toString()));
const quantity = ref<number>(parseFloat((route.query.quantity as string).toString()));

const onFetchArticle = async () => {
    isLoading.value = true;
    const response = await getArticle(parseInt(props.id));
    if (!response.ok) {
        isLoading.value = false;
        isServiceUnavailable.value = true;
        console.error(response);
    } else {
        article.value = convertKeysToCamelCase(await response.json()) as Article;
        isLoading.value = false;
    }
};

// User section
const user = ref<User>();

// On mounted actions
onMounted(async () => {
    await onFetchArticle();
    if (isAuthenticated.value) {
        user.value = await userInfoStore.get();
    }
});
</script>

<template>
    <TheArticleCard
        v-if="!isLoading && !isServiceUnavailable && article"
        :article="article"
        :color-id="colorId"
        :quantity="quantity"
        :user="user"
    />
    <span v-else-if="!isLoading && !isServiceUnavailable && !article" class="d-flex justify-center"><br>Артикула не существует</span>
    <TheLoader v-else-if="isLoading && !isServiceUnavailable"/>
    <span v-else class="d-flex justify-center"><br>Сервис временно недоступен.<br>Приносим извинения за предоставленные неудобства</span>
    <TheMobileFooter v-if="!isWideScreen"/>
</template>

<style scoped>

</style>
