import { Router } from 'express';
import { createUser, getUsers } from '../controllers/user.controllers';


const router = Router();

// POST http://localhost:5000/api/users (ইউজার তৈরি করার জন্য)
router.post('/', createUser);

// GET http://localhost:5000/api/users (সব ইউজার দেখার জন্য)
router.get('/', getUsers);

export default router;