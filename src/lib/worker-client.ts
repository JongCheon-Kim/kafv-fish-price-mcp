import { config } from "../config.js";
import { itemsOf, totalCountOf } from "./normalize.js";

export class WorkerHttpError extends Error {
  status: number;
  body: any;
  constructor(message: string, status: number, body: any) {
    super(message);
    this.name = "WorkerHttpError";
    this.status = status;
    this.body = body;
  }
}

export async function workerGet(path: string, params: Record<string, string | number | boolean | null | undefined> = {}): Promise<any> {
  const url = new URL(path, `${config.workerBaseUrl}/`);
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined || value === "") continue;
    url.searchParams.append(key, String(value));
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.timeoutMs);
  try {
    const response = await fetch(url, { headers: { Accept: "application/json" }, signal: controller.signal });
    const text = await response.text();
    let body: any = text;
    try { body = JSON.parse(text); } catch {}
    if (!response.ok) throw new WorkerHttpError(`KAFV Worker ${response.status}`, response.status, body);
    return body;
  } finally {
    clearTimeout(timer);
  }
}

export async function workerAll(path: string, params: Record<string, string> = {}, maxPages = 8, rowsPerPage = 1000): Promise<any[]> {
  const out: any[] = [];
  for (let page = 1; page <= maxPages; page++) {
    const raw = await workerGet(path, { ...params, pageNo: page, numOfRows: rowsPerPage, returnType: "json" });
    const rows = itemsOf(raw);
    out.push(...rows);
    const total = totalCountOf(raw);
    if (!rows.length) break;
    if (total !== null && out.length >= total) break;
    if (rows.length < rowsPerPage && total === null) break;
  }
  return out;
}

export function cond(params: Record<string, string | undefined>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value) out[`cond[${key}]`] = value;
  }
  return out;
}
