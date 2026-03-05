"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Search, Pencil, Trash2, X, Filter, Wallet } from "lucide-react";
import { format } from "date-fns";
import { transactionAPI, accountAPI, categoryAPI } from "@/lib/api";
import type { Transaction, Account, Category } from "@/types";
import { Button } from "@/components/ui/button";

const transactionSchema = z.object({
  accountId: z.coerce.number().min(1, "Account is required"),
  categoryId: z.coerce.number().min(1, "Category is required"),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  description: z.string().min(1, "Description is required").max(255),
  date: z.string().optional(),
});

type TransactionForm = {
  accountId: number;
  categoryId: number;
  amount: number;
  description: string;
  date?: string;
};

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [filterCategoryId, setFilterCategoryId] = useState("");
  const [filterAccountId, setFilterAccountId] = useState("");

  // Pagination
  const [offset, setOffset] = useState(0);
  const limit = 20;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TransactionForm>({
    resolver: zodResolver(transactionSchema) as any,
  });

  const fetchTransactions = useCallback(async () => {
    try {
      const query: any = { limit, offset };
      if (filterStartDate) query.startDate = new Date(filterStartDate).toISOString();
      if (filterEndDate) query.endDate = new Date(filterEndDate).toISOString();
      if (filterCategoryId) query.categoryId = Number(filterCategoryId);
      if (filterAccountId) query.accountId = Number(filterAccountId);

      const res = await transactionAPI.getAll(query);
      if (res.success && res.data) {
        setTransactions(res.data.transactions || []);
        setTotal(res.data.total || 0);
      }
    } catch (err) {
      console.error("Fetch transactions error:", err);
    } finally {
      setLoading(false);
    }
  }, [offset, filterStartDate, filterEndDate, filterCategoryId, filterAccountId]);

  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const [accRes, catRes] = await Promise.all([accountAPI.getAll(), categoryAPI.getAll()]);
        if (accRes.success && accRes.data?.accounts) setAccounts(accRes.data.accounts);
        if (catRes.success && catRes.data?.categories) setCategories(catRes.data.categories);
      } catch (err) {
        console.error("Fetch meta error:", err);
      }
    };
    fetchMeta();
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const openCreateModal = () => {
    if (accounts.length === 0) {
      alert("Please create an account first before adding transactions.");
      return;
    }
    setEditingId(null);
    setError("");
    reset({
      accountId: accounts[0]?.id || 0,
      categoryId: 0,
      amount: 0,
      description: "",
      date: format(new Date(), "yyyy-MM-dd"),
    });
    setModalOpen(true);
  };

  const openEditModal = (tx: Transaction) => {
    setEditingId(tx.id);
    setError("");
    setValue("accountId", tx.accountId);
    setValue("categoryId", tx.categoryId);
    setValue("amount", tx.amount);
    setValue("description", tx.description);
    setValue("date", format(new Date(tx.date), "yyyy-MM-dd"));
    setModalOpen(true);
  };

  const onSubmit = async (data: TransactionForm) => {
    try {
      setError("");
      const payload = {
        ...data,
        date: data.date ? new Date(data.date).toISOString() : undefined,
      };

      if (editingId) {
        await transactionAPI.update(editingId, payload);
      } else {
        await transactionAPI.create(payload);
      }

      setModalOpen(false);
      fetchTransactions();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to save transaction");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this transaction?")) return;
    try {
      await transactionAPI.delete(id);
      fetchTransactions();
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const applyFilters = () => {
    setOffset(0);
  };

  const clearFilters = () => {
    setFilterStartDate("");
    setFilterEndDate("");
    setFilterCategoryId("");
    setFilterAccountId("");
    setOffset(0);
  };

  // Check if any filters are active
  const hasActiveFilters = filterStartDate || filterEndDate || filterCategoryId || filterAccountId;

  const filteredTransactions = searchTerm
    ? transactions.filter(
        (tx) =>
          tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tx.category?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tx.account?.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : transactions;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" }).format(amount);

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
        <h1 className="text-2xl font-bold">Transactions</h1>
        <Button onClick={openCreateModal}>
          <Plus className="size-4" />
          Add Transaction
        </Button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search transactions..."
            className="flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button 
          variant={hasActiveFilters ? "default" : "outline"} 
          onClick={() => setShowFilters(!showFilters)}
          className={hasActiveFilters ? "bg-primary text-primary-foreground" : ""}
        >
          <Filter className="size-4" />
          Filters
          {hasActiveFilters && (
            <span className="ml-2 size-2 rounded-full bg-current" />
          )}
        </Button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="rounded-xl border bg-card p-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Start Date</label>
              <input
                type="date"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">End Date</label>
              <input
                type="date"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Category</label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                value={filterCategoryId}
                onChange={(e) => setFilterCategoryId(e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Account</label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                value={filterAccountId}
                onChange={(e) => setFilterAccountId(e.target.value)}
              >
                <option value="">All Accounts</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={applyFilters}>Apply</Button>
            <Button size="sm" variant="outline" onClick={clearFilters}>Clear</Button>
          </div>
        </div>
      )}

      {/* Table */}
      {accounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border bg-card p-12">
          <Wallet className="mb-3 size-12 text-muted-foreground/50" />
          <p className="mb-2 text-muted-foreground">No accounts found</p>
          <p className="mb-4 text-sm text-muted-foreground">Create an account to start tracking transactions</p>
          <Button variant="outline" size="sm" onClick={() => useRouter().push('/accounts')}>
            <Plus className="size-4" />
            Create Account
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Date</th>
                <th className="px-4 py-3 text-left font-medium">Description</th>
                <th className="px-4 py-3 text-left font-medium">Category</th>
                <th className="px-4 py-3 text-left font-medium">Account</th>
                <th className="px-4 py-3 text-right font-medium">Amount</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 whitespace-nowrap">
                      {format(new Date(tx.date), "MMM d, yyyy")}
                    </td>
                    <td className="px-4 py-3">{tx.description}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: tx.category?.color + "20", color: tx.category?.color }}>
                        {tx.category?.icon} {tx.category?.name}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{tx.account?.name}</td>
                    <td className={`px-4 py-3 text-right font-semibold ${tx.category?.type === "income" ? "text-green-500" : "text-red-500"}`}>
                      {tx.category?.type === "income" ? "+" : "-"}{formatCurrency(tx.amount)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon-xs" onClick={() => openEditModal(tx)}>
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon-xs" onClick={() => handleDelete(tx.id)}>
                          <Trash2 className="size-3.5 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    No transactions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {total > limit && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {offset + 1}-{Math.min(offset + limit, total)} of {total}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={offset === 0}
              onClick={() => setOffset(Math.max(0, offset - limit))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={offset + limit >= total}
              onClick={() => setOffset(offset + limit)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {editingId ? "Edit Transaction" : "Add Transaction"}
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
                <label className="text-sm font-medium">Account</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  {...register("accountId")}
                >
                  <option value={0}>Select account</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                  ))}
                </select>
                {errors.accountId && <p className="text-xs text-destructive">{errors.accountId.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  {...register("categoryId")}
                >
                  <option value={0}>Select category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.icon} {cat.name} ({cat.type})</option>
                  ))}
                </select>
                {errors.categoryId && <p className="text-xs text-destructive">{errors.categoryId.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="0.00"
                  {...register("amount")}
                />
                {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <input
                  type="text"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="What was this for?"
                  {...register("description")}
                />
                {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Date</label>
                <input
                  type="date"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  {...register("date")}
                />
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
    </div>
  );
}
