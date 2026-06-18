import express from 'express';
import verifyJWT from '../middleware/authMiddleware.js';
import { getMyReport, getTeamReport, getAllReport, generateDailyReportPDF } from '../services/reportServices.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';

const reportRoutes = express.Router();

reportRoutes.get('/daily-pdf', verifyJWT, asyncHandler(async (req, res) => {
  const { date, status } = req.query;
  const user = req.user;

  if (!date) {
    throw new ApiError(400, "Date parameter is required (YYYY-MM-DD)");
  }

  let logs;

  // Dynamically select reporting query service based on secure user role
  if (user.role === 'admin') {
    logs = await getAllReport({ date, status });
  } else if (user.role === 'manager') {
    logs = await getTeamReport(user._id, { date });
  } else {
    logs = await getMyReport(user._id, { date });
  }

  // Generate official PDF document via backend buffer stream
  const pdfBuffer = await generateDailyReportPDF(date, logs, user.name);

  // Set streaming properties
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="daily-attendance-report-${date}.pdf"`);
  res.send(pdfBuffer);
}));

export default reportRoutes;
