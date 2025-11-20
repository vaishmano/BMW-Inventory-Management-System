import mysql from "mysql2/promise";
import dotenv from "dotenv";
import logger from "./logger";

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "",
  database: process.env.DB_NAME || "bmw_battery",
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONN_LIMIT || 10),
  queueLimit: 0,
});

pool
  .getConnection()
  .then((conn) => {
    conn.release();
    logger.info("MySQL pool created and connection verified");
  })
  .catch((err) => {
    logger.error(
      `MySQL pool connection failed: ${err && err.message ? err.message : err}`,
    );
  });

export default pool;
