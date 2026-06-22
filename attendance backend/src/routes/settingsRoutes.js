import express from 'express';
import { getGeofence, updateGeofence } from '../controllers/settingsController.js';
import verifyJWT, { allowedRoles } from '../middleware/authMiddleware.js';

const settingsRoutes = express.Router();

settingsRoutes.get('/geofence', verifyJWT, getGeofence);
settingsRoutes.put('/geofence', verifyJWT, allowedRoles(['admin']), updateGeofence);

export default settingsRoutes;
