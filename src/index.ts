import { createMcpHandler } from "agents/mcp/server";
import { KAFV } from "./constants.js";
import type { Env, WorkerDeps } from "./types.js";
import { createServer } from "./mcp.js";
import { workerGet } from "./lib/worker-client.js";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}

function depsFromEnv(env: Env): WorkerDeps {
  return { priceApi: env.PRICE_API, timeoutMs: KAFV.timeoutMs };
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const deps = depsFromEnv(env);

    if (url.pathname === "/") {
      return json({
        name: "kafv-fish-price-mcp-api",
        version: KAFV.serverVersion,
        status: "ok",
        protocol: "MCP Streamable HTTP",
        mcp_endpoint: "/mcp",
        upstream_binding: "PRICE_API",
        upstream_worker_expected_version: KAFV.expectedPriceWorkerVersion
      });
    }

    if (url.pathname === "/health") {
      return json({
        ok: true,
        service: "kafv-fish-price-mcp-api",
        version: KAFV.serverVersion,
        price_api_binding: Boolean(env.PRICE_API),
        mcp_endpoint: "/mcp",
        timestamp: new Date().toISOString()
      });
    }

    if (url.pathname === "/test/overview") {
      const itemCode = url.searchParams.get("item_cd") || "611";
      const itemName = url.searchParams.get("item_nm") || "고등어";
      try {
        const raw = await workerGet(deps, "/api/item-overview", {
          ctgry_cd: KAFV.categoryCode,
          item_cd: itemCode,
          item_nm: itemName
        });
        return json({
          ok: true,
          test: "mcp-worker-to-price-worker-service-binding",
          requested_item: { ctgry_cd: KAFV.categoryCode, item_cd: itemCode, item_nm: itemName },
          binding: "PRICE_API",
          upstream_worker: "kafv-fish-price-api",
          data: raw
        });
      } catch (error: any) {
        return json({ ok: false, error: String(error?.message || error), detail: error?.body || null }, 502);
      }
    }

    if (url.pathname === "/mcp") {
      const handler = createMcpHandler(() => createServer(deps), {
        route: "/mcp",
        legacy: "stateless",
        responseMode: "auto",
        maxSubscriptions: 0,
        onerror: (error) => console.error("MCP error", error)
      });
      return handler(request, env, ctx);
    }

    return json({
      ok: false,
      error: "Not found",
      available_paths: ["/", "/health", "/mcp", "/test/overview?item_cd=611&item_nm=고등어"]
    }, 404);
  }
} satisfies ExportedHandler<Env>;
