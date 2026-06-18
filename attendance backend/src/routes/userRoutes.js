import express from 'express';
import { register, fetchUsers, getMyTeam } from '../controllers/userController.js';
import verifyJWT, { allowedRoles } from '../middleware/authMiddleware.js';

const userRoutes = express.Router();

userRoutes.post('/register', verifyJWT, allowedRoles(['admin']), register);
userRoutes.get('/fetchusers', verifyJWT, fetchUsers);
userRoutes.get('/my-team', verifyJWT, allowedRoles(['manager']), getMyTeam);

export default userRoutes;