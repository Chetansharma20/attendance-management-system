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

server.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true, // allow cookies to be sent cross-origin
}));
server.use(express.json());
server.use(cookieParser());

// Setup logging middleware (Console + access.log file)
setupLogger(server);

// Routes
server.use('/api/v1', apiRouter);

server.get('/', (req, res) => {
  res.send('Hello world');
});

// Global Error Handler
server.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`server running on port ${PORT}`);
});