import { Router, Response } from "express";
import { body, validationResult } from "express-validator";
import prisma from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";
import { AuthRequest } from "../types/auth";
import {
  CreateCategoryRequest,
  CategoryResponse,
} from "../types/category";

const router = Router();

const handleValidationErrors = (req: AuthRequest, res: Response): boolean => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const response: CategoryResponse = {
      success: false,
      message: "Validation failed",
      data: { errors: errors.array() },
    };
    res.status(400).json(response);
    return true;
  }
  return false;
};

// GET /api/categories - ดูหมวดหมู่ทั้งหมด
router.get("/", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      const response: CategoryResponse = {
        success: false,
        message: "User not authenticated",
      };
      res.status(401).json(response);
      return;
    }

    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
    });

    const response: CategoryResponse = {
      success: true,
      message: "Categories retrieved successfully",
      data: { categories },
    };

    res.json(response);
  } catch (error: any) {
    console.error("Get categories error:", error);
    const response: CategoryResponse = {
      success: false,
      message: error?.message ?? "Error retrieving categories",
    };
    res.status(500).json(response);
  }
});

// POST /api/categories - สร้างหมวดหมู่ใหม่ (admin only)
router.post(
  "/",
  authMiddleware,
  [
    body("name").isLength({ min: 1, max: 100 }).withMessage("Name must be 1-100 characters"),
    body("type").isIn(["income", "expense"]).withMessage("Type must be 'income' or 'expense'"),
    body("icon").isLength({ min: 1, max: 50 }).withMessage("Icon must be 1-50 characters"),
    body("color").matches(/^#[0-9A-Fa-f]{6}$/).withMessage("Color must be a valid hex color (e.g. #FF5733)"),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      if (handleValidationErrors(req, res)) return;

      if (!req.user) {
        const response: CategoryResponse = {
          success: false,
          message: "User not authenticated",
        };
        res.status(401).json(response);
        return;
      }

      const { name, type, icon, color }: CreateCategoryRequest = req.body;

      const existingCategory = await prisma.category.findUnique({
        where: { name },
      });

      if (existingCategory) {
        const response: CategoryResponse = {
          success: false,
          message: "Category with this name already exists",
        };
        res.status(409).json(response);
        return;
      }

      const category = await prisma.category.create({
        data: { name, type, icon, color },
      });

      const response: CategoryResponse = {
        success: true,
        message: "Category created successfully",
        data: { category },
      };

      res.status(201).json(response);
    } catch (error: any) {
      console.error("Create category error:", error);
      const response: CategoryResponse = {
        success: false,
        message: error?.message ?? "Error creating category",
      };
      res.status(500).json(response);
    }
  }
);

export default router;
