import { Router, Response } from "express";
import { body, validationResult } from "express-validator";
import prisma from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";
import { AuthRequest } from "../types/auth";
import {
  CreateAccountRequest,
  UpdateAccountRequest,
  AccountResponse,
} from "../types/account";

const router = Router();

const handleValidationErrors = (req: AuthRequest, res: Response): boolean => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const response: AccountResponse = {
      success: false,
      message: "Validation failed",
      data: { errors: errors.array() },
    };
    res.status(400).json(response);
    return true;
  }
  return false;
};

// GET /api/accounts - ดูบัญชีทั้งหมด
router.get("/", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      const response: AccountResponse = {
        success: false,
        message: "User not authenticated",
      };
      res.status(401).json(response);
      return;
    }

    const accounts = await prisma.account.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "asc" },
    });

    const response: AccountResponse = {
      success: true,
      message: "Accounts retrieved successfully",
      data: { accounts },
    };

    res.json(response);
  } catch (error: any) {
    console.error("Get accounts error:", error);
    const response: AccountResponse = {
      success: false,
      message: error?.message ?? "Error retrieving accounts",
    };
    res.status(500).json(response);
  }
});

// POST /api/accounts - สร้างบัญชีใหม่
router.post(
  "/",
  authMiddleware,
  [
    body("name").isLength({ min: 1, max: 100 }).withMessage("Name must be 1-100 characters"),
    body("type").isLength({ min: 1, max: 50 }).withMessage("Type must be 1-50 characters"),
    body("balance").optional().isFloat({ min: 0 }).withMessage("Balance must be a non-negative number"),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      if (handleValidationErrors(req, res)) return;

      if (!req.user) {
        const response: AccountResponse = {
          success: false,
          message: "User not authenticated",
        };
        res.status(401).json(response);
        return;
      }

      const { name, type, balance = 0 }: CreateAccountRequest = req.body;

      const account = await prisma.account.create({
        data: {
          userId: req.user.id,
          name,
          type,
          balance,
        },
      });

      const response: AccountResponse = {
        success: true,
        message: "Account created successfully",
        data: { account },
      };

      res.status(201).json(response);
    } catch (error: any) {
      console.error("Create account error:", error);
      const response: AccountResponse = {
        success: false,
        message: error?.message ?? "Error creating account",
      };
      res.status(500).json(response);
    }
  }
);

// PUT /api/accounts/:id - แก้ไขบัญชี
router.put(
  "/:id",
  authMiddleware,
  [
    body("name").optional().isLength({ min: 1, max: 100 }).withMessage("Name must be 1-100 characters"),
    body("type").optional().isLength({ min: 1, max: 50 }).withMessage("Type must be 1-50 characters"),
    body("balance").optional().isFloat({ min: 0 }).withMessage("Balance must be a non-negative number"),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      if (handleValidationErrors(req, res)) return;

      if (!req.user) {
        const response: AccountResponse = {
          success: false,
          message: "User not authenticated",
        };
        res.status(401).json(response);
        return;
      }

      const accountId = parseInt(req.params.id as string);
      if (isNaN(accountId)) {
        const response: AccountResponse = {
          success: false,
          message: "Invalid account ID",
        };
        res.status(400).json(response);
        return;
      }

      const existingAccount = await prisma.account.findFirst({
        where: { id: accountId, userId: req.user.id },
      });

      if (!existingAccount) {
        const response: AccountResponse = {
          success: false,
          message: "Account not found or does not belong to user",
        };
        res.status(404).json(response);
        return;
      }

      const updateData: UpdateAccountRequest = req.body;

      const updatedAccount = await prisma.account.update({
        where: { id: accountId },
        data: updateData,
      });

      const response: AccountResponse = {
        success: true,
        message: "Account updated successfully",
        data: { account: updatedAccount },
      };

      res.json(response);
    } catch (error: any) {
      console.error("Update account error:", error);
      const response: AccountResponse = {
        success: false,
        message: error?.message ?? "Error updating account",
      };
      res.status(500).json(response);
    }
  }
);

// GET /api/accounts/:id/balance - ดูยอดคงเหลือ
router.get("/:id/balance", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      const response: AccountResponse = {
        success: false,
        message: "User not authenticated",
      };
      res.status(401).json(response);
      return;
    }

    const accountId = parseInt(req.params.id as string);
    if (isNaN(accountId)) {
      const response: AccountResponse = {
        success: false,
        message: "Invalid account ID",
      };
      res.status(400).json(response);
      return;
    }

    const account = await prisma.account.findFirst({
      where: { id: accountId, userId: req.user.id },
    });

    if (!account) {
      const response: AccountResponse = {
        success: false,
        message: "Account not found or does not belong to user",
      };
      res.status(404).json(response);
      return;
    }

    const response: AccountResponse = {
      success: true,
      message: "Balance retrieved successfully",
      data: { balance: account.balance },
    };

    res.json(response);
  } catch (error: any) {
    console.error("Get balance error:", error);
    const response: AccountResponse = {
      success: false,
      message: error?.message ?? "Error retrieving balance",
    };
    res.status(500).json(response);
  }
});

// POST /api/accounts/transfer - ย้ายเงินระหว่างบัญชี
router.post(
  "/transfer",
  authMiddleware,
  [
    body("fromAccountId").isInt({ min: 1 }).withMessage("รหัสบัญชีต้นทางต้องเป็นจำนวนเต็มบวก"),
    body("toAccountId").isInt({ min: 1 }).withMessage("รหัสบัญชีปลายทางต้องเป็นจำนวนเต็มบวก"),
    body("amount").isFloat({ min: 0.01 }).withMessage("จำนวนเงินต้องมากกว่า 0"),
    
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      if (handleValidationErrors(req, res)) return;

      if (!req.user) {
        const response: AccountResponse = {
          success: false,
          message: "ผู้ใช้ไม่ได้รับการรับรอง",
        };
        res.status(401).json(response);
        return;
      }

      const { fromAccountId, toAccountId, amount } = req.body;

      // ตรวจสอบว่าไม่ได้ย้ายไปบัญชีเดียวกัน
      if (fromAccountId === toAccountId) {
        const response: AccountResponse = {
          success: false,
          message: "ไม่สามารถย้ายเงินไปบัญชีเดียวกันได้",
        };
        res.status(400).json(response);
        return;
      }

      // ตรวจสอบบัญชีต้นทาง
      const fromAccount = await prisma.account.findFirst({
        where: { id: fromAccountId, userId: req.user.id },
      });

      if (!fromAccount) {
        const response: AccountResponse = {
          success: false,
          message: "ไม่พบบัญชีต้นทางหรือบัญชีไม่ใช่ของผู้ใช้",
        };
        res.status(404).json(response);
        return;
      }

      // ตรวจสอบบัญชีปลายทาง
      const toAccount = await prisma.account.findFirst({
        where: { id: toAccountId, userId: req.user.id },
      });

      if (!toAccount) {
        const response: AccountResponse = {
          success: false,
          message: "ไม่พบบัญชีปลายทางหรือบัญชีไม่ใช่ของผู้ใช้",
        };
        res.status(404).json(response);
        return;
      }

      // ตรวจสอบว่าบัญชีต้นทางมีเงินพอ
      if (fromAccount.balance < amount) {
        const response: AccountResponse = {
          success: false,
          message: "ยอดเงินในบัญชีต้นทางไม่เพียงพอ",
        };
        res.status(400).json(response);
        return;
      }

      // ทำการย้ายเงิน
      const [updatedFromAccount, updatedToAccount] = await prisma.$transaction([
        prisma.account.update({
          where: { id: fromAccountId },
          data: { balance: fromAccount.balance - amount },
        }),
        prisma.account.update({
          where: { id: toAccountId },
          data: { balance: toAccount.balance + amount },
        }),
      ]);

      const response: AccountResponse = {
        success: true,
        message: `ย้ายเงิน ${amount} จาก ${fromAccount.name} ไปยัง ${toAccount.name} สำเร็จ`,
        data: {
          fromAccount: updatedFromAccount,
          toAccount: updatedToAccount,
        },
      };

      res.json(response);
    } catch (error: any) {
      console.error("Transfer error:", error);
      const response: AccountResponse = {
        success: false,
        message: error?.message ?? "เกิดข้อผิดพลาดในการย้ายเงิน",
      };
      res.status(500).json(response);
    }
  }
);

export default router;
