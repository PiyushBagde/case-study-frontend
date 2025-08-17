
export interface Category {
    categoryId: number;
    categoryName: string;
}

export interface Product {
    prodId: number;
    prodName: string;
    price: number;
    stock: number;
    category: Category;
}


export interface AddProductRequest {
    prodName: string;
    price: number;
    stock: number;
    category: { categoryName: string };
}

export interface UpdateProductRequest {
    prodName: string;
    price: number;
    stock: number;
    category: { categoryName: string };
}