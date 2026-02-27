import dotenv from 'dotenv';
dotenv.config()
import express from 'express';
import cors from 'cors';
import prisma from './lib/prisma';

import authRoutes from './routes/auth';
import transactionRoutes from './routes/transactions';
import accountRoutes from './routes/accounts';
import categoryRoutes from './routes/categories';
import budgetRoutes from './routes/budgets';
import goalRoutes from './routes/goals';
import { authMiddleware } from './middleware/auth';
import { AuthRequest } from './types/auth';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/goals', goalRoutes);

app.get('/api/test', async (req, res) => {
  try {
    const userCount = await prisma.user.count();
    res.json({ message: 'Database connected!', userCount });
  } catch (error: any) {
    res.status(500).json({ error: String(error) });
  }
});

app.get('/api/protected', authMiddleware, async (req: AuthRequest, res) => {
  res.json({ 
    message: 'Protected route accessed successfully!', 
    user: req.user 
  });
});

export default app;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
  });
}