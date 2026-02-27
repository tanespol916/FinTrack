"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, X, AlertTriangle, CheckCircle } from "lucide-react";
import { budgetAPI, categoryAPI, transactionAPI } from "@/lib/api";
import type { Budget, Category, Transaction } from "@/types";
import { Button } from "@/components/ui/button";

const budgetSchema = z.object({
  categoryId: z.coerce.number().min(1, "Category is required"),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  month: z.coerce.number().min(1).max(12),
  year: z.coerce.number().min(2000).max(2100),
});

type BudgetForm = {
  categoryId: number;
  amount: number;
  month: number;
  year: number;
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function BudgetsPage() {
  const now = new Date();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BudgetForm>({
    resolver: zodResolver(budgetSchema) as any,
    defaultValues: {
      month: selectedMonth,
      year: selectedYear,
    },
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const startDate = new Date(selectedYear, selectedMonth - 1, 1).toISOString();
      const endDate = new Date(selectedYear, selectedMonth, 0).toISOString();

      const [budgetRes, txRes] = await Promise.all([
        budgetAPI.getByMonthYear(selectedMonth, selectedYear),
        transactionAPI.getAll({ startDate, endDate, limit: 100 }),
      ]);

      if (budgetRes.success && budgetRes.data?.budgets) setBudgets(budgetRes.data.budgets);
      else setBudgets([]);

      if (txRes.success && txRes.data?.transactions) setTransactions(txRes.data.transactions);
      else setTransactions([]);
    } catch (err) {
      console.error("Fetch budgets error:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await categoryAPI.getAll();
        if (res.success && res.data?.categories) setCategories(res.data.categories);
      } catch (err) {
        console.error("Fetch categories error:", err);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getSpentForCategory = (categoryId: number) => {
    return transactions
      .filter((tx) => tx.categoryId === categoryId && tx.category?.type === "expense")
      .reduce((sum, tx) => sum + tx.amount, 0);
  };

  const openCreateModal = () => {
    setError("");
    reset({
      categoryId: 0,
      amount: 0,
      month: selectedMonth,
      year: selectedYear,
    });
    setModalOpen(true);
  };

  const onSubmit = async (data: BudgetForm) => {
    try {
      setError("");
      await budgetAPI.create(data);
      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to create budget");
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" }).format(amount);

  const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + getSpentForCategory(b.categoryId), 0);
  const overallPercentage = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Budgets</h1>
        <Button onClick={openCreateModal}>
          <Plus className="size-4" />
          New Budget
        </Button>
      </div>

      {/* Month/Year Selector */}
      <div className="flex items-center gap-3">
        <select
          className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(Number(e.target.value))}
        >
          {MONTHS.map((m, i) => (
            <option key={i} value={i + 1}>{m}</option>
          ))}
        </select>
        <select
          className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
        >
          {Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i).map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* Overall Summary */}
      <div className="rounded-xl border bg-card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Overall Budget</h2>
          <span className="text-sm text-muted-foreground">
            {formatCurrency(totalSpent)} / {formatCurrency(totalBudget)}
          </span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-secondary">
          <div
            className={`h-full rounded-full transition-all ${
              totalSpent > totalBudget
                ? "bg-red-500"
                : overallPercentage >= 80
                  ? "bg-yellow-500"
                  : "bg-green-500"
            }`}
            style={{ width: `${overallPercentage}%` }}
          />
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {overallPercentage.toFixed(0)}% of total budget used
        </p>
      </div>

      {/* Budget List */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {budgets.length > 0 ? (
          budgets.map((budget) => {
            const spent = getSpentForCategory(budget.categoryId);
            const percentage = Math.min((spent / budget.amount) * 100, 100);
            const isOverBudget = spent > budget.amount;
            const isNearLimit = percentage >= 80 && !isOverBudget;

            return (
              <div key={budget.id} className="rounded-xl border bg-card p-4 space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="flex size-8 items-center justify-center rounded-lg text-sm"
                      style={{
                        backgroundColor: budget.category?.color + "20",
                        color: budget.category?.color,
                      }}
                    >
                      {budget.category?.icon}
                    </span>
                    <span className="font-medium">{budget.category?.name}</span>
                  </div>
                  {isOverBudget && <AlertTriangle className="size-4 text-red-500" />}
                  {isNearLimit && <AlertTriangle className="size-4 text-yellow-500" />}
                  {!isOverBudget && !isNearLimit && <CheckCircle className="size-4 text-green-500" />}
                </div>

                {/* Amount */}
                <div className="flex items-baseline justify-between">
                  <span className={`text-lg font-bold ${isOverBudget ? "text-red-500" : ""}`}>
                    {formatCurrency(spent)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    of {formatCurrency(budget.amount)}
                  </span>
                </div>

                {/* Progress */}
                <div className="h-2 overflow-hidden rounded-full bg-secondary">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isOverBudget
                        ? "bg-red-500"
                        : isNearLimit
                          ? "bg-yellow-500"
                          : "bg-green-500"
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                {/* Status */}
                <p className={`text-xs ${isOverBudget ? "text-red-500" : isNearLimit ? "text-yellow-600" : "text-muted-foreground"}`}>
                  {isOverBudget
                    ? `Over budget by ${formatCurrency(spent - budget.amount)}`
                    : isNearLimit
                      ? `${percentage.toFixed(0)}% used - approaching limit`
                      : `${formatCurrency(budget.amount - spent)} remaining`}
                </p>
              </div>
            );
          })
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center rounded-xl border bg-card p-12">
            <p className="mb-2 text-muted-foreground">No budgets for {MONTHS[selectedMonth - 1]} {selectedYear}</p>
            <Button variant="outline" size="sm" onClick={openCreateModal}>
              <Plus className="size-4" />
              Create Budget
            </Button>
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">New Budget</h2>
              <Button variant="ghost" size="icon-xs" onClick={() => setModalOpen(false)}>
                <X className="size-4" />
              </Button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  {...register("categoryId")}
                >
                  <option value={0}>Select category</option>
                  {categories
                    .filter((c) => c.type === "expense")
                    .map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                    ))}
                </select>
                {errors.categoryId && <p className="text-xs text-destructive">{errors.categoryId.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Budget Amount</label>
                <input
                  type="number"
                  step="0.01"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="0.00"
                  {...register("amount")}
                />
                {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Month</label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    {...register("month")}
                  >
                    {MONTHS.map((m, i) => (
                      <option key={i} value={i + 1}>{m}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Year</label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    {...register("year")}
                  >
                    {Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i).map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="submit" className="flex-1" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create Budget"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
