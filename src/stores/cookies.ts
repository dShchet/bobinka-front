import {defineStore} from 'pinia'

export const useCookiesStore = defineStore('cookies', {
    state: (): {
        setCookie: (name: string, value: string, days: number) => void;
        getCookie: (name: string) => string | null;
        deleteCookie: (name: string) => void;
    } => ({
        setCookie: function (name: string, value: string, days: number) {
            const expires = new Date();
            expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
            document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
        },
        getCookie: function (name: string) {
            const cookies = document.cookie.split(";");
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i];
                const eqPos = cookie.indexOf("=");
                const cookieName = eqPos > -1 ? cookie.slice(0, eqPos) : cookie;
                if (cookieName.trim() === name) {
                    return decodeURIComponent(cookie.slice(eqPos + 1));
                }
            }
            return null;
        },
        deleteCookie: function (name: string) {
            const cookies = document.cookie.split(";");
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i];
                const eqPos = cookie.indexOf("=");
                const cookieName = eqPos > -1 ? cookie.slice(0, eqPos) : cookie;
                if (cookieName.trim() === name) {
                    document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                }
            }
        },
    }),
})
