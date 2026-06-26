import express from 'express';
import { register, fetchUsers, getMyTeam, getUserProfile, uploadProfilePic, updateUser, deleteUser } from './user.controller.js';
import verifyJWT, { allowedRoles } from '../../middleware/authMiddleware.js';
import { upload } from '../../middleware/uploadMiddleware.js';

const router = express.Router();

router.post('/register', verifyJWT, allowedRoles(['admin']), upload.single('profilePic') as any, register);
router.get('/fetchusers', verifyJWT, fetchUsers);
router.get('/my-team', verifyJWT, allowedRoles(['manager']), getMyTeam);
router.get('/profile/:id', verifyJWT, allowedRoles(['admin', 'manager']), getUserProfile);
router.post('/upload-profile-pic', verifyJWT, upload.single('profilePic') as any, uploadProfilePic);
router.patch('/:id', verifyJWT, allowedRoles(['admin']) as any, updateUser as any);
router.delete('/:id', verifyJWT, allowedRoles(['admin']) as any, deleteUser as any);

export default router;
