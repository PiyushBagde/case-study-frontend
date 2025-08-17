
import apiClient from './api';
import { AddProductRequest, Category, Product, UpdateProductRequest } from '../types/inventory'; 
export const getAllProducts = async (): Promise<Product[]> => {
  try {
    const response = await apiClient.get<Product[]>('/invent/admin-biller-customer/getAllProducts');
    return response.data;
  } catch (error: any) {
    console.error("Error fetching products:", error);
    throw error;
  }
};

export const getPublicCategories = async (): Promise<Category[]> => {
     const response = await apiClient.get<Category[]>('/invent/admin/getAllCategory'); // Using existing admin one for now
     return response.data;
};

// Fetches all categories (Admin)
export const adminGetAllCategories = async (): Promise<Category[]> => {
  const response = await apiClient.get<Category[]>('/invent/admin/getAllCategory');
  return response.data;
};


// Adds a new category (Admin)
export const adminAddCategory = async (categoryData: { categoryName: string }): Promise<Category> => {
  // We send what the backend expects based on its @RequestBody
  const payload: Partial<Category> = { categoryName: categoryData.categoryName };
  const response = await apiClient.post<Category>('/invent/admin/addCategory', payload);
  return response.data;
};

//  Updates a category's name (Admin).
export const adminUpdateCategoryName = async (categoryId: number, newCategoryName: string): Promise<Category> => {
  const response = await apiClient.put<Category>(
      `/invent/admin/updateCategoryName/${categoryId}`,
      null, // No request body needed if using RequestParam
      { params: { newCategoryName } } // Send as query parameter
  );
  return response.data;
};

// Deletes a category (Admin)
export const adminDeleteCategory = async (categoryId: number): Promise<string> => {
  const response = await apiClient.delete<string>(`/invent/admin/deleteCategory/${categoryId}`);
  return response.data; // Expecting string confirmation
};

// --- NEW Admin Product Functions ---

 /**
  * Fetches all products (Admin view might differ from customer, e.g., different endpoint).
  * Assuming '/invent/admin/getAllProducts' exists.
  * @returns Promise<Product[]>
  */
 export const adminGetAllProducts = async (): Promise<Product[]> => {
  const response = await apiClient.get<Product[]>('/invent/admin-biller-customer/getAllProducts');
  return response.data;
};

export const adminAddProduct = async (productData: AddProductRequest): Promise<Product> => {
  const response = await apiClient.post<Product>('/invent/admin/addProduct', productData);
  return response.data;
};


export const adminUpdateProduct = async (productId: number, productData: UpdateProductRequest): Promise<Product> => {
  // Send the payload directly
  const response = await apiClient.put<Product>(`/invent/admin/updateProduct/${productId}`, productData);
  return response.data;
};

export const adminDeleteProduct = async (productId: number): Promise<string> => {
 const response = await apiClient.delete<string>(`/invent/admin/deleteProduct/${productId}`);
 return response.data;
};

export const getProductByName = async (prodName: string): Promise<Product> => {
  // Assuming endpoint exists and is accessible
  const response = await apiClient.get<Product>('/invent/biller/getProductByProdName', {
      params: { prodName }
  });
  return response.data;
};