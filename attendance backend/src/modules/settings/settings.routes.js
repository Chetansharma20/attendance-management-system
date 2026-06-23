import express from 'express';
import { getGeofence, updateGeofence } from './settings.controller.js';
import verifyJWT, { allowedRoles } from '../../middleware/authMiddleware.js';

const router = express.Router();

router.get('/geofence', verifyJWT, getGeofence);
router.put('/geofence', verifyJWT, allowedRoles(['admin']), updateGeofence);

export default router;
