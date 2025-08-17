

export interface CartItem{
    cartItemId: number;
    prodId:number;
    prodName:string;
    price:number;
    quantity:number;
    totalPrice:number;
}

export interface CartStateData {
    cartId: number;
    userId: number;
    cartTotalPrice: number;
    items: CartItem[];
}


// Represents the overall state managed by the cart Redux slice
export interface CartSliceState {
    cart: CartStateData | null; // Holds the actual cart data, null if not fetched/empty
    status: 'idle' | 'loading' | 'succeeded' | 'failed'; // Status for fetching the whole cart
    error: string | null | object; // Error related to fetching the whole cart
    itemStatus: 'idle' | 'loading' | 'succeeded' | 'failed'; // Status for single item operations (add/update/remove)
    itemError: string | null | object; // Error related to single item operations
}

export interface AddToCartPayload {
    prodName: string;
    quantity: number;
}

export interface UpdateQuantityPayload {
    prodName: string;
}

export interface RemoveItemPayload {
    prodName: string;
}

















