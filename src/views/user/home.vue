<script lang="ts" setup>
import {useRouter} from "vue-router";
import {onMounted} from "vue";

// Common section
const router = useRouter();

// On mounted actions
onMounted(async () => {
    await router.push({name: 'article-colors'});
});
</script>
