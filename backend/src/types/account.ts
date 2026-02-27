export interface Account {
  id: number;
  userId: number;
  name: string;
  type: string;
  balance: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAccountRequest {
  name: string;
  type: string;
  balance?: number;
}

export interface UpdateAccountRequest {
  name?: string;
  type?: string;
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
