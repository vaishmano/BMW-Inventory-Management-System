import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import logger from "./logger";

import pool from "./db";
import itemsRouter from "./routes/items";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json());

app.use("/api/items", itemsRouter);

app.get("/health", (_req: any, res: any) => res.json({ status: "ok" }));

async function start() {
  const port = Number(process.env.PORT || 4000);
  try {
    try {
      const conn = await pool.getConnection();
      conn.release();
      logger.info("Successfully connected to MySQL");
    } catch (err: any) {
      logger.warn(
        `Warning: could not verify DB connection at startup: ${err && err.message ? err.message : err}`,
      );
    }

    app.listen(port, () => {
      logger.info(`Backend server listening on http://localhost:${port}`);
    });
  } catch (err: any) {
    logger.error(
      `Failed to start server: ${err && err.message ? err.message : err}`,
    );
    process.exit(1);
  }
}

start();

export default app;
