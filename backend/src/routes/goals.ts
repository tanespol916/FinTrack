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
    body("targetAmount").optional().isFloat({ min: 0 }).withMessage("Target amount must be 0 or greater"),
    body("currentAmount").optional().isFloat({ min: 0 }).withMessage("Current amount must be 0 or greater"),
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

      const { title, targetAmount = 0, currentAmount = 0, deadline } = req.body;

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

// POST /api/goals/:id/fund - เติมเงินเข้าเป้าหมาย
router.post(
  "/:id/fund",
  authMiddleware,
  [
    body("amount").isFloat({ min: 0.01 }).withMessage("จำนวนเงินต้องมากกว่า 0"),
    body("accountId").isInt({ min: 1 }).withMessage("รหัสบัญชีต้องเป็นจำนวนเต็มบวก"),
    body("description").optional().isLength({ min: 1, max: 255 }).withMessage("คำอธิบายต้องมีความยาว 1-255 ตัวอักษร"),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      if (handleValidationErrors(req, res)) return;

      if (!req.user) {
        const response: GoalResponse = {
          success: false,
          message: "ผู้ใช้ไม่ได้รับการรับรอง",
        };
        res.status(401).json(response);
        return;
      }

      const goalId = parseInt(req.params.id as string);
      if (isNaN(goalId)) {
        const response: GoalResponse = {
          success: false,
          message: "รหัสเป้าหมายไม่ถูกต้อง",
        };
        res.status(400).json(response);
        return;
      }

      const { amount, accountId, description } = req.body;

      // ตรวจสอบว่าเป้าหมายมีอยู่และเป็นของผู้ใช้
      const goal = await prisma.goal.findFirst({
        where: { id: goalId, userId: req.user.id },
      });

      if (!goal) {
        const response: GoalResponse = {
          success: false,
          message: "ไม่พบเป้าหมายหรือเป้าหมายไม่ใช่ของผู้ใช้",
        };
        res.status(404).json(response);
        return;
      }

      // ตรวจสอบว่าบัญชีมีอยู่และเป็นของผู้ใช้
      const account = await prisma.account.findFirst({
        where: { id: accountId, userId: req.user.id },
      });

      if (!account) {
        const response: GoalResponse = {
          success: false,
          message: "ไม่พบบัญชีหรือบัญชีไม่ใช่ของผู้ใช้",
        };
        res.status(404).json(response);
        return;
      }

      // ตรวจสอบว่าบัญชีมีเงินพอ
      if (account.balance < amount) {
        const response: GoalResponse = {
          success: false,
          message: "ยอดเงินในบัญชีไม่เพียงพอ",
        };
        res.status(400).json(response);
        return;
      }

      // ตรวจสอบว่าไม่เกินเป้าหมาย
      if (goal.targetAmount > 0 && goal.currentAmount + amount > goal.targetAmount) {
        const response: GoalResponse = {
          success: false,
          message: "จำนวนเงินเกินเป้าหมายที่กำหนด",
        };
        res.status(400).json(response);
        return;
      }

      // หักเงินจากบัญชี
      await prisma.account.update({
        where: { id: accountId },
        data: { balance: account.balance - amount },
      });

      // เพิ่มเงินเข้าเป้าหมาย
      const updatedGoal = await prisma.goal.update({
        where: { id: goalId },
        data: { currentAmount: goal.currentAmount + amount },
      });

      const response: GoalResponse = {
        success: true,
        message: "เติมเงินเข้าเป้าหมายสำเร็จ",
        data: { 
          goal: updatedGoal,
          account: { ...account, balance: account.balance - amount }
        },
      };

      res.json(response);
    } catch (error: any) {
      console.error("Fund goal error:", error);
      const response: GoalResponse = {
        success: false,
        message: error?.message ?? "เกิดข้อผิดพลาดในการเติมเงินเข้าเป้าหมาย",
      };
      res.status(500).json(response);
    }
  }
);

// DELETE /api/goals/:id - ลบเป้าหมาย
router.delete("/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      const response: GoalResponse = {
        success: false,
        message: "ผู้ใช้ไม่ได้รับการรับรอง",
      };
      res.status(401).json(response);
      return;
    }

    const goalId = parseInt(req.params.id as string);
    if (isNaN(goalId)) {
      const response: GoalResponse = {
        success: false,
        message: "รหัสเป้าหมายไม่ถูกต้อง",
      };
      res.status(400).json(response);
      return;
    }

    // ตรวจสอบว่าเป้าหมายมีอยู่และเป็นของผู้ใช้
    const goal = await prisma.goal.findFirst({
      where: { id: goalId, userId: req.user.id },
    });

    if (!goal) {
      const response: GoalResponse = {
        success: false,
        message: "ไม่พบเป้าหมายหรือเป้าหมายไม่ใช่ของผู้ใช้",
      };
      res.status(404).json(response);
      return;
    }

    // ถ้ามีเงินในเป้าหมาย ให้คืนคืนกลับบัญชีแรกกแรก
    if (goal.currentAmount > 0) {
      // หาบัญชีแรกแรกของผู้ใช้เพื่อคืนเงินคืน
      const accounts = await prisma.account.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: "asc" },
      });

      if (accounts.length > 0) {
        // คืนเงินไปบัญชีแรกแรก (บัญชีแรกแรก)
        const firstAccount = accounts[0]!;
        await prisma.account.update({
          where: { id: firstAccount.id },
          data: { balance: firstAccount.balance + goal.currentAmount },
        });
      }
    }

    // ลบเป้าหมาย
    await prisma.goal.delete({
      where: { id: goalId },
    });

    const response: GoalResponse = {
      success: true,
      message: goal.currentAmount > 0 
        ? `ลบเป้าหมายสำเร็จและคืนเงิน ${goal.currentAmount} กลับบัญชี` 
        : "ลบเป้าหมายสำเร็จ",
    };

    res.json(response);
  } catch (error: any) {
    console.error("Delete goal error:", error);
    const response: GoalResponse = {
      success: false,
      message: error?.message ?? "เกิดข้อผิดพลาดในการลบเป้าหมาย",
    };
    res.status(500).json(response);
  }
});

export default router;
