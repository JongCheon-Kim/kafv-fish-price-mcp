import { McpServer } from "@modelcontextprotocol/server";
import { KAFV } from "./constants.js";
import type { WorkerDeps } from "./types.js";
import { registerCatalogResolver } from "./tools/catalog-resolver.js";
import { registerPriceOverview } from "./tools/price-overview.js";
import { registerPriceHistory } from "./tools/price-history.js";
import { registerPriceCompare } from "./tools/price-compare.js";
import { registerTradeActivity } from "./tools/trade-activity.js";

export function createServer(deps: WorkerDeps) {
  const server = new McpServer({
    name: KAFV.serverName,
    version: KAFV.serverVersion
  });

  registerCatalogResolver(server, deps);
  registerPriceOverview(server, deps);
  registerPriceHistory(server, deps);
  registerPriceCompare(server, deps);
  registerTradeActivity(server, deps);

  return server;
}
