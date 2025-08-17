// src/pages/admin/AdminProductListPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Product, Category, AddProductRequest, UpdateProductRequest } from '../../types/inventory';
// import { ApiErrorResponse } from '../../types/auth'; // Not directly used here
import {
    adminGetAllProducts,
    adminGetAllCategories,
    adminAddProduct,
    adminUpdateProduct,
    adminDeleteProduct
} from '../../services/inventoryService';
import ProductForm from '../../components/admin/ProductForm'; // Your existing ProductForm

// Mantine Imports
import {
    Table, Button, Group, Title, Text, Modal, ActionIcon, Center, Loader, Alert, Paper
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconEdit, IconTrash, IconAlertCircle } from '@tabler/icons-react';

const AdminProductListPage: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Modal and Form State
    const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
    const [productToEdit, setProductToEdit] = useState<Product | null>(null);
    const [formSubmitting, setFormSubmitting] = useState<boolean>(false); // For the modal form

    // --- Data Fetching ---
    const fetchProductsAndCategories = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const [productsData, categoriesData] = await Promise.all([
                adminGetAllProducts(),
                adminGetAllCategories()
            ]);
            setProducts(productsData);
            setCategories(categoriesData);
        } catch (err: any) {
            console.error("Error fetching products or categories:", err);
            let errorMsg = 'Failed to fetch data.';
             if (err.response?.status === 404 && err.response?.data?.message?.toLowerCase().includes("no products found")) {
                 setProducts([]); setError(null); // Ok if no products
                  // Still try to set categories if that part succeeded, or handle its error separately
                  try { if (categories.length === 0) setCategories(await adminGetAllCategories()); } catch (_) {}
             } else {
                 if (err.response?.data?.message) errorMsg = err.response.data.message;
                 setError(errorMsg); setProducts([]); setCategories([]);
             }
        } finally { setLoading(false); }
    }, [categories.length]); // Added categories.length to re-evaluate if categories were empty

    useEffect(() => { fetchProductsAndCategories(); }, [fetchProductsAndCategories]);

    // --- Modal and Form Handlers ---
    const handleAddClick = () => {
        setProductToEdit(null);
        openModal();
    };

    const handleEditClick = (product: Product) => {
        setProductToEdit(product);
        openModal();
    };

    const handleModalClose = () => {
        closeModal();
        setProductToEdit(null);
        setFormSubmitting(false);
    };

    const handleFormSubmit = async (formData: AddProductRequest | UpdateProductRequest) => {
        setFormSubmitting(true);
        const isEditing = !!productToEdit;
        const action = isEditing ? 'update' : 'add';
        const successMsg = `Product successfully ${isEditing ? 'updated' : 'added'}!`;
        const errorMsgBase = `Failed to ${action} product.`;

        try {
            if (isEditing && productToEdit) {
                await adminUpdateProduct(productToEdit.prodId, formData as UpdateProductRequest);
            } else {
                await adminAddProduct(formData as AddProductRequest);
            }
            toast.success(successMsg);
            handleModalClose();
            await fetchProductsAndCategories(); // Refresh list
        } catch (err: any) {
            console.error(`Error ${action}ing product:`, err);
            let errorMsg = `${errorMsgBase} `;
            if (err.response?.data?.message) errorMsg += err.response.data.message;
            if (err.response?.status === 409) errorMsg = `Error: Product name "${formData.prodName}" already exists.`;
            toast.error(errorMsg);
        } finally {
            setFormSubmitting(false);
        }
    };

    // --- Delete Handler ---
    const handleDeleteProduct = async (product: Product) => {
        if (window.confirm(`Delete product "${product.prodName}" (ID: ${product.prodId})?`)) {
            setFormSubmitting(true); // Reuse formSubmitting to disable other buttons
            try {
                await adminDeleteProduct(product.prodId);
                toast.success(`Product "${product.prodName}" deleted!`);
                await fetchProductsAndCategories();
            } catch (err: any) {
                let errorMsg = 'Failed to delete product.';
                if (err.response?.data?.message) errorMsg = err.response.data.message;
                toast.error(errorMsg);
            } finally {
                setFormSubmitting(false);
            }
        }
    };

    // --- Render Logic ---
    if (loading) return <Center style={{ height: '200px' }}><Loader /><div>Loading Products...</div></Center>;
    if (error) return <Alert icon={<IconAlertCircle size="1rem"/>} title="Error!" color="red" mt="md">{error}</Alert>;

    const rows = products.map((product) => (
        <Table.Tr key={product.prodId}>
            <Table.Td>{product.prodId}</Table.Td>
            <Table.Td>{product.prodName}</Table.Td>
            <Table.Td>{product.category?.categoryName || 'N/A'}</Table.Td>
            <Table.Td style={{ textAlign: 'right' }}>₹{product.price.toFixed(2)}</Table.Td>
            <Table.Td style={{ textAlign: 'center' }}>{product.stock}</Table.Td>
            <Table.Td>
                <Group gap="xs" justify="flex-end">
                    <ActionIcon variant="subtle" color="blue" onClick={() => handleEditClick(product)} title="Edit Product">
                        <IconEdit size={16} />
                    </ActionIcon>
                    <ActionIcon variant="subtle" color="red" onClick={() => handleDeleteProduct(product)} title="Delete Product">
                        <IconTrash size={16} />
                    </ActionIcon>
                </Group>
            </Table.Td>
        </Table.Tr>
    ));

    return (
        <div>
            <Group justify="space-between" mb="lg">
                <Title order={2}>Manage Products</Title>
                <Button onClick={handleAddClick} leftSection={<IconPlus size={18} />} disabled={categories.length === 0}>
                    Add Product
                </Button>
                {categories.length === 0 && <Text size="xs" c="orange">Add categories first to create products.</Text>}
            </Group>

            {/* Modal for Add/Edit Product */}
            <Modal
                opened={modalOpened}
                onClose={handleModalClose}
                title={productToEdit ? `Edit Product: ${productToEdit.prodName}` : "Add New Product"}
                size="md" // Adjust size as needed
                centered
            >
                {categories.length > 0 ? (
                    <ProductForm
                        productToEdit={productToEdit}
                        categories={categories} // Pass fetched categories to the form
                        onSubmit={handleFormSubmit}
                        onCancel={handleModalClose}
                        isLoading={formSubmitting}
                    />
                ) : (
                    <Text c="dimmed">Please add categories first before adding products.</Text>
                )}
            </Modal>

            {products.length === 0 ? (
                <Text mt="md">No products found. Click "Add Product" to create one (ensure categories exist).</Text>
            ) : (
                <Paper withBorder shadow="sm" p="md" mt="md">
                    <Table striped highlightOnHover withTableBorder verticalSpacing="sm">
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>ID</Table.Th>
                                <Table.Th>Name</Table.Th>
                                <Table.Th>Category</Table.Th>
                                <Table.Th style={{ textAlign: 'right' }}>Price</Table.Th>
                                <Table.Th style={{ textAlign: 'center' }}>Stock</Table.Th>
                                <Table.Th style={{ textAlign: 'right' }}>Actions</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>{rows.length > 0 ? rows : <Table.Tr><Table.Td colSpan={6}><Center><Text c="dimmed">No products available.</Text></Center></Table.Td></Table.Tr>}</Table.Tbody>
                    </Table>
                </Paper>
            )}
        </div>
    );
};

export default AdminProductListPage;