import { CookieOptions } from "express";

const isProd = process.env.NODE_ENV === "production" || process.env.RENDER === "true";

export const accessCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? "none" : "lax",
  maxAge: 15 * 60 * 1000, // 15 minutes
};

export const refreshCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};
