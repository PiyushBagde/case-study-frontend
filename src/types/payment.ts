import { PaymentMode } from "./enums";

export interface Transaction {
    transactionId: number;
    userId: number;
    orderId: number;
    requiredAmount: number;
    receivedAmount: number;
    balanceAmount: number;
    paymentMode: PaymentMode;
    paymentStatus: string; // "Pending", "Completed", "Incomplete"
    paymentTime: string; // ISO Date string
    upiId?: string | null;
    transactionTime?: string | null; // ISO Date string
    cardNumber?: string | null; // MASKED if returned from API
    cardHolderName?: string | null;
}

export interface PaymentSliceState {
    lastTransaction: Transaction | null; // Store details of the last attempted transaction
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null | object;
}

export interface PayByCardPayload {
    orderId: number;
    receivedAmount: number;
    cardNumber: string;
    cardHolderName: string;
}

export interface PayByUpiPayload {
    orderId: number;
    receivedAmount: number;
    upiId: string;
}

export interface PayByCashPayload {
    orderId: number;
    receivedAmount: number;
}
