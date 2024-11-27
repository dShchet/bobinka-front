import {AdminUserInOrder} from "~/interfaces/admin/user.ts";
import {AdminArticleInOrder} from "~/interfaces/admin/article.ts";
import {AdminColorInOrder} from "~/interfaces/admin/color.ts";
import {AdminBobbinInColor} from "~/interfaces/admin/bobbin.ts";
import {OrderStatus} from "~/enums/statuses.ts";
import {DeliveryTypeValue} from "~/enums/deliveryType.ts";

export interface AdminOrderInColor {
    id: number

    createdAt: Date

    status: OrderStatus
    quantity: number
    comment?: string
    sample?: string
    fullname?: string

    deliveryState?: string
    deliveryType: DeliveryTypeValue
    payLink?: string
    trackNumber?: string

    isArchived: boolean

    user: AdminUserInOrder
}

export interface AdminOrderMatchInOrder {
    id: number
    quantity: number
    requestId: number
    matchedAt: Date
}

export interface AdminOrderWithMatches extends AdminOrderInColor {
    matches: AdminOrderMatchInOrder[]
}

export interface AdminOrder extends AdminOrderWithMatches {
    article: AdminArticleInOrder
    color: AdminColorInOrder

    matchedBobbins: AdminBobbinInColor[]
}
