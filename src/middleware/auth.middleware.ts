import { Request, Response, NextFunction } from 'express';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'] as string | undefined;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized. Please login.',
    });
  }

  (req as any).user = { id: userId };
  next();
};
