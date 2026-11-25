import { Router } from 'express';
import { createOrder, getAllOrdersForAdmin, getUserOrders } from '../controllers/ordercontroller';

// import { verifyAuth, verifyAdmin } from '../middlewares/auth.middleware';

const router = Router();

router.post('/create', createOrder);       
router.get('/my-orders', getUserOrders);   
router.get('/admin/all', getAllOrdersForAdmin); 

export default router;