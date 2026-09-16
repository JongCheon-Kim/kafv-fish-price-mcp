import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/server";
import type { WorkerDeps } from "../types.js";
import { businessError, toolResult } from "../lib/result.js";
import { itemsOf, firstField, normName } from "../lib/normalize.js";
import { workerGet } from "../lib/worker-client.js";

const endpoint: Record<string, string> = { auction: "/api/auction", online: "/api/online", shipment: "/api/shipment" };

export function registerTradeActivity(server: McpServer, deps: WorkerDeps) {
  server.registerTool("get_seafood_trade_activity", {
    title: "수산물 경매·거래 조회",
    description: "실시간 경매·온라인 도매·출하 API를 조회한다. 가격 API와 코드체계가 다르므로 가격 품목코드를 거래 API에 억지로 재사용하지 않는다. 현재 v0.2는 날짜 등으로 조회한 실제 응답에서 품목명을 보수적으로 명칭 매칭한다.",
    inputSchema: {
      item_name: z.string().min(1), channel: z.enum(["auction", "online", "shipment"]),
      date: z.string().regex(/^\d{4}-?\d{2}-?\d{2}$/).optional(), market_code: z.string().optional(), corporation_code: z.string().optional()
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
  }, async (args) => {
    try {
      const params: Record<string, string | number> = { pageNo: 1, numOfRows: 1000, returnType: "json" };
      const d = (args.date || "").replaceAll("-", "");
      if (args.channel === "auction") {
        if (d) params["cond[trd_clcln_ymd::EQ]"] = d;
        if (args.market_code) params["cond[whsl_mrkt_cd::EQ]"] = args.market_code;
        if (args.corporation_code) params["cond[corp_cd::EQ]"] = args.corporation_code;
      }
      const raw = await workerGet(deps, endpoint[args.channel], params);
      const q = normName(args.item_name);
      const rows = itemsOf(raw).filter(r => {
        const names = [
          firstField(r, ["corp_gds_item_nm"]), firstField(r, ["gds_sclsf_nm"]), firstField(r, ["gds_mclsf_nm"]),
          firstField(r, ["onln_whsl_mrkt_sclsf_nm"]), firstField(r, ["onln_whsl_mrkt_mclsf_nm"]), firstField(r, ["onln_whsl_mrkt_lclsf_nm"]),
          firstField(r, ["item_nm"])
        ].filter(Boolean);
        return names.some(n => normName(n).includes(q) || q.includes(normName(n)));
      });
      return toolResult({ status: rows.length ? "available" : "empty", request: args, source: { endpoint: endpoint[args.channel], matching: "name-only-v0.2" }, result: { rowCount: rows.length, rows: rows.slice(0, 100) } });
    } catch (error: any) {
      return businessError("TRADE_ACTIVITY_FAILED", "거래정보 조회에 실패했습니다.", error?.body || String(error?.message || error));
    }
  });
}
