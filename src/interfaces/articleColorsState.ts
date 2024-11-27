import {type ArticleTag} from "~/interfaces/articletag";
import {type Quantity} from "~/interfaces/quantity";
import {Color} from "~/interfaces/color.ts";

export default interface ArticleColorsState {
    paginatedColors: Color[];
    tags: ArticleTag[];
    colorsNames: string[];
    quantities: Quantity[];
    remove: (colorId: number) => Color | undefined;
};
