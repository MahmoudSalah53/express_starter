import { app } from "./app";
import { prisma } from "./config/database";
import { env } from "./config/env";
import { logger } from "./config/logger";

const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, "Server started");
});

function shutdown(signal: string) {
  logger.info({ signal }, "Shutting down");

  server.close(() => {
    void prisma.$disconnect().finally(() => {
      process.exit(0);
    });
  });

  setTimeout(() => {
    logger.error("Forced shutdown");
    process.exit(1);
  }, 10_000).unref();
}

process.on("SIGINT", () => {
  shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  shutdown("SIGTERM");
});
