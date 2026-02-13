import jwt from "jsonwebtoken";
import crypto from "crypto";
import { env } from "../config/env";

export function generateAccessToken(user: {
  userId: string;
  email: string;
  username: string;
  tokenVersion: number;
}) {
  return jwt.sign(user, env.JWT_SECRET, {
    expiresIn: "15m",
  });
}

export function generateRefreshToken() {
  return crypto.randomBytes(64).toString("hex");
}

export function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}
