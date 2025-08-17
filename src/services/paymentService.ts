import { PayByCardPayload, PayByCashPayload, PayByUpiPayload, Transaction } from "../types/payment";
import apiClient from "./api";

export const payByCard = async (payload: PayByCardPayload): Promise<Transaction> => {
    const response = await apiClient.post<Transaction>(
        '/payment/biller-customer/payByCard',
        null, // No body if using params
        { params: payload } // Send payload as query parameters
    );
    return response.data; // Backend returns the completed/updated Transaction
};

export const payByUpi = async (payload: PayByUpiPayload): Promise<Transaction> => {
    const response = await apiClient.post<Transaction>(
        '/payment/biller-customer/payByUpi',
        null,
        { params: payload }
    );
    return response.data;
};


export const payByCash = async (payload: PayByCashPayload): Promise<Transaction> => {
    const response = await apiClient.post<Transaction>(
        '/payment/biller-customer/payByCash',
        null,
        { params: payload }
    );
    return response.data;
};

export const getPaymentDetails = async(transactionId: number): Promise<Transaction> => {
    // Use an appropriate admin/biller/customer endpoint
    const response = await apiClient.get<Transaction>(`/payment/admin/getPaymentById/${transactionId}`); 
    return response.data;
}

export const getMyPaymentDetailsForOrder = async(orderId: number): Promise<Transaction> => {
    // Use an appropriate admin/biller/customer endpoint
    const response = await apiClient.get<Transaction>(`/payment/customer/getMyTransactionByOrderId/${orderId}`); 
    return response.data;
}








