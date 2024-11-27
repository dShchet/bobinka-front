import {defineStore} from 'pinia'
import {AdminOrder} from "~/interfaces/admin/order.ts";
import AdminOrdersState from "~/interfaces/admin/ordersState.ts";
import {getAdminOrder} from "~/utils/api.ts";
import {convertKeysToCamelCase, convertOrderDatesFromApi} from "~/utils/converters.ts";

export const useAdminOrdersStore = defineStore('adminOrders', {
    state: (): AdminOrdersState => ({
        paginatedOrders: [],
        get: function (orderId: number): AdminOrder | undefined {
            return this.paginatedOrders.find((order) => order.id === orderId);
        },
        fetch: async function (orderId: number): Promise<AdminOrder | undefined> {
            const response = await getAdminOrder(orderId);
            if (!response.ok) {
                console.error(`Failed to fetch order ${orderId}`, response);
                return;
            } else {
                const order = convertKeysToCamelCase(await response.json()) as AdminOrder;
                convertOrderDatesFromApi(order);
                return order;
            }
        },
        remove: function (orderId: number): AdminOrder | undefined {
            const order = this.get(orderId);
            if (!order) {
                return;
            }
            this.paginatedOrders = this.paginatedOrders.filter((order) => order.id !== orderId);
            return order;
        },
    }),
})
