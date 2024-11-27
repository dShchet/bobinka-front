import {createRouter, createWebHistory, type RouteRecordRaw} from 'vue-router'
import {default as userHome} from '~/views/user/home.vue'
import {default as userArticleColors} from "~/views/user/articleColors.vue";
import {default as article} from "~/views/user/article/id.vue";
import cart from "~/views/user/cart.vue";
import checkout from "~/views/user/checkout.vue";
import {default as userLogin} from "~/views/user/login.vue";
import profile from "~/views/user/profile.vue";
import {default as adminHome} from '~/views/admin/home.vue'
import {default as adminLogin} from '~/views/admin/login.vue'
import fastPreorders from "~/views/admin/fastPreorders.vue";
import createArticle from "~/views/admin/createArticle.vue";
import {default as adminArticles} from "~/views/admin/articles.vue";
import editArticle from "~/views/admin/editArticle.vue";
import {default as adminOrders} from "~/views/admin/orders.vue";
import {default as adminOrder} from "~/views/admin/orderInfo.vue";
import {default as adminCompetitors} from "~/views/admin/competitors.vue";
import confirmAuth from "~/views/user/confirmAuth.vue";
import {default as adminConfirmAuth} from "~/views/admin/confirmAuth.vue";

const routes: RouteRecordRaw[] = [
    // User
    {
        path: '/',
        name: 'home',
        component: userHome,
    },
    {
        path: '/colors',
        name: 'article-colors',
        component: userArticleColors,
    },
    {
        path: '/article/:id',
        name: 'article',
        component: article,
        props: true,
    },
    {
        path: '/cart',
        name: 'cart',
        component: cart,
    },
    {
        path: '/checkout',
        name: 'checkout',
        component: checkout,
        props: true,
    },
    {
        path: '/login',
        name: 'login',
        component: userLogin,
    },
    {
        path: '/profile',
        name: 'profile',
        component: profile,
    },
    {
        path: '/confirm',
        name: 'confirm-auth',
        component: confirmAuth,
    },
    // Admin
    {
        path: '/admin',
        name: 'admin-home',
        component: adminHome,
    },
    {
        path: '/admin/login',
        name: 'admin-login',
        component: adminLogin,
    },
    {
        path: '/admin/fast_preorders',
        name: 'admin-fast-preorders',
        component: fastPreorders,
    },
    {
        path: '/admin/create_article/:fastPreorderId?',
        name: 'admin-create-article',
        component: createArticle,
        props: true,
    },
    {
        path: '/admin/edit_article/:id',
        name: 'admin-edit-article',
        component: editArticle,
        props: true,
    },
    {
        path: '/admin/articles',
        name: 'admin-articles',
        component: adminArticles,
    },
    {
        path: '/admin/orders',
        name: 'admin-orders',
        component: adminOrders,
    },
    {
        path: '/admin/order/:id',
        name: 'admin-order',
        component: adminOrder,
        props: true,
    },
    {
        path: '/admin/competitors',
        name: 'admin-competitors',
        component: adminCompetitors,
    },
    {
        path: '/admin/confirm',
        name: 'admin-confirm-auth',
        component: adminConfirmAuth,
    },
    // Not found
    {
        path: '/:pathMatch(.*)*',
        name: 'not-found',
        component: userHome,
    },
]

const router = createRouter({history: createWebHistory(), routes});
router.beforeEach((to, from, next) => {
    if (import.meta.env.DEV) {
        console.log(`Navigating to: ${String(to.name)}\nParameters: ${JSON.stringify(to.query)}`);
    }
    to.meta.from = {
        name: from.name,
        params: from.params,
        query: from.query
    };
    next();
});
export default router;
