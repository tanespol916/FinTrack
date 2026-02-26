import 'dotenv/config';
import express from 'express';
import { PrismaClient } from './generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const app = express();
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
// @ts-ignore
const prisma = new PrismaClient({ adapter });
const PORT = process.env.PORT;
app.use(express.json());

// Test route
app.get('/api/test', async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.json({ message: 'Database connected!', users });
  } catch (error: any) {
    res.status(500).json({ error: String(error) });
  }
});

app.listen(PORT, () => {
    console.log("Server started on port 4000");
});