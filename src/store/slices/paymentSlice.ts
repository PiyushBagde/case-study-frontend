import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { PayByCardPayload, PayByCashPayload, PayByUpiPayload, PaymentSliceState, Transaction } from "../../types/payment";
import ApiErrorResponse from "../../types/auth";
import { payByCard, payByCash, payByUpi } from "../../services/paymentService";

const initialState: PaymentSliceState = {
    lastTransaction: null,
    status: 'idle',
    error: null,
};

// --- Async Thunks ---
export const payByCardThunk = createAsyncThunk<
    Transaction, PayByCardPayload, { rejectValue: ApiErrorResponse | string }
>('payment/payByCard', async (payload, { rejectWithValue }) => {
    try {
        const transaction = await payByCard(payload);
        return transaction;
    } catch (error: any) {
        console.error("Pay by card error:", error);
        if (error.response && error.response.data) return rejectWithValue(error.response.data);
        return rejectWithValue(error.message || 'Card payment failed');
    }
});

export const payByUpiThunk = createAsyncThunk<
    Transaction, PayByUpiPayload, { rejectValue: ApiErrorResponse | string }
>('payment/payByUpi', async (payload, { rejectWithValue }) => {
     try {
         const transaction = await payByUpi(payload);
         return transaction;
     } catch (error: any) {
         console.error("Pay by UPI error:", error);
         if (error.response && error.response.data) return rejectWithValue(error.response.data);
         return rejectWithValue(error.message || 'UPI payment failed');
     }
});

export const payByCashThunk = createAsyncThunk<
    Transaction, PayByCashPayload, { rejectValue: ApiErrorResponse | string }
>('payment/payByCash', async (payload, { rejectWithValue }) => {
     try {
         const transaction = await payByCash(payload);
         return transaction;
     } catch (error: any) {
         console.error("Pay by cash error:", error);
         if (error.response && error.response.data) return rejectWithValue(error.response.data);
         return rejectWithValue(error.message || 'Cash payment failed');
     }
});

// --- Payment Slice ---
const paymentSlice = createSlice({
    name: 'payment',
    initialState,
    reducers: {
        clearPaymentStatus: (state) => {
            state.lastTransaction = null;
            state.status = 'idle';
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        const handlePending = (state: PaymentSliceState) => {
            state.status = 'loading';
            state.error = null;
            state.lastTransaction = null;
        };
        const handleFulfilled = (state: PaymentSliceState, action: PayloadAction<Transaction>) => {
            state.status = 'succeeded';
            state.lastTransaction = action.payload; // Store completed transaction details
            state.error = null;
        };
        const handleRejected = (state: PaymentSliceState, action: PayloadAction<any>) => {
            state.status = 'failed';
            state.error = action.payload ?? 'Unknown payment error';
            state.lastTransaction = null;
        };

        // Add cases for each payment thunk
        builder.addCase(payByCardThunk.pending, handlePending);
        builder.addCase(payByCardThunk.fulfilled, handleFulfilled);
        builder.addCase(payByCardThunk.rejected, handleRejected);

        builder.addCase(payByUpiThunk.pending, handlePending);
        builder.addCase(payByUpiThunk.fulfilled, handleFulfilled);
        builder.addCase(payByUpiThunk.rejected, handleRejected);

        builder.addCase(payByCashThunk.pending, handlePending);
        builder.addCase(payByCashThunk.fulfilled, handleFulfilled);
        builder.addCase(payByCashThunk.rejected, handleRejected);
    }
});

export const { clearPaymentStatus } = paymentSlice.actions;
export default paymentSlice.reducer;






