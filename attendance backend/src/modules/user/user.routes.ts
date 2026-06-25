import express from 'express';
import { register, fetchUsers, getMyTeam, getUserProfile } from './user.controller.js';
import verifyJWT, { allowedRoles } from '../../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', verifyJWT, allowedRoles(['admin']), register);
router.get('/fetchusers', verifyJWT, fetchUsers);
router.get('/my-team', verifyJWT, allowedRoles(['manager']), getMyTeam);
router.get('/profile/:id', verifyJWT, allowedRoles(['admin', 'manager']), getUserProfile);

export default router;
