import {defineStore} from 'pinia'
import type ScreenState from "~/interfaces/screenState";

export const useScreenStore = defineStore('screen', {
    state: (): ScreenState => ({
        windowWidth: 0,
        isWideScreen: true,
        isExtraSmallScreen: false,
        scrollY: 0,
    }),
})
