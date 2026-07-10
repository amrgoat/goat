import pino from "pino";
import { istDateTimeLabel } from "./time.js";

const isProduction = process.env.NODE_ENV === "production";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  // All timestamps (dev pretty-print and JSON logs in production) are IST,
  // independent of the container's system timezone.
  timestamp: () => `,"time":"${istDateTimeLabel(new Date())} IST"`,
  redact: [
    "req.headers.authorization",
    "req.headers.cookie",
    "res.headers['set-cookie']",
  ],
  ...(isProduction
    ? {}
    : {
        transport: {
          target: "pino-pretty",
          options: { colorize: true, translateTime: false },
        },
      }),
});
