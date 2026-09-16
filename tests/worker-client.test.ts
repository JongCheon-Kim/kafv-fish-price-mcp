import test from "node:test";
import assert from "node:assert/strict";
import { workerGet } from "../src/lib/worker-client.js";

class MockBinding {
  lastUrl = "";
  async fetch(input: Request | string | URL): Promise<Response> {
    const request = input instanceof Request ? input : new Request(input);
    this.lastUrl = request.url;
    return new Response(JSON.stringify({ ok: true, path: new URL(request.url).pathname }), {
      status: 200,
      headers: { "content-type": "application/json" }
    });
  }
}

test("workerGet uses PRICE_API service binding when present", async () => {
  const binding = new MockBinding();
  const raw = await workerGet({ priceApi: binding }, "/api/item-overview", { ctgry_cd: "600", item_cd: "611" });
  assert.equal(raw.ok, true);
  assert.equal(new URL(binding.lastUrl).pathname, "/api/item-overview");
  assert.equal(new URL(binding.lastUrl).searchParams.get("item_cd"), "611");
});
