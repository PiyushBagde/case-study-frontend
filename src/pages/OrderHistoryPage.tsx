// src/pages/OrderHistoryPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getMyOrders } from '../services/billingService'; // API function
import { Order } from '../types/order';
// import { ApiErrorResponse } from '../types/auth';

// Mantine Imports
import {
    Container, Title, Text, Table, Button, Group, Center, Loader, Alert, Paper, Anchor
} from '@mantine/core';
import { IconAlertCircle, IconListDetails, IconShoppingCartPlus } from '@tabler/icons-react';

const OrderHistoryPage: React.FC = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchOrderHistory = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const data = await getMyOrders();
            setOrders(data);
        } catch (err: any) {
            let errorMsg = 'Failed to fetch your order history.';
            if (err.response?.status === 404 && err.response?.data?.message?.toLowerCase().includes("no orders found")) {
                setOrders([]); setError(null); // No error, just no orders
            } else if (err.response?.data?.message) {
                errorMsg = err.response.data.message;
                setError(errorMsg); setOrders([]);
            } else if (err.message) {
                errorMsg = err.message;
                setError(errorMsg); setOrders([]);
            } else {
                setError(errorMsg); setOrders([]);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOrderHistory();
    }, [fetchOrderHistory]);

    // --- Render Logic ---
    if (loading) return <Center style={{ height: '300px' }}><Loader /><div>Loading Your Orders...</div></Center>;
    if (error) return <Container size="md" mt="xl"><Alert icon={<IconAlertCircle size="1rem"/>} title="Error!" color="red">{error}</Alert></Container>;

    const rows = orders.map((order) => (
        <Table.Tr key={order.orderId}>
            <Table.Td>{order.orderId}</Table.Td>
            <Table.Td>{new Date(order.orderDate).toLocaleDateString()}</Table.Td> {/* Just Date */}
            <Table.Td style={{ textAlign: 'center' }}>{order.orderItems?.length || 0}</Table.Td>
            <Table.Td style={{ textAlign: 'right' }}>₹{order.totalBillPrice.toFixed(2)}</Table.Td>
            <Table.Td style={{ textAlign: 'center' }}>
                {/* Use Mantine Button as a Link */}
                <Button
                    component={Link}
                    to={`/order-details/${order.orderId}`}
                    variant="subtle" // Or "light" or "outline"
                    size="xs"
                    leftSection={<IconListDetails size={14} />}
                >
                    View Details
                </Button>
            </Table.Td>
        </Table.Tr>
    ));

    return (
        <Container size="lg" my="xl"> {/* Larger container for tables */}
            <Paper shadow="sm" p="lg" radius="md" withBorder>
                <Title order={2} ta="center" mb="xl">
                    My Order History
                </Title>

                {orders.length === 0 ? (
                    <Center style={{ flexDirection: 'column', padding: '2rem' }}>
                        <IconShoppingCartPlus size={48} stroke={1.5} color="var(--mantine-color-gray-5)" />
                        <Text mt="md" c="dimmed">You haven't placed any orders yet.</Text>
                        <Button component={Link} to="/products" mt="lg" variant="outline">
                            Start Shopping
                        </Button>
                    </Center>
                ) : (
                    <Table striped highlightOnHover withTableBorder withColumnBorders verticalSpacing="sm">
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Order ID</Table.Th>
                                <Table.Th>Date Placed</Table.Th>
                                <Table.Th style={{ textAlign: 'center' }}>Items</Table.Th>
                                <Table.Th style={{ textAlign: 'right' }}>Total Amount</Table.Th>
                                <Table.Th style={{ textAlign: 'center' }}>Actions</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>{rows}</Table.Tbody>
                    </Table>
                )}
            </Paper>
        </Container>
    );
};

export default OrderHistoryPage;