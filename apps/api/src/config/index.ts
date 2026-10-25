import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

dotenv.config({
  path: resolve(dirname(fileURLToPath(import.meta.url)), "../../../..", ".env"),
});

export const config = {
  host: process.env.API_HOST ?? "127.0.0.1",
  port: Number(process.env.API_PORT ?? 4000),
  origin: process.env.API_ORIGIN ?? "http://localhost:4000",
  webOrigin: process.env.WEB_ORIGIN ?? "http://localhost:3000",
  sessionCookieName: process.env.SESSION_COOKIE_NAME ?? "commerce_session",
  sessionTtlDays: Number(process.env.SESSION_TTL_DAYS ?? 7),
  redisUrl: process.env.REDIS_URL ?? "redis://127.0.0.1:6379",
  isProduction: process.env.NODE_ENV === "production",
};

export const sessionMaxAge = config.sessionTtlDays * 24 * 60 * 60;
