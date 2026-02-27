"use client";

import { useState, useEffect, useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Target,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import { transactionAPI, budgetAPI, goalAPI, accountAPI } from "@/lib/api";
import type { Transaction, Budget, Goal, Account } from "@/types";
import { format } from "date-fns";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

export default function DashboardPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const now = new Date();
        const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

        const [txRes, budgetRes, goalRes, accountRes] = await Promise.all([
          transactionAPI.getAll({ startDate, endDate, limit: 100 }),
          budgetAPI.getByMonthYear(now.getMonth() + 1, now.getFullYear()),
          goalAPI.getAll(),
          accountAPI.getAll(),
        ]);

        if (txRes.success && txRes.data?.transactions) setTransactions(txRes.data.transactions);
        if (budgetRes.success && budgetRes.data?.budgets) setBudgets(budgetRes.data.budgets);
        if (goalRes.success && goalRes.data?.goals) setGoals(goalRes.data.goals);
        if (accountRes.success && accountRes.data?.accounts) setAccounts(accountRes.data.accounts);
      } catch (error) {
        console.error("Dashboard fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const { totalIncome, totalExpense, balance } = useMemo(() => {
    let income = 0;
    let expense = 0;

    transactions.forEach((tx) => {
      if (tx.category?.type === "income") {
        income += tx.amount;
      } else {
        expense += tx.amount;
      }
    });

    return {
      totalIncome: income,
      totalExpense: expense,
      balance: income - expense,
    };
  }, [transactions]);

  const totalAccountBalance = useMemo(() => {
    return accounts.reduce((sum, acc) => sum + acc.balance, 0);
  }, [accounts]);

  // Account breakdown for dashboard
  const accountBreakdown = useMemo(() => {
    return accounts.map((account) => ({
      ...account,
      percentage: totalAccountBalance > 0 ? (account.balance / totalAccountBalance) * 100 : 0,
    }));
  }, [accounts, totalAccountBalance]);

  const barChartData = useMemo(() => {
    const dailyData: Record<string, { income: number; expense: number }> = {};
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

    for (let i = 1; i <= daysInMonth; i++) {
      const key = String(i);
      dailyData[key] = { income: 0, expense: 0 };
    }

    transactions.forEach((tx) => {
      const day = String(new Date(tx.date).getDate());
      if (dailyData[day]) {
        if (tx.category?.type === "income") {
          dailyData[day].income += tx.amount;
        } else {
          dailyData[day].expense += tx.amount;
        }
      }
    });

    const labels = Object.keys(dailyData);
    return {
      labels,
      datasets: [
        {
          label: "Income",
          data: labels.map((d) => dailyData[d].income),
          backgroundColor: "rgba(34, 197, 94, 0.7)",
          borderRadius: 4,
        },
        {
          label: "Expense",
          data: labels.map((d) => dailyData[d].expense),
          backgroundColor: "rgba(239, 68, 68, 0.7)",
          borderRadius: 4,
        },
      ],
    };
  }, [transactions]);

  const doughnutData = useMemo(() => {
    const categoryTotals: Record<string, { amount: number; color: string }> = {};

    transactions
      .filter((tx) => tx.category?.type === "expense")
      .forEach((tx) => {
        const name = tx.category?.name || "Other";
        if (!categoryTotals[name]) {
          categoryTotals[name] = { amount: 0, color: tx.category?.color || "#6b7280" };
        }
        categoryTotals[name].amount += tx.amount;
      });

    const labels = Object.keys(categoryTotals);
    return {
      labels,
      datasets: [
        {
          data: labels.map((l) => categoryTotals[l].amount),
          backgroundColor: labels.map((l) => categoryTotals[l].color),
          borderWidth: 0,
        },
      ],
    };
  }, [transactions]);

  const recentTransactions = useMemo(() => {
    return transactions.slice(0, 5);
  }, [transactions]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" }).format(amount);
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
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          title="Total Income"
          value={formatCurrency(totalIncome)}
          icon={TrendingUp}
          iconColor="text-green-500"
          bgColor="bg-green-500/10"
        />
        <SummaryCard
          title="Total Expense"
          value={formatCurrency(totalExpense)}
          icon={TrendingDown}
          iconColor="text-red-500"
          bgColor="bg-red-500/10"
        />
        <SummaryCard
          title="Net Balance"
          value={formatCurrency(balance)}
          icon={Wallet}
          iconColor="text-blue-500"
          bgColor="bg-blue-500/10"
        />
        <SummaryCard
          title="Account Balance"
          value={formatCurrency(totalAccountBalance)}
          icon={Target}
          iconColor="text-purple-500"
          bgColor="bg-purple-500/10"
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Bar Chart */}
        <div className="rounded-xl border bg-card p-4 lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold">Income vs Expenses (This Month)</h2>
          <div className="h-64">
            <Bar
              data={barChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: "top" } },
                scales: {
                  x: { grid: { display: false } },
                  y: { beginAtZero: true },
                },
              }}
            />
          </div>
        </div>

        {/* Doughnut Chart */}
        <div className="rounded-xl border bg-card p-4">
          <h2 className="mb-4 text-lg font-semibold">Expense by Category</h2>
          <div className="flex h-64 items-center justify-center">
            {doughnutData.labels.length > 0 ? (
              <Doughnut
                data={doughnutData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { position: "bottom", labels: { boxWidth: 12 } } },
                }}
              />
            ) : (
              <p className="text-sm text-muted-foreground">No expense data</p>
            )}
          </div>
        </div>
      </div>

      {/* Budget Progress + Recent Transactions */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Budget Progress */}
        <div className="rounded-xl border bg-card p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Budget Progress</h2>
            <Link href="/budgets" className="flex items-center gap-1 text-sm text-primary hover:underline">
              View all <ArrowRight className="size-3" />
            </Link>
          </div>
          <div className="space-y-4">
            {budgets.length > 0 ? (
              budgets.slice(0, 4).map((budget) => {
                const spent = transactions
                  .filter((tx) => tx.categoryId === budget.categoryId && tx.category?.type === "expense")
                  .reduce((sum, tx) => sum + tx.amount, 0);
                const percentage = Math.min((spent / budget.amount) * 100, 100);
                const isOverBudget = spent > budget.amount;
                const isNearLimit = percentage >= 80;

                return (
                  <div key={budget.id} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{budget.category?.name}</span>
                      <span className={isOverBudget ? "text-red-500 font-medium" : "text-muted-foreground"}>
                        {formatCurrency(spent)} / {formatCurrency(budget.amount)}
                      </span>
                    </div>
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
                    {isOverBudget && (
                      <p className="text-xs text-red-500">Over budget by {formatCurrency(spent - budget.amount)}</p>
                    )}
                    {isNearLimit && !isOverBudget && (
                      <p className="text-xs text-yellow-600">Approaching limit ({percentage.toFixed(0)}%)</p>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground">No budgets set for this month</p>
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="rounded-xl border bg-card p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent Transactions</h2>
            <Link href="/transactions" className="flex items-center gap-1 text-sm text-primary hover:underline">
              View all <ArrowRight className="size-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {recentTransactions.length > 0 ? (
              recentTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between rounded-lg p-2 hover:bg-accent/50">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex size-9 items-center justify-center rounded-lg text-sm"
                      style={{ backgroundColor: tx.category?.color + "20", color: tx.category?.color }}
                    >
                      {tx.category?.icon || "📦"}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{tx.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {tx.category?.name} &middot; {format(new Date(tx.date), "MMM d")}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-sm font-semibold ${
                      tx.category?.type === "income" ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    {tx.category?.type === "income" ? "+" : "-"}
                    {formatCurrency(tx.amount)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No transactions this month</p>
            )}
          </div>
        </div>
      </div>

      {/* Account Overview */}
      {accounts.length > 0 && (
        <div className="rounded-xl border bg-card p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Account Overview</h2>
            <Link href="/accounts" className="flex items-center gap-1 text-sm text-primary hover:underline">
              Manage <ArrowRight className="size-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {accountBreakdown.map((account) => (
              <div key={account.id} className="flex items-center justify-between rounded-lg p-3 hover:bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-muted">
                    <Wallet className="size-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{account.name}</p>
                    <p className="text-xs text-muted-foreground">{account.type}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{formatCurrency(account.balance)}</p>
                  <p className="text-xs text-muted-foreground">{account.percentage.toFixed(1)}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Goals Progress */}
      {goals.length > 0 && (
        <div className="rounded-xl border bg-card p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Goals Progress</h2>
            <Link href="/goals" className="flex items-center gap-1 text-sm text-primary hover:underline">
              View all <ArrowRight className="size-3" />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {goals.slice(0, 3).map((goal) => {
              const percentage = goal.targetAmount > 0 ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100) : 0;
              return (
                <div key={goal.id} className="space-y-3 rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{goal.title}</h3>
                    <span className="text-sm font-semibold text-primary">{percentage.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{formatCurrency(goal.currentAmount)}</span>
                    <span>{formatCurrency(goal.targetAmount)}</span>
                  </div>
                  {goal.deadline && (
                    <p className="text-xs text-muted-foreground">
                      Deadline: {format(new Date(goal.deadline), "MMM d, yyyy")}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  title,
  value,
  icon: Icon,
  iconColor,
  bgColor,
}: {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  bgColor: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center gap-3">
        <div className={`flex size-10 items-center justify-center rounded-lg ${bgColor}`}>
          <Icon className={`size-5 ${iconColor}`} />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{title}</p>
          <p className="text-lg font-bold">{value}</p>
        </div>
      </div>
    </div>
  );
}
