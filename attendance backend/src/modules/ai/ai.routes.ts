import express from 'express';
import { askAiAssistant } from './ai.controller.js';
import verifyJWT from '../../middleware/authMiddleware.js';

const router = express.Router();

// POST /api/v1/ai/chat
router.post('/chat', verifyJWT, askAiAssistant);

export default router;
