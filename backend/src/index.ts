import express from "express";
import dotenv from "dotenv";
import carsRouter from "./routes/cars";
import logger from "./logger";

dotenv.config();

const app = express();
app.use(express.json());

app.get("/health", (_req: any, res: any) => res.json({ status: "ok" }));
app.use("/api/cars", carsRouter);

const port = Number(process.env.PORT || 4000);
app.listen(port, () => {
  logger.info(`Backend listening on ${port}`);
});
