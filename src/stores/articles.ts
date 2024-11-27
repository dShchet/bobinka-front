import {defineStore} from 'pinia'
import type ArticleColorsState from "~/interfaces/articleColorsState.ts";
import {type Quantity} from "~/interfaces/quantity";
import {Color} from "~/interfaces/color.ts";

export const useArticleColorsStore = defineStore('articleColors', {
    state: (): ArticleColorsState => ({
        paginatedColors: [],
        tags: [],
        colorsNames: [],
        quantities: [
            {
                number: 0.5,
                name: 'Половина',
            },
            {
                number: 1,
                name: 'Целая',
            },
        ] as Quantity[],
        remove: function (colorId: number): Color | undefined {
            const color = this.paginatedColors.find((color) => color.id === colorId);
            if (!color) {
                return;
            }
            this.paginatedColors = this.paginatedColors.filter((color) => color.id !== colorId);
            return color;
        },
    }),
})
