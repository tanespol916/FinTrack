import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { AuthRequest, JWTPayload } from '../types/auth';

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'No token provided or invalid format'
      });
      return;
    }

    const token = authHeader.substring(7);

    if (!process.env.JWT_SECRET) {
      res.status(500).json({
        success: false,
        message: 'JWT_SECRET is not configured on server'
      });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as JWTPayload;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User not found in system'
      });
      return;
    }

    const { password, ...userWithoutPassword } = user;
    req.user = userWithoutPassword;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        message: 'Token has expired'
      });
    } else if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    } else {
      console.error('Auth middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Error verifying token'
      });
    }
  }
};
