import {format} from "date-fns";
import {ru} from "date-fns/locale";

export const timeDifferenceWithNow = (time: number) => {
    const now = new Date().getTime();
    return time - now;
};

export const formatDate = (date: Date) => {
    return format(date, 'dd.MM.yyyy HH:mm:ss', {locale: ru});
};
