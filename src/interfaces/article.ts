import {PreorderType} from "~/enums/preorderType";
import {type ColorInArticle} from "~/interfaces/color";
import {type ArticleTag} from "~/interfaces/articletag";
import type {LocationQueryRaw} from "vue-router";

export interface Article {
    id: number;
    name: string;
    structure: string;
    footage: string;
    priceRetail: number;
    priceSale: number | null;
    saleName: string | null;
    comment: string;
    preorderType: PreorderType;
    inStock: boolean;
    colors: ColorInArticle[];
    tags: ArticleTag[];
    additionalVideos: string[];
    additionalPhotos: string[];
    expiredAt: Date | null;
    isHot: boolean;
}

export interface CartItemArticle {
    id: number;
    name: string;
    priceRetail: number;
    priceSale: number | null;
    saleName: string | null;
    expired?: boolean;
}

export interface ArticleInOrder {
    id: number;
    name: string;
    structure: string;
    footage: number | string;
    priceRetail: number;
    priceSale: number | null;
    preorderStatus: string;
}

export interface ArticleInColor {
    id: number
    name: string
    structure: string
    footage: number | string
    priceRetail: number
    priceSale?: number
    saleName?: string
    comment?: string
    preorder: { type: PreorderType }
    inStock: boolean
    expiredAt?: Date
    isHot: boolean
}

export interface ArticlesQuery extends LocationQueryRaw {
    page: number;
    search?: string;
    article_tags?: string;
    only_in_stock?: string;
    only_sale?: string;
}
