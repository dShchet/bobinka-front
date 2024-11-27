import {ColorStatus} from "~/enums/statuses.ts";
import {AdminBobbinInColor} from "~/interfaces/admin/bobbin.ts";
import {AdminOrderInColor} from "~/interfaces/admin/order.ts";

export interface AdminColorInOrder {
    id: number
    articleId: number
    numInArticle: number

    name: string
    multicolor: string

    fileId?: string
    localFileName?: string
    fileIdSigned?: string

    quantity: number

    status: ColorStatus

    id1c?: string
}

export interface AdminColorInArticle extends AdminColorInOrder {
    bobbins: AdminBobbinInColor[]
    requests: AdminOrderInColor[]
}
