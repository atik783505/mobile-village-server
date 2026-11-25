import { Router } from 'express';
import {
  createOrder,
  createGuestOrder,
  getAllOrdersForAdmin,
  getUserOrders,
  updateOrderStatus,
} from '../controllers/ordercontroller';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Logged-in user — DB cart থেকে order
router.post('/create', authMiddleware, createOrder);

// Guest user — body items থেকে order (auth লাগে না)
router.post('/guest', createGuestOrder);

// User নিজের orders
router.get('/my-orders', authMiddleware, getUserOrders);

// Admin
router.get('/admin/all', authMiddleware, adminMiddleware, getAllOrdersForAdmin);
router.patch('/admin/:orderId/status', authMiddleware, adminMiddleware, updateOrderStatus);

export default router;
