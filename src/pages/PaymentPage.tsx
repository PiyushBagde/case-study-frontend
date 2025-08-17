// src/pages/PaymentPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { RootState } from '../store/store';
import { getAnyOrderByOrderId, getMyOrderDetails } from '../services/billingService'; // Use the Biller/Admin accessible endpoint
import { fetchCartThunk as refreshCartAfterPayment } from '../store/slices/cartSlice';
import {
    payByCardThunk,
    payByUpiThunk,
    payByCashThunk,
    clearPaymentStatus
} from '../store/slices/paymentSlice';
import { Order } from '../types/order';
import { PaymentMode, Role } from '../types/enums';
import { toast } from 'sonner'; // For notifications

// Mantine Imports
import {
    Container, Paper, Title, Text, Radio, Group, Stack, TextInput, Button, Alert, Loader, Center, Divider
} from '@mantine/core';
import { IconAlertCircle, IconCreditCard, IconBrandCashapp, IconCash } from '@tabler/icons-react'; // Example icons
import ApiErrorResponse from '../types/auth';

const PaymentPage: React.FC = () => {
    const { orderId } = useParams<{ orderId: string }>();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const currentUserRole = useAppSelector((state: RootState) => state.auth.user?.role); // For conditional fetching if needed
    const isAuthenticated = useAppSelector((state: RootState) => state.auth.isAuthenticated);
    
    const [orderDetails, setOrderDetails] = useState<Order | null>(null);
    const [orderLoading, setOrderLoading] = useState<boolean>(true);
    const [orderError, setOrderError] = useState<string | null>(null);

    // Payment form state
    const [selectedMode, setSelectedMode] = useState<PaymentMode | null>(null);
    const [cardNumber, setCardNumber] = useState('');
    const [cardHolderName, setCardHolderName] = useState('');
    const [upiId, setUpiId] = useState('');

    const { status: paymentStatus, error: paymentError, lastTransaction } = useAppSelector((state: RootState) => state.payment);

    // Fetch order details effect
    useEffect(() => {
        if (orderId && isAuthenticated) { // Ensure user is authenticated before trying to fetch role-specific data
            const numericOrderId = parseInt(orderId, 10);
            if (isNaN(numericOrderId)) {
                setOrderError("Invalid Order ID."); setOrderLoading(false); return;
            }

            const fetchDetails = async () => {
                setOrderLoading(true); setOrderError(null); dispatch(clearPaymentStatus());
                try {
                    console.log(`PaymentPage: Fetching details for order ${numericOrderId}. User role: ${currentUserRole}`);
                    let orderData: Order;

                    // *** CONDITIONAL API CALL based on role ***
                    if (currentUserRole === Role.CUSTOMER) {
                         console.log("Fetching as CUSTOMER using getMyOrderById");
                         orderData = await getMyOrderDetails(numericOrderId);
                    } else if (currentUserRole === Role.BILLER || currentUserRole === Role.ADMIN) {
                         console.log(`Fetching as ${currentUserRole} using getAnyOrderByOrderId`);
                         orderData = await getAnyOrderByOrderId(numericOrderId);
                    } else {
                        // This case should be rare if routes are protected, but handle defensively
                        console.error("PaymentPage: Unknown or missing user role. Cannot fetch order details.");
                        throw new Error("User role not identified. Unable to fetch order details.");
                    }
                    setOrderDetails(orderData);
                } catch (err: any) {
                    console.error("Error fetching order details for payment:", err);
                    let errorMsg = 'Failed to load order details for payment.';
                    if (err.response?.status === 404) errorMsg = `Order with ID ${numericOrderId} not found or not accessible.`;
                    else if (err.response?.status === 403) errorMsg = "You are not authorized to view this order's details.";
                    else if (err.response?.data?.message) errorMsg = err.response.data.message;
                    else if (err.message) errorMsg = err.message;
                    setError(errorMsg);
                } finally {
                    setOrderLoading(false);
                }
            };
            fetchDetails();
        } else if (!orderId) {
             setOrderError("Order ID is missing."); setOrderLoading(false);
        } else if (!isAuthenticated) {
            setOrderError("User not authenticated. Please login."); setOrderLoading(false);
            // Optionally navigate to login
            // navigate('/login');
        }

        return () => { dispatch(clearPaymentStatus()); };
    }, [orderId, dispatch, currentUserRole, isAuthenticated]); // *** Add currentUserRole & isAuthenticated to dependency array ***

    
    // Navigate on successful payment effect
    useEffect(() => {
         if (paymentStatus === 'succeeded' && lastTransaction) {
             toast.success(`Payment successful! Transaction ID: ${lastTransaction.transactionId}. Status: ${lastTransaction.paymentStatus}`);
             console.log("Payment successful, dispatching cart refetch...");
             dispatch(refreshCartAfterPayment());
             navigate(`/order-confirmation/${lastTransaction.orderId}`);
         }
    }, [paymentStatus, lastTransaction, navigate, dispatch]);


    const handlePaymentSubmit = (e: React.FormEvent<HTMLFormElement>) => {
         e.preventDefault();
         if (!selectedMode || !orderDetails || !orderId || paymentStatus === 'loading') return;
         const numericOrderId = parseInt(orderId, 10);
         const receivedAmount = orderDetails.totalBillPrice;

         let formIsValid = true;
         if (selectedMode === PaymentMode.CARD) {
             if (!cardNumber.trim() || !cardHolderName.trim() || !/^\d{13,19}$/.test(cardNumber.replace(/\s+/g, ''))) {
                 toast.error("Please enter valid card number and holder name."); formIsValid = false;
             }
         } else if (selectedMode === PaymentMode.UPI) {
             if (!upiId.trim() || !/^[\w.-]+@[\w.-]+$/.test(upiId)) {
                 toast.error("Please enter a valid UPI ID."); formIsValid = false;
             }
         }
         if (!formIsValid) return;

         switch (selectedMode) {
             case PaymentMode.CARD:
                 dispatch(payByCardThunk({ orderId: numericOrderId, receivedAmount, cardNumber, cardHolderName }));
                 break;
             case PaymentMode.UPI:
                 dispatch(payByUpiThunk({ orderId: numericOrderId, receivedAmount, upiId }));
                 break;
             case PaymentMode.CASH:
                 dispatch(payByCashThunk({ orderId: numericOrderId, receivedAmount }));
                 break;
         }
    };

    // --- Render Logic ---
    if (!isAuthenticated && !orderLoading) { // If not authenticated and not already loading for an order
        return (
            <Container size="sm" my="xl">
                <Paper withBorder shadow="md" p="xl" radius="md">
                    <Title order={3} ta="center">Authentication Required</Title>
                    <Text ta="center" mt="md">Please <Link to="/login">login</Link> to proceed with payment.</Text>
                </Paper>
            </Container>
        );
    }
    if (orderLoading) return <Center style={{ height: '300px' }}><Loader color="blue" size="xl" /><div>Loading order details...</div></Center>;
    if (orderError) return <Alert icon={<IconAlertCircle size="1rem" />} title="Error!" color="red" radius="md" mt="lg">{orderError}</Alert>;
    if (!orderDetails) return <Alert icon={<IconAlertCircle size="1rem" />} title="Order Not Found" color="orange" radius="md" mt="lg">Order details could not be loaded.</Alert>;

    
    return (
        <Container size="sm" my="xl"> {/* my for vertical margin */}
            <Paper withBorder shadow="md" p="xl" radius="md"> {/* p for padding */}
                <Title order={2} ta="center" mb="lg">
                    Complete Payment
                </Title>
                <Text ta="center" mb="xs">Order ID: #{orderDetails.orderId}</Text>
                <Text ta="center" size="xl" fw={700} mb="xl"> {/* fw for font-weight */}
                    Amount Due: ₹{orderDetails.totalBillPrice.toFixed(2)}
                </Text>

                <Divider my="lg" label="Select Payment Method" labelPosition="center" />

                <form onSubmit={handlePaymentSubmit}>
                    <Radio.Group
                        value={selectedMode}
                        onChange={(value) => setSelectedMode(value as PaymentMode)} // Cast value to PaymentMode
                        name="paymentMode"
                        withAsterisk
                        mb="md"
                    >
                        <Group mt="xs">
                            <Radio value={PaymentMode.CARD} label="Card" icon={IconCreditCard} />
                            <Radio value={PaymentMode.UPI} label="UPI" icon={IconBrandCashapp} />
                            <Radio value={PaymentMode.CASH} label="Cash" icon={IconCash} />
                        </Group>
                    </Radio.Group>

                    {/* Conditional Forms */}
                    {selectedMode === PaymentMode.CARD && (
                        <Stack mt="md" gap="sm">
                            <TextInput
                                label="Card Number"
                                placeholder="Enter Card Number"
                                value={cardNumber}
                                onChange={e => setCardNumber(e.currentTarget.value)}
                                required={selectedMode === PaymentMode.CARD}
                            />
                            <TextInput
                                label="Card Holder Name"
                                placeholder="Name on Card"
                                value={cardHolderName}
                                onChange={e => setCardHolderName(e.currentTarget.value)}
                                required={selectedMode === PaymentMode.CARD}
                            />
                        </Stack>
                    )}

                    {selectedMode === PaymentMode.UPI && (
                         <Stack mt="md" gap="sm">
                            <TextInput
                                label="UPI ID"
                                placeholder="yourname@bank"
                                value={upiId}
                                onChange={e => setUpiId(e.currentTarget.value)}
                                required={selectedMode === PaymentMode.UPI}
                            />
                        </Stack>
                    )}

                     {selectedMode === PaymentMode.CASH && (
                         <Text mt="md" size="sm" c="dimmed">
                             Payment will be collected upon delivery/pickup (simulated as successful here).
                         </Text>
                    )}

                    <Group justify="flex-end" mt="xl">
                        <Button
                            type="submit"
                            disabled={!selectedMode || paymentStatus === 'loading'}
                            loading={paymentStatus === 'loading'}
                            size="md"
                            color={selectedMode === PaymentMode.CASH ? "orange" : "blue"} // Example: different button color for cash
                        >
                            {paymentStatus === 'loading' ? 'Processing...' : `Pay ₹${orderDetails.totalBillPrice.toFixed(2)}`}
                        </Button>
                    </Group>

                    {paymentStatus === 'failed' && paymentError && (
                        <Alert icon={<IconAlertCircle size="1rem" />} title="Payment Failed!" color="red" radius="md" mt="md" withCloseButton onClose={() => dispatch(clearPaymentStatus())}>
                           {typeof paymentError === 'string' ? paymentError : (paymentError as ApiErrorResponse)?.message || 'An unknown error occurred.'}
                            {typeof paymentError === 'object' && (paymentError as ApiErrorResponse)?.errors && (
                                <Stack gap="xs" mt="xs">
                                    {Object.entries((paymentError as ApiErrorResponse).errors!).map(([field, msg]) => <Text size="xs" key={field}>{field}: {msg}</Text>)}
                                </Stack>
                            )}
                        </Alert>
                    )}
                </form>
            </Paper>
        </Container>
    );
};

export default PaymentPage;

function setError(errorMsg: string) {
    throw new Error('Function not implemented.');
}


