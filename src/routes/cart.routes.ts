import { Router } from 'express';
import { addToCart, getCart, removeFromCart, syncCart } from '../controllers/cart.controllers';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// সব cart route এ auth middleware লাগবে
router.use(authMiddleware);

router.get('/', getCart);
router.post('/add', addToCart);
router.delete('/item/:itemId', removeFromCart);
router.post('/sync', syncCart);

export default router;
