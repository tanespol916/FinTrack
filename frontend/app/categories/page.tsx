"use client";

import { useState, useEffect } from "react";
import { categoryAPI } from "@/lib/api";
import type { Category } from "@/types";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await categoryAPI.getAll();
      if (res.success && res.data?.categories) setCategories(res.data.categories);
    } catch (err) {
      console.error("Fetch categories error:", err);
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const incomeCategories = categories.filter(c => c.type === "income");
  const expenseCategories = categories.filter(c => c.type === "expense");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Categories</h1>
      </div>

      {/* Category Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Income Categories */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-green-600">Income Categories</h2>
          <div className="grid gap-3">
            {incomeCategories.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between rounded-lg border bg-card p-4"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="flex size-10 items-center justify-center rounded-lg text-lg"
                    style={{ backgroundColor: category.color + "20", color: category.color }}
                  >
                    {category.icon}
                  </span>
                  <div>
                    <p className="font-medium">{category.name}</p>
                    <p className="text-xs text-muted-foreground">Income</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Expense Categories */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-red-600">Expense Categories</h2>
          <div className="grid gap-3">
            {expenseCategories.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between rounded-lg border bg-card p-4"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="flex size-10 items-center justify-center rounded-lg text-lg"
                    style={{ backgroundColor: category.color + "20", color: category.color }}
                  >
                    {category.icon}
                  </span>
                  <div>
                    <p className="font-medium">{category.name}</p>
                    <p className="text-xs text-muted-foreground">Expense</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
