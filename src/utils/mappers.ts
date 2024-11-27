import {PreorderType} from "~/enums/preorderType.ts";
import {ArticleStatus, ColorStatus, OrderStatus} from "~/enums/statuses.ts";
import {DeliveryTypeValue} from "~/enums/deliveryType.ts";
import {colorMap} from "~/utils/colorMap.ts";

export const mapPreorderType = (preorderType: PreorderType): string => {
    const map: Record<PreorderType, string> = {
        [PreorderType.PREORDER]: 'Предзаказ',
        [PreorderType.IN_STOCK]: 'В наличии',
        [PreorderType.SALE]: 'Распродажа',
        [PreorderType.COURSE]: 'Мастеркласс',
        [PreorderType.FAST_PREORDER]: 'Быстрый предзаказ',
        [PreorderType.FEEDBACK]: "Отзывы",
    };
    return map[preorderType];
};

export const mapPreorderTypeString = (preorderType: string): PreorderType => {
    const map: Record<string, PreorderType> = {
        'Предзаказ': PreorderType.PREORDER,
        'В наличии': PreorderType.IN_STOCK,
        'Распродажа': PreorderType.SALE,
        'Мастеркласс': PreorderType.COURSE,
        'Быстрый предзаказ': PreorderType.FAST_PREORDER,
        'Отзывы': PreorderType.FEEDBACK,
    };
    return map[preorderType];
};

export const mapArticleStatus = (articleStatus: ArticleStatus): string => {
    const map = {
        [ArticleStatus.ACTIVE]: 'Активный',
        [ArticleStatus.INACTIVE]: 'Не активный',
    };
    return map[articleStatus];
};

export const mapColorStatus = (colorStatus: ColorStatus): string => {
    const map = {
        [ColorStatus.ACTIVE]: 'Активный',
        [ColorStatus.INACTIVE]: 'Не активный',
    };
    return map[colorStatus];
};

export const mapOrderStatus = (orderStatus: OrderStatus): string => {
    const map = {
        [OrderStatus.NEW]: 'Новый',
        [OrderStatus.WAITING_FOR_APPROVAL]: 'Ожидает подтверждения',
        [OrderStatus.USER_APPROVED]: 'Подтвержден пользователем',
        [OrderStatus.USER_REJECTED]: 'Отклонен пользователем',
        [OrderStatus.ADMIN_APPROVED]: 'Подтвержден администратором',
        [OrderStatus.ADMIN_REJECTED]: 'Отклонен администратором',
        [OrderStatus.PROCESSED]: 'Обработан',
        [OrderStatus.COMPLETE]: 'Завершен',
    };
    return map[orderStatus];
};

export const mapOrderStatusString = (orderStatus: string): OrderStatus => {
    const map: Record<string, OrderStatus> = {
        'Новый': OrderStatus.NEW,
        'Ожидает подтверждения': OrderStatus.WAITING_FOR_APPROVAL,
        'Подтвержден пользователем': OrderStatus.USER_APPROVED,
        'Отклонен пользователем': OrderStatus.USER_REJECTED,
        'Подтвержден администратором': OrderStatus.ADMIN_APPROVED,
        'Отклонен администратором': OrderStatus.ADMIN_REJECTED,
        'Обработан': OrderStatus.PROCESSED,
        'Завершен': OrderStatus.COMPLETE,
    };
    return map[orderStatus];
};

export const mapQuantity = (quantity: number): string => {
    const map: Record<number, string> = {
        0.5: 'Половина',
        1: 'Целая',
    };
    return map[quantity];
};

export const mapDeliveryType = (deliveryType: DeliveryTypeValue): string => {
    const map = {
        [DeliveryTypeValue.RUPOSTOFFICE]: 'Почта России',
        [DeliveryTypeValue.CDEK]: 'СДЭК',
        [DeliveryTypeValue.PICKUP]: 'Самовывоз',
    };
    return map[deliveryType];
};

export const mapBoolean = (value: boolean): string => {
    const map: Record<string, string> = {
        true: 'Да',
        false: 'Нет',
    };
    return map[value.toString()];
};

export const mapColorNameToHex = (value: string): string | undefined => {
    return colorMap[value];
};
