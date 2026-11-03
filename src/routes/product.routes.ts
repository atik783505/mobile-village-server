import { Router } from 'express';
import {createProduct, getProductById, getProducts, updateProduct} from '../controllers/product.controllers';


const router = Router();

router.post('/', createProduct);
router.patch('/:id', updateProduct);
router.get('/', getProducts);
router.get('/:id', getProductById);

export default router;