import { Request } from 'express';
import { User } from '../generated/prisma/client';

export interface JWTPayload {
  userId: number;
  username: string;
  iat: number;
  exp: number;
}

export interface AuthRequest extends Request {
  user?: Omit<User, 'password'>;
}

export interface RegisterRequest {
  username: string;
  password: string;
  name: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user?: Omit<User, 'password'>;
    token?: string;
  };
}

export interface UserResponse {
  id: number;
  username: string;
  name: string;
  discord_id?: string;
  createdAt: Date;
  updatedAt: Date;
}
