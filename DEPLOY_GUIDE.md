# KAFV Fish Price MCP v0.2 배포 가이드

## 1. GitHub 반영
기존 저장소 `kafv-fish-price-mcp`에서 v0.1 파일을 v0.2 파일로 갱신한다.

필수 신규 파일:
- `src/index.ts`
- `src/mcp.ts`
- `src/types.ts`
- `src/constants.ts`
- `wrangler.jsonc`
- `tsconfig.json`
- `CHANGELOG.md`
- `.gitignore`

## 2. Cloudflare Worker 기준
대상 Worker: `kafv-fish-price-mcp-api`

Service Binding:
- Variable name: `PRICE_API`
- Service: `kafv-fish-price-api`

기존 가격 Worker `kafv-fish-price-api` v0.7.2는 수정하지 않는다.

## 3. 배포 전 확인
```bash
npm install
npm test
npm run typecheck
```

## 4. 배포
```bash
npm run deploy
```

## 5. 배포 후 Smoke Test
### Health
`https://kafv-fish-price-mcp-api.123kjc.workers.dev/health`

기대값:
- `ok: true`
- `price_api_binding: true`
- `mcp_endpoint: /mcp`

### 고등어 통합조회
`https://kafv-fish-price-mcp-api.123kjc.workers.dev/test/overview?item_cd=611&item_nm=고등어`

기대값:
- 실제 고등어 통합조회 데이터 반환
- 기존 가격 Worker v0.7.2 결과와 정합

### MCP endpoint
`https://kafv-fish-price-mcp-api.123kjc.workers.dev/mcp`

MCP Inspector 또는 Streamable HTTP MCP Client로 연결한다.

## 6. 다음 QA
5개 Tool을 순서대로 시험한다.
1. `get_seafood_price_overview`
2. `get_seafood_price_history`
3. `compare_seafood_prices`
4. `get_seafood_trade_activity`
5. `resolve_seafood_catalog`

30개 QA Matrix를 기준으로 정상·0건·미확인·오류·비교·보안 회귀를 검증한다.
