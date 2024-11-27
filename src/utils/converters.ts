import {camelCase, snakeCase} from "scule";
import {AdminArticle, AdminArticleInOrder} from "~/interfaces/admin/article.ts";
import {Article, ArticleInColor} from "~/interfaces/article.ts";
import {AdminOrder} from "~/interfaces/admin/order.ts";


export const convertKeysToCamelCase = (obj: any): any => {
    if (Array.isArray(obj)) {
        return obj.map((item) => convertKeysToCamelCase(item));
    } else if (obj !== null && typeof obj === 'object') {
        return Object.keys(obj).reduce(
            (result, key) => ({
                ...result,
                [camelCase(key)]: convertKeysToCamelCase(obj[key]),
            }),
            {}
        );
    }
    return obj;
};

export const convertKeysToSnakeCase = (obj: any): any => {
    if (Array.isArray(obj)) {
        return obj.map((item) => convertKeysToSnakeCase(item));
    } else if (obj !== null && typeof obj === 'object') {
        return Object.keys(obj).reduce(
            (result, key) => ({
                ...result,
                [snakeCase(key)]: convertKeysToSnakeCase(obj[key]),
            }),
            {}
        );
    }
    return obj;
};

export const convertDateToGMT = (date: Date) => {
    const utcMilliseconds = date.getTime() - (date.getTimezoneOffset() * 60000);
    return new Date(utcMilliseconds);
};

export const convertDateFromApi = (date: Date) => {
    const offsetMinutes = -(new Date().getTimezoneOffset());
    const gmtPlus3Offset = 3 * 60;

    const gmtPlus3Date = date as Date;
    const originalDate = new Date(gmtPlus3Date);

    const totalOffset = offsetMinutes - gmtPlus3Offset;

    const newTime = originalDate.getTime() + totalOffset * 60 * 1000;
    const convertedDate = new Date(newTime);

    return new Date(convertedDate);
};

export const convertArticleDatesFromApi = (article: AdminArticle | Article | AdminArticleInOrder | ArticleInColor) => {
    if ('createdAt' in article && article.createdAt) {
        article.createdAt = convertDateFromApi(article.createdAt);
    }

    if ('updatedAt' in article && article.updatedAt) {
        article.updatedAt = convertDateFromApi(article.updatedAt);
    }

    if (article.expiredAt) {
        article.expiredAt = convertDateFromApi(article.expiredAt);
    }
};

export const convertOrderDatesFromApi = (order: AdminOrder) => {
    if (order.createdAt !== null) {
        order.createdAt = convertDateFromApi(order.createdAt);
    }
    order.matches.forEach((match) => {
        if (match.matchedAt !== null) {
            match.matchedAt = convertDateFromApi(match.matchedAt);
        }
    })
    convertArticleDatesFromApi(order.article);
}
