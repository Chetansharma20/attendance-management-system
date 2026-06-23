import express from 'express';
import { login, logout, refreshToken } from './auth.controller.js';
import verifyJWT from '../../middleware/authMiddleware.js';

const router = express.Router();

router.post('/login', login);
router.post('/logout', verifyJWT, logout);
router.post('/refresh', refreshToken);

export default router;
