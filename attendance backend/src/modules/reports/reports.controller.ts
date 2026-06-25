import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import {
  getMyReport,
  getTeamReport,
  getAllReport,
  generateDailyReportPDF,
  getMonthlyReportDataService,
  generateMonthlyCSVService,
  generateMonthlyReportPDF,
  getTodayStatsService
} from "./reports.service.js";
import { findDepartmentById } from "../department/department.repository.js";

export const getDailyPDFReport = asyncHandler(async (req: Request, res: Response) => {
  const { date, status } = req.query as { date?: string; status?: string };
  const user = (req as any).user;

  if (!date) throw new ApiError(400, "Date parameter is required (YYYY-MM-DD)");

  let logs;
  if (user.role === 'admin') {
    logs = await getAllReport({ date, status });
  } else if (user.role === 'manager') {
    logs = await getTeamReport(user._id, { date });
  } else {
    logs = await getMyReport(user._id, { date });
  }

  const pdfBuffer = await generateDailyReportPDF(date, logs, user.name);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="daily-attendance-report-${date}.pdf"`);
  res.send(pdfBuffer);
});

export const getMonthlyReport = asyncHandler(async (req: Request, res: Response) => {
  const { month, format, departmentId } = req.query as { month?: string; format?: string; departmentId?: string };
  const user = (req as any).user;

  if (!month) throw new ApiError(400, "Month parameter is required (YYYY-MM)");
  if (!format || !["pdf", "csv", "json"].includes(format)) {
    throw new ApiError(400, "Format parameter is required and must be either 'pdf', 'csv', or 'json'");
  }

  // Only admins can filter by department
  const deptFilter = user.role === "admin" ? departmentId : undefined;
  const data = await getMonthlyReportDataService(user._id, user.role, month, deptFilter);

  // Resolve department name for file label
  let departmentName: string | undefined;
  if (deptFilter) {
    const dept = await findDepartmentById(deptFilter);
    departmentName = dept?.name;
  }

  const fileSuffix = departmentName ? `${month}-${departmentName.replace(/\s+/g, '_')}` : month;

  if (format === "csv") {
    const csvContent = generateMonthlyCSVService(data, departmentName);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="monthly-report-${fileSuffix}.csv"`);
    return res.status(200).send(csvContent);
  } else if (format === "pdf") {
    const pdfBuffer = await generateMonthlyReportPDF(month, data, user.name);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="monthly-report-${fileSuffix}.pdf"`);
    return res.status(200).send(pdfBuffer);
  } else {
    return res.status(200).json({
      success: true,
      data,
    });
  }
});

export const getTodayStats = asyncHandler(async (req: Request, res: Response) => {
  const { date } = req.query as { date?: string };
  const user = (req as any).user;
  const stats = await getTodayStatsService(user._id, user.role, date);
  res.status(200).json(new ApiResponse(200, stats, "Today's statistics fetched successfully"));
});
