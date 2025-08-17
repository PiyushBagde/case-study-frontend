// src/pages/ProductsPage.tsx
import React, { useState, useEffect, useMemo, ChangeEvent } from 'react';
import { getAllProducts } from '../services/inventoryService';
import { Product } from '../types/inventory';
// import ApiErrorResponse from '../types/auth';
import ProductCard from '../components/ProductCard'; // Import the new card component


// Mantine Imports
import { SimpleGrid, Title, Text, Center, Loader, Alert, TextInput, Stack, Select, Group, Button, Container } from '@mantine/core'; // Added Select, Group
import { IconAlertCircle, IconSearch, IconArrowsSort, IconSortAscending, IconSortDescending } from '@tabler/icons-react'; // Added sort icons

// Define sort options
type SortOptionValue = 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc' | 'default';
const sortOptions = [
    { value: 'default', label: 'Default (No Sort)' },
    { value: 'name-asc', label: 'Name (A-Z)' },
    { value: 'name-desc', label: 'Name (Z-A)' },
    { value: 'price-asc', label: 'Price (Low to High)' },
    { value: 'price-desc', label: 'Price (High to Low)' },
];

const ProductsPage: React.FC = () => {
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [sortOrder, setSortOrder] = useState<SortOptionValue>('default'); // State for sorting
    // Fetching logic remains largely the same
    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await getAllProducts();
                setAllProducts(data); // Store all products
            } catch (err: any) {
                // ... error handling as before ...
                let errorMsg = 'Failed to fetch products.';
                if (err.response?.data?.message) errorMsg = err.response.data.message;
                else if (err.message) errorMsg = err.message;
                if (err.response?.status === 404 && err.response?.data?.message?.toLowerCase().includes("no products found")) {
                    setAllProducts([]); setError(null);
                } else {
                    setError(errorMsg); setAllProducts([]);
                }
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    // --- Client-Side Filtering and Sorting ---
    const processedProducts = useMemo(() => {
        let productsToDisplay = [...allProducts]; // Start with a copy to avoid mutating original

        // 1. Apply Search Filter
        if (searchTerm.trim()) {
            productsToDisplay = productsToDisplay.filter(product =>
                product.prodName.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // 2. Apply Sorting
        switch (sortOrder) {
            case 'name-asc':
                productsToDisplay.sort((a, b) => a.prodName.localeCompare(b.prodName));
                break;
            case 'name-desc':
                productsToDisplay.sort((a, b) => b.prodName.localeCompare(a.prodName));
                break;
            case 'price-asc':
                productsToDisplay.sort((a, b) => a.price - b.price);
                break;
            case 'price-desc':
                productsToDisplay.sort((a, b) => b.price - a.price);
                break;
            case 'default':
            default:
                // No sorting or maintain original fetch order (if backend provides one)
                // If allProducts itself is already in a desired default order, no action needed.
                // If you need to reset to an explicit original order, you'd need to store that separately.
                break;
        }
        return productsToDisplay;
    }, [allProducts, searchTerm, sortOrder]); // Re-calculate when these change


    // --- Render Logic ---
    if (loading) {
        return (
            <Center style={{ height: '300px' }}>
                <Loader color="blue" size="xl" />
            </Center>
        );
    }

    if (error) {
        return (
            <Alert icon={<IconAlertCircle size="1rem" />} title="Error!" color="red" radius="md" mt="lg">
                {error}
            </Alert>
        );
    }

    return (
        <Container py="xl"> {/* Added Container with padding */}
            <Title order={1} ta="center" mb="xl">Our Products</Title>

            {/* Search and Sort Controls */}
            <Group justify="space-between" mb="xl" align="flex-end">
                <TextInput
                    placeholder="Search products by name..."
                    value={searchTerm}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => setSearchTerm(event.currentTarget.value)}
                    leftSection={<IconSearch size="1rem" stroke={1.5} />}
                    radius="xl"
                    size="md"
                    style={{ flexGrow: 1, maxWidth: '500px' }}
                    __clearable
                />
                <Select
                    label="Sort by"
                    placeholder="Select sorting"
                    data={sortOptions}
                    value={sortOrder}
                    onChange={(value) => setSortOrder(value as SortOptionValue || 'default')} // Handle null if Select allows clearing
                    leftSection={<IconArrowsSort size="1rem" stroke={1.5} />}
                    radius="md"
                    style={{ minWidth: '200px' }}
                    allowDeselect={false} // Or true if you want them to be able to deselect to 'default'
                />
            </Group>

            {/* Display filtered and sorted products */}
            {processedProducts.length === 0 ? (
                <Center style={{ height: '200px', flexDirection: 'column' }}>
                    <Text c="dimmed">
                        {searchTerm ? `No products found matching "${searchTerm}".` : "No products currently available."}
                    </Text>
                     {searchTerm && <Button variant="subtle" onClick={() => setSearchTerm('')} mt="sm">Clear Search</Button>}
                </Center>
            ) : (
                <SimpleGrid
                    cols={{ base: 1, xs: 2, sm: 2, md: 3, lg: 4 }}
                    spacing="lg"
                    verticalSpacing="lg"
                >
                    {processedProducts.map((product) => (
                        <ProductCard key={product.prodId} product={product} />
                    ))}
                </SimpleGrid>
            )}
        </Container>
    );
};

export default ProductsPage;