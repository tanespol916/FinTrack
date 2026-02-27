export interface Budget {
  id: number;
  userId: number;
  categoryId: number;
  amount: number;
  month: number;
  year: number;
  createdAt: Date;
  updatedAt: Date;
  category?: {
    id: number;
    name: string;
    type: string;
    icon: string;
    color: string;
  };
}

export interface CreateBudgetRequest {
  categoryId: number;
  amount: number;
  month: number;
  year: number;
}

export interface BudgetResponse {
  success: boolean;
  message: string;
  data?: {
    budget?: Budget;
    budgets?: Budget[];
    errors?: any[];
  };
}
