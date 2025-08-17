// src/pages/OrderDetailPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getMyOrderDetails, getAnyOrderByOrderId } from '../services/billingService'; // Using both for role-based fetching
import { Order, OrderItem } from '../types/order';
// import { ApiErrorResponse } from '../types/auth';
import { Role } from '../types/enums';
import { useAppSelector } from '../store/hooks';
import { RootState } from '../store/store';

// Mantine Imports
import {
    Container, Paper, Title, Text, Table, Button, Group, Divider, Stack, Center, Loader, Alert, Grid, ThemeIcon
} from '@mantine/core';
import { IconAlertCircle, IconReceipt, IconCalendarEvent, IconUser, IconHash, IconShoppingCart, IconArrowLeft } from '@tabler/icons-react';

const OrderDetailPage: React.FC = () => {
    const { orderId } = useParams<{ orderId: string }>();
    const navigate = useNavigate();

    const currentUserRole = useAppSelector((state: RootState) => state.auth.user?.role);
    const isAuthenticated = useAppSelector((state: RootState) => state.auth.isAuthenticated);

    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchOrderData = useCallback(async (idToFetch: number) => {
        setLoading(true); setError(null);
        try {
            let orderData: Order;
            if (currentUserRole === Role.CUSTOMER) {
                orderData = await getMyOrderDetails(idToFetch);
            } else if (currentUserRole === Role.BILLER || currentUserRole === Role.ADMIN) {
                orderData = await getAnyOrderByOrderId(idToFetch);
            } else {
                throw new Error("User role not sufficient to view order details.");
            }
            setOrder(orderData);
        } catch (err: any) {
            let errorMsg = 'Failed to load order details.';
            if (err.response?.status === 404) errorMsg = `Order with ID ${idToFetch} not found or not accessible.`;
            else if (err.response?.status === 403) errorMsg = "You are not authorized to view this order.";
            else if (err.response?.data?.message) errorMsg = err.response.data.message;
            else if (err.message) errorMsg = err.message;
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    }, [currentUserRole]); // Depend on role to choose the correct fetch function

    useEffect(() => {
        if (orderId && isAuthenticated) {
            const numericOrderId = parseInt(orderId, 10);
            if (isNaN(numericOrderId)) {
                setError("Invalid Order ID format in URL."); setLoading(false); return;
            }
            fetchOrderData(numericOrderId);
        } else if (!orderId) {
            setError("Order ID not found in URL."); setLoading(false);
        } else if (!isAuthenticated) {
            setError("User not authenticated. Please login."); setLoading(false);
        }
    }, [orderId, isAuthenticated, fetchOrderData]);


    // --- Render Logic ---
    if (loading) return <Center style={{ height: '300px' }}><Loader /><div>Loading Order Details...</div></Center>;
    if (error) return <Container size="sm" mt="xl"><Alert icon={<IconAlertCircle size="1rem"/>} title="Error!" color="red">{error}</Alert></Container>;
    if (!order) return <Container size="sm" mt="xl"><Alert icon={<IconAlertCircle size="1rem"/>} title="Not Found" color="orange">Order details could not be loaded.</Alert></Container>;

    const orderItemsRows = order.orderItems.map((item: OrderItem) => (
        <Table.Tr key={item.orderItemId}>
            <Table.Td>
                <Text>{item.prodName}</Text>
                <Text size="xs" c="dimmed">Product ID: {item.prodId}</Text>
            </Table.Td>
            <Table.Td style={{ textAlign: 'center' }}>{item.quantity}</Table.Td>
            <Table.Td style={{ textAlign: 'right' }}>₹{item.price.toFixed(2)}</Table.Td>
            <Table.Td style={{ textAlign: 'right' }}>₹{item.totalPrice.toFixed(2)}</Table.Td>
        </Table.Tr>
    ));

    return (
        <Container size="lg" my="xl">
            <Paper shadow="sm" p="xl" radius="md" withBorder>
                <Stack gap="lg">
                    <Group justify="space-between" align="center">
                        <Title order={2}>Order Details</Title>
                        <Button
                            variant="outline"
                            onClick={() => navigate(currentUserRole === Role.CUSTOMER ? "/my-orders" : "/admin/orders")} // Example: Admin might go to a different list
                            leftSection={<IconArrowLeft size={16} />}
                        >
                            Back to Orders
                        </Button>
                    </Group>

                    <Paper p="md" withBorder radius="sm" bg="var(--mantine-color-gray-0)"> {/* bg for background color */}
                        <Grid gutter="md">
                            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                                <Group gap="xs" wrap="nowrap">
                                    <ThemeIcon size="lg" variant="light"><IconHash size="1.2rem" /></ThemeIcon>
                                    <div>
                                        <Text size="xs" c="dimmed">Order ID</Text>
                                        <Text fw={500}>{order.orderId}</Text>
                                    </div>
                                </Group>
                            </Grid.Col>
                            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                                 <Group gap="xs" wrap="nowrap">
                                    <ThemeIcon size="lg" variant="light"><IconCalendarEvent size="1.2rem" /></ThemeIcon>
                                    <div>
                                        <Text size="xs" c="dimmed">Date Placed</Text>
                                        <Text fw={500}>{new Date(order.orderDate).toLocaleString()}</Text>
                                    </div>
                                </Group>
                            </Grid.Col>
                            {(currentUserRole === Role.ADMIN || currentUserRole === Role.BILLER) && (
                                <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                                    <Group gap="xs" wrap="nowrap">
                                        <ThemeIcon size="lg" variant="light"><IconUser size="1.2rem" /></ThemeIcon>
                                        <div>
                                            <Text size="xs" c="dimmed">Customer ID</Text>
                                            <Text fw={500}>{order.userId}</Text>
                                        </div>
                                    </Group>
                                </Grid.Col>
                            )}
                            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                                 <Group gap="xs" wrap="nowrap">
                                    <ThemeIcon size="lg" variant="light" color="green"><IconReceipt size="1.2rem" /></ThemeIcon>
                                    <div>
                                        <Text size="xs" c="dimmed">Total Amount</Text>
                                        <Text fw={700} size="lg">₹{order.totalBillPrice.toFixed(2)}</Text>
                                    </div>
                                </Group>
                            </Grid.Col>
                        </Grid>
                    </Paper>

                    <Title order={4} mt="md">Items in this Order:</Title>
                    <Table striped withTableBorder withColumnBorders verticalSpacing="sm">
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

                </Stack>
            </Paper>
        </Container>
    );
};

export default OrderDetailPage;