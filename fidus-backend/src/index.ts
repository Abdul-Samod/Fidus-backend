import express from "express";
import cors from "cors";
import "dotenv/config";
import prisma from "./prisma.js";
import authRoutes from "./routes/auth.js";
import kycRoutes from "./routes/kyc.js";
import serviceRoutes from "./routes/services.js";
import bidRoutes from "./routes/bids.js";
import reviewsRoutes from "./routes/reviews.js";
import escrowRoutes from "./routes/escrow.js";
import { errorHandler } from "./middleware/errorHandler.js";
import cookieParser from "cookie-parser";

const app = express();
const PORT = process.env.PORT || 5000;

// Dynamic CORS configuration allowing localhost, production Vercel, and preview branches
const allowedOrigins = [
  'https://fidus-pi.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000'
];

if (process.env.FRONTEND_URL) {
  const custom = process.env.FRONTEND_URL.startsWith('http')
    ? process.env.FRONTEND_URL
    : `https://${process.env.FRONTEND_URL}`;
  if (!allowedOrigins.includes(custom)) {
    allowedOrigins.push(custom);
  }
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (mobile, curl, postman, server-to-server)
    if (!origin) return callback(null, true);
    
    // Check if origin matches allowed list or any Vercel deployment preview domain
    if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// Request logger for debugging production issues
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (res.statusCode >= 400) {
      console.warn(`[WARN] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// Application Routes
app.use('/api/auth', authRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/bids', bidRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/escrow', escrowRoutes);

// Upgraded Health Check Endpoint
app.get('/api/health', async (req, res) => {
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const latencyMs = Date.now() - start;

    res.status(200).json({
      status: 'success',
      message: 'Fidus Backend is LIVE and securely connected to PostgreSQL!',
      latency: `${latencyMs}ms`,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("Database Health Check Failed:", error);
    res.status(503).json({
      status: 'error',
      message: 'Database connection failed or database is paused.',
      error: error.message
    });
  }
});

// Global Error Handler
app.use(errorHandler);

// Start the server
app.listen(PORT, () => {
  console.log(`Fidus Engine running on http://localhost:${PORT}`);
});
