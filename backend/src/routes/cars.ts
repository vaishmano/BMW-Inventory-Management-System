import { Router } from "express";
import pool from "../db";
import logger from "../logger";

const router = Router();

type Filter = { field: string; op: string; value?: any };

function buildWhere(filters: Filter[], params: any[]) {
  if (!filters || filters.length === 0) return "";
  const clauses: string[] = [];
  filters.forEach((f) => {
    const field = `\`${f.field.replace(/`/g, "")}\``;
    switch (f.op) {
      case "contains":
        params.push(`%${f.value}%`);
        clauses.push(`${field} LIKE ?`);
        break;
      case "equals":
        params.push(f.value);
        clauses.push(`${field} = ?`);
        break;
      case "startsWith":
        params.push(`${f.value}%`);
        clauses.push(`${field} LIKE ?`);
        break;
      case "endsWith":
        params.push(`%${f.value}`);
        clauses.push(`${field} LIKE ?`);
        break;
      case "isEmpty":
        if (f.value === "true" || f.value === true)
          clauses.push(`(${field} IS NULL OR ${field} = '')`);
        else clauses.push(`(${field} IS NOT NULL AND ${field} != '')`);
        break;
      case "gt":
        params.push(f.value);
        clauses.push(`${field} > ?`);
        break;
      case "lt":
        params.push(f.value);
        clauses.push(`${field} < ?`);
        break;
      default:
        break;
    }
  });
  return clauses.length ? "WHERE " + clauses.join(" AND ") : "";
}

router.get("/", async (req, res) => {
  const page = Math.max(Number(req.query.page || 1), 1);
  const pageSize = Math.min(
    Math.max(Number(req.query.pageSize || 25), 1),
    1000,
  );
  const offset = (page - 1) * pageSize;
  const sortField = req.query.sortField ? String(req.query.sortField) : "Brand";
  const sortOrder = req.query.sortOrder === "desc" ? "DESC" : "ASC";

  const params: any[] = [];
  let where = "";

  if (req.query.search) {
    const s = `%${String(req.query.search)}%`;
    where = "WHERE (`Brand` LIKE ? OR `Model` LIKE ?)";
    params.push(s, s);
  }

  if (req.query.filters) {
    try {
      const parsed: Filter[] = JSON.parse(String(req.query.filters));
      const additionalParams: any[] = [];
      const fWhere = buildWhere(parsed, additionalParams);
      if (fWhere) {
        if (where) where += " AND " + fWhere.replace(/^WHERE\s*/i, "");
        else where = fWhere;
        params.push(...additionalParams);
      }
    } catch (err) {
      logger.error("Invalid filters JSON");
      return res.status(400).json({ error: "Invalid filters JSON" });
    }
  }

  try {
    const countSql = `SELECT COUNT(*) as total FROM electric_cars ${where}`;
    const [countRows] = await pool.query(countSql, params);
    const total =
      Array.isArray(countRows) && (countRows as any)[0]
        ? (countRows as any)[0].total
        : 0;

    const sql = `SELECT * FROM electric_cars ${where} ORDER BY \`${sortField.replace(/`/g, "")}\` ${sortOrder} LIMIT ? OFFSET ?`;
    const qParams = params.concat([pageSize, offset]);
    const [rows] = await pool.query(sql, qParams);

    res.json({ data: rows, total: Number(total), page, pageSize });
  } catch (err: any) {
    logger.error(`Error fetching cars: ${err.message}`);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
