import {type ColorInOrder} from "~/interfaces/color";
import {type ArticleInOrder} from "~/interfaces/article";
import {OrderStatus} from "~/enums/statuses.ts";

export interface Order {
    id: number;
    tgUserId: number;
    status: OrderStatus;
    quantity: number;
    deliveryState?: string;
    payLink?: string;
    trackNumber?: string;
    bobbinPrice?: number;
    bobbinWeight?: number;
    color: ColorInOrder;
    article: ArticleInOrder;
}
