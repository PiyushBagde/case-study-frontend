// src/pages/OrderConfirmationPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom'; // Import useNavigate
import { getAnyOrderByOrderId, getMyOrderDetails } from '../services/billingService'; // Use the general fetch
import { Order, OrderItem } from '../types/order';
// import ApiErrorResponse from '../types/auth';
import { Role } from '../types/enums';
import { useAppSelector } from '../store/hooks';
import { RootState } from '../store/store';
// import { useAppDispatch } from '../store/hooks'; // If clearing payment state
// import { clearPaymentStatus } from '../store/slices/paymentSlice'; // If clearing payment state

// Mantine Imports
import {
    Container, Paper, Title, Text, List, Button, Group, Divider, Stack, Center, Loader, Alert, Table
} from '@mantine/core';
import { IconCircleCheck, IconAlertCircle, IconShoppingCart, IconReceipt, IconArrowLeft } from '@tabler/icons-react';

const OrderConfirmationPage: React.FC = () => {
    const { orderId } = useParams<{ orderId: string }>();
    const navigate = useNavigate();
    // const dispatch = useAppDispatch(); // Uncomment if using clearPaymentStatus

    const currentUserRole = useAppSelector((state: RootState) => state.auth.user?.role);
    const isAuthenticated = useAppSelector((state: RootState) => state.auth.isAuthenticated);
    
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Optional: dispatch(clearPaymentStatus()); // Clear payment status from previous page

        if (orderId && isAuthenticated) { // Check for authentication
            const numericOrderId = parseInt(orderId, 10);
            if (isNaN(numericOrderId)) {
                setError("Invalid Order ID."); setLoading(false); return;
            }

            const fetchConfirmationDetails = async () => {
                setLoading(true); setError(null);
                try {
                    console.log(`OrderConfirmationPage: Fetching details for order ${numericOrderId}. User role: ${currentUserRole}`);
                    let orderData: Order;

                    // *** CONDITIONAL API CALL based on role ***
                    if (currentUserRole === Role.CUSTOMER) {
                         console.log("Fetching as CUSTOMER using getMyOrderById");
                         orderData = await getMyOrderDetails(numericOrderId); // Customer's own order
                    } else if (currentUserRole === Role.BILLER || currentUserRole === Role.ADMIN) {
                         console.log(`Fetching as ${currentUserRole} using getAnyOrderByOrderId`);
                         orderData = await getAnyOrderByOrderId(numericOrderId); // Biller/Admin viewing any order
                    } else {
                        console.error("OrderConfirmationPage: Unknown or missing user role. Cannot fetch order details.");
                        throw new Error("User role not identified. Unable to fetch order details.");
                    }
                    setOrder(orderData);

                } catch (err: any) {
                    console.error(`Error fetching order confirmation details for ID ${numericOrderId}:`, err);
                    let errorMsg = 'Failed to load order confirmation.';
                    if (err.response?.status === 404) errorMsg = `Order with ID ${numericOrderId} not found or not accessible by your role.`;
                    else if (err.response?.status === 403) errorMsg = "You are not authorized to view this order.";
                    else if (err.response?.data?.message) errorMsg = err.response.data.message;
                    else if (err.message) errorMsg = err.message;
                    setError(errorMsg);
                } finally {
                    setLoading(false);
                }
            };
            fetchConfirmationDetails();
        } else if (!orderId) {
            setError("Order ID not found in URL."); setLoading(false);
        } else if (!isAuthenticated) {
            setError("User not authenticated. Please login."); setLoading(false);
            // navigate('/login'); // Optionally redirect
        }
    }, [orderId, currentUserRole, isAuthenticated /*, dispatch */]); // Add dependencies


    // --- Render Logic ---
    if (loading) return <Center style={{ height: '300px' }}><Loader /><div>Loading Confirmation...</div></Center>;
    if (error) return <Container size="sm" mt="xl"><Alert icon={<IconAlertCircle size="1rem"/>} title="Error!" color="red">{error}</Alert></Container>;
    if (!order) return <Container size="sm" mt="xl"><Alert icon={<IconAlertCircle size="1rem"/>} title="Not Found" color="orange">Order details could not be loaded.</Alert></Container>;

    const isBillerFlow = currentUserRole === Role.BILLER || currentUserRole === Role.ADMIN;

    const orderItemsRows = order.orderItems.map((item: OrderItem) => (
        <Table.Tr key={item.orderItemId}>
            <Table.Td>{item.prodName} (ID: {item.prodId})</Table.Td>
            <Table.Td style={{ textAlign: 'center' }}>{item.quantity}</Table.Td>
            <Table.Td style={{ textAlign: 'right' }}>₹{item.price.toFixed(2)}</Table.Td>
            <Table.Td style={{ textAlign: 'right' }}>₹{item.totalPrice.toFixed(2)}</Table.Td>
        </Table.Tr>
    ));

    return (
        <Container size="md" my="xl">
            <Paper shadow="sm" p="xl" radius="md" withBorder>
                <Stack align="center" gap="md">
                    <IconCircleCheck size={60} stroke={1.5} color="var(--mantine-color-green-6)" />
                    <Title order={isBillerFlow ? 3 : 2} ta="center">
                        {isBillerFlow ? `Order Placed for Customer (User ID: ${order.userId})` : 'Your Order is Confirmed!'}
                    </Title>
                    <Text c="dimmed" ta="center">
                        {isBillerFlow
                            ? `Order ID #${order.orderId} has been successfully processed.`
                            : 'Thank you for your purchase. We have received your order.'
                        }
                    </Text>
                </Stack>

                <Divider my="lg" label="Order Summary" labelPosition="center" />

                <Group justify="space-between" mb="xs">
                    <Text fw={500}>Order ID:</Text>
                    <Text>{order.orderId}</Text>
                </Group>
                <Group justify="space-between" mb="lg">
                    <Text fw={500}>Placed On:</Text>
                    <Text>{new Date(order.orderDate).toLocaleString()}</Text>
                </Group>

                <Title order={4} mb="sm">Items Ordered:</Title>
                <Table striped withTableBorder withColumnBorders verticalSpacing="xs">
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Product</Table.Th>
                            <Table.Th style={{ textAlign: 'center' }}>Quantity</Table.Th>
                            <Table.Th style={{ textAlign: 'right' }}>Price/Unit</Table.Th>
                            <Table.Th style={{ textAlign: 'right' }}>Item Total</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>{orderItemsRows}</Table.Tbody>
                </Table>
                <Group justify="flex-end" mt="md">
                    <Text size="lg" fw={700}>Grand Total:</Text>
                    <Text size="lg" fw={700}>₹{order.totalBillPrice.toFixed(2)}</Text>
                </Group>

                <Divider my="xl" />

                <Group justify="center" mt="lg">
                    {isBillerFlow ? (
                        <Button
                            onClick={() => navigate('/biller/dashboard')}
                            variant="outline"
                            leftSection={<IconArrowLeft size={18} />}
                        >
                            Back to Biller Tools
                        </Button>
                    ) : (
                        <>
                            <Button component={Link} to="/my-orders" variant="outline" leftSection={<IconReceipt size={18} />}>
                                View Order History
                            </Button>
                            <Button component={Link} to="/products" leftSection={<IconShoppingCart size={18} />}>
                                Continue Shopping
                            </Button>
                        </>
                    )}
                </Group>
            </Paper>
        </Container>
    );
};

export default OrderConfirmationPage;