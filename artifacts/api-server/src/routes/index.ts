import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import adminRouter from "./admin.js";
import bookingsRouter from "./bookings.js";
import settingsRouter from "./settings.js";
import telegramRouter from "./telegram-webhook.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/admin", adminRouter);
router.use("/bookings", bookingsRouter);
router.use("/settings", settingsRouter);
router.use("/telegram", telegramRouter);

export default router;
