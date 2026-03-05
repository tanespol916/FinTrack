"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Edit2,X, CreditCard, Wallet, PiggyBank, DollarSign, TrendingUp, Home, ArrowRightLeft } from "lucide-react";
import { accountAPI } from "@/lib/api";
import type { Account } from "@/types";
import { Button } from "@/components/ui/button";

const accountSchema = z.object({
  name: z.string().min(1, "Account name is required").max(100),
  type: z.string().min(1, "Account type is required"),
  balance: z.coerce.number().min(0, "Balance must be non-negative"),
});

const transferSchema = z.object({
  fromAccountId: z.coerce.number().min(1, "From account is required"),
  toAccountId: z.coerce.number().min(1, "To account is required"),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),

});

type AccountForm = z.infer<typeof accountSchema>;
type TransferForm = z.infer<typeof transferSchema>;

const ACCOUNT_TYPES = [
  { value: "checking", label: "Checking Account", icon: CreditCard, color: "#3b82f6" },
  { value: "savings", label: "Savings Account", icon: PiggyBank, color: "#10b981" },
  { value: "credit", label: "Credit Card", icon: CreditCard, color: "#ef4444" },
  { value: "cash", label: "Cash", icon: DollarSign, color: "#f59e0b" },
  { value: "investment", label: "Investment", icon: TrendingUp, color: "#8b5cf6" },
  { value: "digital", label: "Digital Wallet", icon: Wallet, color: "#06b6d4" },
  { value: "other", label: "Other", icon: Home, color: "#6b7280" },
];

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AccountForm>({
    resolver: zodResolver(accountSchema) as any,
  });

  const {
    register: registerTransfer,
    handleSubmit: handleSubmitTransfer,
    reset: resetTransfer,
    formState: { errors: transferErrors, isSubmitting: isSubmittingTransfer },
  } = useForm<TransferForm>({
    resolver: zodResolver(transferSchema) as any,
  });

  const fetchAccounts = useCallback(async () => {
    try {
      const res = await accountAPI.getAll();
      if (res.success && res.data?.accounts) setAccounts(res.data.accounts);
    } catch (err) {
      console.error("Fetch accounts error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const openCreateModal = () => {
    setEditingId(null);
    setError("");
    reset({ name: "", type: "checking", balance: 0 });
    setModalOpen(true);
  };

  const openEditModal = (account: Account) => {
    setEditingId(account.id);
    setError("");
    setValue("name", account.name);
    setValue("type", account.type);
    setValue("balance", account.balance);
    setModalOpen(true);
  };

  const openTransferModal = () => {
    if (accounts.length < 2) {
      setError("ต้องมีบัญชีอย่างน้อย 2 บัญชีถึงจะย้ายเงินได้");
      return;
    }
    setError("");
    resetTransfer({ fromAccountId: 0, toAccountId: 0, amount: 0});
    setTransferModalOpen(true);
  };

  const onTransfer = async (data: TransferForm) => {
    try {
      setError("");
      await accountAPI.transfer(data);
      setTransferModalOpen(false);
      fetchAccounts(); // Refresh accounts to show updated balances
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to transfer money");
    }
  };

  const onSubmit = async (data: AccountForm) => {
    try {
      setError("");
      if (editingId) {
        // Note: Update endpoint exists in backend
        await accountAPI.update(editingId, data);
      } else {
        await accountAPI.create(data);
      }
      setModalOpen(false);
      fetchAccounts();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to save account");
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" }).format(amount);

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

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
        <h1 className="text-2xl font-bold">Accounts</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={openTransferModal}>
            <ArrowRightLeft className="size-4" />
            Transfer
          </Button>
          <Button onClick={openCreateModal}>
            <Plus className="size-4" />
            Add Account
          </Button>
        </div>
      </div>

      {/* Summary Card */}
      <div className="rounded-xl border bg-card p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Total Balance</p>
            <p className="text-2xl font-bold">{formatCurrency(totalBalance)}</p>
          </div>
          <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10">
            <Wallet className="size-6 text-primary" />
          </div>
        </div>
      </div>

      {/* Account Cards */}
      {accounts.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => {
            const accountType = ACCOUNT_TYPES.find((t) => t.value === account.type);
            const Icon = accountType?.icon || Home;
            const color = accountType?.color || "#6b7280";

            return (
              <div key={account.id} className="rounded-xl border bg-card p-5 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex size-10 items-center justify-center rounded-lg"
                      style={{ backgroundColor: color + "20", color }}
                    >
                      <Icon className="size-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{account.name}</h3>
                      <p className="text-sm text-muted-foreground">{accountType?.label || account.type}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon-xs" onClick={() => openEditModal(account)}>
                      <Edit2 className="size-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Balance */}
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Balance</p>
                  <p className="text-xl font-bold">{formatCurrency(account.balance)}</p>
                </div>

                
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border bg-card p-12">
          <Wallet className="mb-3 size-12 text-muted-foreground/50" />
          <p className="mb-2 text-muted-foreground">No accounts yet</p>
          <p className="mb-4 text-sm text-muted-foreground">Create your first account to start tracking transactions</p>
          <Button variant="outline" size="sm" onClick={openCreateModal}>
            <Plus className="size-4" />
            Create Account
          </Button>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {editingId ? "Edit Account" : "Add Account"}
              </h2>
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
                <label className="text-sm font-medium">Account Name</label>
                <input
                  type="text"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="e.g., Kasikorn Checking"
                  {...register("name")}
                />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Account Type</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  {...register("type")}
                >
                  {ACCOUNT_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                {errors.type && <p className="text-xs text-destructive">{errors.type.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Initial Balance</label>
                <input
                  type="number"
                  step="0.01"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="0.00"
                  {...register("balance")}
                />
                {errors.balance && <p className="text-xs text-destructive">{errors.balance.message}</p>}
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="submit" className="flex-1" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : editingId ? "Update" : "Create"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {transferModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md rounded-xl border bg-background p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Transfer Money</h2>
              <Button variant="ghost" size="icon-xs" onClick={() => setTransferModalOpen(false)}>
                <X className="size-4" />
              </Button>
            </div>

            <form onSubmit={handleSubmitTransfer(onTransfer)} className="space-y-4">
              {error && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">From Account</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  {...registerTransfer("fromAccountId")}
                >
                  <option value="">Select account</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} ({formatCurrency(account.balance)})
                    </option>
                  ))}
                </select>
                {transferErrors.fromAccountId && <p className="text-xs text-destructive">{transferErrors.fromAccountId.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">To Account</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  {...registerTransfer("toAccountId")}
                >
                  <option value="">Select account</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} ({formatCurrency(account.balance)})
                    </option>
                  ))}
                </select>
                {transferErrors.toAccountId && <p className="text-xs text-destructive">{transferErrors.toAccountId.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="0.00"
                  {...registerTransfer("amount")}
                />
                {transferErrors.amount && <p className="text-xs text-destructive">{transferErrors.amount.message}</p>}
              </div>



              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1" disabled={isSubmittingTransfer}>
                  {isSubmittingTransfer ? "Transferring..." : "Transfer"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setTransferModalOpen(false)}>
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
