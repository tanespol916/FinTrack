"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, X, Target, TrendingUp, Calendar, Wallet, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { goalAPI, accountAPI } from "@/lib/api";
import type { Goal, Account } from "@/types";
import { Button } from "@/components/ui/button";

const goalSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  targetAmount: z.string().optional().transform((val) => val && val !== "" ? parseFloat(val) : undefined).refine((val) => val === undefined || val >= 0, "Target must be non-negative"),
  currentAmount: z.coerce.number().min(0, "Current amount must be non-negative"),
  deadline: z.string().optional(),
});

type GoalForm = {
  title: string;
  targetAmount?: number;
  currentAmount: number;
  deadline?: string;
};

const progressSchema = z.object({
  currentAmount: z.coerce.number().min(0, "Amount must be non-negative"),
});

const fundSchema = z.object({
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  accountId: z.string().min(1, "Account is required"),
  description: z.string().optional(),
});

type ProgressForm = {
  currentAmount: number;
};

type FundForm = {
  amount: number;
  accountId: string;
  description?: string;
};

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [progressModalOpen, setProgressModalOpen] = useState(false);
  const [fundModalOpen, setFundModalOpen] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const {
    register: registerGoal,
    handleSubmit: handleSubmitGoal,
    reset: resetGoal,
    formState: { errors: goalErrors, isSubmitting: isSubmittingGoal },
  } = useForm<GoalForm>({
    resolver: zodResolver(goalSchema) as any,
  });

  const {
    register: registerProgress,
    handleSubmit: handleSubmitProgress,
    reset: resetProgress,
    formState: { errors: progressErrors, isSubmitting: isSubmittingProgress },
  } = useForm<ProgressForm>({
    resolver: zodResolver(progressSchema) as any,
  });

  const {
    register: registerFund,
    handleSubmit: handleSubmitFund,
    reset: resetFund,
    formState: { errors: fundErrors, isSubmitting: isSubmittingFund },
  } = useForm<FundForm>({
    resolver: zodResolver(fundSchema) as any,
  });

  const fetchGoals = useCallback(async () => {
    try {
      const res = await goalAPI.getAll();
      if (res.success && res.data?.goals) setGoals(res.data.goals);
    } catch (err) {
      console.error("Fetch goals error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAccounts = useCallback(async () => {
    try {
      const res = await accountAPI.getAll();
      if (res.success && res.data?.accounts) setAccounts(res.data.accounts);
    } catch (err) {
      console.error("Fetch accounts error:", err);
    }
  }, []);

  useEffect(() => {
    fetchGoals();
    fetchAccounts();
  }, [fetchGoals, fetchAccounts]);

  const openCreateModal = () => {
    setError("");
    resetGoal({ title: "", targetAmount: undefined, currentAmount: 0, deadline: "" });
    setCreateModalOpen(true);
  };


  const openFundModal = (goal: Goal) => {
    setError("");
    setSelectedGoalId(goal.id);
    resetFund({ amount: 0, accountId: "", description: "" });
    setFundModalOpen(true);
  };

  const onCreateGoal = async (data: GoalForm) => {
    try {
      setError("");
      const payload: any = {
        title: data.title,
      };
      if (data.targetAmount !== undefined) payload.targetAmount = data.targetAmount;
      if (data.currentAmount) payload.currentAmount = data.currentAmount;
      if (data.deadline) payload.deadline = new Date(data.deadline).toISOString();

      await goalAPI.create(payload);
      setCreateModalOpen(false);
      fetchGoals();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to create goal");
    }
  };

  const onUpdateProgress = async (data: ProgressForm) => {
    if (!selectedGoalId) return;
    try {
      setError("");
      await goalAPI.updateProgress(selectedGoalId, { currentAmount: data.currentAmount });
      setProgressModalOpen(false);
      fetchGoals();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to update progress");
    }
  };

  const onFundGoal = async (data: FundForm) => {
    if (!selectedGoalId) return;
    try {
      setError("");
      const payload = {
        amount: data.amount,
        accountId: parseInt(data.accountId),
        description: data.description,
      };
      await goalAPI.fund(selectedGoalId, payload);
      setFundModalOpen(false);
      fetchGoals();
      fetchAccounts(); // Refresh accounts to show updated balance
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to fund goal");
    }
  };

  const onDeleteGoal = async (goalId: number) => {
    if (!confirm("Are you sure you want to delete this goal? This action cannot be undone.")) return;
    try {
      setError("");
      await goalAPI.delete(goalId);
      fetchGoals(); // Refresh goals list
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to delete goal");
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" }).format(amount);

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return "bg-green-500";
    if (percentage >= 75) return "bg-blue-500";
    if (percentage >= 50) return "bg-yellow-500";
    return "bg-primary";
  };

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
        <h1 className="text-2xl font-bold">Goals</h1>
        <Button onClick={openCreateModal}>
          <Plus className="size-4" />
          New Goal
        </Button>
      </div>

      {/* Summary */}
      {goals.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-blue-500/10">
                <Target className="size-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Goals</p>
                <p className="text-lg font-bold">{goals.length}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-green-500/10">
                <TrendingUp className="size-5 text-green-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Completed</p>
                <p className="text-lg font-bold">
                  {goals.filter((g) => g.currentAmount >= g.targetAmount).length}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-purple-500/10">
                <Calendar className="size-5 text-purple-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">In Progress</p>
                <p className="text-lg font-bold">
                  {goals.filter((g) => g.currentAmount < g.targetAmount).length}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Goal Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {goals.length > 0 ? (
          goals.map((goal) => {
            const percentage = goal.targetAmount > 0 
              ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100) 
              : 0;
            const isCompleted = goal.targetAmount > 0 && goal.currentAmount >= goal.targetAmount;
            const daysLeft = goal.deadline
              ? Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
              : null;

            return (
              <div
                key={goal.id}
                className={`rounded-xl border bg-card p-5 space-y-4 ${isCompleted ? "border-green-500/30" : ""}`}
              >
                {/* Title & Status */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{goal.title}</h3>
                    {isCompleted && (
                      <span className="mt-1 inline-block rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-500">
                        Completed!
                      </span>
                    )}
                  </div>
                  <span className="text-lg font-bold text-primary">{percentage.toFixed(0)}%</span>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="h-3 overflow-hidden rounded-full bg-secondary">
                    <div
                      className={`h-full rounded-full transition-all ${getProgressColor(percentage)}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{formatCurrency(goal.currentAmount)}</span>
                    <span>{formatCurrency(goal.targetAmount)}</span>
                  </div>
                </div>

                {/* Deadline */}
                {goal.deadline && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="size-3" />
                    <span>
                      {format(new Date(goal.deadline), "MMM d, yyyy")}
                      {daysLeft !== null && daysLeft > 0 && (
                        <span className="ml-1">({daysLeft} days left)</span>
                      )}
                      {daysLeft !== null && daysLeft <= 0 && !isCompleted && (
                        <span className="ml-1 text-red-500">(overdue)</span>
                      )}
                    </span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => openFundModal(goal)}
                  >
                    <Wallet className="size-3.5" />
                    Add Funds
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDeleteGoal(goal.id)}
                    className="text-red-500 hover:text-red-600 hover:border-red-500"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center rounded-xl border bg-card p-12">
            <Target className="mb-3 size-12 text-muted-foreground/50" />
            <p className="mb-2 text-muted-foreground">No goals yet</p>
            <Button variant="outline" size="sm" onClick={openCreateModal}>
              <Plus className="size-4" />
              Create Your First Goal
            </Button>
          </div>
        )}
      </div>

      {/* Create Goal Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">New Goal</h2>
              <Button variant="ghost" size="icon-xs" onClick={() => setCreateModalOpen(false)}>
                <X className="size-4" />
              </Button>
            </div>

            <form onSubmit={handleSubmitGoal(onCreateGoal)} className="space-y-4">
              {error && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Goal Title</label>
                <input
                  type="text"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="e.g., Emergency Fund, Vacation, New Car"
                  {...registerGoal("title")}
                />
                {goalErrors.title && <p className="text-xs text-destructive">{goalErrors.title.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Target Amount</label>
                <input
                  type="number"
                  step="0.01"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="0.00"
                  {...registerGoal("targetAmount")}
                />
                {goalErrors.targetAmount && <p className="text-xs text-destructive">{goalErrors.targetAmount.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Current Amount (optional)</label>
                <input
                  type="number"
                  step="0.01"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="0.00"
                  {...registerGoal("currentAmount")}
                />
                {goalErrors.currentAmount && <p className="text-xs text-destructive">{goalErrors.currentAmount.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Deadline (optional)</label>
                <input
                  type="date"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  {...registerGoal("deadline")}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="submit" className="flex-1" disabled={isSubmittingGoal}>
                  {isSubmittingGoal ? "Creating..." : "Create Goal"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setCreateModalOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Progress Modal */}
      {progressModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-card p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Update Progress</h2>
              <Button variant="ghost" size="icon-xs" onClick={() => setProgressModalOpen(false)}>
                <X className="size-4" />
              </Button>
            </div>

            <form onSubmit={handleSubmitProgress(onUpdateProgress)} className="space-y-4">
              {error && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Current Amount</label>
                <input
                  type="number"
                  step="0.01"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  {...registerProgress("currentAmount")}
                />
                {progressErrors.currentAmount && (
                  <p className="text-xs text-destructive">{progressErrors.currentAmount.message}</p>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="submit" className="flex-1" disabled={isSubmittingProgress}>
                  {isSubmittingProgress ? "Updating..." : "Update"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setProgressModalOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fund Goal Modal */}
      {fundModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Add Funds to Goal</h2>
              <Button variant="ghost" size="icon-xs" onClick={() => setFundModalOpen(false)}>
                <X className="size-4" />
              </Button>
            </div>

            <form onSubmit={handleSubmitFund(onFundGoal)} className="space-y-4">
              {error && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="0.00"
                  {...registerFund("amount")}
                />
                {fundErrors.amount && <p className="text-xs text-destructive">{fundErrors.amount.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">From Account</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  {...registerFund("accountId")}
                >
                  <option value="">Select account</option>
                  {accounts.length > 0 ? (
                    accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name} ({formatCurrency(account.balance)})
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>No accounts available</option>
                  )}
                </select>
                {fundErrors.accountId && <p className="text-xs text-destructive">{fundErrors.accountId.message}</p>}
              </div>



              <div className="space-y-2">
                <label className="text-sm font-medium">Description (optional)</label>
                <input
                  type="text"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="e.g., Monthly savings, Bonus money"
                  {...registerFund("description")}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="submit" className="flex-1" disabled={isSubmittingFund}>
                  {isSubmittingFund ? "Adding Funds..." : "Add Funds"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setFundModalOpen(false)}>
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
