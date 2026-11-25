import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';

// x-user-id header theke userId ber kore DB te validate kore req.user set kore
export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'] as string | undefined;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized. Please login.',
    });
  }

  // DB te user exist kore kina verify koro
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized. User not found.',
    });
  }

  (req as any).user = { id: user.id, role: user.role };
  next();
};

// req.user.role === 'admin' check kore
export const adminMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const role = (req as any).user?.role;

  if (role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Forbidden. Admin access only.',
    });
  }

  next();
};
