import jwt from "jsonwebtoken";
import crypto from "crypto";
import { JwtPayload, TokenPair, GoogleTempPayload } from "../types/auth.types";

const ACCESS_SECRET = process.env.JWT_SECRET as string;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || `${ACCESS_SECRET}_refresh`;
const GOOGLE_TEMP_SECRET = `${ACCESS_SECRET}_google_temp`;

const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = "7d";
const GOOGLE_TEMP_TOKEN_EXPIRY = "10m";
export const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

if (!ACCESS_SECRET) {
  throw new Error("JWT_SECRET is not defined in environment variables");
}

export const generateAccessToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, ACCESS_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
};

export const generateRefreshToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  });
};

export const generateTokenPair = (payload: JwtPayload): TokenPair => {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
};

export const verifyAccessToken = (token: string): JwtPayload => {
  return jwt.verify(token, ACCESS_SECRET) as JwtPayload;
};

export const verifyRefreshToken = (token: string): JwtPayload => {
  return jwt.verify(token, REFRESH_SECRET) as JwtPayload;
};

export const generateMagicLinkToken = (): string => {
  return crypto.randomBytes(48).toString("hex");
};

export const generateGoogleTempToken = (payload: GoogleTempPayload): string => {
  return jwt.sign(payload, GOOGLE_TEMP_SECRET, {
    expiresIn: GOOGLE_TEMP_TOKEN_EXPIRY,
  });
};

export const verifyGoogleTempToken = (token: string): GoogleTempPayload => {
  return jwt.verify(token, GOOGLE_TEMP_SECRET) as GoogleTempPayload;
};
