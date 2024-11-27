import {defineStore} from 'pinia'
import type CartState from "~/interfaces/cartState";

export const useCartStore = defineStore('cart', {
    state: (): CartState => ({
        cart: [],
        selectedItemIds: [],
    }),
})
