export interface Transaction {
  id: number;
  accountId: number;
  categoryId: number;
  userId: number;
  amount: number;
  description: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
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
