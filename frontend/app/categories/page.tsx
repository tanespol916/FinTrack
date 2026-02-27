"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2 } from "lucide-react";
import { categoryAPI } from "@/lib/api";
import type { Category } from "@/types";
import { Button } from "@/components/ui/button";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "expense" as "income" | "expense",
    icon: "📝",
    color: "#6b7280",
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingCategory) {
        // Note: Update endpoint doesn't exist in backend yet
        console.log("Update category not implemented in backend");
      } else {
        // Note: Create endpoint requires admin privileges
        console.log("Create category requires admin privileges");
      }
      setShowForm(false);
      setEditingCategory(null);
      setFormData({ name: "", type: "expense", icon: "📝", color: "#6b7280" });
    } catch (err) {
      console.error("Category operation error:", err);
    }
  };

  const startEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      type: category.type,
      icon: category.icon,
      color: category.color,
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingCategory(null);
    setFormData({ name: "", type: "expense", icon: "📝", color: "#6b7280" });
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
        <Button onClick={() => setShowForm(true)}>
          <Plus className="size-4" />
          Add Category
        </Button>
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
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon-xs" onClick={() => startEdit(category)}>
                    <Edit2 className="size-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon-xs">
                    <Trash2 className="size-3.5 text-destructive" />
                  </Button>
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
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon-xs" onClick={() => startEdit(category)}>
                    <Edit2 className="size-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon-xs">
                    <Trash2 className="size-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {editingCategory ? "Edit Category" : "Add Category"}
              </h2>
              <Button variant="ghost" size="icon-xs" onClick={resetForm}>
                <Trash2 className="size-4" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <input
                  type="text"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Type</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as "income" | "expense" })}
                >
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Icon</label>
                <input
                  type="text"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="📝"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Color</label>
                <input
                  type="color"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="submit" className="flex-1">
                  {editingCategory ? "Update" : "Create"}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
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
