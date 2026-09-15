# KAFV Fish Price MCP v0.1

목적: 기존 Cloudflare Worker v0.7.2를 수정하지 않고, 그 위에 ChatGPT/MCP용 의미 계층을 추가한다.

## LOCK 원칙
- 기존 Worker v0.7.2 직접 수정 금지
- 공공 API Secret은 이 저장소에 두지 않음
- 품목코드 자동완화 금지
- `available / empty / unconfirmed / error` 구분
- 계산은 코드, 설명은 AI
- Firebase / BigQuery / Push는 이번 v0.1 범위 밖

## 현재 도구
1. `resolve_seafood_catalog`
2. `get_seafood_price_overview`
3. `get_seafood_price_history`
4. `compare_seafood_prices`
5. `get_seafood_trade_activity`

## 개발 실행
```bash
npm install
npm test
npm run dev
```
`npm run dev`는 stdio MCP 개발 서버를 실행한다. 원격 ChatGPT 연결용 Streamable HTTP transport는 다음 단계에서 별도 추가한다.

## 주의
`get_seafood_trade_activity` v0.1은 가격 API와 거래 API의 코드체계 차이를 존중하기 위해 거래 응답의 실제 품목명만 보수적으로 매칭한다. 정식 거래 코드 매핑은 별도 QA 후 v0.2에서 강화한다.
