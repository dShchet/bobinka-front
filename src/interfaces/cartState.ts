import {type CartItem} from "~/interfaces/cart";

export default interface CartState {
    cart: CartItem[];
    selectedItemIds: number[];
};
