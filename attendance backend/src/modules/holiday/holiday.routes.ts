import express from 'express';
import verifyJWT, { allowedRoles } from '../../middleware/authMiddleware.js';
import { getAllHolidays, createHoliday, deleteHoliday, syncHolidays, clearAllHolidays } from './holiday.controller.js';

const router = express.Router();

router.get('/all', verifyJWT as any, getAllHolidays as any);
router.post('/create', verifyJWT as any, allowedRoles(['admin']) as any, createHoliday as any);
router.post('/sync', verifyJWT as any, allowedRoles(['admin']) as any, syncHolidays as any);
router.delete('/clear', verifyJWT as any, allowedRoles(['admin']) as any, clearAllHolidays as any);
router.delete('/:id', verifyJWT as any, allowedRoles(['admin']) as any, deleteHoliday as any);

export default router;
