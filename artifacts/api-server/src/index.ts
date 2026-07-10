// Force IST for any stray unconverted Date usage (log timestamps, default formatting).
// Explicit timeZone-aware helpers in lib/time.ts remain the source of truth for
// "today"/report calculations, but this ensures the whole process defaults to IST.
process.env["TZ"] = "Asia/Kolkata";

import app from "./app";
import { logger } from "./lib/logger";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});
