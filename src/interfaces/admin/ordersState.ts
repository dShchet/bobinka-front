import {AdminOrder} from "~/interfaces/admin/order.ts";

export default interface AdminOrdersState {
    paginatedOrders: AdminOrder[];
    get: (orderId: number) => AdminOrder | undefined;
    fetch: (orderId: number) => Promise<AdminOrder | undefined>;
    remove: (orderId: number) => AdminOrder | undefined;
};
