import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/errorHandler.js';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new AppError('No token provided', 401);
    }

    const decoded = jwt.verify(token, config.security.jwtSecret) as { userId: string; email: string };
    const user = await User.findById(decoded.userId);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    req.user = { userId: user._id.toString(), email: user.email };
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('Invalid token', 401));
    } else {
      next(error);
    }
  }
};

// Optional authentication - allows requests with userEmail from Gmail Add-on
export const optionalAuthenticate = async (
  req: AuthRequest | any,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (token) {
      try {
        const decoded = jwt.verify(token, config.security.jwtSecret) as { userId: string; email: string };
        const user = await User.findById(decoded.userId);

        if (user) {
          req.user = { userId: user._id.toString(), email: user.email };
        }
      } catch (error) {
        // Invalid token - continue without auth
      }
    }
    
    // If no token but userEmail in body (from Gmail Add-on), we'll handle it in controllers
    next();
  } catch (error) {
    next();
  }
};

