import { Router } from 'express';
import { getUsers } from '../controllers/user.controllers';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Admin only — সব user দেখা
router.get('/', authMiddleware, adminMiddleware, getUsers);

export default router;
