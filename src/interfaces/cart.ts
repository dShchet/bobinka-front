import {type CartItemColor} from "~/interfaces/color";

export interface CartItem {
    id: number;
    quantity: number;
    userId: number;
    color: CartItemColor;
    enough?: boolean;
}
