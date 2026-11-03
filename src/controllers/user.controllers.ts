import { Request, Response } from 'express';
import prisma from '../config/prisma';

export const createUser = async (req: Request, res: Response) => {
  try {
    const { name, email } = req.body;

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
      },
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully!',
      data: newUser,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Something went wrong',
    });
  }
};

// ২. সব ইউজার গেট করার Controller
export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany();
    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};