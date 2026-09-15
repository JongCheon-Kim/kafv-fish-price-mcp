import * as z from "zod/v4";
import type { McpServer } from "@modelcontextprotocol/server";
import { resolveEntity } from "../lib/catalog.js";
import { businessError, toolResult } from "../lib/result.js";

const entityType = z.enum(["item", "region", "market", "corporation", "unit", "size", "grade", "origin", "packaging", "distribution_stage"]);

export function registerCatalogResolver(server: McpServer) {
  server.registerTool("resolve_seafood_catalog", {
    title: "수산 가격 코드 확인",
    description: "수산물명, 지역, 시장, 유통단계, 등급 등 자연어 명칭을 기존 KAFV 가격 엔진이 사용하는 실제 코드 후보로 확인한다. 모호하면 후보를 반환하며 임의 선택하지 않는다.",
    inputSchema: z.object({ entity_type: entityType, query: z.string().min(1) }),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
  }, async ({ entity_type, query }) => {
    try { return toolResult(await resolveEntity(entity_type, query)); }
    catch (error: any) { return businessError("CATALOG_RESOLVE_FAILED", "코드 조회 중 오류가 발생했습니다.", String(error?.message || error)); }
  });
}
