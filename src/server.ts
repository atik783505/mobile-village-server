// src/server.ts
import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import prisma from './config/prisma';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Test Route
app.get('/', (req: Request, res: Response) => {
  res.json({ message: "Mobile Village Server is running successfully!" });
});

// Server & Database Connection Check
app.listen(PORT, async () => {
  try {
    await prisma.$connect();
    console.log(`Database connected successfully via Prisma!`);
    console.log(`Server is running on port ${PORT}`);
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
  }
});