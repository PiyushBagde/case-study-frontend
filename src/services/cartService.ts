import { AddToCartPayload, CartStateData, RemoveItemPayload, UpdateQuantityPayload } from "../types/cart";
import apiClient from "./api";

// Fetches the current authenticated user's cart.
export const fetchMyCart = async (): Promise<CartStateData> => {
    const response = await apiClient.get<CartStateData>('/cart/customer/getMyCart');
    return response.data;
}

// Adds an item to the current authenticated user's cart
export const addItemToCart = async (itemData: AddToCartPayload): Promise<string> => {
    const response = await apiClient.post<string>(
        '/cart/customer/addToMyCart',
        null, // No request body needed if using query params
        {
            params: { // Send data as query parameters
                prodName: itemData.prodName,
                quantity: itemData.quantity,
            }
        }
    );
    return response.data;
};

// Removes an item from the current authenticated user's cart.
export const removeItemFromCart = async (payload: RemoveItemPayload): Promise<String> => {
    const response = await apiClient.delete<string>('/cart/customer/removeItemFromMyCart',
        {
            params: {
                prodName: payload.prodName
            }
        }
    );
    return response.data;
};


// Increases the quantity of an item in the current authenticated user's cart.
export const increaseCartItemQuantity = async (payload: UpdateQuantityPayload): Promise<string> => {
    const response = await apiClient.put<string>(
        '/cart/customer/increaseQuantity',
        null, // No request body needed if using query params
        {
            params: { // Send data as query parameters
                prodName: payload.prodName
            }
        }
    );
    return response.data;
};


// Decreases the quantity of an item in the current authenticated user's cart.
export const decreaseCartItemQuantity = async (payload: UpdateQuantityPayload): Promise<string> => {
    const response = await apiClient.put<string>(
        '/cart/customer/decreaseQuantity',
        null, // No request body needed if using query params
        { params: { prodName: payload.prodName}}
    );
    return response.data;
};


// Clears the current authenticated user's cart contents ONLY (no inventory change)
export const clearMyCartContentsOnly = async (): Promise<string> => {
    const response = await apiClient.delete<string>('/cart/customer/clearMyCart');
    return response.data;
};


// Fetches the cart for a specific user ID (Biller/Admin).
export const getCartForUser = async (userId: number): Promise<CartStateData> => {
    const response = await apiClient.get<CartStateData>(`/cart/biller/getCartByUser/${userId}`);
    return response.data;
};

 // Adds an item to a specific user's cart (Biller).
 export const billerAddItemToCart = async (userId: number, itemData: AddToCartPayload): Promise<string> => {
    const response = await apiClient.post<string>(
        '/cart/biller/addToCart',
        null,
        { params: { userId, prodName: itemData.prodName, quantity: itemData.quantity } }
    );
    return response.data;
};

// Removes an item from a specific user's cart (Biller).
export const billerRemoveItemFromCart = async (userId: number, payload: RemoveItemPayload): Promise<string> => {
    const response = await apiClient.delete<string>(
        '/cart/biller/removeItemFromCart',
        { params: { userId, prodName: payload.prodName } }
    );
    return response.data;
};

// Increases quantity for an item in a specific user's cart (Biller).
export const billerIncreaseQuantity = async (userId: number, payload: UpdateQuantityPayload): Promise<string> => {
    const response = await apiClient.put<string>(
        '/cart/biller/increaseQuantity',
        null,
        { params: { userId, prodName: payload.prodName } }
    );
    return response.data;
};

// Decreases quantity for an item in a specific user's cart (Biller).
export const billerDecreaseQuantity = async (userId: number, payload: UpdateQuantityPayload): Promise<string> => {
    const response = await apiClient.put<string>(
        '/cart/biller/decreaseQuantity',
        null,
        { params: { userId, prodName: payload.prodName } }
    );
    return response.data;
};

// Clears a specific user's cart contents ONLY (Biller).
export const billerClearUserCartContents = async (userId: number): Promise<string> => {
     // Calls the NEW backend endpoint specifically for billers clearing contents
    const response = await apiClient.delete<string>(`/cart/biller/clearUserCartContents/${userId}`);
    return response.data;
};