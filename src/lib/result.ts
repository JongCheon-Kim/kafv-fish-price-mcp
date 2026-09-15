import { config } from "../config.js";

export function toolResult(data: any) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data) }],
    structuredContent: data
  };
}

export function businessError(code: string, message: string, detail: any = null) {
  return toolResult({
    status: "error",
    error: { code, message, detail },
    source: { workerVersionExpected: "0.7.2", workerBaseUrl: config.workerBaseUrl }
  });
}
