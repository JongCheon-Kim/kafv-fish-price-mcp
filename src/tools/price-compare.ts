import * as z from "zod/v4";
import type { McpServer } from "@modelcontextprotocol/server";
import { config } from "../config.js";
import { resolveEntity, type EntityType } from "../lib/catalog.js";
import { itemsOf } from "../lib/normalize.js";
import { businessError, toolResult } from "../lib/result.js";
import { cond, workerGet } from "../lib/worker-client.js";

export function registerPriceCompare(server: McpServer) {
  server.registerTool("compare_seafood_prices", {
    title: "수산물 가격 비교",
    description: "동일 수산물의 지역·시장·유통단계별 가격을 strict 조건으로 비교한다. 비교 대상 조건은 절대로 자동 완화하지 않는다. 날짜가 없으면 item-overview의 해당 가격 endpoint 최신일을 먼저 확인한다.",
    inputSchema: z.object({
      item_name: z.string().min(1), item_code: z.string().optional(),
      compare_by: z.enum(["region", "market", "distribution_stage"]),
      targets: z.array(z.string().min(1)).min(2).max(10),
      date: z.string().regex(/^\d{4}-?\d{2}-?\d{2}$/).optional()
    }),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
  }, async (args) => {
    try {
      let code = args.item_code || "";
      if (!code) {
        const r = await resolveEntity("item", args.item_name);
        if (r.status !== "resolved") return toolResult({ status: r.status, request: args, catalog: r });
        code = r.resolved.code;
      }
      let date = (args.date || "").replaceAll("-", "");
      if (!date && args.compare_by !== "distribution_stage") {
        const ov = await workerGet("/api/item-overview", { ctgry_cd: config.categoryCode, item_cd: code, item_nm: args.item_name });
        const key = args.compare_by === "region" ? "region" : "daily";
        date = String(ov?.results?.[key]?.latestDate || "");
        if (!date) return toolResult({ status: "unconfirmed", request: args, reason: `No latest date for ${key}` });
      }
      const entityType: EntityType = args.compare_by;
      const resolvedTargets = [] as any[];
      for (const target of args.targets) {
        const r = await resolveEntity(entityType, target);
        if (r.status !== "resolved") resolvedTargets.push({ target, status: r.status, candidates: r.candidates });
        else resolvedTargets.push({ target, status: "resolved", code: r.resolved.code, name: r.resolved.name });
      }
      if (resolvedTargets.some(x => x.status !== "resolved")) return toolResult({ status: "ambiguous", request: args, targets: resolvedTargets });
      const rows = [] as any[];
      for (const target of resolvedTargets) {
        const base: Record<string, string | undefined> = { "ctgry_cd::EQ": config.categoryCode, "item_cd::EQ": code };
        let endpoint = "/api/daily";
        if (args.compare_by === "region") { endpoint = "/api/region"; base["sgg_cd::EQ"] = target.code; base["exmn_ymd::EQ"] = date; }
        if (args.compare_by === "market") { endpoint = "/api/daily"; base["mrkt_cd::EQ"] = target.code; base["exmn_ymd::GTE"] = date; base["exmn_ymd::LTE"] = date; }
        if (args.compare_by === "distribution_stage") { endpoint = "/api/recent"; base["se_cd::EQ"] = target.code; }
        const raw = await workerGet(endpoint, { ...cond(base), pageNo: 1, numOfRows: 1000, returnType: "json" });
        const found = itemsOf(raw);
        rows.push({ target, endpoint, rowCount: found.length, rows: found });
      }
      return toolResult({ status: rows.some(x => x.rowCount > 0) ? "available" : "empty", request: { ...args, resolved_item_code: code, effective_date: date || null }, result: rows });
    } catch (error: any) {
      return businessError("PRICE_COMPARE_FAILED", "가격 비교에 실패했습니다.", error?.body || String(error?.message || error));
    }
  });
}
