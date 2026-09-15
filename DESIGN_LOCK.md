# KAFV MCP Design Lock v0.1

- 기준 Worker: v0.7.2 LOCK. 직접 수정하지 않는다.
- 현재 웹 기준판: PWA v0202 TodayDateFix.
- MCP 위치: ChatGPT/MCP -> Adapter -> 기존 Worker -> 공공 API.
- 품목과 수산분류는 자동완화 금지.
- strict 질의에서는 지역/시장/날짜 등 핵심 비교조건 자동완화 금지.
- `available / empty / unconfirmed / error`를 하나로 합치지 않는다.
- Worker 내부 `item-overview` 예산 40은 Cloudflare quota가 아니다.
- Endpoint별 최신일은 독립적이며 `/recent` 날짜를 공통 기준일로 강제하지 않는다.
- Firebase, BigQuery, Push는 후속 버전으로 이연.
- 거래 API는 가격 API와 코드체계가 다르므로 v0.1에서 명칭 기반 보수 매칭만 허용한다.
