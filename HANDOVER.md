# HANDOVER — 肥宅老司機前進世界地圖

> 上次更新：2026-04-15  
> 當前狀態：v1.7.1 穩定版，外站比價 UI 全面升級

---

## ✅ 已完成功能清單

| 版本 | 功能 |
|------|------|
| v1.0 | 地圖標記、Google 登入、匿名發文、多點導航、搜尋建議 |
| v1.4 | Trip.com 聯盟整合（旅遊預訂分頁）|
| v1.5 | 照片延遲載入、影片上傳 |
| v1.6 | 換匯計算器接 opencli API 真實匯率 |
| v1.7 | **外站比價整合**（`components/AboutOverlay.tsx`）|

---

## ✅ 本次完成（v1.7.1）

### 外站比價 UI 全面升級（`components/AboutOverlay.tsx`）

根據使用者測試回饋修正的 6 個問題：

| # | 問題 | 修正 |
|---|------|------|
| 1 | 出發地固定 TPE 無法調整 | 新增出發地下拉（同機場清單）|
| 2 | 沒有回程日期 | 新增回程日期欄（選填），查直飛時同步查回程 |
| 3 | 直飛只顯示 1 筆 | 改為顯示 Top 5，每筆都有起飛/降落時間 |
| 4 | 換目的地後舊直飛留著 | `fhSearchOuter` 開始即清除 `fhDirectResult` |
| 5 | 起飛/降落時間未顯示 | 所有航班卡片顯示 `departure` / `arrival` |
| 6 | 外站定位段不清楚 | 外站卡片明確標示「定位段 TPE→SIN，再飛 SIN→LHR」|

**新增 state**：
- `fhOrigin` — 出發地（預設 `TPE｜台北桃園`）
- `fhReturnDate` — 回程日期（選填）
- `fhReturnResult` — 回程直飛查詢結果

**新增常數**：`FH_AIRPORTS`（30 個機場，出發地與目的地共用）

---

## 🔴 下一個對話要做

1. **SIM 卡查詢元件**（已規劃很久，還沒做）
   ```ts
   fetch('https://opencli-api.liupony2000.workers.dev/api/sim-rank?country=Vietnam&days=7')
   ```

2. **deploy 到線上**（功能確認 OK 後）：
   ```bash
   cd "/Users/liu/Documents/porject/肥宅老司機前進世界地圖"
   git add -A && git commit -m "v1.7.1: 外站比價 UI 升級" && git push
   ```

3. **外站比價進一步優化**（低優先）：
   - 查外站方案時也查回程外站（目前回程只查直飛）
   - 地圖點擊時自動帶入目的地城市

---

## 🔗 相關 API 端點（直接可用，無金鑰）

| 服務 | URL | 說明 |
|------|-----|------|
| 機票比價 | `https://flight.twgolddigger.com/search` | 外站票，TPE 出發 |
| 機票輪詢 | `https://flight.twgolddigger.com/jobs/{id}` | outer/mix 非同步結果 |
| 匯率 | `https://opencli-api.liupony2000.workers.dev/api/forex` | 台銀真實牌告匯率 |
| SIM卡 | `https://opencli-api.liupony2000.workers.dev/api/sim-rank` | SIM 卡 CP 值排名 |

---

## 開發環境

```bash
cd "/Users/liu/Documents/porject/肥宅老司機前進世界地圖"
npm run dev
```

部署：push 到 git，Cloudflare Pages 自動 CI/CD  
線上網址：`https://fattymap.pages.dev/`

---

## ⚠️ 注意事項

1. flight-hack API 架在自己的 Mac（開機自啟）。Mac 關機 API 就掛，外站比價功能失效
2. `https://flight.twgolddigger.com` CORS 已開 `*`，前端直接呼叫沒問題
3. Trip.com 聯盟 ID 在 `AboutOverlay.tsx` 的 `TRIP_AFFILIATE` 常數
4. Cloudflare Pages 環境變數要在 CF Pages 後台設定（不是 .env 檔）
