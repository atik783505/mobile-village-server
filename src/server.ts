import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import prisma from './config/prisma';
import userRoutes from './routes/user.routes';
import productRoutes from './routes/product.routes';
import cartRoutes from './routes/cart.routes';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  process.env.CLIENT_URL,
].filter(Boolean) as string[];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  allowedHeaders: ['Content-Type', 'x-user-id'],
}));

app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.json({ message: "Mobile Village Server is running successfully!" });
});

app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);

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
