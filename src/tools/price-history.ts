import * as z from "zod/v4";
import type { McpServer } from "@modelcontextprotocol/server";
import { config } from "../config.js";
import { resolveEntity } from "../lib/catalog.js";
import { daysBefore, monthsBefore, ym, ymd, itemsOf } from "../lib/normalize.js";
import { businessError, toolResult } from "../lib/result.js";
import { cond, workerGet } from "../lib/worker-client.js";

const endpointByType: Record<string, string> = {
  daily: "/api/daily", trend: "/api/trend", change: "/api/change",
  retail: "/api/retail", wholesale: "/api/wholesale", yearmonth: "/api/yearmonth"
};

function periodDates(period?: string) {
  if (!period) return null;
  if (period === "7d") return { start: ymd(daysBefore(6)), end: ymd(new Date()) };
  if (period === "30d") return { start: ymd(daysBefore(29)), end: ymd(new Date()) };
  if (period === "3m") return { start: ymd(monthsBefore(3)), end: ymd(new Date()) };
  if (period === "1y") return { start: ymd(monthsBefore(12)), end: ymd(new Date()) };
  return null;
}

export function registerPriceHistory(server: McpServer) {
  server.registerTool("get_seafood_price_history", {
    title: "수산물 기간 가격조회",
    description: "수산물의 일별·추세·등락·기간 소매·기간 중도매·연월별 가격을 지정 기간으로 조회한다. 지정한 날짜·품목 조건은 임의 완화하지 않는다.",
    inputSchema: z.object({
      item_name: z.string().min(1), item_code: z.string().optional(),
      price_type: z.enum(["daily", "trend", "change", "retail", "wholesale", "yearmonth"]),
      start_date: z.string().regex(/^\d{4}-?\d{2}-?\d{2}$/).optional(),
      end_date: z.string().regex(/^\d{4}-?\d{2}-?\d{2}$/).optional(),
      period: z.enum(["7d", "30d", "3m", "1y"]).optional(),
      region_code: z.string().optional(), market_code: z.string().optional(), grade_code: z.string().optional(), variety_code: z.string().optional()
    }),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
  }, async (args) => {
    try {
      let code = args.item_code || "";
      if (!code) {
        const resolved = await resolveEntity("item", args.item_name);
        if (resolved.status !== "resolved") return toolResult({ status: resolved.status, request: args, catalog: resolved });
        code = resolved.resolved.code;
      }
      const endpoint = endpointByType[args.price_type];
      const base: Record<string, string | undefined> = {
        "ctgry_cd::EQ": config.categoryCode, "item_cd::EQ": code,
        "sgg_cd::EQ": args.region_code, "mrkt_cd::EQ": args.market_code,
        "grd_cd::EQ": args.grade_code, "vrty_cd::EQ": args.variety_code
      };
      if (args.price_type === "retail") base["se_cd::EQ"] = "01";
      if (args.price_type === "wholesale") base["se_cd::EQ"] = "02";
      const p = periodDates(args.period);
      const start = (args.start_date || p?.start || "").replaceAll("-", "");
      const end = (args.end_date || p?.end || "").replaceAll("-", "");
      if (args.price_type === "yearmonth") {
        if (start) base["exmn_ym::GTE"] = start.slice(0, 6);
        if (end) base["exmn_ym::LTE"] = end.slice(0, 6);
      } else {
        if (start) base["exmn_ymd::GTE"] = start;
        if (end) base["exmn_ymd::LTE"] = end;
      }
      const raw = await workerGet(endpoint, { ...cond(base), pageNo: 1, numOfRows: 1000, returnType: "json" });
      const rows = itemsOf(raw);
      return toolResult({
        status: rows.length ? "available" : "empty",
        request: { ...args, resolved_item_code: code },
        source: { workerVersionExpected: "0.7.2", endpoint },
        result: { rowCount: rows.length, rows, raw }
      });
    } catch (error: any) {
      return businessError("PRICE_HISTORY_FAILED", "기간 가격조회에 실패했습니다.", error?.body || String(error?.message || error));
    }
  });
}
