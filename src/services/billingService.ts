import apiClient from "./api";
import { Order } from "../types/order";

export const placeOrder = async (): Promise<Order> => {
    // Endpoint likely targets /customer/placeMyOrder which reads header
    const response = await apiClient.post<Order>('/bill/customer/placeMyOrder');
    // Backend returns the created Order object
    return response.data;
};

export const getAnyOrderByOrderId = async (orderId: number): Promise<Order> => {
    const response = await apiClient.get<Order>(`/bill/admin-biller/getOrderByOrderId/${orderId}`);
    return response.data;
};

export const getMyOrderDetails = async(orderId: number): Promise<Order> => {
    const response = await apiClient.get<Order>(`/bill/customer/getMyOrderById/${orderId}`);
    return response.data;
}

export const getMyOrders = async (): Promise<Order[]> => {
    const response = await apiClient.get<Order[]>('/bill/customer/getMyOrders');
    return response.data;
};

export const placeBillerOrder = async (userId: number): Promise<Order> => {
    const response = await apiClient.post<Order>(`/bill/biller/placeOrder/${userId}`);
    return response.data;
};