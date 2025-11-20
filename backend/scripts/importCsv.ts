import fs from "fs";
import path from "path";
import csv from "csv-parser";
import pool from "../src/db";
import logger from "../src/logger";

export function getCsvPath(): string {
  return (
    process.env.CSV_PATH || "./BMW_Aptitude_Test_Test_Data_ElectricCarData.csv"
  );
}

export async function streamCsv(
  csvPath: string,
  onRow: (row: any) => Promise<void>,
): Promise<void> {
  const abs = path.isAbsolute(csvPath)
    ? csvPath
    : path.join(process.cwd(), csvPath);
  if (!fs.existsSync(abs)) throw new Error(`CSV file not found: ${abs}`);

  return new Promise((resolve, reject) => {
    const readStream = fs.createReadStream(abs).pipe(csv());
    readStream.on("data", async (row: any) => {
      readStream.pause();
      try {
        await onRow(row);
      } catch (err) {
        reject(err);
        return;
      } finally {
        try {
          readStream.resume();
        } catch (_) {}
      }
    });
    readStream.on("end", () => resolve());
    readStream.on("error", (err: any) => reject(err));
  });
}

export function mapRowToDb(row: any): any {
  const get = (k: string) => {
    const v = row[k] ?? row[k.toLowerCase()] ?? row[k.trim()];
    return v === undefined || v === null ? "" : String(v).trim();
  };

  const parseNumber = (v: string) => {
    if (!v) return null;
    const s = v.trim();
    if (s === "" || s === "-") return null;
    const n = Number(s.replace(/[^0-9.-]/g, ""));
    return Number.isFinite(n) ? n : null;
  };

  const parseDate = (v: string) => {
    const s = (v || "").trim();
    if (!s) return null;
    const d = new Date(s);
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
    const parts = s.split("/");
    if (parts.length === 3) {
      const mm = parts[0].padStart(2, "0");
      const dd = parts[1].padStart(2, "0");
      let yy = parts[2];
      if (yy.length === 2) yy = "20" + yy;
      return `${yy}-${mm}-${dd}`;
    }
    return null;
  };

  const Brand = get("Brand") || null;
  const Model = get("Model") || null;
  const AccelSec = parseNumber(get("AccelSec"));
  const TopSpeed_KmH = parseNumber(get("TopSpeed_KmH"));
  const Range_Km = parseNumber(get("Range_Km"));
  const Efficiency_WhKm = parseNumber(get("Efficiency_WhKm"));
  const FastCharge_KmH = parseNumber(get("FastCharge_KmH"));
  const RapidCharge = get("RapidCharge") || null;
  const PowerTrain = get("PowerTrain") || null;
  const PlugType = get("PlugType") || null;
  const BodyStyle = get("BodyStyle") || null;
  const Segment = get("Segment") || null;
  const Seats = parseNumber(get("Seats"));
  const PriceEuro = parseNumber(get("PriceEuro"));
  const DateVal = parseDate(get("Date"));

  return {
    Brand,
    Model,
    AccelSec,
    TopSpeed_KmH,
    Range_Km,
    Efficiency_WhKm,
    FastCharge_KmH,
    RapidCharge,
    PowerTrain,
    PlugType,
    BodyStyle,
    Segment,
    Seats,
    PriceEuro,
    Date: DateVal,
  };
}

export async function batchInsert(
  pool: any,
  rows: any[],
  batchSize: number = 500,
): Promise<void> {
  if (!rows || rows.length === 0) return;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const keyClauses: string[] = [];
    const keyParams: any[] = [];
    for (const r of rows) {
      keyClauses.push(
        "(Brand = ? AND Model = ? AND (Date = ? OR (Date IS NULL AND ? IS NULL)))",
      );
      keyParams.push(
        r.Brand || null,
        r.Model || null,
        r.Date || null,
        r.Date || null,
      );
    }

    let existingMap = new Set<string>();
    if (keyClauses.length) {
      const where = keyClauses.join(" OR ");
      const existSql = `SELECT Brand, Model, Date FROM cars WHERE ${where}`;
      const [existRows]: any = await conn.query(existSql, keyParams);
      for (const er of existRows || []) {
        const k = `${er.Brand}||${er.Model}||${er.Date}`;
        existingMap.add(k);
      }
    }

    const toInsert = rows.filter((r) => {
      const k = `${r.Brand}||${r.Model}||${r.Date}`;
      return !existingMap.has(k);
    });

    if (toInsert.length === 0) {
      await conn.commit();
      logger.info("Batch skipped, all rows already exist");
      return;
    }

    const columns = [
      "Brand",
      "Model",
      "AccelSec",
      "TopSpeed_KmH",
      "Range_Km",
      "Efficiency_WhKm",
      "FastCharge_KmH",
      "RapidCharge",
      "PowerTrain",
      "PlugType",
      "BodyStyle",
      "Segment",
      "Seats",
      "PriceEuro",
      "Date",
    ];
    const placeholders = toInsert
      .map(() => `(${columns.map(() => "?").join(",")})`)
      .join(",");
    const insertSql = `INSERT INTO cars (${columns.join(",")}) VALUES ${placeholders}`;
    const insertParams: any[] = [];
    for (const r of toInsert) {
      insertParams.push(
        r.Brand,
        r.Model,
        r.AccelSec,
        r.TopSpeed_KmH,
        r.Range_Km,
        r.Efficiency_WhKm,
        r.FastCharge_KmH,
        r.RapidCharge,
        r.PowerTrain,
        r.PlugType,
        r.BodyStyle,
        r.Segment,
        r.Seats,
        r.PriceEuro,
        r.Date,
      );
    }

    const result = await conn.query(insertSql, insertParams);
    await conn.commit();
    logger.info(
      `Inserted ${toInsert.length} rows (skipped ${rows.length - toInsert.length} duplicates)`,
    );
    return;
  } catch (err) {
    try {
      await conn.rollback();
    } catch (_) {}
    logger.error(`batchInsert failed: ${(err as any).message}`);
    throw err;
  } finally {
    try {
      conn.release();
    } catch (_) {}
  }
}

export async function runImport(): Promise<void> {
  const csvPath = getCsvPath();
  const BATCH_SIZE = 500;
  const buffer: any[] = [];

  let total = 0;
  try {
    await streamCsv(csvPath, async (row) => {
      const mapped = mapRowToDb(row);
      if (mapped) buffer.push(mapped);
      if (buffer.length >= BATCH_SIZE) {
        const chunk = buffer.splice(0, BATCH_SIZE);
        await batchInsert(pool, chunk, BATCH_SIZE);
        total += chunk.length;
        logger.info(`Processed ${total} rows so far`);
      }
    });

    if (buffer.length) {
      const rem = buffer.splice(0, buffer.length);
      await batchInsert(pool, rem, BATCH_SIZE);
      total += rem.length;
    }

    logger.info(`Import finished. Total rows processed: ${total}`);
  } catch (err: any) {
    logger.error(`runImport failed: ${err.message}`);
    throw err;
  }
}

if (require.main === module) {
  (async () => {
    try {
      await runImport();
    } catch (err: any) {
      process.exitCode = 1;
    }
  })();
}
