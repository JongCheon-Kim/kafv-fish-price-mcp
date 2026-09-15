export const config = {
  workerBaseUrl: (process.env.KAFV_WORKER_BASE_URL || "https://kafv-fish-price-api.123kjc.workers.dev").replace(/\/$/, ""),
  timeoutMs: Number(process.env.KAFV_MCP_TIMEOUT_MS || 20000),
  categoryCode: "600",
  serverName: "kafv-fish-price-mcp",
  serverVersion: "0.1.0"
};
