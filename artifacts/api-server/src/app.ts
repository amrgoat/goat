import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { hashPassword } from "./lib/auth.js";
import { scheduleDailyReport } from "./lib/daily-report.js";
import { sendEmergencyAlert } from "./lib/telegram.js";

const app: Express = express();

process.on("uncaughtException", (err) => {
  logger.error({ err }, "Uncaught exception");
  sendEmergencyAlert("Unexpected Server Error", err.message).catch(() => {});
});
process.on("unhandledRejection", (reason) => {
  logger.error({ reason }, "Unhandled rejection");
  sendEmergencyAlert("Unexpected Server Error", String(reason)).catch(() => {});
});

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

/* Generic error handler — catches anything thrown in route handlers */
app.use((err: any, _req: any, res: any, _next: any) => {
  logger.error({ err }, "Unhandled route error");
  sendEmergencyAlert("Unexpected Server Error", err?.message ?? String(err)).catch(() => {});
  res.status(500).json({ error: "Internal server error" });
});

scheduleDailyReport();

/**
 * Seed owner accounts from environment variables.
 *
 * Set these Replit Secrets (never hardcode credentials):
 *   OWNER_1_PHONE  — 10-digit phone number
 *   OWNER_1_PASSWORD — password (min 8 chars)
 *   OWNER_1_NAME   — display name (optional)
 *   OWNER_2_PHONE / OWNER_2_PASSWORD / OWNER_2_NAME (optional second owner)
 */
async function seedOwners() {
  const slots = [
    {
      phone: process.env["OWNER_1_PHONE"],
      password: process.env["OWNER_1_PASSWORD"],
      name: process.env["OWNER_1_NAME"] ?? null,
    },
    {
      phone: process.env["OWNER_2_PHONE"],
      password: process.env["OWNER_2_PASSWORD"],
      name: process.env["OWNER_2_NAME"] ?? null,
    },
  ];

  for (const slot of slots) {
    if (!slot.phone || !slot.password) continue;
    if (!/^\d{10}$/.test(slot.phone)) {
      logger.warn({ phone: slot.phone }, "Owner phone is not 10 digits — skipping seed");
      continue;
    }

    const [existing] = await db.select().from(usersTable).where(eq(usersTable.phone, slot.phone)).limit(1);
    if (!existing) {
      await db.insert(usersTable).values({
        phone: slot.phone,
        passwordHash: hashPassword(slot.password),
        name: slot.name,
        balance: 0,
        isAdmin: true,
        role: "owner",
      });
      logger.info({ phone: slot.phone }, "Owner account seeded");
    } else {
      // Ensure existing account is promoted to owner
      const updates: Record<string, unknown> = {};
      if (!existing.isAdmin) updates.isAdmin = true;
      if (existing.role !== "owner") updates.role = "owner";
      if (slot.name && existing.name !== slot.name) updates.name = slot.name;
      if (Object.keys(updates).length > 0) {
        await db.update(usersTable).set(updates).where(eq(usersTable.phone, slot.phone));
        logger.info({ phone: slot.phone }, "Existing account promoted to owner");
      }
    }
  }
}

seedOwners().catch((err) => logger.error({ err }, "Failed to seed owners"));

export default app;
