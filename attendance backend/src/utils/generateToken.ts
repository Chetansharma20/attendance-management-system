import jwt from "jsonwebtoken";

export const generateTokens = (user: any) => {
  const accessToken = jwt.sign(
    {
      userId: user._id,
      role: user.role,
    },
    process.env.JWT_SECRET as string,
    {
      expiresIn: "15m",
    }
  );

  const refreshToken = jwt.sign(
    {
      userId: user._id,
    },
    process.env.REFRESH_TOKEN as string,
    {
      expiresIn: "7d",
    }
  );

  return { accessToken, refreshToken };
};
