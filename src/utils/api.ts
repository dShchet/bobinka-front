import ky from "ky";
import {BASE_URL, ORDERS_PAGE_SIZE, PAGE_SIZE} from "~/config/constants";
import {type AuthData} from "~/interfaces/authData";
import {PreorderType} from "~/enums/preorderType";
import {type CheckoutData} from "~/interfaces/checkoutData";
import {convertKeysToSnakeCase} from "~/utils/converters";
import {type ContactsData} from "~/interfaces/contactsData.ts";
import {AdminColorsOrderUpdateData, ArticleCreateData} from "~/interfaces/admin/article.ts";
import {YarnWeightCalculatorData} from "~/interfaces/calculatorData.ts";
import {OrderStatus} from "~/enums/statuses.ts";
import {competitorArticleCardStatus} from "~/enums/competitor.ts";

const api = ky.create({
    prefixUrl: BASE_URL,
    mode: "cors",
    credentials: "include",
    throwHttpErrors: false,
    timeout: false,
});

// ====
// User
// ====

// Articles

// Get

export const getArticles = async (
    preorderTypes: PreorderType[],
    onlyInStock: boolean = false,
    onlyPreorder: boolean = false,
    onlySale: boolean = false,
    onlyHot: boolean = false,
    search: string | undefined = undefined,
    articleTags: string | undefined = undefined,
    colorsNames: string | undefined = undefined,
    page: number = 1,
    size: number = PAGE_SIZE,
) => {
    let url = `articles/` +
        `?preorder_types=${preorderTypes.join(',')}` +
        `&only_in_stock=${onlyInStock}` +
        `&only_preorder=${onlyPreorder}` +
        `&only_sale=${onlySale}` +
        `&only_hot=${onlyHot}` +
        `&page=${page}` +
        `&size=${size}`;
    if (search) {
        url += `&search=${search}`;
    }
    if (articleTags) {
        url += `&article_tags_ids=${articleTags}`;
    }
    if (colorsNames) {
        url += `&colors_names=${colorsNames}`;
    }
    return api.get(url);
};

export const getArticleTags = async () => {
    return api.get('articles/filters/article_tags');
};

export const getUniqueColorsNames = async () => {
    return api.get('articles/filters/colors_names');
};

export const getArticle = async (articleId: number) => {
    return api.get(`articles/${articleId}`);
};

// Post

export const calculateYarnWeight = async (data: YarnWeightCalculatorData) => {
    return api.post('articles/calculate_yarn_weight', {json: convertKeysToSnakeCase(data)});
};


// Colors

// Get
export const getColors = async (
    preorderTypes: PreorderType[],
    onlyInStock: boolean = false,
    onlyPreorder: boolean = false,
    onlySale: boolean = false,
    onlyHot: boolean = false,
    search: string | undefined = undefined,
    articleTags: string | undefined = undefined,
    colorsNames: string | undefined = undefined,
    page: number = 1,
    size: number = PAGE_SIZE,
) => {
    let url = `articles/colors/` +
        `?preorder_types=${preorderTypes.join(',')}` +
        `&only_in_stock=${onlyInStock}` +
        `&only_preorder=${onlyPreorder}` +
        `&only_sale=${onlySale}` +
        `&only_hot=${onlyHot}` +
        `&page=${page}` +
        `&size=${size}`;
    if (search) {
        url += `&search=${search}`;
    }
    if (articleTags) {
        url += `&article_tags_ids=${articleTags}`;
    }
    if (colorsNames) {
        url += `&colors_names=${colorsNames}`;
    }
    return api.get(url);
}


// Cart

// Get

export const getUserCart = async () => {
    return api.get('cart/');
};

// Post

export const addItemToCart = async (colorId: number, quantity: number) => {
    return api.post('cart/', {json: {color_id: colorId, quantity: quantity}});
};

// Delete

export const removeItemFromCart = async (cartItemId: number) => {
    return api.delete('cart/' + cartItemId);
};


// Users

// Get

export const getMe = async () => {
    return api.get('users/me');
};

export const getUserCheckoutSavedData = async () => {
    return api.get('users/checkout_saved_data');
};

export const getUserRuPostSavedData = async () => {
    return api.get('users/ru_post_saved_data');
};

export const getRefLink = async () => {
    return api.get('users/ref_link');
};

export const getUserEULAChoice = async () => {
    return api.get('users/eula');
};

// Post

export const setUserEULAChoice = async (choice: boolean) => {
    return api.post(`users/eula?choice=${choice}`);
};

export const setUserPhone = async (phone: string) => {
    return api.post('users/phone', {json: {phone: phone}});
};

export const setUserAddress = async (address: string | null) => {
    return api.post('users/address', {json: {address: address}});
};

export const setWantsHotArticles = async (wantsHotArticles: boolean) => {
    return api.post('users/wants_hot_articles', {json: {wants_hot_articles: wantsHotArticles}});
};


// Checkout

// Post

export const processCheckout = async (data: CheckoutData) => {
    return api.post('checkout/', {json: convertKeysToSnakeCase(data)});
};

export const getAdminMe = async () => {
    return api.get('admin/users/me');
};


// Orders

// Get

export const getUserPreorders = async (page: number = 1, size: number = ORDERS_PAGE_SIZE) => {
    return api.get(`orders/?page=${page}&size=${size}`);
};

export const getUserArchivedOrders = async (page: number = 1, size: number = ORDERS_PAGE_SIZE) => {
    return api.get(`orders/archive?page=${page}&size=${size}`);
};

// Post

export const archiveOrder = async (orderId: number) => {
    return api.post(`orders/archive/${orderId}`);
};

export const unarchiveOrder = async (orderId: number) => {
    return api.post(`orders/unarchive/${orderId}`);
};


// Contact

// Post

export const processContactWithMe = async (data: ContactsData) => {
    return api.post('contact/', {json: convertKeysToSnakeCase(data)});
};


// Auth

// Post

export const userSignInViaTelegramWebApp = async (data: AuthData) => {
    return api.post('auth/telegram', {json: data});
};

export const userConfirmAuthViaTelegram = async (code: string) => {
    return api.post(`auth/confirm?code=${code}`);
};

export const logout = async () => {
    return api.post('auth/logout');
};


// =====
// Admin
// =====

// Articles

// Get

export const getAdminArticles = async (
    search: string | undefined = undefined,
    page: number = 1,
    onlyActive: boolean = false,
    size: number = PAGE_SIZE,
) => {
    let url = `admin/articles/` +
        `?page=${page}` +
        `&size=${size}`;
    if (search) {
        url += `&search=${search}`;
    }
    if (onlyActive) {
        url += `&only_active=${onlyActive}`;
    }
    return api.get(url);
};

export const getAdminArticle = async (articleId: number) => {
    return api.get(`admin/articles/${articleId}`);
}

// Post

export const createArticle = async (data: ArticleCreateData) => {
    const formData = new FormData();

    if (data.preorderId) {
        formData.append('preorder_id', data.preorderId.toString());
    }
    formData.append('name', data.name);
    formData.append('structure', data.structure);
    formData.append('footage', data.footage);
    formData.append('price_opt', data.priceOpt.toString());
    formData.append('price_retail', data.priceRetail.toString());
    if (data.priceSale && data.saleName) {
        formData.append('price_sale', data.priceSale.toString());
        formData.append('sale_name', data.saleName);
    }
    formData.append('quantities', data.quantities.join(','));
    formData.append('ttl_delta', data.ttlDelta.toString());
    if (data.comment) {
        formData.append('comment', data.comment);
    }
    data.photos.forEach((photo) => {
        formData.append('photos', photo);
    });
    if (data.videos && data.videos.length > 0) {
        data.videos?.forEach((video) => {
            formData.append('videos', video);
        });
    }
    if (data.videosUrls && data.videosUrls.length > 0) {
        formData.append('videos_urls', data.videosUrls.join(','));
    }
    if (data.additionalMedia && data.additionalMedia.length > 0) {
        data.additionalMedia?.forEach((media) => {
            formData.append('additional_media', media);
        });
    }
    if (data.articleTagsIds) {
        formData.append('article_tags_ids', data.articleTagsIds.join(','));
    }
    formData.append('is_hot', data.isHot.toString());
    formData.append('is_distribute', data.isDistribute.toString());

    return api.post('admin/articles/', {body: formData});
};

export const activateArticle = async (articleId: number) => {
    return api.post(`admin/articles/activate/${articleId}`);
};

export const deactivateArticle = async (articleId: number) => {
    return api.post(`admin/articles/deactivate/${articleId}`);
};

export const toggleArticleInStock = async (articleId: number) => {
    return api.post(`admin/articles/toggle_in_stock/${articleId}`);
};

export const addArticleAdditionalMedia = async (articleId: number, media: File[]) => {
    const formData = new FormData();
    media.forEach((item) => {
        formData.append('additional_media', item);
    });
    return api.post(`admin/articles/additional_media/${articleId}`, {body: formData});
};

export const addArticleVideos = async (
    data: {
        articleId: number,
        videos?: File[],
        videosUrls?: string[],
    }
) => {
    const formData = new FormData();

    if (data.videos && data.videos.length > 0) {
        data.videos?.forEach((video) => {
            formData.append('videos', video);
        });
    }
    if (data.videosUrls && data.videosUrls.length > 0) {
        formData.append('videos_urls', data.videosUrls.join(','));
    }

    return api.post(`admin/articles/videos/${data.articleId}`, {body: formData});
};

// Patch

export const changeArticleExpiredAt = async (articleId: number, expiredAt: Date | null) => {
    return api.patch(`admin/articles/expired_at/${articleId}`, {json: {expired_at: expiredAt}});
};

export const updateArticleName = async (articleId: number, name: string) => {
    return api.patch(`admin/articles/name/${articleId}`, {json: {name: name}});
};

export const updateArticlePreorder = async (articleId: number, preorderId: number) => {
    return api.patch(`admin/articles/preorder/${articleId}`, {json: {preorder_id: preorderId}});
};

export const updateArticleStructure = async (articleId: number, structure: string) => {
    return api.patch(`admin/articles/structure/${articleId}`, {json: {structure: structure}});
}

export const updateArticleFootage = async (articleId: number, footage: string) => {
    return api.patch(`admin/articles/footage/${articleId}`, {json: {footage: footage}});
};

export const updateArticleRetailPrice = async (articleId: number, priceRetail: number) => {
    return api.patch(`admin/articles/retail_price/${articleId}`, {json: {price: priceRetail}});
};

export const updateArticleOptPrice = async (articleId: number, priceOpt: number) => {
    return api.patch(`admin/articles/opt_price/${articleId}`, {json: {price: priceOpt}});
};

export const updateArticleSaleInfo = async (articleId: number, priceSale: number | null, saleName: string | null) => {
    return api.patch(`admin/articles/sale_info/${articleId}`, {json: {price_sale: priceSale, sale_name: saleName}});
};

export const updateColorsOrder = async (articleId: number, newOrder: AdminColorsOrderUpdateData[]) => {
    return api.patch(`admin/articles/colors_order/${articleId}`, {json: newOrder});
};

// Delete

export const deleteArticleAdditionalMedia = async (articleId: number) => {
    return api.delete(`admin/articles/all_additional_media/${articleId}`);
};

export const deleteArticleAdditionalMediaItem = async (additionalMediaItemId: number) => {
    return api.delete(`admin/articles/additional_media/${additionalMediaItemId}`);
};

export const deleteArticleVideos = async (articleId: number, videosIds?: number[]) => {
    let url = `admin/articles/videos/${articleId}`;
    if (videosIds) {
        url += `?videos_ids=${videosIds.join(',')}`;
    }
    return api.delete(url);
};

export const deleteArticleVideo = async (videoId: number) => {
    return api.delete(`admin/articles/video/${videoId}`);
};


// Colors

// Get

export const getFreeBobbinsQuantity = async (colorId: number) => {
    return api.get(`admin/colors/free_bobbins_quantity/${colorId}`);
};

// Post

export const activateColor = async (colorId: number) => {
    return api.post(`admin/colors/activate/${colorId}`);
};

export const deactivateColor = async (colorId: number) => {
    return api.post(`admin/colors/deactivate/${colorId}`);
};

export const setWeightsForBobbins = async (colorId: number, weights: number[]) => {
    return api.post(`admin/colors/bobbins_weights/${colorId}`, {json: {weights: weights}});
};

// Patch

export const updateColorName = async (colorId: number, name: string) => {
    return api.patch(`admin/colors/name/${colorId}`, {json: {name: name}});
};

export const updateColorPhoto = async (colorId: number, photo: File) => {
    const formData = new FormData();
    formData.append('photo', photo);
    return api.patch(`admin/colors/photo/${colorId}`, {body: formData});
}

// Delete

export const deleteColor = async (colorId: number) => {
    return api.delete(`admin/colors/${colorId}`);
};


// Bobbins

// Post

export const setWeightForBobbin = async (bobbinId: number, weight: number) => {
    return api.post(`admin/bobbins/weight/${bobbinId}`, {json: {weights: [weight]}});
};


// Fast preorders

// Get

export const getFastPreorderDrafts = async (page: number = 1) => {
    return api.get(`admin/fast_preorders/?page=${page}`);
};

export const getFastPreorderDraft = async (fastPreorderId: number) => {
    return api.get(`admin/fast_preorders/${fastPreorderId}`);
};

// Delete

export const deleteFastPreorderDraft = async (fastPreorderId: number) => {
    return api.delete(`admin/fast_preorders/${fastPreorderId}`);
};


// Orders

// Get

export const getAdminOrders = async (
    search: string | undefined = undefined,
    page: number = 1,
    size: number = PAGE_SIZE,
) => {
    let url = `admin/orders/` +
        `?page=${page}` +
        `&size=${size}`;
    if (search) {
        url += `&search=${search}`;
    }
    return api.get(url);
};

export const getAdminOrder = async (orderId: number) => {
    return api.get(`admin/orders/${orderId}`);
};
export const getOrdersByBobbinId = async (bobbinId: number) => {
    return api.get(`admin/orders/bobbin/${bobbinId}`);
};

export const getArticleOrdersCount = async (articleId: number) => {
    return api.get(`admin/orders/article/count/${articleId}`);
};

export const getColorOrdersCount = async (colorId: number) => {
    return api.get(`admin/orders/color/count/${colorId}`);
};

// Patch

export const updateOrderStatus = async (orderId: number, status: OrderStatus) => {
    return api.patch(`admin/orders/status/${orderId}`, {json: {status: status}});
};


// Preorders

// Get

export const getPreorders = async () => {
    return api.get('admin/preorders/');
};

// Patch

export const updatePreorderType = async (preorderId: number, preorderType: PreorderType) => {
    return api.patch(`admin/preorders/type/${preorderId}`, {json: {type: preorderType}});
};


// Auth

// Post

export const adminSignInViaTelegram = async (data: AuthData) => {
    return api.post('admin/auth/telegram', {json: data});
};

export const adminConfirmAuthViaTelegram = async (code: string) => {
    return api.post(`admin/auth/confirm?code=${code}`);
};

export const adminLogout = async () => {
    return api.post('admin/auth/logout');
};


// Competitors

// Get

export const getCompetitorArticleCards = async (search: string, inactive: boolean) => {
    return api.get(`admin/competitors/articles/cards?search=${search}&inactive=${inactive}`)
};

// Patch

export const updateCompetitorArticleCardStatus = async (id: string, status: competitorArticleCardStatus) => {
    return api.patch(`admin/competitors/articles/cards/${id}`, {json: {status: status}})
}