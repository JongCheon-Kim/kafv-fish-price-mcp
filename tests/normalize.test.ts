import test from "node:test";
import assert from "node:assert/strict";
import { itemsOf, normName, deriveStatus } from "../src/lib/normalize.js";

test("itemsOf handles public API envelope", () => {
  const raw = { response: { body: { items: { item: [{ item_cd: "611" }] } } } };
  assert.equal(itemsOf(raw).length, 1);
});

test("normName is tolerant to spacing/punctuation", () => {
  assert.equal(normName("고등어 (국산)"), "고등어국산");
});

test("four-state precedence", () => {
  assert.equal(deriveStatus({ rows: [{ x: 1 }], ok: true }), "available");
  assert.equal(deriveStatus({ rows: [], budgetExceeded: true, ok: false }), "unconfirmed");
  assert.equal(deriveStatus({ rows: [], ok: false, error: "x" }), "error");
  assert.equal(deriveStatus({ rows: [], ok: true }), "empty");
});
