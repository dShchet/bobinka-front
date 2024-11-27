import {type Bobbin} from "~/interfaces/bobbin";
import {ArticleInColor, type CartItemArticle} from "~/interfaces/article";

export interface Color {
    id: number
    name: string
    numInArticle: number
    bobbins: Bobbin[]
    availableQuantity: number
    article: ArticleInColor
}

export interface ColorInArticle {
    id: number;
    name: string;
    telegramFileId: string;
    numInArticle: number;
    bobbins: Bobbin[];
    availableQuantity: number;
}

export interface CartItemColor {
    id: number;
    name: string;
    fileId: string;
    fileIdSigned?: string;
    localFileName?: string;
    article: CartItemArticle;
}

export interface ColorInOrder {
    id: number;
    name: string;
}
