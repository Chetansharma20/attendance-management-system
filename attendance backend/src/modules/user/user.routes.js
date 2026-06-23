import express from 'express';
import { register, fetchUsers, getMyTeam } from './user.controller.js';
import verifyJWT, { allowedRoles } from '../../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', verifyJWT, allowedRoles(['admin']), register);
router.get('/fetchusers', verifyJWT, fetchUsers);
router.get('/my-team', verifyJWT, allowedRoles(['manager']), getMyTeam);

export default router;
