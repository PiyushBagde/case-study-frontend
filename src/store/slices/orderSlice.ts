import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { placeOrder } from "../../services/billingService";
import ApiErrorResponse from "../../types/auth";
import { Order, OrderSliceState } from "../../types/order";
import { clearCartStateLocally, fetchCartThunk } from "./cartSlice";

const initialState: OrderSliceState = {
    currentOrderId: null,
    currentOrderDetails: null,
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
  };

// --- Async Thunks ---

// Thunk to place an order
export const placeOrderThunk = createAsyncThunk<
    Order, // Return the created Order object on success
    void,  
    { rejectValue: ApiErrorResponse | string, dispatch: any, state: any }
>('order/placeOrder', async (_, { dispatch, rejectWithValue, getState }) => {

    const cartState = getState().cart as { cart: { items: any[] } | null };
    if (!cartState.cart || cartState.cart.items.length === 0) {
        console.warn("Attempted to place order with empty cart (client-side check).");
        return rejectWithValue("Cannot place order with an empty cart.");
    }
    try {
        console.log("placeOrderThunk: Calling billingService.placeOrder...");
        const createdOrder = await placeOrder(); // Call the API service function
        console.log(`placeOrderThunk: Order ${createdOrder.orderId} created successfully by backend.`);

        dispatch(clearCartStateLocally());
        console.log("placeOrderThunk: Dispatched local cart clear action.");

        try {
            await dispatch(fetchCartThunk()).unwrap(); 
            console.log("Cart refetched successfully after order placement.");
        } catch (cartError) {
            console.error("Order placed successfully, but failed to refetch cart:", cartError);
        }

        return createdOrder;

    } catch (error: any) {
        console.error("Place order error in thunk:", error);
        if (error.response && error.response.data) {
            return rejectWithValue(error.response.data as ApiErrorResponse);
        }
        return rejectWithValue(error.message || 'Failed to place order');
    }
});

// --- Order Slice Definition ---
const orderSlice = createSlice({
    name: 'order',
    initialState,
    reducers: {
        // Action to clear the currently viewed/processed order details
        clearCurrentOrder: (state) => {
            state.currentOrderId = null;
            state.currentOrderDetails = null;
            state.status = 'idle';
            state.error = null;
            console.log("Cleared current order details in slice.");
        },
    },
    extraReducers: (builder) => {
        builder
            // Place Order Lifecycle
            .addCase(placeOrderThunk.pending, (state) => {
                state.status = 'loading';
                state.error = null;
                state.currentOrderId = null;
                state.currentOrderDetails = null;
            })
            .addCase(placeOrderThunk.fulfilled, (state, action: PayloadAction<Order>) => {
                state.status = 'succeeded';
                state.currentOrderId = action.payload.orderId;
                state.currentOrderDetails = action.payload;
                state.error = null;
                console.log(`Order slice updated: Order placed successfully. Order ID: ${action.payload.orderId}`);
            })
            .addCase(placeOrderThunk.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload ?? 'Unknown error placing order';
                state.currentOrderId = null;
                state.currentOrderDetails = null;
                 console.error("Order slice updated: Order placement failed.", action.payload);
            });
        // Add cases for other thunks if they exist
    },
});

// Export actions and reducer
export const { clearCurrentOrder } = orderSlice.actions;
export default orderSlice.reducer;
