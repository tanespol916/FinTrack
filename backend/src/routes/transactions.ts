import { Router, Response } from "express";
import { body, query, validationResult } from "express-validator";
import prisma from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";
import { AuthRequest } from "../types/auth";
import {
  CreateTransactionRequest,
  UpdateTransactionRequest,
  TransactionQuery,
  TransactionResponse,
} from "../types/transaction";

const router = Router();

// Helper function to update account balance based on all transactions
const updateAccountBalance = async (accountId: number): Promise<void> => {
  try {
    // Get all transactions for this account with category info
    const transactions = await prisma.transaction.findMany({
      where: { accountId },
      include: {
        category: true
      }
    });

    // Calculate balance as sum of all transaction effects
    // Income adds to balance, Expenses subtract from balance
    let calculatedBalance = 0;
    for (const tx of transactions) {
      const categoryType = tx.category as any;
      if (categoryType?.type === 'income') {
        calculatedBalance += tx.amount;
      } else {
        calculatedBalance -= tx.amount;
      }
    }

    // Update account balance with calculated value
    await prisma.account.update({
      where: { id: accountId },
      data: { balance: calculatedBalance }
    });
  } catch (error) {
    console.error("Error updating account balance:", error);
    throw error;
  }
};

const handleValidationErrors = (req: AuthRequest, res: Response): boolean => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const response: TransactionResponse = {
      success: false,
      message: "Validation failed",
      data: { errors: errors.array() },
    };
    res.status(400).json(response);
    return true;
  }
  return false;
};

// GET /api/transactions - ดูรายการทั้งหมด (filter by date, category)
router.get(
  "/",
  authMiddleware,
  [
    query("startDate").optional().isISO8601().withMessage("Start date must be a valid date"),
    query("endDate").optional().isISO8601().withMessage("End date must be a valid date"),
    query("categoryId").optional().isInt({ min: 1 }).withMessage("Category ID must be a positive integer"),
    query("accountId").optional().isInt({ min: 1 }).withMessage("Account ID must be a positive integer"),
    query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100"),
    query("offset").optional().isInt({ min: 0 }).withMessage("Offset must be a non-negative integer"),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      if (handleValidationErrors(req, res)) return;

      if (!req.user) {
        const response: TransactionResponse = {
          success: false,
          message: "User not authenticated",
        };
        res.status(401).json(response);
        return;
      }

      const {
        startDate,
        endDate,
        categoryId,
        accountId,
        limit = 50,
        offset = 0,
      } = req.query as TransactionQuery;

      const whereClause: any = {
        userId: req.user.id,
      };

      if (startDate || endDate) {
        whereClause.date = {};
        if (startDate) whereClause.date.gte = new Date(startDate);
        if (endDate) whereClause.date.lte = new Date(endDate);
      }

      if (categoryId) whereClause.categoryId = categoryId;
      if (accountId) whereClause.accountId = accountId;

      const [transactions, total] = await Promise.all([
        prisma.transaction.findMany({
          where: whereClause,
          include: {
            account: {
              select: { id: true, name: true, type: true },
            },
            category: {
              select: { id: true, name: true, type: true, icon: true, color: true },
            },
          },
          orderBy: { date: "desc" },
          take: Number(limit),
          skip: Number(offset),
        }),
        prisma.transaction.count({ where: whereClause }),
      ]);

      const response: TransactionResponse = {
        success: true,
        message: "Transactions retrieved successfully",
        data: {
          transactions,
          total,
        },
      };

      res.json(response);
    } catch (error: any) {
      console.error("Get transactions error:", error);
      const response: TransactionResponse = {
        success: false,
        message: error?.message ?? "Error retrieving transactions",
      };
      res.status(500).json(response);
    }
  }
);

// POST /api/transactions - เพิ่มรายการใหม่
router.post(
  "/",
  authMiddleware,
  [
    body("accountId").isInt({ min: 1 }).withMessage("Account ID must be a positive integer"),
    body("categoryId").isInt({ min: 1 }).withMessage("Category ID must be a positive integer"),
    body("amount").isFloat({ min: 0.01 }).withMessage("Amount must be greater than 0"),
    body("description").isLength({ min: 1, max: 255 }).withMessage("Description must be 1-255 characters"),
    body("date").optional().isISO8601().withMessage("Date must be a valid date"),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      if (handleValidationErrors(req, res)) return;

      if (!req.user) {
        const response: TransactionResponse = {
          success: false,
          message: "User not authenticated",
        };
        res.status(401).json(response);
        return;
      }

      const { accountId, categoryId, amount, description, date }: CreateTransactionRequest = req.body;

      // Verify account belongs to user
      const account = await prisma.account.findFirst({
        where: { id: accountId, userId: req.user.id },
      });

      if (!account) {
        const response: TransactionResponse = {
          success: false,
          message: "Account not found or does not belong to user",
        };
        res.status(404).json(response);
        return;
      }

      // Verify category exists
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
      });

      if (!category) {
        const response: TransactionResponse = {
          success: false,
          message: "Category not found",
        };
        res.status(404).json(response);
        return;
      }

      const transactionData: any = {
        accountId,
        categoryId,
        userId: req.user.id,
        amount,
        description,
      };

      if (date) {
        transactionData.date = new Date(date);
      }

      const transaction = await prisma.transaction.create({
        data: transactionData,
        include: {
          account: {
            select: { id: true, name: true, type: true },
          },
          category: {
            select: { id: true, name: true, type: true, icon: true, color: true },
          },
        },
      });

      // Update account balance
      await updateAccountBalance(accountId);

      const response: TransactionResponse = {
        success: true,
        message: "Transaction created successfully",
        data: { transaction },
      };

      res.status(201).json(response);
    } catch (error: any) {
      console.error("Create transaction error:", error);
      const response: TransactionResponse = {
        success: false,
        message: error?.message ?? "Error creating transaction",
      };
      res.status(500).json(response);
    }
  }
);

// PUT /api/transactions/:id - แก้ไขรายการ
router.put(
  "/:id",
  authMiddleware,
  [
    body("accountId").optional().isInt({ min: 1 }).withMessage("Account ID must be a positive integer"),
    body("categoryId").optional().isInt({ min: 1 }).withMessage("Category ID must be a positive integer"),
    body("amount").optional().isFloat({ min: 0.01 }).withMessage("Amount must be greater than 0"),
    body("description").optional().isLength({ min: 1, max: 255 }).withMessage("Description must be 1-255 characters"),
    body("date").optional().isISO8601().withMessage("Date must be a valid date"),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      if (handleValidationErrors(req, res)) return;

      if (!req.user) {
        const response: TransactionResponse = {
          success: false,
          message: "User not authenticated",
        };
        res.status(401).json(response);
        return;
      }

      const transactionId = parseInt(req.params.id as string);
      if (isNaN(transactionId)) {
        const response: TransactionResponse = {
          success: false,
          message: "Invalid transaction ID",
        };
        res.status(400).json(response);
        return;
      }

      // Check if transaction exists and belongs to user
      const existingTransaction = await prisma.transaction.findFirst({
        where: { id: transactionId, userId: req.user.id },
      });

      if (!existingTransaction) {
        const response: TransactionResponse = {
          success: false,
          message: "Transaction not found or does not belong to user",
        };
        res.status(404).json(response);
        return;
      }

      const updateData: UpdateTransactionRequest = req.body;

      // Verify account belongs to user if provided
      if (updateData.accountId) {
        const account = await prisma.account.findFirst({
          where: { id: updateData.accountId, userId: req.user.id },
        });

        if (!account) {
          const response: TransactionResponse = {
            success: false,
            message: "Account not found or does not belong to user",
          };
          res.status(404).json(response);
          return;
        }
      }

      // Verify category exists if provided
      if (updateData.categoryId) {
        const category = await prisma.category.findUnique({
          where: { id: updateData.categoryId },
        });

        if (!category) {
          const response: TransactionResponse = {
            success: false,
            message: "Category not found",
          };
          res.status(404).json(response);
          return;
        }
      }

      const transactionUpdateData: any = { ...updateData };
      if (updateData.date) {
        transactionUpdateData.date = new Date(updateData.date);
      }

      const updatedTransaction = await prisma.transaction.update({
        where: { id: transactionId },
        data: transactionUpdateData,
        include: {
          account: {
            select: { id: true, name: true, type: true },
          },
          category: {
            select: { id: true, name: true, type: true, icon: true, color: true },
          },
        },
      });

      // Update account balance (both old and new accounts if account changed)
      await updateAccountBalance(existingTransaction.accountId);
      if (updateData.accountId && updateData.accountId !== existingTransaction.accountId) {
        await updateAccountBalance(updateData.accountId);
      }

      const response: TransactionResponse = {
        success: true,
        message: "Transaction updated successfully",
        data: { transaction: updatedTransaction },
      };

      res.json(response);
    } catch (error: any) {
      console.error("Update transaction error:", error);
      const response: TransactionResponse = {
        success: false,
        message: error?.message ?? "Error updating transaction",
      };
      res.status(500).json(response);
    }
  }
);

// DELETE /api/transactions/:id - ลบรายการ
router.delete("/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      const response: TransactionResponse = {
        success: false,
        message: "User not authenticated",
      };
      res.status(401).json(response);
      return;
    }

    const transactionId = parseInt(req.params.id as string);
    if (isNaN(transactionId)) {
      const response: TransactionResponse = {
        success: false,
        message: "Invalid transaction ID",
      };
      res.status(400).json(response);
      return;
    }

    // Check if transaction exists and belongs to user
    const existingTransaction = await prisma.transaction.findFirst({
      where: { id: transactionId, userId: req.user.id },
    });

    if (!existingTransaction) {
      const response: TransactionResponse = {
        success: false,
        message: "Transaction not found or does not belong to user",
      };
      res.status(404).json(response);
      return;
    }

    await prisma.transaction.delete({
      where: { id: transactionId },
    });

    // Update account balance to reverse the transaction effect
    await updateAccountBalance(existingTransaction.accountId);

    const response: TransactionResponse = {
      success: true,
      message: "Transaction deleted successfully",
    };

    res.json(response);
  } catch (error: any) {
    console.error("Delete transaction error:", error);
    const response: TransactionResponse = {
      success: false,
      message: error?.message ?? "Error deleting transaction",
    };
    res.status(500).json(response);
  }
});

export default router;
