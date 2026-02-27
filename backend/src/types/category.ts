export interface Category {
  id: number;
  name: string;
  type: string;
  icon: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCategoryRequest {
  name: string;
  type: string;
  icon: string;
  color: string;
}

export interface CategoryResponse {
  success: boolean;
  message: string;
  data?: {
    category?: Category;
    categories?: Category[];
    errors?: any[];
  };
}
