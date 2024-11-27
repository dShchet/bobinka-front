import {competitorShopNaming} from "~/enums/competitor.ts"
import {LocationQueryRaw} from "vue-router";

export interface CompetitorArticleCard {
    id: string

    title: string
    price: string
    link: string
    isActive: boolean

    shop: competitorShopNaming
}

export interface CompetitorArticleCardsQuery extends LocationQueryRaw {
    search?: string;
    inactive?: string;
}