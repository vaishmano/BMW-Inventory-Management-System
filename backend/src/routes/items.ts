import { Router, Request, Response } from "express";
import pool from "../db";
import logger from "../logger";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const q = req.query.q ? String(req.query.q) : undefined;
    const page = Math.max(Number(req.query.page || 1), 1);
    let pageSize = Number(req.query.pageSize || 25);
    const maxPageSize = 1000;
    if (!Number.isFinite(pageSize) || pageSize <= 0) pageSize = 25;
    pageSize = Math.min(pageSize, maxPageSize);

    const allowedColumns = new Set([
      "id",
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
    ]);

    const params: any[] = [];
    const whereClauses: string[] = [];

    if (q) {
      whereClauses.push("(`Brand` LIKE ? OR `Model` LIKE ?)");
      params.push(`%${q}%`, `%${q}%`);
    }

    if (req.query.filters) {
      let parsed: any;
      try {
        parsed = JSON.parse(String(req.query.filters));
      } catch (err) {
        return res.status(400).json({ error: "Invalid filters JSON" });
      }
      if (!Array.isArray(parsed))
        return res.status(400).json({ error: "filters must be an array" });

      for (const f of parsed) {
        if (!f || typeof f !== "object")
          return res.status(400).json({ error: "invalid filter item" });
        const col = String(f.column || "");
        const op = String(f.op || "");
        const val = f.value;

        if (!allowedColumns.has(col))
          return res
            .status(400)
            .json({ error: `Invalid filter column: ${col}` });

        const colEscaped = `\`${col.replace(/`/g, "")}\``;

        switch (op) {
          case "contains":
            whereClauses.push(`${colEscaped} LIKE ?`);
            params.push(`%${String(val)}%`);
            break;
          case "equals":
            whereClauses.push(`${colEscaped} = ?`);
            params.push(val);
            break;
          case "startsWith":
            whereClauses.push(`${colEscaped} LIKE ?`);
            params.push(`${String(val)}%`);
            break;
          case "endsWith":
            whereClauses.push(`${colEscaped} LIKE ?`);
            params.push(`%${String(val)}`);
            break;
          case "isEmpty":
            if (val === true || String(val) === "true") {
              whereClauses.push(
                `(${colEscaped} IS NULL OR ${colEscaped} = '')`,
              );
            } else {
              whereClauses.push(
                `(${colEscaped} IS NOT NULL AND ${colEscaped} != '')`,
              );
            }
            break;
          case "gt":
            whereClauses.push(`${colEscaped} > ?`);
            params.push(val);
            break;
          case "lt":
            whereClauses.push(`${colEscaped} < ?`);
            params.push(val);
            break;
          default:
            return res
              .status(400)
              .json({ error: `Invalid filter operator: ${op}` });
        }
      }
    }

    const whereSql = whereClauses.length
      ? "WHERE " + whereClauses.join(" AND ")
      : "";

    const countSql = `SELECT COUNT(*) as total FROM cars ${whereSql}`;
    logger.info(`Count SQL: ${countSql} -- params: ${JSON.stringify(params)}`);
    const [countRows]: any = await pool.query(countSql, params);
    const total =
      Array.isArray(countRows) && countRows[0] ? Number(countRows[0].total) : 0;

    const offset = (page - 1) * pageSize;
    const dataSql = `SELECT * FROM cars ${whereSql} LIMIT ? OFFSET ?`;
    const dataParams = params.concat([pageSize, offset]);
    logger.info(
      `Data SQL: ${dataSql} -- params: ${JSON.stringify(dataParams)}`,
    );

    const [rows]: any = await pool.query(dataSql, dataParams);

    return res.json({ data: rows, total, page, pageSize });
  } catch (err: any) {
    logger.error(`GET /api/items failed: ${err.message}`);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const numId = Number(id);
    if (!Number.isInteger(numId) || numId <= 0) {
      return res.status(400).json({ error: "Invalid id" });
    }

    const sql = "SELECT * FROM cars WHERE id = ? LIMIT 1";
    logger.info(`GET /api/items/:id SQL: ${sql} -- params: [${numId}]`);
    const [rows]: any = await pool.query(sql, [numId]);
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(404).json({ error: "Not found" });
    }
    return res.json(rows[0]);
  } catch (err: any) {
    logger.error(`GET /api/items/:id failed: ${err.message}`);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const numId = Number(id);
    if (!Number.isInteger(numId) || numId <= 0) {
      return res.status(400).json({ error: "Invalid id" });
    }

    const sql = "DELETE FROM cars WHERE id = ?";
    logger.info(`DELETE /api/items/:id SQL: ${sql} -- params: [${numId}]`);
    const [result]: any = await pool.query(sql, [numId]);

    const affected =
      result &&
      ((result.affectedRows ?? result.affectedRows === 0)
        ? result.affectedRows
        : null);
    if (!affected) {
      return res.status(404).json({ error: "Not found" });
    }
    return res.json({ success: true });
  } catch (err: any) {
    logger.error(`DELETE /api/items/:id failed: ${err.message}`);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
