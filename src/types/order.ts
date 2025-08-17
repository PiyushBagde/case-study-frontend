export interface OrderItem {
    orderItemId: number;
    prodId: number;
    prodName: string;
    price: number;
    quantity: number;
    totalPrice: number;
}

export interface Order {
    orderId: number;
    userId: number;
    cartId: number;
    orderDate: string;
    totalBillPrice: number;
    orderItems: OrderItem[];
}

export interface OrderSliceState {
    currentOrderId: number | null; // ID of the most recently placed order
    currentOrderDetails: Order | null; // Optional: Store full details if needed immediately
    status: 'idle' | 'loading' | 'succeeded' | 'failed'; // Status for placing order / fetching orders
    error: string | null | object; // Error related to order operations
    // Could add state for fetching order history later
    //     orderHistory: Order[];
    //     historyStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
    //     historyError: string | null | object;
}