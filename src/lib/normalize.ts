export type KafvStatus = "available" | "empty" | "unconfirmed" | "error";

export function normalizedBody(raw: any): any {
  let x = raw;
  if (typeof x === "string") {
    try { x = JSON.parse(x); } catch { return x; }
  }
  let body = x?.response?.body ?? x?.body ?? x;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch {}
  }
  return body;
}

export function itemsOf(raw: any): any[] {
  const body = normalizedBody(raw);
  let items = body?.items?.item ?? body?.item ?? body?.items ?? [];
  if (items && !Array.isArray(items) && typeof items === "object") items = [items];
  return Array.isArray(items) ? items : [];
}

export function totalCountOf(raw: any): number | null {
  const body = normalizedBody(raw);
  const v = body?.totalCount ?? body?.total_count;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function firstField(row: any, fields: string[]): string {
  for (const field of fields) {
    const value = row?.[field];
    if (value !== undefined && value !== null && String(value).trim() !== "") return String(value).trim();
  }
  return "";
}

export function normName(value: string): string {
  return String(value || "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\s()\[\]{}·ㆍ,._\-/]/g, "")
    .trim();
}

export function deriveStatus(raw: any): KafvStatus {
  const rowCount = Array.isArray(raw?.rows) ? raw.rows.length : Number(raw?.rowCount || 0);
  if (rowCount > 0) return "available";
  if (raw?.status && ["available", "empty", "unconfirmed", "error"].includes(raw.status)) return raw.status;
  if (raw?.budgetExceeded || raw?.unconfirmed || raw?.searchComplete === false) return "unconfirmed";
  if (raw?.ok === false || raw?.error) return "error";
  return "empty";
}

export function ymd(date: Date): string {
  return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
}

export function ym(date: Date): string {
  return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function daysBefore(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

export function monthsBefore(months: number): Date {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return d;
}
