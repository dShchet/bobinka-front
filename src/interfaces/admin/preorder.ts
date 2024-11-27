import {PreorderType} from "~/enums/preorderType.ts";
import {AdminSupplier} from "~/interfaces/admin/supplier.ts";

export interface AdminPreorder {
    id: number
    name: string
    status: string
    openDate: Date
    shipmentDate?: Date
    receiptDate?: Date
    closeDate?: Date

    type: PreorderType

    supplier: AdminSupplier
}
