# KAFV Fish Price MCP v0.2

KAFV 수산물 가격정보 AI의 **Cloudflare Remote MCP 서버** 개발판이다. 기존 가격정보 Worker v0.7.2를 직접 수정하지 않고, Cloudflare Service Binding을 통해 그 위에 MCP 의미계층을 추가한다.

## 아키텍처

```text
MCP Client
   ↓ Streamable HTTP
/mcp
   ↓
kafv-fish-price-mcp-api
   ↓ PRICE_API Service Binding
kafv-fish-price-api v0.7.2 [LOCK]
   ↓
공공 수산가격 API
```

## MCP Tool 5개
1. `resolve_seafood_catalog`
2. `get_seafood_price_overview`
3. `get_seafood_price_history`
4. `compare_seafood_prices`
5. `get_seafood_trade_activity`

## Cloudflare endpoints
- `/` : 서비스 정보
- `/health` : Service Binding 및 서버 상태
- `/test/overview?item_cd=611&item_nm=고등어` : 기존 가격 Worker 연결 회귀시험
- `/mcp` : 정식 Remote MCP Streamable HTTP endpoint

## 설치/테스트

```bash
npm install
npm test
npm run typecheck
npm run dev
```

로컬 MCP endpoint:

```text
http://localhost:8787/mcp
```

배포:

```bash
npm run deploy
```

## Cloudflare Service Binding
`wrangler.jsonc`에 다음 binding을 선언한다.

```json
{
  "services": [
    {
      "binding": "PRICE_API",
      "service": "kafv-fish-price-api"
    }
  ]
}
```

Cloudflare Dashboard에서 이미 Binding을 수동 설정한 경우에도 동일한 이름 `PRICE_API`를 유지한다.

## LOCK 원칙
- 기존 가격 Worker v0.7.2 직접 수정 금지
- 공공 API Secret을 MCP 저장소/Worker에 복제하지 않음
- 품목코드 자동완화 금지
- strict 비교조건 자동완화 금지
- `available / empty / unconfirmed / error` 구분
- Endpoint별 최신일 독립 유지
- 계산은 코드, 설명은 AI

## 현재 단계
v0.2는 Remote MCP 구현 및 독립 테스트 단계다. ChatGPT 공개 Plug-in/App 제출은 후속 단계에서 진행한다.
