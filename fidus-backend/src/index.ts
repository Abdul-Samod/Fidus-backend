import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import authRoutes from './routes/auth.js';
import kycRoutes from './routes/kyc.js';

// Setting up the raw PostgreSQL connection
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Auth Routes
app.use('/api/auth', authRoutes);
app.use('/api/kyc', kycRoutes);

// Health Check Endpoint
app.get('/api/health', async (req, res) => {
  try {
    // Pinging the database to check if it's awake
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ 
      status: 'success', 
      message: 'Fidus Backend is LIVE and securely connected to PostgreSQL!' 
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      message: 'Database connection failed.',
      details: error
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Fidus Engine running on http://localhost:${PORT}`);
});