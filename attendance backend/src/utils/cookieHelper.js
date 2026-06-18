export const accessCookieOptions = {
  httpOnly: true,
  secure: false, // Set to true in production
  sameSite: "lax",
  maxAge: 15 * 60 * 1000, // 15 minutes
};

export const refreshCookieOptions = {
  httpOnly: true,
  secure: false, // Set to true in production
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};
