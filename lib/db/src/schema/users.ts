import { pgTable, serial, varchar, text, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  phone: varchar("phone", { length: 15 }).notNull().unique(),
  username: varchar("username", { length: 30 }).unique(),
  name: varchar("name", { length: 100 }),
  passwordHash: text("password_hash"),
  balance: integer("balance").default(0).notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  role: varchar("role", { length: 20 }).default("player").notNull(),
  failedLoginAttempts: integer("failed_login_attempts").default(0).notNull(),
  lastLoginUserAgent: text("last_login_user_agent"),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const transactionsTable = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: varchar("type", { length: 10 }).notNull(),
  amount: integer("amount").notNull(),
  description: varchar("description", { length: 200 }).notNull(),
  /** recharge | gaming_session | food | other | booking | admin_adjustment */
  category: varchar("category", { length: 30 }),
  adminName: varchar("admin_name", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const bookingsTable = pgTable("bookings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  game: varchar("game", { length: 100 }).notNull(),
  bookingDate: varchar("booking_date", { length: 20 }).notNull(),
  timeSlot: varchar("time_slot", { length: 50 }).notNull(),
  players: integer("players").default(1).notNull(),
  durationMin: integer("duration_min").default(30).notNull(),
  notes: text("notes"),
  paymentMethod: varchar("payment_method", { length: 20 }).default("wallet").notNull(),
  /** pending_approval | confirmed | cancelled | completed | no_show */
  status: varchar("status", { length: 30 }).default("pending_approval").notNull(),
  /** paid_wallet | pending_cash | paid_cash */
  paymentStatus: varchar("payment_status", { length: 20 }).default("paid_wallet").notNull(),
  approvedBy: varchar("approved_by", { length: 100 }),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/** Generic key/value settings store (Telegram config, notification toggles, cafe hours). */
export const settingsTable = pgTable("settings", {
  key: varchar("key", { length: 100 }).primaryKey(),
  value: text("value"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/** Records every admin action for accountability. */
export const auditLogsTable = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  adminName: varchar("admin_name", { length: 100 }).notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  targetUser: varchar("target_user", { length: 100 }),
  details: text("details"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
export type Transaction = typeof transactionsTable.$inferSelect;
export type Booking = typeof bookingsTable.$inferSelect;
export type Setting = typeof settingsTable.$inferSelect;
export type AuditLog = typeof auditLogsTable.$inferSelect;
