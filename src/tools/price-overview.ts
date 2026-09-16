import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/server";
import { KAFV } from "../constants.js";
import type { WorkerDeps } from "../types.js";
import { resolveEntity } from "../lib/catalog.js";
import { businessError, toolResult } from "../lib/result.js";
import { workerGet } from "../lib/worker-client.js";

export function registerPriceOverview(server: McpServer, deps: WorkerDeps) {
  server.registerTool("get_seafood_price_overview", {
    title: "수산물 가격 통합조회",
    description: "특정 수산물의 최근가격·일별·추세·등락·지역·중도매·소매·연월별 정보를 KAFV Worker v0.7.2 item-overview로 통합 조회한다. 품목코드는 절대 다른 품목으로 완화하지 않는다.",
    inputSchema: { item_name: z.string().min(1), item_code: z.string().min(1).optional() },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
  }, async ({ item_name, item_code }) => {
    try {
      let code = item_code || "";
      if (!code) {
        const resolved = await resolveEntity(deps, "item", item_name);
        if (resolved.status !== "resolved") return toolResult({ status: resolved.status, request: { item_name }, catalog: resolved });
        code = resolved.resolved.code;
      }
      const raw = await workerGet(deps, "/api/item-overview", { ctgry_cd: KAFV.categoryCode, item_cd: code, item_nm: item_name });
      const availableCount = Number(raw?.availableCount || 0);
      const unconfirmedCount = Number(raw?.unconfirmedCount || 0);
      const errorCount = Number(raw?.errorCount || 0);
      const aggregateStatus = availableCount > 0 ? "available" : unconfirmedCount > 0 ? "unconfirmed" : errorCount > 0 ? "error" : "empty";
      return toolResult({
        status: aggregateStatus,
        request: { item_name, resolved_item_code: code },
        source: { workerVersionExpected: KAFV.expectedPriceWorkerVersion, endpoint: "/api/item-overview" },
        result: raw
      });
    } catch (error: any) {
      return businessError("PRICE_OVERVIEW_FAILED", "통합 가격조회에 실패했습니다.", error?.body || String(error?.message || error));
    }
  });
}
