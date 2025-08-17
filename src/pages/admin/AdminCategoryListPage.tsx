// src/pages/admin/AdminCategoryListPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Category } from '../../types/inventory';
// import { ApiErrorResponse } from '../../types/auth'; // Not directly used here
import {
    adminGetAllCategories,
    adminAddCategory,
    adminUpdateCategoryName,
    adminDeleteCategory
} from '../../services/inventoryService';

// Mantine Imports
import {
    Table, Button, Group, Title, Text, Modal, TextInput, Stack, ActionIcon, Center, Loader, Alert,
    Paper
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks'; // For Modal open/close state
import { IconPlus, IconEdit, IconTrash, IconAlertCircle } from '@tabler/icons-react';

const AdminCategoryListPage: React.FC = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // State for Modal and Form
    const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
    const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);
    const [categoryName, setCategoryName] = useState<string>('');
    const [formSubmitting, setFormSubmitting] = useState<boolean>(false);

    // --- Data Fetching ---
    const fetchCategories = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const data = await adminGetAllCategories();
            setCategories(data);
        } catch (err: any) {
            let errorMsg = 'Failed to fetch categories.';
            if (err.response?.status === 404 && err.response?.data?.message?.toLowerCase().includes("no categories found")) {
                setCategories([]); setError(null);
            } else {
                if (err.response?.data?.message) errorMsg = err.response.data.message;
                setError(errorMsg); setCategories([]);
            }
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchCategories(); }, [fetchCategories]);

    // --- Modal and Form Handlers ---
    const handleOpenAddModal = () => {
        setCategoryToEdit(null);
        setCategoryName('');
        openModal();
    };

    const handleOpenEditModal = (category: Category) => {
        setCategoryToEdit(category);
        setCategoryName(category.categoryName);
        openModal();
    };

    const handleModalClose = () => {
        closeModal();
        setCategoryToEdit(null); // Reset editing state
        setCategoryName('');
        setFormSubmitting(false);
    };

    const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!categoryName.trim()) {
            toast.error("Category name cannot be empty."); return;
        }
        setFormSubmitting(true);
        try {
            if (categoryToEdit) {
                await adminUpdateCategoryName(categoryToEdit.categoryId, categoryName.trim());
                toast.success(`Category "${categoryToEdit.categoryName}" updated to "${categoryName.trim()}"!`);
            } else {
                await adminAddCategory({ categoryName: categoryName.trim() });
                toast.success(`Category "${categoryName.trim()}" added successfully!`);
            }
            handleModalClose();
            await fetchCategories(); // Refresh list
        } catch (err: any) {
            let errorMsg = categoryToEdit ? 'Failed to update category.' : 'Failed to add category.';
            if (err.response?.data?.message) errorMsg = err.response.data.message;
            if (err.response?.status === 409) errorMsg = `Error: Category name "${categoryName.trim()}" already exists.`;
            toast.error(errorMsg);
        } finally {
            setFormSubmitting(false);
        }
    };

    // --- Delete Handler ---
    const handleDeleteCategory = async (category: Category) => {
        if (window.confirm(`Delete category "${category.categoryName}"? This may fail if products are associated.`)) {
            // Consider using Mantine's Modal for confirmation instead of window.confirm
            setFormSubmitting(true); // Use formSubmitting to disable other actions too
            try {
                await adminDeleteCategory(category.categoryId);
                toast.success(`Category "${category.categoryName}" deleted!`);
                await fetchCategories();
            } catch (err: any) {
                let errorMsg = 'Failed to delete category.';
                if (err.response?.data?.message) errorMsg = err.response.data.message;
                toast.error(errorMsg);
            } finally {
                setFormSubmitting(false);
            }
        }
    };

    // --- Render Logic ---
    if (loading) return <Center style={{ height: '200px' }}><Loader /><div>Loading Categories...</div></Center>;
    if (error) return <Alert icon={<IconAlertCircle size="1rem"/>} title="Error!" color="red" mt="md">{error}</Alert>;

    const rows = categories.map((category) => (
        <Table.Tr key={category.categoryId}>
            <Table.Td>{category.categoryId}</Table.Td>
            <Table.Td>{category.categoryName}</Table.Td>
            <Table.Td>
                <Group gap="xs" justify="flex-end">
                    <ActionIcon variant="subtle" color="blue" onClick={() => handleOpenEditModal(category)} title="Edit Category">
                        <IconEdit size={16} />
                    </ActionIcon>
                    <ActionIcon variant="subtle" color="red" onClick={() => handleDeleteCategory(category)} title="Delete Category">
                        <IconTrash size={16} />
                    </ActionIcon>
                </Group>
            </Table.Td>
        </Table.Tr>
    ));

    return (
        <div>
            <Group justify="space-between" mb="lg">
                <Title order={2}>Manage Categories</Title>
                <Button onClick={handleOpenAddModal} leftSection={<IconPlus size={18} />}>
                    Add Category
                </Button>
            </Group>

            {/* Modal for Add/Edit Category */}
            <Modal
                opened={modalOpened}
                onClose={handleModalClose}
                title={categoryToEdit ? `Edit Category: ${categoryToEdit.categoryName}` : "Add New Category"}
                centered
            >
                <form onSubmit={handleFormSubmit}>
                    <Stack>
                        <TextInput
                            label="Category Name"
                            placeholder="Enter category name"
                            value={categoryName}
                            onChange={(event) => setCategoryName(event.currentTarget.value)}
                            data-autofocus // Focus on this input when modal opens
                            required
                        />
                        <Group justify="flex-end" mt="md">
                            <Button variant="default" onClick={handleModalClose} disabled={formSubmitting}>
                                Cancel
                            </Button>
                            <Button type="submit" loading={formSubmitting}>
                                {categoryToEdit ? 'Update' : 'Add'} Category
                            </Button>
                        </Group>
                    </Stack>
                </form>
            </Modal>

            {categories.length === 0 ? (
                <Text>No categories found. Click "Add Category" to create one.</Text>
            ) : (
                <Paper withBorder shadow="sm" p="md"> {/* Wrap table in paper for better styling */}
                    <Table striped highlightOnHover withTableBorder verticalSpacing="sm">
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>ID</Table.Th>
                                <Table.Th>Name</Table.Th>
                                <Table.Th style={{ textAlign: 'right' }}>Actions</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>{rows.length > 0 ? rows : <Table.Tr><Table.Td colSpan={3}><Center><Text c="dimmed">No categories yet.</Text></Center></Table.Td></Table.Tr>}</Table.Tbody>
                    </Table>
                </Paper>
            )}
        </div>
    );
};

export default AdminCategoryListPage;