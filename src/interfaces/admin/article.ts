import {AdminPreorder} from "~/interfaces/admin/preorder.ts";
import {ArticleTag} from "~/interfaces/articletag.ts";
import {AdminColorInArticle} from "~/interfaces/admin/color.ts";
import {ArticleStatus} from "~/enums/statuses.ts";
import {LocationQueryRaw} from "vue-router";
import {MediaType} from "~/enums/mediaType.ts";

export interface AdminAdditionalMediaInArticle {
    id: number
    telegramFileId?: string
    youtubeUrl?: string
    fileType: MediaType
    numInArticle: number
}

export interface AdminVideoInArticle {
    id: number
    fileId?: string
    youtubeUrl?: string
}

export interface AdminArticle {
    id: number
    name: string

    createdAt?: Date
    updatedAt?: Date
    expiredAt?: Date

    structure: string
    footage: string
    priceOpt: number
    priceRetail: number
    priceSale?: number
    saleName?: string
    comment?: string
    status?: ArticleStatus
    priority?: number

    inStock: boolean
    isHot: boolean

    additionalMedia: AdminAdditionalMediaInArticle[]
    videos: AdminVideoInArticle[]

    preorder: AdminPreorder
    tags: ArticleTag[]
    colors: AdminColorInArticle[]
}


export interface ArticleCreateData {
    preorderId: number;
    name: string;
    structure: string;
    footage: string;
    priceOpt: string;
    priceRetail: string;
    priceSale?: string;
    saleName?: string;
    quantities: number[];
    ttlDelta: number;
    comment?: string;
    photos: File[];
    videos?: File[];
    videosUrls?: string[];
    additionalMedia?: File[];
    articleTagsIds?: number[];
    isHot: boolean;
    isDistribute: boolean;
}

export interface AdminArticlesQuery extends LocationQueryRaw {
    page: number;
    search?: string;
    active?: string;
}

export interface AdminColorsOrderUpdateData {
    id: number;
    numInArticle: number;
}

export interface AdminArticleInOrder {
    id: number
    name: string

    createdAt: Date
    updatedAt: Date
    expiredAt: Date

    structure: string
    footage: string
    priceOpt: number
    priceRetail: number
    priceSale?: number
    saleName?: string
    comment?: string
    status?: ArticleStatus
    priority?: number

    inStock: boolean
    isHot: boolean

    preorder: AdminPreorder
    tags: ArticleTag[]
}
