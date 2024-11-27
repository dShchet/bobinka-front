import {defineStore} from 'pinia'
import {useCookiesStore} from "~/stores/cookies.ts";

export const useEULAStore = defineStore('eula', {
    state: (): {
        isChoiceRemembered: boolean;
        rememberChoice: () => void;
        forgetChoice: () => void;
        getChoiceFromLocalStorage: () => boolean;
    } => ({
        isChoiceRemembered:
            localStorage.getItem('eulaRemembered') === 'true'
            || useCookiesStore().getCookie("bobinka_eula_accept") === 'true'
            || false,
        rememberChoice: function () {
            this.isChoiceRemembered = true;
            localStorage.setItem('eulaRemembered', 'true');
        },
        forgetChoice: function () {
            this.isChoiceRemembered = false;
            localStorage.setItem('eulaRemembered', 'false');
        },
        getChoiceFromLocalStorage: function (): boolean {
            this.isChoiceRemembered = localStorage.getItem('eulaRemembered') === 'true' ?? false;
            return this.isChoiceRemembered;
        }
    }),
})
