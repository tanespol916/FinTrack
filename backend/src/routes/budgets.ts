import { Router, Response } from "express";
import { body, validationResult } from "express-validator";
import prisma from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";
import { AuthRequest } from "../types/auth";
import {
  CreateBudgetRequest,
  BudgetResponse,
} from "../types/budget";

const router = Router();

const handleValidationErrors = (req: AuthRequest, res: Response): boolean => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const response: BudgetResponse = {
      success: false,
      message: "Validation failed",
      data: { errors: errors.array() },
    };
    res.status(400).json(response);
    return true;
  }
  return false;
};

// GET /api/budgets - ดูงบประมาณทั้งหมด
router.get("/", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      const response: BudgetResponse = {
        success: false,
        message: "User not authenticated",
      };
      res.status(401).json(response);
      return;
    }

    const budgets = await prisma.budget.findMany({
      where: { userId: req.user.id },
      include: {
        category: {
          select: { id: true, name: true, type: true, icon: true, color: true },
        },
      },
      orderBy: [{ year: "desc" }, { month: "desc" }],
    });

    const response: BudgetResponse = {
      success: true,
      message: "Budgets retrieved successfully",
      data: { budgets },
    };

    res.json(response);
  } catch (error: any) {
    console.error("Get budgets error:", error);
    const response: BudgetResponse = {
      success: false,
      message: error?.message ?? "Error retrieving budgets",
    };
    res.status(500).json(response);
  }
});

// POST /api/budgets - ตั้งงบประมาณใหม่
router.post(
  "/",
  authMiddleware,
  [
    body("categoryId").isInt({ min: 1 }).withMessage("Category ID must be a positive integer"),
    body("amount").isFloat({ min: 0.01 }).withMessage("Amount must be greater than 0"),
    body("month").isInt({ min: 1, max: 12 }).withMessage("Month must be between 1 and 12"),
    body("year").isInt({ min: 2000, max: 2100 }).withMessage("Year must be between 2000 and 2100"),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      if (handleValidationErrors(req, res)) return;

      if (!req.user) {
        const response: BudgetResponse = {
          success: false,
          message: "User not authenticated",
        };
        res.status(401).json(response);
        return;
      }

      const { categoryId, amount, month, year }: CreateBudgetRequest = req.body;

      const category = await prisma.category.findUnique({
        where: { id: categoryId },
      });

      if (!category) {
        const response: BudgetResponse = {
          success: false,
          message: "Category not found",
        };
        res.status(404).json(response);
        return;
      }

      const existingBudget = await prisma.budget.findFirst({
        where: { userId: req.user.id, categoryId, month, year },
      });

      if (existingBudget) {
        const response: BudgetResponse = {
          success: false,
          message: "Budget for this category, month, and year already exists",
        };
        res.status(409).json(response);
        return;
      }

      const budget = await prisma.budget.create({
        data: {
          userId: req.user.id,
          categoryId,
          amount,
          month,
          year,
        },
        include: {
          category: {
            select: { id: true, name: true, type: true, icon: true, color: true },
          },
        },
      });

      const response: BudgetResponse = {
        success: true,
        message: "Budget created successfully",
        data: { budget },
      };

      res.status(201).json(response);
    } catch (error: any) {
      console.error("Create budget error:", error);
      const response: BudgetResponse = {
        success: false,
        message: error?.message ?? "Error creating budget",
      };
      res.status(500).json(response);
    }
  }
);

// GET /api/budgets/:month/:year - ดูงบของเดือน/ปีที่กำหนด
router.get("/:month/:year", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      const response: BudgetResponse = {
        success: false,
        message: "User not authenticated",
      };
      res.status(401).json(response);
      return;
    }

    const month = parseInt(req.params.month as string);
    const year = parseInt(req.params.year as string);

    if (isNaN(month) || month < 1 || month > 12) {
      const response: BudgetResponse = {
        success: false,
        message: "Invalid month. Must be between 1 and 12",
      };
      res.status(400).json(response);
      return;
    }

    if (isNaN(year) || year < 2000 || year > 2100) {
      const response: BudgetResponse = {
        success: false,
        message: "Invalid year. Must be between 2000 and 2100",
      };
      res.status(400).json(response);
      return;
    }

    const budgets = await prisma.budget.findMany({
      where: { userId: req.user.id, month, year },
      include: {
        category: {
          select: { id: true, name: true, type: true, icon: true, color: true },
        },
      },
    });

    const response: BudgetResponse = {
      success: true,
      message: `Budgets for ${month}/${year} retrieved successfully`,
      data: { budgets },
    };

    res.json(response);
  } catch (error: any) {
    console.error("Get budgets by month/year error:", error);
    const response: BudgetResponse = {
      success: false,
      message: error?.message ?? "Error retrieving budgets",
    };
    res.status(500).json(response);
  }
});

export default router;
