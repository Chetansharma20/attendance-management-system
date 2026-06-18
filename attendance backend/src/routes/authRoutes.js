import express from 'express';
import { login, logout, refreshToken } from '../controllers/authController.js';
import verifyJWT from '../middleware/authMiddleware.js';

const authRoutes = express.Router();

authRoutes.post('/login', login);
authRoutes.post('/logout', verifyJWT, logout);
authRoutes.post('/refresh', refreshToken);

export default authRoutes;
