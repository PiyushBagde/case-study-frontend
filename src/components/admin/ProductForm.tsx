// src/components/admin/ProductForm.tsx
import React, { useState, useEffect } from 'react';
import { Product, Category, AddProductRequest, UpdateProductRequest } from '../../types/inventory';
import { toast } from 'sonner';

interface ProductFormProps {
    productToEdit?: Product | null; // Product object if editing, null/undefined if adding
    categories: Category[]; // List of available categories for dropdown
    onSubmit: (formData: AddProductRequest | UpdateProductRequest) => Promise<void>; // Async submit handler
    onCancel: () => void;
    isLoading: boolean; // Loading state from parent
}

const ProductForm: React.FC<ProductFormProps> = ({
    productToEdit,
    categories,
    onSubmit,
    onCancel,
    isLoading
}) => {
    const [prodName, setProdName] = useState('');
    const [price, setPrice] = useState<number | string>(''); // Use string initially for empty input
    const [stock, setStock] = useState<number | string>(''); // Use string initially
    const [selectedCategoryName, setSelectedCategoryName] = useState<string>('');

    const isEditing = !!productToEdit;

    // Populate form fields when productToEdit changes (for editing)
    useEffect(() => {
        if (isEditing && productToEdit) {
            setProdName(productToEdit.prodName);
            setPrice(productToEdit.price);
            setStock(productToEdit.stock);
            setSelectedCategoryName(productToEdit.category?.categoryName || ''); // Handle potential null category
        } else {
            // Reset form for adding
            setProdName('');
            setPrice('');
            setStock('');
            setSelectedCategoryName('');
        }
    }, [productToEdit, isEditing]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        // Basic validation (more can be added)
        const numPrice = Number(price);
        const numStock = Number(stock);

        if (!prodName.trim() || isNaN(numPrice) || numPrice <= 0 || isNaN(numStock) || numStock < 0 || !selectedCategoryName) {
            toast.error("Please fill in all fields correctly. Price must be positive, stock non-negative, and category selected.");
            return;
        }

        const formData: AddProductRequest | UpdateProductRequest = {
            prodName: prodName.trim(),
            price: numPrice,
            stock: numStock,
            category: { categoryName: selectedCategoryName },
        };

        await onSubmit(formData); // Call the onSubmit passed from parent
    };

    return (
        <form onSubmit={handleSubmit} style={{ marginBottom: '1rem', padding: '1rem', border: '1px solid #ccc' }}>
            <h3>{isEditing ? `Edit Product: ${productToEdit?.prodName}` : 'Add New Product'}</h3>
            <div style={{ marginBottom: '0.5rem' }}>
                <label htmlFor="prodName">Name: </label>
                <input type="text" id="prodName" value={prodName} onChange={e => setProdName(e.target.value)} required />
            </div>
            <div style={{ marginBottom: '0.5rem' }}>
                <label htmlFor="price">Price: </label>
                <input type="number" id="price" value={price} onChange={e => setPrice(e.target.value)} required min="0.01" step="0.01" />
            </div>
            <div style={{ marginBottom: '0.5rem' }}>
                <label htmlFor="stock">Stock: </label>
                <input type="number" id="stock" value={stock} onChange={e => setStock(e.target.value)} required min="0" step="1" />
            </div>
            {/* Category Dropdown */}
            <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="category">Category: </label>
                <select
                    id="category"
                    value={selectedCategoryName}
                    onChange={e => setSelectedCategoryName(e.target.value)}
                    required
                >
                    <option value="" disabled>-- Select Category --</option>
                    {categories.map(cat => (
                        <option key={cat.categoryId} value={cat.categoryName}>
                            {cat.categoryName}
                        </option>
                    ))}
                </select>
            </div>
            <div>
                <button type="submit" disabled={isLoading} style={{ marginRight: '10px' }}>
                    {isLoading ? 'Saving...' : (isEditing ? 'Update Product' : 'Add Product')}
                </button>
                <button type="button" onClick={onCancel} disabled={isLoading}>
                    Cancel
                </button>
            </div>
        </form>
    );
};

export default ProductForm;