// src/components/ProductCard.tsx
import React, { useState } from 'react';
import { Product } from '../types/inventory';
import { Role } from '../types/enums';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { addItemToCartThunk } from '../store/slices/cartSlice';
import { RootState } from '../store/store';
import { toast } from 'sonner';

// Mantine Imports
import { Card, Image, Text, Badge, Button, Group, Stack } from '@mantine/core';
import classes from './ProductCard.module.css'; // We'll create this CSS Module
import { getProductImagePath } from '../utils/imageUtils';


interface ProductCardProps {
    product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
    const dispatch = useAppDispatch();
    const { itemStatus: cartItemStatus } = useAppSelector((state: RootState) => state.cart);
    const currentUserRole = useAppSelector((state: RootState) => state.auth.user?.role);

    const [isAddingToCart, setIsAddingToCart] = useState(false); // Local loading state for this specific card

    // Determine stock display text based on role
    const getStockDisplay = (stock: number, role?: string): string => {
        if (role === Role.ADMIN || role === Role.BILLER) {
            return stock.toString();
        } else if (role === Role.CUSTOMER) {
            if (stock <= 0) return 'Out of Stock';
            if (stock <= 10) return `Low Stock (${stock} left!)`; // Example low stock threshold
            return 'In Stock';
        }
        return stock > 0 ? 'Available' : 'Unavailable';
    };

    const stockText = getStockDisplay(product.stock, currentUserRole);
    const isOutOfStock = product.stock <= 0;

    const handleAddToCart = async () => {
        if (isAddingToCart || isOutOfStock) return;
        setIsAddingToCart(true);
        try {
            await dispatch(addItemToCartThunk({ prodName: product.prodName, quantity: 1 })).unwrap();
            toast.success(`${product.prodName} added to cart!`);
        } catch (rejectedValueOrSerializedError: any) {
            let errorMsg = 'Failed to add item.';
            if (typeof rejectedValueOrSerializedError === 'string') errorMsg = rejectedValueOrSerializedError;
            else if (rejectedValueOrSerializedError?.message) errorMsg = rejectedValueOrSerializedError.message;
            toast.error(errorMsg);
        } finally {
            setIsAddingToCart(false);
        }
    };

    return (
        <Card shadow="sm" padding="lg" radius="md" withBorder className={classes.card}>
            <Card.Section>
                {/* *** Use the helper function to set the image source *** */}
                <Image
                    src={getProductImagePath(product.prodName)}
                    height={160}
                    alt={product.prodName}
                    // Add a fallback for broken images
                    fallbackSrc="/prodImg/default-placeholder.png"
                />
            </Card.Section>

            <Group justify="space-between" mt="md" mb="xs">
                <Text fw={500} truncate="end">{product.prodName}</Text> {/* fw is font-weight */}
                <Badge color={isOutOfStock ? "red" : "pink"} variant="light">
                    {product.category.categoryName}
                </Badge>
            </Group>

            <Stack gap="xs"> {/* Use Stack for vertical spacing of text */}
                <Text size="sm" c="dimmed"> {/* c is color */}
                    Stock: {stockText}
                </Text>
                <Text size="lg" fw={700}>
                    ₹{product.price.toFixed(2)} {/* Assuming INR, change symbol as needed */}
                </Text>
            </Stack>


            {currentUserRole === Role.CUSTOMER && (
                <Button
                    variant="light"
                    color="blue"
                    fullWidth
                    mt="md"
                    radius="md"
                    onClick={handleAddToCart}
                    disabled={isOutOfStock || isAddingToCart || cartItemStatus === 'loading'}
                    loading={isAddingToCart}
                >
                    {isOutOfStock ? "Out of Stock" : "Add to Cart"}
                </Button>
            )}
        </Card>
    );
};

export default ProductCard;