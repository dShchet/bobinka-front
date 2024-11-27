import {DeliveryTypeValue} from "~/enums/deliveryType";

export interface CheckoutData {
    fullname: string;
    sample?: string;
    comment?: string;
    phone: string;
    deliveryType: DeliveryTypeValue;
    index?: number;
    address?: string;
    cartItemsIds: number[];
}
