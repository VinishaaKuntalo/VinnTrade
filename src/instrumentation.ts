import { logger } from "@/lib/logger";

/** Called once on server startup; hook for APM, error reporting, or tracing. */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    logger.info("app.startup", {
      node: process.version,
    });
  }
}
