import { McpServer } from "@modelcontextprotocol/server";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { config } from "./config.js";
import { registerCatalogResolver } from "./tools/catalog-resolver.js";
import { registerPriceOverview } from "./tools/price-overview.js";
import { registerPriceHistory } from "./tools/price-history.js";
import { registerPriceCompare } from "./tools/price-compare.js";
import { registerTradeActivity } from "./tools/trade-activity.js";

function createServer() {
  const server = new McpServer(
    { name: config.serverName, version: config.serverVersion },
    { instructions: "KAFV 수산물 가격정보 도구. 품목코드는 다른 품목으로 대체하지 않는다. empty, unconfirmed, error를 구분한다. 수치 계산과 원자료 조회는 코드가 담당하며 모델은 결과를 설명한다." }
  );
  registerCatalogResolver(server);
  registerPriceOverview(server);
  registerPriceHistory(server);
  registerPriceCompare(server);
  registerTradeActivity(server);
  return server;
}

serveStdio(createServer);
