import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import { logger } from "./config/logger";
import { seedDatabase } from "./config/seed";
import { prisma } from "./config/db";

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  // Start listening immediately so the server stays alive and port 5000 is open
  app.listen(PORT, async () => {
    logger.info(`Server is running in ${process.env.NODE_ENV || "development"} mode on http://localhost:${PORT}`);
    logger.info(`API Documentation available at http://localhost:${PORT}/api/docs`);

    // Attempt to connect and seed in the background
    try {
      await prisma.$connect();
      logger.info("Database connected successfully.");
      await seedDatabase();
    } catch (error) {
      logger.error("Database connection or seed failed on startup: " + (error as Error).message);
      logger.info("Express server remains active. Prisma will attempt to reconnect on subsequent requests.");
    }
  });
}

bootstrap();
