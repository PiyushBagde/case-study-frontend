// src/pages/biller/BillerViewCartPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { CartStateData, CartItem } from '../../types/cart';
import { Product } from '../../types/inventory';
//import { ApiErrorResponse } from '../../types/auth'; // If using for detailed error display
import {
    getCartForUser,
    billerClearUserCartContents,
    billerAddItemToCart,
    billerIncreaseQuantity,
    billerDecreaseQuantity,
    billerRemoveItemFromCart
} from '../../services/cartService';
import { placeBillerOrder } from '../../services/billingService';
import { getProductByName } from '../../services/inventoryService'; // Corrected import

// Mantine Imports
import {
    Container, Title, Text, Table, Button, Group, Stack, Paper, Alert, Center, Loader, TextInput, NumberInput, Divider
} from '@mantine/core';
import {
    IconAlertCircle, IconShoppingCartOff, IconTrash, IconSquareRoundedPlus, IconSquareRoundedMinus, IconSearch, IconUser, IconArrowLeft, IconFilePlus
} from '@tabler/icons-react';

const BillerViewCartPage: React.FC = () => {
    const { userId: userIdParam } = useParams<{ userId: string }>();
    const navigate = useNavigate();

    const [targetUserId, setTargetUserId] = useState<number | null>(null);
    // const [targetUserName, setTargetUserName] = useState<string | null>(null); // To display user name
    const [cart, setCart] = useState<CartStateData | null>(null);
    const [loading, setLoading] = useState(true); // For initial cart load
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState(false); // For all button actions

    // Product Search/Add State
    const [productSearchTerm, setProductSearchTerm] = useState('');
    const [foundProduct, setFoundProduct] = useState<Product | null>(null);
    const [addProductError, setAddProductError] = useState<string | null>(null);
    const [addQuantity, setAddQuantity] = useState<number>(1);
    const [searchLoading, setSearchLoading] = useState(false);

    const [processingCartItemId, setProcessingCartItemId] = useState<number | null>(null);

    // --- Data Fetching ---
    const fetchUserCart = useCallback(async (id: number) => {
        if (isNaN(id) || id <= 0) { /* ... */ return; }
        setLoading(true); setError(null); setCart(null);
        try {
            const data = await getCartForUser(id);
            setCart(data);
            // In a real app, you'd fetch user details separately if needed for name.
            // For now, we'll just show ID.
            // toast.success(`Loaded cart for user ${id}. Items: ${data?.items?.length || 0}`);
        } catch (err: any) {
            let errorMsg = 'Failed to load cart for user.';
            if (err.response?.status === 404) {
                setError(null); setCart(null);
                toast.info(`User ${id} has no active cart or user not found for cart.`);
            } else {
                if (err.response?.data?.message) errorMsg = err.response.data.message;
                else if (err.message) errorMsg = err.message;
                setError(errorMsg); setCart(null);
            }
        } finally { setLoading(false); }
    }, []);

    useEffect(() => {
        const id = parseInt(userIdParam || '', 10);
        if (!isNaN(id) && id > 0) {
            setTargetUserId(id);
            fetchUserCart(id);
            // Fetch target user's name here if needed (requires userService.adminGetUserById)
            // For simplicity, we'll omit this for now.
        } else {
            setError("Invalid User ID provided in URL."); setLoading(false);
        }
    }, [userIdParam, fetchUserCart]);

    // --- Action Handlers ---
    const handleClearCart = async () => { /* ... (as before, using toasts) ... */
        if (!targetUserId || actionLoading) return;
        if (!window.confirm(`Clear all items from User ${targetUserId}'s cart? Inventory will NOT be affected.`)) return;
        setActionLoading(true);
        try {
            await billerClearUserCartContents(targetUserId);
            toast.success(`Cart cleared for user ${targetUserId}`);
            await fetchUserCart(targetUserId);
        } catch (err: any) { toast.error(`Failed to clear cart: ${err?.response?.data?.message || err.message || 'Unknown error'}`); }
        finally { setActionLoading(false); }
    };

    const handleSearchProduct = async () => {
        if (!productSearchTerm.trim()) return;
        setSearchLoading(true); setAddProductError(null); setFoundProduct(null);
         try {
             const product = await getProductByName(productSearchTerm.trim());
             setFoundProduct(product);
         } catch (err: any) {
            const errorMsg = err.response?.status === 404 ? `Product "${productSearchTerm}" not found.` : `Failed to find product: ${err.response?.data?.message || err.message}`;
            setAddProductError(errorMsg); toast.error(errorMsg);
         } finally { setSearchLoading(false); }
    };

    const handleAddItemToUserCart = async () => {
         if (!targetUserId || !foundProduct || addQuantity <= 0 || actionLoading) return;
         setActionLoading(true); setProcessingCartItemId(foundProduct.prodId); // Indicate adding this specific product
         setAddProductError(null);
          try {
              await billerAddItemToCart(targetUserId, { prodName: foundProduct.prodName, quantity: addQuantity });
              toast.success(`${addQuantity} x ${foundProduct.prodName} added.`);
              setFoundProduct(null); setProductSearchTerm(''); setAddQuantity(1);
              await fetchUserCart(targetUserId);
          } catch (err: any) {
             const errorMsg = `Failed to add ${foundProduct.prodName}: ${err.response?.data?.message || err.message}`;
             setAddProductError(errorMsg); toast.error(errorMsg);
          } finally { setActionLoading(false); setProcessingCartItemId(null); }
    };

    const handleIncreaseQuantity = async (item: CartItem) => {
        if (!targetUserId || actionLoading) return;
        setActionLoading(true); setProcessingCartItemId(item.cartItemId); // Track item being processed
         try {
             await billerIncreaseQuantity(targetUserId, { prodName: item.prodName });
             await fetchUserCart(targetUserId);
         } catch (err: any) { toast.error(`Failed to update ${item.prodName}: ${err.response?.data?.message || err.message}`); }
         finally { setActionLoading(false); setProcessingCartItemId(null); }
    };
    const handleDecreaseQuantity = async (item: CartItem) => {
       if (!targetUserId || actionLoading) return;
       setActionLoading(true); setProcessingCartItemId(item.cartItemId);
        try {
            await billerDecreaseQuantity(targetUserId, { prodName: item.prodName });
            await fetchUserCart(targetUserId);
        } catch (err: any) { toast.error(`Failed to update ${item.prodName}: ${err.response?.data?.message || err.message}`); }
        finally { setActionLoading(false); setProcessingCartItemId(null); }
    };
    const handleRemoveItem = async (item: CartItem) => {
        if (!targetUserId || actionLoading) return;
        if (!window.confirm(`Remove ${item.prodName} from user ${targetUserId}'s cart?`)) return;
        setActionLoading(true); setProcessingCartItemId(item.cartItemId);
        try {
            await billerRemoveItemFromCart(targetUserId, { prodName: item.prodName });
            toast.success(`${item.prodName} removed.`);
            await fetchUserCart(targetUserId);
        } catch (err: any) { toast.error(`Failed to remove ${item.prodName}: ${err.response?.data?.message || err.message}`); }
        finally { setActionLoading(false); setProcessingCartItemId(null); }
    };
    const handlePlaceOrderForUser = async () => { /* ... (as before, using toasts) ... */
        if (!targetUserId || actionLoading || !cart || cart.items.length === 0) return;
        setActionLoading(true);
        try {
            const order = await placeBillerOrder(targetUserId);
            toast.success(`Order ${order.orderId} placed for user ${targetUserId}. Redirecting...`);
            navigate(`/payment/${order.orderId}`);
        } catch (err: any) { toast.error(`Failed to place order: ${err.response?.data?.message || err.message}`); }
        finally { setActionLoading(false); }
    };

    // --- Render Logic ---
    if (loading) return <Center style={{ height: '300px' }}><Loader /><div>Loading Cart for User {userIdParam}...</div></Center>;
    if (error && !cart) return <Container size="sm" mt="xl"><Alert icon={<IconAlertCircle size="1rem"/>} title="Error!" color="red">{error}</Alert></Container>;

    const cartItemsRows = cart?.items.map((item) => {
        // *** THIS ITEM is being processed if its ID matches processingCartItemId AND actionLoading is true ***
        const isThisItemProcessing = actionLoading && processingCartItemId === item.cartItemId;
        return (
            <Table.Tr key={item.cartItemId} style={{ opacity: isThisItemProcessing ? 0.7 : 1 }}>
                <Table.Td>{item.prodName}</Table.Td>
                <Table.Td style={{ textAlign: 'right' }}>₹{item.price.toFixed(2)}</Table.Td>
                <Table.Td style={{ textAlign: 'center' }}>
                    <Group gap="xs" justify="center">
                        <Button variant="outline" size="xs" px={5} onClick={() => handleDecreaseQuantity(item)} disabled={isThisItemProcessing || item.quantity <= 1} loading={isThisItemProcessing}> <IconSquareRoundedMinus size={16} /> </Button>
                        <Text w={30} ta="center">{item.quantity}</Text>
                        <Button variant="outline" size="xs" px={5} onClick={() => handleIncreaseQuantity(item)} disabled={isThisItemProcessing} loading={isThisItemProcessing}> <IconSquareRoundedPlus size={16} /> </Button>
                    </Group>
                </Table.Td>
                <Table.Td style={{ textAlign: 'right' }}>₹{item.totalPrice.toFixed(2)}</Table.Td>
                <Table.Td style={{ textAlign: 'center' }}>
                    <Button variant="subtle" color="red" size="xs" onClick={() => handleRemoveItem(item)} disabled={isThisItemProcessing} loading={isThisItemProcessing} leftSection={<IconTrash size={14}/>}> Remove </Button>
                </Table.Td>
            </Table.Tr>
        );
    });


    return (
        <Container size="lg" my="xl">
            <Paper shadow="sm" p="xl" radius="md" withBorder>
                <Stack gap="lg">
                    {/* ... Header and Back Button ... */}
                     <Group justify="space-between">
                         <Title order={2}>Manage Cart for User ID: {targetUserId}</Title>
                         <Button component={Link} to="/biller/dashboard" variant="outline" leftSection={<IconArrowLeft size={16}/>}>
                             Back to User Search
                         </Button>
                     </Group>

                    {/* Add Product Section */}
                    <Paper withBorder p="md" radius="sm">
                        <Title order={4} mb="sm">Add Product to User's Cart</Title>
                        <Group align="flex-end" gap="sm">
                            <TextInput
                                label="Product Name"
                                placeholder="Enter Product Name"
                                value={productSearchTerm}
                                onChange={e => setProductSearchTerm(e.currentTarget.value)}
                                disabled={searchLoading || actionLoading}
                                style={{ flexGrow: 1 }}
                            />
                            <Button onClick={handleSearchProduct} loading={searchLoading} disabled={actionLoading || !productSearchTerm.trim()} leftSection={<IconSearch size={16}/>}>
                                {searchLoading ? 'Finding...' : 'Find Product'}
                            </Button>
                        </Group>
                        {addProductError && <Text c="red" size="sm" mt="xs">{addProductError}</Text>}
                        {foundProduct && (
                            <Paper mt="md" p="sm" withBorder radius="xs" bg="var(--mantine-color-gray-0)">
                                <Text fw={500}>Found: {foundProduct.prodName}</Text>
                                <Text size="xs">Price: ₹{foundProduct.price.toFixed(2)} | Stock: {foundProduct.stock}</Text>
                                <Group mt="xs" align="flex-end">
                                    <NumberInput
                                        label="Quantity"
                                        min={1}
                                        max={foundProduct.stock}
                                        value={addQuantity}
                                        onChange={(val) => setAddQuantity(Number(val) || 1)}
                                        disabled={actionLoading || foundProduct.stock <= 0}
                                        style={{ width: '100px' }}
                                    />
                                    <Button
                                        onClick={handleAddItemToUserCart}
                                        // Disable if any general action is loading OR if adding THIS product
                                        disabled={actionLoading || foundProduct.stock <= 0 || addQuantity > foundProduct.stock || addQuantity < 1}
                                        loading={actionLoading && processingCartItemId === foundProduct.prodId} // Specific loading for this add action
                                        leftSection={<IconFilePlus size={16}/>}
                                    >
                                        Add to Cart
                                    </Button>
                                </Group>
                                {addQuantity > foundProduct.stock && <Text c="red" size="xs" mt="xs">Not enough stock!</Text>}
                            </Paper>
                        )}
                    </Paper>

                    <Divider my="md" label="Current Cart Contents" labelPosition="center" />

                    {!cart || cart.items.length === 0 ? (
                        <Center style={{flexDirection: 'column', padding: '2rem'}}>
                            <IconShoppingCartOff size={40} stroke={1.5} color="var(--mantine-color-gray-5)"/>
                            <Text mt="sm" c="dimmed">Cart is currently empty for this user.</Text>
                        </Center>
                    ) : (
                        <Table striped highlightOnHover withTableBorder verticalSpacing="sm">
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>Product</Table.Th>
                                    <Table.Th style={{ textAlign: 'right' }}>Price</Table.Th>
                                    <Table.Th style={{ textAlign: 'center' }}>Quantity</Table.Th>
                                    <Table.Th style={{ textAlign: 'right' }}>Item Total</Table.Th>
                                    <Table.Th style={{ textAlign: 'center' }}>Actions</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>{cartItemsRows}</Table.Tbody>
                             <Table.Tfoot>
                                <Table.Tr>
                                    <Table.Td colSpan={3} style={{ textAlign: 'right' }}><Text fw={700} size="lg">Grand Total:</Text></Table.Td>
                                    <Table.Td style={{ textAlign: 'right' }}><Text fw={700} size="lg">₹{cart.cartTotalPrice.toFixed(2)}</Text></Table.Td>
                                    <Table.Td></Table.Td>
                                </Table.Tr>
                            </Table.Tfoot>
                        </Table>
                    )}

                    <Group justify="space-between" mt="xl">
                        <Button onClick={handleClearCart} disabled={actionLoading || !cart || cart.items.length === 0} loading={actionLoading && !processingCartItemId}>Clear Cart</Button>
                        <Button onClick={handlePlaceOrderForUser} disabled={actionLoading || !cart || cart.items.length === 0} loading={actionLoading && !processingCartItemId}>Place Order</Button>
                    </Group>
                </Stack>
            </Paper>
        </Container>
    );
}
export default BillerViewCartPage;