import winston from "winston";

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(
      (info: any) => `${info.timestamp} [${info.level}] ${info.message}`,
    ),
  ),
  transports: [new winston.transports.Console()],
});

export default logger;
