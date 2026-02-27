import { Router, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { body, validationResult } from "express-validator";
import prisma from "../lib/prisma";
import {
  AuthRequest,
  RegisterRequest,
  LoginRequest,
  AuthResponse,
} from "../types/auth";
import { authMiddleware } from "../middleware/auth";
import dotenv from "dotenv";
dotenv.config();

const router = Router();

const generateToken = (userId: number, username: string): string => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined");
  }

  return jwt.sign({ userId, username }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

const handleValidationErrors = (req: AuthRequest, res: Response): boolean => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      data: { errors: errors.array() },
    });
    return true;
  }
  return false;
};

router.post(
  "/register",
  [
    body("username")
      .isLength({ min: 3, max: 50 })
      .withMessage("Username must be 3-50 characters long")
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage(
        "Username can only contain letters, numbers, and underscores",
      ),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long"),
    body("name")
      .isLength({ min: 1, max: 100 })
      .withMessage("Name must be 1-100 characters long"),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      if (handleValidationErrors(req, res)) return;

      const { username, password, name }: RegisterRequest = req.body;

      const existingUser = await prisma.user.findUnique({
        where: { username },
      });

      if (existingUser) {
        const response: AuthResponse = {
          success: false,
          message: "Username already exists",
        };
        res.status(409).json(response);
        return;
      }

      const hashedPassword = await bcrypt.hash(password, 12);

      const user = await prisma.user.create({
        data: {
          username,
          password: hashedPassword,
          name,
        },
      });

      const token = generateToken(user.id, user.username);

      const { password: _, ...userWithoutPassword } = user;

      const response: AuthResponse = {
        success: true,
        message: "Registration successful",
        data: {
          user: userWithoutPassword,
          token,
        },
      };

      res.status(201).json(response);
    } catch (error: any) {
      console.error("Register error:", error);
      const response: AuthResponse = {
        success: false,
        message: String(error?.message ?? error),
      };
      res.status(500).json(response);
    }
  },
);

router.post(
  "/login",
  [
    body("username").notEmpty().withMessage("Username is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      if (handleValidationErrors(req, res)) return;

      const { username, password }: LoginRequest = req.body;

      const user = await prisma.user.findUnique({
        where: { username },
      });

      if (!user) {
        const response: AuthResponse = {
          success: false,
          message: "Invalid username or password",
        };
        res.status(401).json(response);
        return;
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        const response: AuthResponse = {
          success: false,
          message: "Invalid username or password",
        };
        res.status(401).json(response);
        return;
      }

      const token = generateToken(user.id, user.username);

      const { password: _, ...userWithoutPassword } = user;

      const response: AuthResponse = {
        success: true,
        message: "Login successful",
        data: {
          user: userWithoutPassword,
          token,
        },
      };

      res.json(response);
    } catch (error: any) {
      console.error("Login error:", error);
      const response: AuthResponse = {
        success: false,
        message: error?.message ?? "Error during login",
      };
      res.status(500).json(response);
    }
  },
);

router.get("/me", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      const response: AuthResponse = {
        success: false,
        message: "User not found",
      };
      res.status(401).json(response);
      return;
    }

    const response: AuthResponse = {
      success: true,
      message: "User data retrieved successfully",
      data: {
        user: req.user,
      },
    };

    res.json(response);
  } catch (error) {
    console.error("Get user error:", error);
    const response: AuthResponse = {
      success: false,
      message: "Error retrieving user data",
    };
    res.status(500).json(response);
  }
});

export default router;
