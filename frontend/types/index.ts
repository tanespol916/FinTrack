// ==================== User ====================
export interface User {
  id: number;
  username: string;
  name: string;
  discord_id?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ==================== Auth ====================
export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user?: User;
    token?: string;
    errors?: any[];
  };
}

// ==================== Account ====================
export interface Account {
  id: number;
  userId: number;
  name: string;
  type: string;
  balance: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAccountRequest {
  name: string;
  type: string;
  balance?: number;
}

export interface AccountResponse {
  success: boolean;
  message: string;
  data?: {
    account?: Account;
    accounts?: Account[];
    balance?: number;
    errors?: any[];
  };
}

// ==================== Category ====================
export interface Category {
  id: number;
  name: string;
  type: "income" | "expense";
  icon: string;
  color: string;
  createdAt: string;
  updatedAt: string;
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

// ==================== Transaction ====================
export interface Transaction {
  id: number;
  accountId: number;
  categoryId: number;
  userId: number;
  amount: number;
  description: string;
  date: string;
  createdAt: string;
  updatedAt: string;
  account?: {
    id: number;
    name: string;
    type: string;
  };
  category?: {
    id: number;
    name: string;
    type: string;
    icon: string;
    color: string;
  };
}

export interface CreateTransactionRequest {
  accountId: number;
  categoryId: number;
  amount: number;
  description: string;
  date?: string;
}

export interface UpdateTransactionRequest {
  accountId?: number;
  categoryId?: number;
  amount?: number;
  description?: string;
  date?: string;
}

export interface TransactionQuery {
  startDate?: string;
  endDate?: string;
  categoryId?: number;
  accountId?: number;
  limit?: number;
  offset?: number;
}

export interface TransactionResponse {
  success: boolean;
  message: string;
  data?: {
    transaction?: Transaction;
    transactions?: Transaction[];
    total?: number;
    errors?: any[];
  };
}

// ==================== Budget ====================
export interface Budget {
  id: number;
  userId: number;
  categoryId: number;
  amount: number;
  month: number;
  year: number;
  createdAt: string;
  updatedAt: string;
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

// ==================== Goal ====================
export interface Goal {
  id: number;
  userId: number;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGoalRequest {
  title: string;
  targetAmount?: number;
  currentAmount?: number;
  deadline?: string;
}

export interface UpdateGoalProgressRequest {
  currentAmount: number;
}

export interface GoalResponse {
  success: boolean;
  message: string;
  data?: {
    goal?: Goal;
    goals?: Goal[];
    errors?: any[];
  };
}
