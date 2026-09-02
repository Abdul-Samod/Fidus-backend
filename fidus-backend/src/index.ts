import express from "express";
import cors from "cors";
import "dotenv/config";
import prisma from "./prisma.js";
import authRoutes from "./routes/auth.js";
import kycRoutes from "./routes/kyc.js";
import serviceRoutes from "./routes/services.js"
import bidRoutes from "./routes/bids.js";
import reviewsRoutes from './routes/reviews.js';
import escrowRoutes from './routes/escrow.js';



import { errorHandler } from './middleware/errorHandler.js';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const allowedOrigins = process.env.FRONTEND_URL ? [process.env.FRONTEND_URL, 'http://localhost:5173'] : true;
app.use(cors({ origin: allowedOrigins, credentials: true })); // Needs credentials: true for cookies
app.use(express.json());
app.use(cookieParser());

// Auth Routes
app.use('/api/auth', authRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/bids', bidRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/escrow', escrowRoutes);

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
    console.error("Database Health Check Failed:", error);
    res.status(500).json({
      status: 'error',
      message: 'Database connection failed.'
    });
  }
});

app.use(errorHandler);

// Start the server
app.listen(PORT, () => {
  console.log(`Fidus Engine running on http://localhost:${PORT}`);
});