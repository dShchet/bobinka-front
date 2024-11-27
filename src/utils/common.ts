import {useCartStore} from "~/stores/cart";
import {storeToRefs} from "pinia";
import {adminSignInViaTelegram, getUserCart, userSignInViaTelegramWebApp} from "~/utils/api";
import {useUserInfoStore} from "~/stores/userInfo";
import {convertKeysToCamelCase} from "~/utils/converters";
import {type CartItem} from "~/interfaces/cart";
import {type AuthData, type UserAuthDataResponse} from "~/interfaces/authData";
import {AdminAuthDataResponse} from "~/interfaces/admin/authData.ts";
import {useAdminInfoStore} from "~/stores/adminInfo.ts";
import {Color, ColorInArticle} from "~/interfaces/color.ts";
import {Article} from "~/interfaces/article.ts";
import {YOUTUBE_VIDEO_ID_REGEX} from "~/utils/regex.ts";

export const onFetchUserCart = async () => {
    const cartStore = useCartStore();
    const {cart} = storeToRefs(cartStore);

    const userInfoStore = useUserInfoStore();
    const user = await userInfoStore.get();

    if (!user) {
        return;
    }

    const response = await getUserCart();
    if (!response.ok) {
        console.error('Failed to fetch user cart', response);
    } else {
        cart.value = convertKeysToCamelCase(await response.json()) as CartItem[];
    }
};

export const onUserTelegramWebAppLogin = async (data: AuthData) => {
    const userInfoStore = useUserInfoStore();
    const response = await userSignInViaTelegramWebApp(data);
    if (response.ok) {
        const result = convertKeysToCamelCase(await response.json()) as UserAuthDataResponse;
        if (!result) {
            location.reload();
        }
        await userInfoStore.get();
        await new Promise(r => setTimeout(r, 500));
    }
};

export const onAdminTelegramWebAppLogin = async (data: AuthData) => {
    const adminInfoStore = useAdminInfoStore();
    const response = await adminSignInViaTelegram(data);
    if (response.ok) {
        const result = convertKeysToCamelCase(await response.json()) as AdminAuthDataResponse;
        if (!result) {
            location.reload();
        }
        await adminInfoStore.get();
        await new Promise(r => setTimeout(r, 500));
    }
};

export const articleColorAvailableQuantityWithCart = (article: Article, colorId: number) => {
    const color = (article.colors.find(color => color.id === colorId) as ColorInArticle);
    if (!color) {
        return 0;
    }
    const cartStore = useCartStore();
    const {cart} = storeToRefs(cartStore);
    const cartItems = cart.value.filter(item => item.color.id === colorId);
    return color.availableQuantity - (cartItems.length > 0 ? cartItems.reduce((acc, item) => acc + item.quantity, 0) : 0);
};

export const colorAvailableQuantityWithCart = (color: Color) => {
    const cartStore = useCartStore();
    const {cart} = storeToRefs(cartStore);
    const cartItems = cart.value.filter(item => item.color.id === color.id);
    return color.availableQuantity - (cartItems.length > 0 ? cartItems.reduce((acc, item) => acc + item.quantity, 0) : 0);
};

export const createUrl = (file: File): string => {
    return URL.createObjectURL(file);
};

export const isColorInCart = (colorId: number, quantity: number): boolean => {
    const cartStore = useCartStore();
    const {cart} = storeToRefs(cartStore);
    return cart.value.some(item => item.color.id === colorId && item.quantity === quantity);
};

export const extractYoutubeVideoId = (url: string) => {
    const match = url.match(YOUTUBE_VIDEO_ID_REGEX);
    if (match) {
        return match[1];
    } else {
        return null;
    }
};
