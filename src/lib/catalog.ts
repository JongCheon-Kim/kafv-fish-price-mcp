import { config } from "../config.js";
import { firstField, normName } from "./normalize.js";
import { cond, workerAll } from "./worker-client.js";

export type EntityType = "item" | "region" | "market" | "corporation" | "unit" | "size" | "grade" | "origin" | "packaging" | "distribution_stage";
export type Candidate = { code: string; name: string; meta?: Record<string, string> };

const STATIC: Partial<Record<EntityType, Candidate[]>> = {
  distribution_stage: [
    { code: "01", name: "소매" },
    { code: "02", name: "중도매" }
  ]
};

const ENDPOINTS: Partial<Record<EntityType, { path: string; code: string[]; name: string[]; meta?: [string, string[]][] }>> = {
  market: { path: "/api/markets", code: ["whsl_mrkt_cd", "mrkt_cd"], name: ["whsl_mrkt_nm", "mrkt_nm"], meta: [["region", ["ctprvn_nm", "sgg_nm"]]] },
  corporation: { path: "/api/corps", code: ["corp_cd"], name: ["corp_nm"], meta: [["market", ["whsl_mrkt_nm", "mrkt_nm"]]] },
  unit: { path: "/api/units", code: ["unit_cd"], name: ["unit_nm"] },
  size: { path: "/api/sizes", code: ["sz_cd", "size_cd"], name: ["sz_nm", "size_nm"] },
  grade: { path: "/api/grades", code: ["grd_cd", "grade_cd"], name: ["grd_nm", "grade_nm"] },
  origin: { path: "/api/origins", code: ["plor_cd", "origin_cd"], name: ["plor_nm", "origin_nm"] },
  packaging: { path: "/api/packagings", code: ["pkg_cd", "packaging_cd"], name: ["pkg_nm", "packaging_nm"] }
};

function uniq(rows: Candidate[]): Candidate[] {
  const m = new Map<string, Candidate>();
  for (const row of rows) if (row.code && row.name && !m.has(`${row.code}|${row.name}`)) m.set(`${row.code}|${row.name}`, row);
  return [...m.values()];
}

async function candidates(entityType: EntityType): Promise<Candidate[]> {
  if (STATIC[entityType]) return STATIC[entityType]!;

  if (entityType === "item" || entityType === "region") {
    const rows = await workerAll(
      "/api/recent",
      cond({ "ctgry_cd::EQ": config.categoryCode }),
      8,
      1000
    );
    if (entityType === "item") {
      return uniq(rows.map(r => ({ code: firstField(r, ["item_cd"]), name: firstField(r, ["item_nm"]) })));
    }
    return uniq(rows.map(r => ({ code: firstField(r, ["sgg_cd"]), name: firstField(r, ["sgg_nm"]) })));
  }

  const cfg = ENDPOINTS[entityType];
  if (!cfg) return [];
  const rows = await workerAll(cfg.path, {}, entityType === "market" || entityType === "corporation" ? 30 : 10, 1000);
  return uniq(rows.map(r => {
    const meta: Record<string, string> = {};
    for (const [k, fields] of cfg.meta || []) {
      const v = firstField(r, fields);
      if (v) meta[k] = v;
    }
    return { code: firstField(r, cfg.code), name: firstField(r, cfg.name), meta };
  }));
}

export async function resolveEntity(entityType: EntityType, query: string) {
  const rows = await candidates(entityType);
  const q = normName(query);
  const exact = rows.filter(x => normName(x.name) === q || normName(x.code) === q);
  if (exact.length === 1) return { status: "resolved" as const, entityType, query, resolved: exact[0], candidates: [] as Candidate[] };
  if (exact.length > 1) return { status: "ambiguous" as const, entityType, query, candidates: exact.slice(0, 10) };
  const partial = rows.filter(x => normName(x.name).includes(q) || q.includes(normName(x.name)));
  if (partial.length === 1) return { status: "resolved" as const, entityType, query, resolved: partial[0], candidates: [] as Candidate[] };
  if (partial.length > 1) return { status: "ambiguous" as const, entityType, query, candidates: partial.slice(0, 10) };
  return { status: "not_found" as const, entityType, query, candidates: [] as Candidate[] };
}
