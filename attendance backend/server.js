import express from 'express';
import 'dotenv/config';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import connectDB from './src/config/db.js';
import { setupLogger } from './src/middleware/loggerMiddleware.js';
import { errorHandler } from './src/middleware/errorMiddleware.js';
import apiRouter from './src/routes/index.js';

const server = express();

connectDB();

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
];

// Add all CLIENT_URL values from env (comma-separated supported)
if (process.env.CLIENT_URL) {
  process.env.CLIENT_URL.split(',').forEach((url) => {
    allowedOrigins.push(url.trim().replace(/\/$/, ''));
  });
}

server.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl, Postman)
    if (!origin) return callback(null, true);

    // Allow any vercel.app subdomain for this project
    const isVercel = /^https:\/\/attendance-management-system.*\.vercel\.app$/.test(origin);

    if (allowedOrigins.includes(origin) || isVercel) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
}));
server.use(express.json());
server.use(cookieParser());

setupLogger(server);


server.use('/api/v1', apiRouter);

server.get('/', (req, res) => {
  res.send('Hello world');
});


server.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`server running on port ${PORT}`);
});