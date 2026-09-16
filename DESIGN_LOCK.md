# KAFV MCP Design Lock v0.2

## 기준 고정
- 기준 가격 Worker: `kafv-fish-price-api` v0.7.2 LOCK. 직접 수정하지 않는다.
- MCP Worker: `kafv-fish-price-mcp-api`.
- Worker-to-Worker 연결: Cloudflare Service Binding `PRICE_API`.
- 원격 MCP transport: Streamable HTTP, endpoint `/mcp`.
- 신규 서버는 stateless `createMcpHandler()` 경로를 사용한다.

## 데이터·판정 원칙
- 수산분류 `600` 및 품목코드는 자동완화 금지.
- strict 질의의 지역/시장/날짜/등급 등 핵심조건 자동완화 금지.
- `available / empty / unconfirmed / error`를 하나로 합치지 않는다.
- 기존 Worker 내부 `item-overview` 예산 40은 Cloudflare quota가 아니다.
- Endpoint별 최신일은 독립적이며 `/recent` 날짜를 공통 기준일로 강제하지 않는다.
- 계산은 코드가 하고, 설명은 AI가 한다.

## 보안 원칙
- 공공 API Secret은 MCP 저장소 및 MCP Worker에 복제하지 않는다.
- MCP Worker는 `PRICE_API` Service Binding을 통해 기존 가격 Worker를 호출한다.
- `.env`, 토큰, API Key는 GitHub에 커밋하지 않는다.

## 범위
- v0.2: 가격정보 Remote MCP + 5개 Tool + QA.
- Firebase, BigQuery, Push는 후속 버전.
- 이후 개발순서: 가격정보 MCP 완료 → TourAPI → 수산물사전 내부 데이터 → 통합 테스트.
