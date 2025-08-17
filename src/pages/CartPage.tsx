// src/pages/CartPage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { RootState } from '../store/store';
import { CartItem } from '../types/cart';
import { toast } from 'sonner';
import {
    fetchCartThunk,
    increaseQuantityThunk,
    decreaseQuantityThunk,
    removeItemFromCartThunk,
    clearCartContentsOnlyThunk
} from '../store/slices/cartSlice';
import { placeOrderThunk } from '../store/slices/orderSlice';
import ApiErrorResponse from '../types/auth';

// Mantine Imports
import { Table, Button, Group, Title, Text, Center, Loader, Alert, Paper, Stack } from '@mantine/core';
import { IconAlertCircle, IconShoppingCartOff, IconTrash, IconSquareRoundedPlus, IconSquareRoundedMinus } from '@tabler/icons-react';


const CartPage: React.FC = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    const { cart, status: cartStatus, error: cartError, itemStatus, itemError } = useAppSelector((state: RootState) => state.cart);
    const { status: orderStatus, error: orderError } = useAppSelector((state: RootState) => state.order);
    const { isAuthenticated } = useAppSelector((state: RootState) => state.auth);

    const [processingItemId, setProcessingItemId] = useState<number | null>(null);

    // Fetch cart effect (keep as is)
    useEffect(() => {
        const isNotFoundError = cartStatus === 'failed' && typeof cartError === 'object' && cartError && 'status' in cartError && cartError.status === 404;
        if (isAuthenticated && (cartStatus === 'idle' || (cartStatus === 'failed' && !isNotFoundError))) {
            dispatch(fetchCartThunk());
        }
    }, [isAuthenticated, cartStatus, dispatch, cartError]);

    // --- Handlers (Keep as is, toasts already implemented) ---
    const handleIncreaseQuantity = async (item: CartItem) => {
        if (itemStatus === 'loading') return;
        setProcessingItemId(item.cartItemId);
        try {
            await dispatch(increaseQuantityThunk({ prodName: item.prodName })).unwrap();
        } catch (err) { toast.error(`Failed to update ${item.prodName} quantity.`); }
        finally { setProcessingItemId(null); }
    };
    const handleDecreaseQuantity = async (item: CartItem) => {
        if (itemStatus === 'loading') return;
        setProcessingItemId(item.cartItemId);
        try {
            await dispatch(decreaseQuantityThunk({ prodName: item.prodName })).unwrap();
        } catch (err) { toast.error(`Failed to update ${item.prodName} quantity.`); }
        finally { setProcessingItemId(null); }
    };
    const handleRemoveItem = async (item: CartItem) => {
        if (itemStatus === 'loading') return;
        if (!window.confirm(`Remove ${item.prodName} from cart?`)) return;
        setProcessingItemId(item.cartItemId);
        try {
            await dispatch(removeItemFromCartThunk({ prodName: item.prodName })).unwrap();
            toast.success(`${item.prodName} removed.`);
        } catch (err) { toast.error(`Failed to remove ${item.prodName}.`); }
        finally { setProcessingItemId(null); }
    };
    const handleClearCartContents = async () => {
        if (!cart || cart.items.length === 0 || itemStatus === 'loading' || orderStatus === 'loading') return;
        if (!window.confirm('Empty your cart?')) return;
        try {
            await dispatch(clearCartContentsOnlyThunk()).unwrap();
            toast.success("Cart cleared!");
        } catch (err) { toast.error("Failed to clear cart."); }
    };
    const handlePlaceOrder = async () => {
        if (!cart || cart.items.length === 0 || orderStatus === 'loading' || itemStatus === 'loading') {
             if (!cart || cart.items.length === 0) toast.warning("Cart is empty."); return;
        }
        try {
            const resultAction = await dispatch(placeOrderThunk()).unwrap();
            toast.success(`Order #${resultAction.orderId} placed! Redirecting...`);
            navigate(`/payment/${resultAction.orderId}`);
        } catch (err) {
             let errorMsg = "Failed to place order.";
             if(typeof err === 'string') errorMsg = err;
             else if (err && typeof err === 'object' && 'message' in err) errorMsg = (err as any).message;
            toast.error(errorMsg);
        }
    };

    // --- Render Logic ---
    if (cartStatus === 'loading') {
        return <Center style={{ height: '300px' }}><Loader color="blue" size="xl" /></Center>;
    }

    const isNotFoundErrorOnLoad = cartStatus === 'failed' && typeof cartError === 'object' && cartError && 'status'in cartError && cartError.status === 404;
    if (cartStatus === 'failed' && !isNotFoundErrorOnLoad) {
        let errorMessage = "Failed to load cart.";
        if (typeof cartError === 'string') errorMessage = cartError;
        else if (cartError && typeof cartError === 'object' && 'message' in cartError) errorMessage = (cartError as any).message;
        return <Alert icon={<IconAlertCircle size="1rem" />} title="Error!" color="red" radius="md" mt="lg">{errorMessage}</Alert>;
    }

    if (!cart || cart.items.length === 0) {
        return (
            <Center style={{ flexDirection: 'column', height: '300px' }}>
                <IconShoppingCartOff size={48} stroke={1.5} color="gray" />
                <Title order={3} mt="md" c="dimmed">Your Shopping Cart is Empty</Title>
                <Text c="dimmed" size="sm" mt="xs">Looks like you haven't added anything yet.</Text>
                <Button component={Link} to="/products" mt="xl" variant="outline">
                    Start Shopping
                </Button>
            </Center>
        );
    }

    // Table Rows
    const rows = cart.items.map((item: CartItem) => {
        const isProcessingThisItem = itemStatus === 'loading' && processingItemId === item.cartItemId;
        return (
            <Table.Tr key={item.cartItemId} style={{ opacity: isProcessingThisItem ? 0.6 : 1 }}>
                <Table.Td>
                    <Text fw={500}>{item.prodName}</Text>
                    <Text size="xs" c="dimmed">ID: {item.prodId}</Text>
                </Table.Td>
                <Table.Td style={{ textAlign: 'right' }}>₹{item.price.toFixed(2)}</Table.Td>
                <Table.Td style={{ textAlign: 'center' }}>
                    <Group gap="xs" justify="center">
                        <Button
                            variant="outline" size="xs" px={5}
                            onClick={() => handleDecreaseQuantity(item)}
                            disabled={isProcessingThisItem || item.quantity <= 1}
                            loading={isProcessingThisItem && processingItemId === item.cartItemId}
                        >
                            <IconSquareRoundedMinus size={16} />
                        </Button>
                        <Text w={30} ta="center">{item.quantity}</Text> {/* w is width, ta is text-align */}
                        <Button
                            variant="outline" size="xs" px={5}
                            onClick={() => handleIncreaseQuantity(item)}
                            disabled={isProcessingThisItem}
                            loading={isProcessingThisItem && processingItemId === item.cartItemId}
                        >
                            <IconSquareRoundedPlus size={16} />
                        </Button>
                    </Group>
                </Table.Td>
                <Table.Td style={{ textAlign: 'right' }}>₹{item.totalPrice.toFixed(2)}</Table.Td>
                <Table.Td style={{ textAlign: 'center' }}>
                    <Button
                        variant="subtle" color="red" size="xs"
                        onClick={() => handleRemoveItem(item)}
                        disabled={isProcessingThisItem}
                        loading={isProcessingThisItem && processingItemId === item.cartItemId}
                        leftSection={<IconTrash size={14} />}
                    >
                        Remove
                    </Button>
                </Table.Td>
            </Table.Tr>
        );
    });

    return (
        // Use Mantine Paper for a contained look
        <Paper shadow="xs" p="xl" radius="md" withBorder>
            <Title order={2} mb="lg">Your Shopping Cart</Title>

            {itemStatus === 'loading' && !processingItemId && <Loader mb="sm" /> /* General item loading indicator */}

            <Table verticalSpacing="sm" striped highlightOnHover withTableBorder withColumnBorders>
                <Table.Thead>
                    <Table.Tr>
                        <Table.Th>Product</Table.Th>
                        <Table.Th style={{ textAlign: 'right' }}>Price</Table.Th>
                        <Table.Th style={{ textAlign: 'center' }}>Quantity</Table.Th>
                        <Table.Th style={{ textAlign: 'right' }}>Total</Table.Th>
                        <Table.Th style={{ textAlign: 'center' }}>Actions</Table.Th>
                    </Table.Tr>
                </Table.Thead>
                <Table.Tbody>{rows}</Table.Tbody>
                <Table.Tfoot>
                    <Table.Tr>
                        <Table.Td colSpan={3} style={{ textAlign: 'right', fontWeight: 'bold' }}><Text fw={700} size="lg">Grand Total:</Text></Table.Td>
                        <Table.Td style={{ textAlign: 'right', fontWeight: 'bold' }}><Text fw={700} size="lg">₹{cart.cartTotalPrice.toFixed(2)}</Text></Table.Td>
                        <Table.Td></Table.Td>
                    </Table.Tr>
                </Table.Tfoot>
            </Table>

            <Group justify="flex-end" mt="xl" gap="md">
                <Button
                    variant="outline" color="orange"
                    onClick={handleClearCartContents}
                    disabled={!cart || cart.items.length === 0 || itemStatus === 'loading' || orderStatus === 'loading'}
                    loading={itemStatus === 'loading' && !processingItemId} // Show loading if a general clear is happening
                    leftSection={<IconShoppingCartOff size={18} />}
                >
                    Clear Cart
                </Button>
                <Button
                    color="green" size="md"
                    onClick={handlePlaceOrder}
                    disabled={!cart || cart.items.length === 0 || orderStatus === 'loading' || itemStatus === 'loading'}
                    loading={orderStatus === 'loading'}
                >
                    Proceed to Checkout
                </Button>
            </Group>
            {orderStatus === 'failed' && orderError && (
                 <Alert icon={<IconAlertCircle size="1rem" />} title="Order Error!" color="red" radius="md" mt="md">
                     {typeof orderError === 'string' ? orderError : (orderError as ApiErrorResponse)?.message || 'Failed to place order.'}
                 </Alert>
             )}
        </Paper>
    );
};

export default CartPage;