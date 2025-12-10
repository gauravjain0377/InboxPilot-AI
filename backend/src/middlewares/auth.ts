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

// Optional authentication - allows requests without token (for extension use)
export const optionalAuthenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      // No token provided - allow request to proceed (for extension)
      req.user = undefined;
      next();
      return;
    }

    try {
      const decoded = jwt.verify(token, config.security.jwtSecret) as { userId: string; email: string };
      const user = await User.findById(decoded.userId);

      if (user) {
        req.user = { userId: user._id.toString(), email: user.email };
      }
    } catch (error) {
      // Invalid token - allow request to proceed without auth (for extension)
      req.user = undefined;
    }
    
    next();
  } catch (error) {
    // On any error, allow request to proceed (for extension)
    req.user = undefined;
    next();
  }
};

