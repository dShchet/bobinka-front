import {RouteLocation, Router} from "vue-router";
import {ref} from "vue";
import type MetaFrom from "~/interfaces/metaFrom";
import {Color} from "~/interfaces/color.ts";

export const openArticlePage = async (router: Router, article: any) => {
    await router.push({
        name: 'article',
        params: {id: article.id},
        query: {color: article.colors[0].id, quantity: 1}
    });
};

export const openArticlePageFromColor = async (router: Router, color: Color) => {
    await router.push({
        name: 'article',
        params: {id: color.article.id},
        query: {color: color.id, quantity: 1}
    });
};

export const getMetaFromRef = (route: RouteLocation) => {
    const from = ref<MetaFrom>({name: 'article-colors', params: {}, query: {}});
    if (route.meta.from && typeof route.meta.from === 'object') {
        const metaFrom = route.meta.from as MetaFrom;
        from.value.name = metaFrom.name || 'article-colors';
        from.value.params = metaFrom.params || {};
        from.value.query = metaFrom.query || {};
    } else {
        from.value.name = 'article-colors';
        from.value.params = {};
        from.value.query = {};
    }
    return from;
};
