import fs from "fs";
import path from "path";
import csv from "csv-parser";
import pool from "./db";
import logger from "./logger";
import dotenv from "dotenv";

dotenv.config();

const argv = process.argv.slice(2);
const fileArgIndex = argv.findIndex((a) => a === "--file");
const cliFile =
  fileArgIndex >= 0 && argv[fileArgIndex + 1]
    ? argv[fileArgIndex + 1]
    : argv[0] || undefined;
const envFile = process.env.CSV_PATH;

const requested =
  cliFile || envFile || "./BMW_Aptitude_Test_Test_Data_ElectricCarData.csv";

function resolveCsvPath(file: string): string {
  if (path.isAbsolute(file)) return file;
  const candidates = [
    path.join(process.cwd(), file),
    path.join(__dirname, "..", file),
    path.join(__dirname, "..", "..", file),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }

  return path.join(process.cwd(), file);
}

const filePath = resolveCsvPath(requested);

async function ensureTable() {
  const create = `
  CREATE TABLE IF NOT EXISTS cars (
    id INT AUTO_INCREMENT PRIMARY KEY,
    Brand VARCHAR(100),
    Model VARCHAR(255),
    AccelSec DOUBLE,
    TopSpeed_KmH INT,
    Range_Km INT,
    Efficiency_WhKm DOUBLE,
    FastCharge_KmH INT,
    RapidCharge VARCHAR(10),
    PowerTrain VARCHAR(50),
    PlugType VARCHAR(50),
    BodyStyle VARCHAR(100),
    Segment VARCHAR(10),
    Seats INT,
    PriceEuro DECIMAL(12,2),
    Date DATE
  );
  `;
  await pool.execute(create);
}

function parseNumber(v: string) {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  if (s === "" || s === "-") return null;
  const n = Number(s.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

async function importCsv(file: string) {
  const abs = path.isAbsolute(file) ? file : path.join(process.cwd(), file);
  if (!fs.existsSync(abs)) {
    logger.error(`CSV file not found: ${abs}`);
    process.exit(1);
  }

  await ensureTable();

  const stream = fs.createReadStream(abs).pipe(csv({ skipLines: 0 }));
  let count = 0;
  const inserts: Promise<any>[] = [];

  for await (const row of stream) {
    const Brand = (row["Brand"] || row["brand"] || "").trim();
    const Model = (row["Model"] || "").trim();
    const AccelSec = parseNumber(row["AccelSec"]);
    const TopSpeed_KmH = parseNumber(row["TopSpeed_KmH"]);
    const Range_Km = parseNumber(row["Range_Km"]);
    const Efficiency_WhKm = parseNumber(row["Efficiency_WhKm"]);
    const FastCharge_KmH = parseNumber(row["FastCharge_KmH"]);
    const RapidCharge = (row["RapidCharge"] || "").trim();
    const PowerTrain = (row["PowerTrain"] || "").trim();
    const PlugType = (row["PlugType"] || "").trim();
    const BodyStyle = (row["BodyStyle"] || "").trim();
    const Segment = (row["Segment"] || "").trim();
    const Seats = parseNumber(row["Seats"]);
    const PriceEuro = parseNumber(row["PriceEuro"]);
    const DateStr = (row["Date"] || "").trim();

    let DateVal: string | null = null;
    if (DateStr) {
      const d = new Date(DateStr);
      if (!isNaN(d.getTime())) {
        DateVal = d.toISOString().slice(0, 10);
      } else {
        const parts = DateStr.split("/");
        if (parts.length === 3) {
          const mm = parts[0].padStart(2, "0");
          const dd = parts[1].padStart(2, "0");
          let yy = parts[2];
          if (yy.length === 2) yy = "20" + yy;
          DateVal = `${yy}-${mm}-${dd}`;
        }
      }
    }

    const sql = `INSERT INTO cars
      (Brand,Model,AccelSec,TopSpeed_KmH,Range_Km,Efficiency_WhKm,FastCharge_KmH,RapidCharge,PowerTrain,PlugType,BodyStyle,Segment,Seats,PriceEuro,Date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const params = [
      Brand || null,
      Model || null,
      AccelSec,
      TopSpeed_KmH,
      Range_Km,
      Efficiency_WhKm,
      FastCharge_KmH,
      RapidCharge || null,
      PowerTrain || null,
      PlugType || null,
      BodyStyle || null,
      Segment || null,
      Seats,
      PriceEuro,
      DateVal,
    ];
    inserts.push(pool.execute(sql, params));
    count++;
    if (inserts.length >= 500) {
      await Promise.all(inserts);
      inserts.length = 0;
      logger.info(`Imported ${count} rows...`);
    }
  }

  if (inserts.length) await Promise.all(inserts);
  logger.info(`Import complete. Total rows imported: ${count}`);
  process.exit(0);
}

importCsv(filePath).catch((err) => {
  logger.error(`Import failed: ${err.message}`);
  process.exit(1);
});
