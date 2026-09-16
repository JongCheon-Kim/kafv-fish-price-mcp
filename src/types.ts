export interface ServiceFetcher {
  fetch(input: Request | string | URL, init?: RequestInit): Promise<Response>;
}

export interface Env {
  PRICE_API: ServiceFetcher;
}

export interface WorkerDeps {
  priceApi?: ServiceFetcher;
  workerBaseUrl?: string;
  timeoutMs?: number;
}
