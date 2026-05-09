import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import { config } from './config/env';
import authRoutes      from './routes/auth.routes';
import warehouseRoutes from './routes/warehouse.routes';
import disasterRoutes  from './routes/disaster.routes';
import documentRoutes  from './routes/document.routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.middleware';
import blockchainRoutes from './routes/blockchain.routes';

const app = express();

// ── Security headers ───────────────────────────────────────────
app.use(helmet());

// ── CORS ───────────────────────────────────────────────────────
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (Postman, server-to-server, curl)
      if (!origin) return callback(null, true);
      if (config.cors.allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ── Body parsing ───────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── Logging ────────────────────────────────────────────────────
app.use(morgan(config.server.isDev ? 'dev' : 'combined'));

// ── Rate limiting ──────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // Stricter limit on auth endpoints
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts, please try again later.' },
});

app.use(globalLimiter);

// ── Health check ───────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: config.server.nodeEnv,
  });
});

// ── API routes ─────────────────────────────────────────────────
app.use('/api/auth',       authLimiter, authRoutes);
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/disasters',  disasterRoutes);
app.use('/api/documents',  documentRoutes);
app.use('/api/blockchain', blockchainRoutes);

// ── 404 & error handling ───────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

export default app;