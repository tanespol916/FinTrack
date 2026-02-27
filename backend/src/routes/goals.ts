import { Router, Response } from "express";
import { body, validationResult } from "express-validator";
import prisma from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";
import { AuthRequest } from "../types/auth";
import {
  CreateGoalRequest,
  UpdateGoalProgressRequest,
  GoalResponse,
} from "../types/goal";

const router = Router();

const handleValidationErrors = (req: AuthRequest, res: Response): boolean => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const response: GoalResponse = {
      success: false,
      message: "Validation failed",
      data: { errors: errors.array() },
    };
    res.status(400).json(response);
    return true;
  }
  return false;
};

// GET /api/goals - ดูเป้าหมายทั้งหมด
router.get("/", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      const response: GoalResponse = {
        success: false,
        message: "User not authenticated",
      };
      res.status(401).json(response);
      return;
    }

    const goals = await prisma.goal.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
    });

    const response: GoalResponse = {
      success: true,
      message: "Goals retrieved successfully",
      data: { goals },
    };

    res.json(response);
  } catch (error: any) {
    console.error("Get goals error:", error);
    const response: GoalResponse = {
      success: false,
      message: error?.message ?? "Error retrieving goals",
    };
    res.status(500).json(response);
  }
});

// POST /api/goals - สร้างเป้าหมายใหม่
router.post(
  "/",
  authMiddleware,
  [
    body("title").isLength({ min: 1, max: 255 }).withMessage("Title must be 1-255 characters"),
    body("targetAmount").isFloat({ min: 0.01 }).withMessage("Target amount must be greater than 0"),
    body("currentAmount").optional().isFloat({ min: 0 }).withMessage("Current amount must be a non-negative number"),
    body("deadline").optional().isISO8601().withMessage("Deadline must be a valid date"),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      if (handleValidationErrors(req, res)) return;

      if (!req.user) {
        const response: GoalResponse = {
          success: false,
          message: "User not authenticated",
        };
        res.status(401).json(response);
        return;
      }

      const { title, targetAmount, currentAmount = 0, deadline }: CreateGoalRequest = req.body;

      const goalData: any = {
        userId: req.user.id,
        title,
        targetAmount,
        currentAmount,
      };

      if (deadline) {
        goalData.deadline = new Date(deadline);
      }

      const goal = await prisma.goal.create({
        data: goalData,
      });

      const response: GoalResponse = {
        success: true,
        message: "Goal created successfully",
        data: { goal },
      };

      res.status(201).json(response);
    } catch (error: any) {
      console.error("Create goal error:", error);
      const response: GoalResponse = {
        success: false,
        message: error?.message ?? "Error creating goal",
      };
      res.status(500).json(response);
    }
  }
);

// PUT /api/goals/:id/progress - อัพเดทความคืบหน้า
router.put(
  "/:id/progress",
  authMiddleware,
  [
    body("currentAmount").isFloat({ min: 0 }).withMessage("Current amount must be a non-negative number"),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      if (handleValidationErrors(req, res)) return;

      if (!req.user) {
        const response: GoalResponse = {
          success: false,
          message: "User not authenticated",
        };
        res.status(401).json(response);
        return;
      }

      const goalId = parseInt(req.params.id as string);
      if (isNaN(goalId)) {
        const response: GoalResponse = {
          success: false,
          message: "Invalid goal ID",
        };
        res.status(400).json(response);
        return;
      }

      const existingGoal = await prisma.goal.findFirst({
        where: { id: goalId, userId: req.user.id },
      });

      if (!existingGoal) {
        const response: GoalResponse = {
          success: false,
          message: "Goal not found or does not belong to user",
        };
        res.status(404).json(response);
        return;
      }

      const { currentAmount }: UpdateGoalProgressRequest = req.body;

      const updatedGoal = await prisma.goal.update({
        where: { id: goalId },
        data: { currentAmount },
      });

      const response: GoalResponse = {
        success: true,
        message: "Goal progress updated successfully",
        data: { goal: updatedGoal },
      };

      res.json(response);
    } catch (error: any) {
      console.error("Update goal progress error:", error);
      const response: GoalResponse = {
        success: false,
        message: error?.message ?? "Error updating goal progress",
      };
      res.status(500).json(response);
    }
  }
);

export default router;
