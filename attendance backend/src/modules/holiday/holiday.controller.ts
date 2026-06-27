import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import Holiday from "./holiday.js";

type HolidayItem = { name: string; date: Date; description: string };

// Fetch Indian holidays from calendar-bharat (Nager.Date does not support IN)
async function fetchIndianHolidays(year: number): Promise<HolidayItem[]> {
  const url = `https://jayantur13.github.io/calendar-bharat/calendar/${year}.json`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch Indian holidays (${response.status})`);

  const data = (await response.json()) as any;
  const yearData = data[String(year)];
  if (!yearData) throw new Error(`No Indian holiday data found for year ${year}`);

  const result: HolidayItem[] = [];

  for (const monthObj of Object.values(yearData) as any[]) {
    for (const [dateKey, item] of Object.entries(monthObj) as [string, any][]) {
      const type = String(item.type || "").toLowerCase();
      if (type === "good to know" || type === "noteworthy day") continue;

      // dateKey format: "January 26, 2025, Sunday"
      const parts = dateKey.split(",");
      if (parts.length < 2) continue;

      const holidayDate = new Date(`${parts[0].trim()}, ${parts[1].trim()}`);
      if (isNaN(holidayDate.getTime())) continue;

      holidayDate.setHours(0, 0, 0, 0);
      result.push({
        name: item.event,
        date: holidayDate,
        description: item.extras || `Indian Holiday (${item.type})`,
      });
    }
  }

  return result;
}

// Fetch holidays for all other countries via Nager.Date API
async function fetchNagerHolidays(countryCode: string, year: number): Promise<HolidayItem[] | null> {
  const response = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/${countryCode}`);
  if (response.status === 204) return []; // No holidays available for this country/year
  if (!response.ok) throw new Error(`Failed to fetch holidays from Nager.Date (${response.status})`);

  const list = (await response.json()) as any[];
  return list.map((item) => {
    const date = new Date(item.date);
    date.setHours(0, 0, 0, 0);
    return {
      name: item.name || item.localName,
      date,
      description: `Public holiday in ${item.countryCode}`,
    };
  });
}

// ─── Controllers ─────────────────────────────────────────────────────────────

export const getAllHolidays = asyncHandler(async (req: Request, res: Response) => {
  const holidays = await Holiday.find().sort({ date: 1 });
  res.status(200).json(new ApiResponse(200, holidays, "Holidays fetched successfully"));
});

export const createHoliday = asyncHandler(async (req: Request, res: Response) => {
  const { name, date, type, description } = req.body;

  if (!name || !date) throw new ApiError(400, "Name and date are required fields");

  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) throw new ApiError(400, "Invalid date format");
  parsedDate.setHours(0, 0, 0, 0);

  const existing = await Holiday.findOne({ date: parsedDate });
  if (existing) throw new ApiError(400, "A holiday is already scheduled on this date");

  const holiday = await Holiday.create({ name, date: parsedDate, type: type || "public", description });
  res.status(201).json(new ApiResponse(201, holiday, "Holiday created successfully"));
});

export const deleteHoliday = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const holiday = await Holiday.findById(id);
  if (!holiday) throw new ApiError(404, "Holiday not found");

  await holiday.deleteOne();
  res.status(200).json(new ApiResponse(200, null, "Holiday deleted successfully"));
});

export const syncHolidays = asyncHandler(async (req: Request, res: Response) => {
  const { country, year } = req.body;
  if (!country || !year) throw new ApiError(400, "Country and year are required");

  const countryCode = String(country).toUpperCase();

  let holidaysList: HolidayItem[];
  try {
    holidaysList = countryCode === "IN"
      ? await fetchIndianHolidays(Number(year))
      : (await fetchNagerHolidays(countryCode, Number(year))) ?? [];
  } catch (err: any) {
    throw new ApiError(502, err.message || "Failed to fetch holidays from external API");
  }

  let createdCount = 0;
  let skippedCount = 0;

  for (const h of holidaysList) {
    const exists = await Holiday.findOne({ date: h.date });
    if (exists) { skippedCount++; continue; }

    await Holiday.create({ name: h.name, date: h.date, type: "public", description: h.description });
    createdCount++;
  }

  res.status(200).json(
    new ApiResponse(200, { createdCount, skippedCount },
      `Sync complete: ${createdCount} imported, ${skippedCount} already existed.`)
  );
});

export const clearAllHolidays = asyncHandler(async (req: Request, res: Response) => {
  const result = await Holiday.deleteMany({});
  res.status(200).json(new ApiResponse(200, { deleted: result.deletedCount }, "Cleared all holidays"));
});
