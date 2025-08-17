import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { fetchMyCart, addItemToCart, removeItemFromCart, increaseCartItemQuantity, decreaseCartItemQuantity, clearMyCartContentsOnly } from '../../services/cartService'; // Import API service functions
import {
    CartSliceState,
    CartStateData,
    AddToCartPayload,
    RemoveItemPayload,
    UpdateQuantityPayload
} from '../../types/cart'; 
import ApiErrorResponse from '../../types/auth';

// --- Initial State ---
const initialState: CartSliceState = {
    cart: null, 
    status: 'idle', 
    error: null,
    itemStatus: 'idle', 
    itemError: null,   
};

// --- Async Thunks ---

// Thunk to fetch the user's cart
export const fetchCartThunk = createAsyncThunk<
    CartStateData, void, { rejectValue: ApiErrorResponse | string }
>('cart/fetchCart', async (_, { rejectWithValue, getState }) => {
     const { auth } = getState() as { auth: { isAuthenticated: boolean } };
     if (!auth.isAuthenticated) return rejectWithValue('User not authenticated');
     try {
         const cartData = await fetchMyCart();
         return cartData;
     } catch (error: any) {
         console.error("Fetch cart error in thunk:", error);
         if (error.response && error.response.data) {
              if (error.response.status === 404) {
                  return rejectWithValue({ message: "Cart not found", status: 404, ...error.response.data } as ApiErrorResponse);
              }
             return rejectWithValue(error.response.data as ApiErrorResponse);
         }
         return rejectWithValue(error.message || 'Failed to fetch cart');
     }
});

// Thunk to add an item (refetches cart on success)
export const addItemToCartThunk = createAsyncThunk<
    CartStateData, // Return UPDATED cart data on success
    AddToCartPayload,
    { rejectValue: ApiErrorResponse | string, dispatch: any }
>('cart/addItem', async (itemData, { dispatch, rejectWithValue }) => {
    try {
        await addItemToCart(itemData);
        const updatedCart = await dispatch(fetchCartThunk()).unwrap();
        return updatedCart;
    } catch (error: any) {
        console.error("Add item to cart error in thunk:", error);
        if (error?.message && typeof error.message === 'string' && error.name !== 'Error') return rejectWithValue(error as ApiErrorResponse | string);
        if (error.response && error.response.data) return rejectWithValue(error.response.data as ApiErrorResponse);
        return rejectWithValue(error.message || 'Failed to add item to cart');
    }
});

// Thunk to remove an item (refetches cart on success)
export const removeItemFromCartThunk = createAsyncThunk<
    CartStateData, // Return UPDATED cart data on success
    RemoveItemPayload,
    { rejectValue: ApiErrorResponse | string, dispatch: any }
>('cart/removeItem', async (itemData, { dispatch, rejectWithValue }) => {
    try {
        await removeItemFromCart(itemData);
        const updatedCart = await dispatch(fetchCartThunk()).unwrap();
        return updatedCart;
    } catch (error: any) {
        console.error("Remove item from cart error in thunk:", error);
        if (error?.message && typeof error.message === 'string' && error.name !== 'Error') return rejectWithValue(error as ApiErrorResponse | string);
        if (error.response && error.response.data) return rejectWithValue(error.response.data as ApiErrorResponse);
        return rejectWithValue(error.message || 'Failed to remove item from cart');
    }
});

// Thunk to increase quantity (refetches cart on success)
export const increaseQuantityThunk = createAsyncThunk<
    CartStateData, // Return UPDATED cart data on success
    UpdateQuantityPayload,
    { rejectValue: ApiErrorResponse | string, dispatch: any }
>('cart/increaseQuantity', async (payload, { dispatch, rejectWithValue }) => {
    try {
        await increaseCartItemQuantity(payload);
        const updatedCart = await dispatch(fetchCartThunk()).unwrap();
        return updatedCart;
    } catch (error: any) {
        console.error("Increase quantity error in thunk:", error);
        if (error?.message && typeof error.message === 'string' && error.name !== 'Error') return rejectWithValue(error as ApiErrorResponse | string);
        if (error.response && error.response.data) return rejectWithValue(error.response.data as ApiErrorResponse);
        return rejectWithValue(error.message || 'Failed to increase item quantity');
    }
});

// Thunk to decrease quantity (refetches cart on success)
export const decreaseQuantityThunk = createAsyncThunk<
    CartStateData, // Return UPDATED cart data on success
    UpdateQuantityPayload,
    { rejectValue: ApiErrorResponse | string, dispatch: any }
>('cart/decreaseQuantity', async (payload, { dispatch, rejectWithValue }) => {
    try {
        await decreaseCartItemQuantity(payload);
        const updatedCart = await dispatch(fetchCartThunk()).unwrap();
        return updatedCart;
    } catch (error: any) {
        console.error("Decrease quantity error in thunk:", error);
        if (error?.message && typeof error.message === 'string' && error.name !== 'Error') return rejectWithValue(error as ApiErrorResponse | string);
        if (error.response && error.response.data) return rejectWithValue(error.response.data as ApiErrorResponse);
        return rejectWithValue(error.message || 'Failed to decrease item quantity');
    }
});

// Thunk for clearing contents only (refetches cart)
export const clearCartContentsOnlyThunk = createAsyncThunk<
    CartStateData, // Expect empty cart structure back after refetch
    void,
    { rejectValue: ApiErrorResponse | string, dispatch: any }
>('cart/clearContentsOnly', async (_, { dispatch, rejectWithValue }) => {
    try {
        console.log("Dispatching clearMyCartContentsOnly API call...");
        await clearMyCartContentsOnly(); 
        console.log("clearMyCartContentsOnly API call successful. Refetching cart...");
        const updatedCart = await dispatch(fetchCartThunk()).unwrap();
        console.log("Refetched cart after clear contents only:", updatedCart);
        return updatedCart; 
    } catch (error: any) {
        console.error("Clear cart contents only error in thunk:", error);
        if (error?.message && typeof error.message === 'string' && error.name !== 'Error') return rejectWithValue(error as ApiErrorResponse | string);
        if (error.response && error.response.data) return rejectWithValue(error.response.data as ApiErrorResponse);
        return rejectWithValue(error.message || 'Failed to clear cart contents');
    }
});


// --- Cart Slice Definition ---
const cartSlice = createSlice({
    name: 'cart',
    initialState,
    reducers: {
        clearCartStateLocally: (state) => {
            state.cart = null;       
            state.status = 'idle';    
            state.error = null;      
            state.itemStatus = 'idle';
            state.itemError = null;  
            console.log("Local cart state reset by clearCartStateLocally.");
        },
    },
    extraReducers: (builder) => {

        const handleItemPending = (state: CartSliceState) => {
            state.itemStatus = 'loading';
            state.itemError = null;
        };
        // Helper function to handle rejected state for item operations
        const handleItemRejected = (state: CartSliceState, action: PayloadAction<any>) => {
            state.itemStatus = 'failed';
            state.itemError = action.payload ?? 'Unknown error during item operation';
        };
        // Helper function to handle fulfilled state for item/clear operations (updates cart)
        const handleItemFulfilled = (state: CartSliceState, action: PayloadAction<CartStateData>) => {
            state.itemStatus = 'succeeded';
            state.cart = action.payload; // Update cart with the refetched data
            state.itemError = null;
            // If the fulfilled action resulted in an empty cart, ensure main status reflects success too
            if (action.payload?.items?.length === 0) {
                state.status = 'succeeded'; // Mark main status as succeeded if cart becomes empty
            }
        };

        // Fetch Cart Lifecycle
        builder
            .addCase(fetchCartThunk.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(fetchCartThunk.fulfilled, (state, action: PayloadAction<CartStateData>) => {
                state.status = 'succeeded';
                // *** Store the actual fetched cart data ***
                state.cart = action.payload;
                state.error = null;
                console.log("Cart slice updated: fetchCartThunk fulfilled.", action.payload);
            })
            .addCase(fetchCartThunk.rejected, (state, action) => {
                state.status = 'failed';
                // *** Clear cart on failure (including 404) ***
                state.cart = null;
                state.error = action.payload ?? 'Unknown error fetching cart';
                 console.log("Cart slice updated: fetchCartThunk rejected.", action.payload);
            });

        // Add Item Lifecycle
        builder
            .addCase(addItemToCartThunk.pending, handleItemPending)
            .addCase(addItemToCartThunk.fulfilled, handleItemFulfilled)
            .addCase(addItemToCartThunk.rejected, handleItemRejected);

        // Remove Item Lifecycle
        builder
            .addCase(removeItemFromCartThunk.pending, handleItemPending)
            .addCase(removeItemFromCartThunk.fulfilled, handleItemFulfilled)
            .addCase(removeItemFromCartThunk.rejected, handleItemRejected);

        // Increase Quantity Lifecycle
        builder
            .addCase(increaseQuantityThunk.pending, handleItemPending)
            .addCase(increaseQuantityThunk.fulfilled, handleItemFulfilled)
            .addCase(increaseQuantityThunk.rejected, handleItemRejected);

        // Decrease Quantity Lifecycle
        builder
            .addCase(decreaseQuantityThunk.pending, handleItemPending)
            .addCase(decreaseQuantityThunk.fulfilled, handleItemFulfilled)
            .addCase(decreaseQuantityThunk.rejected, handleItemRejected);

        // Clear Cart Contents ONLY Lifecycle (If using separate button)
        builder
            .addCase(clearCartContentsOnlyThunk.pending, handleItemPending)
            .addCase(clearCartContentsOnlyThunk.fulfilled, handleItemFulfilled)
            .addCase(clearCartContentsOnlyThunk.rejected, handleItemRejected);
    },
});

// Export actions and reducer
export const { clearCartStateLocally } = cartSlice.actions;
export default cartSlice.reducer;