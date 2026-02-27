import axios from "axios";
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  TransactionResponse,
  TransactionQuery,
  CreateTransactionRequest,
  UpdateTransactionRequest,
  BudgetResponse,
  CreateBudgetRequest,
  GoalResponse,
  CreateGoalRequest,
  UpdateGoalProgressRequest,
  AccountResponse,
  CreateAccountRequest,
  CategoryResponse,
} from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        if (!window.location.pathname.includes("/login")) {
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

// ==================== Auth API ====================
export const authAPI = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const res = await api.post("/auth/login", data);
    return res.data;
  },

  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const res = await api.post("/auth/register", data);
    return res.data;
  },

  me: async (): Promise<AuthResponse> => {
    const res = await api.get("/auth/me");
    return res.data;
  },
};

// ==================== Transaction API ====================
export const transactionAPI = {
  getAll: async (query?: TransactionQuery): Promise<TransactionResponse> => {
    const params = new URLSearchParams();
    if (query?.startDate) params.append("startDate", query.startDate);
    if (query?.endDate) params.append("endDate", query.endDate);
    if (query?.categoryId) params.append("categoryId", String(query.categoryId));
    if (query?.accountId) params.append("accountId", String(query.accountId));
    if (query?.limit) params.append("limit", String(query.limit));
    if (query?.offset) params.append("offset", String(query.offset));

    const res = await api.get(`/transactions?${params.toString()}`);
    return res.data;
  },

  create: async (data: CreateTransactionRequest): Promise<TransactionResponse> => {
    const res = await api.post("/transactions", data);
    return res.data;
  },

  update: async (id: number, data: UpdateTransactionRequest): Promise<TransactionResponse> => {
    const res = await api.put(`/transactions/${id}`, data);
    return res.data;
  },

  delete: async (id: number): Promise<TransactionResponse> => {
    const res = await api.delete(`/transactions/${id}`);
    return res.data;
  },
};

// ==================== Budget API ====================
export const budgetAPI = {
  getAll: async (): Promise<BudgetResponse> => {
    const res = await api.get("/budgets");
    return res.data;
  },

  getByMonthYear: async (month: number, year: number): Promise<BudgetResponse> => {
    const res = await api.get(`/budgets/${month}/${year}`);
    return res.data;
  },

  create: async (data: CreateBudgetRequest): Promise<BudgetResponse> => {
    const res = await api.post("/budgets", data);
    return res.data;
  },
};

// ==================== Goal API ====================
export const goalAPI = {
  getAll: async (): Promise<GoalResponse> => {
    const res = await api.get("/goals");
    return res.data;
  },

  create: async (data: CreateGoalRequest): Promise<GoalResponse> => {
    const res = await api.post("/goals", data);
    return res.data;
  },

  updateProgress: async (id: number, data: UpdateGoalProgressRequest): Promise<GoalResponse> => {
    const res = await api.put(`/goals/${id}/progress`, data);
    return res.data;
  },

  fund: async (id: number, data: { amount: number; accountId: number; description?: string }): Promise<GoalResponse> => {
    const res = await api.post(`/goals/${id}/fund`, data);
    return res.data;
  },

  delete: async (id: number): Promise<GoalResponse> => {
    const res = await api.delete(`/goals/${id}`);
    return res.data;
  },
};

// ==================== Account API ====================
export const accountAPI = {
  getAll: async (): Promise<AccountResponse> => {
    const res = await api.get("/accounts");
    return res.data;
  },

  create: async (data: CreateAccountRequest): Promise<AccountResponse> => {
    const res = await api.post("/accounts", data);
    return res.data;
  },

  update: async (id: number, data: CreateAccountRequest): Promise<AccountResponse> => {
    const res = await api.put(`/accounts/${id}`, data);
    return res.data;
  },

  getBalance: async (id: number): Promise<AccountResponse> => {
    const res = await api.get(`/accounts/${id}/balance`);
    return res.data;
  },

  transfer: async (data: { fromAccountId: number; toAccountId: number; amount: number; description?: string }): Promise<AccountResponse> => {
    const res = await api.post("/accounts/transfer", data);
    return res.data;
  },
};

// ==================== Category API ====================
export const categoryAPI = {
  getAll: async (): Promise<CategoryResponse> => {
    const res = await api.get("/categories");
    return res.data;
  },
};

export default api;
