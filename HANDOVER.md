# HANDOVER — 肥宅老司機前進世界地圖

> 上次更新：2026-05-12  
> 當前狀態：v1.8.x 穩定版，外站機票 API 永久修復完成，Podcast 自動同步已修復

---

## ✅ 2026-05-12 Podcast 自動同步修復

**問題**：5/4 和 5/11 連兩週 git push 失敗（403），S3EP261、S3EP262 摘要積壓在本地沒上網站

**根本原因**：launchd 執行環境沒有 `GH_TOKEN`，`gh auth git-credential` 無法認證 GitHub HTTPS

**修法**：
1. 把 Mac 的 SSH key (`~/.ssh/id_ed25519`) 加到 GitHub 帳號
2. `git remote set-url origin git@github.com:LIUXVuse/fattymap.git`（HTTPS → SSH）
3. 手動 push 了 4 個積壓 commit（含 S3EP261、S3EP262 摘要）

SSH 不需要 env 變數，launchd 以後執行腳本都能正常 push

---

## ✅ 已完成功能清單

| 版本 | 功能 |
|------|------|
| v1.0 | 地圖標記、Google 登入、匿名發文、多點導航、搜尋建議 |
| v1.4 | Trip.com 聯盟整合（旅遊預訂分頁）|
| v1.5 | 照片延遲載入、影片上傳 |
| v1.6 | 換匯計算器接 opencli API 真實匯率 |
| v1.7 | 外站比價整合（`components/AboutOverlay.tsx`）|
| v1.7.1 | 外站比價 UI 升級（出發地、回程、Top5、起降時間）|
| v1.8.0 | 旅遊情報分頁（`components/DestinationInfoPanel.tsx`）天氣 + 簽證 + 彈性日期查票 |
| v1.8.x | 彈性日期一連串 bug 修正（nonstop 傳遞錯誤、輪詢格式不符、取消按鈕、逾時保護）|

---

## ✅ v1.8.x 修正的 bug（本次）

| Bug | 原因 | 修法 |
|-----|------|------|
| 彈性日期勾選「避開聯航」查不到結果 | main.py p_flex parser 無 `--nonstop`；scan_date_range 無 nonstop 參數 | 補齊整條呼叫鏈 |
| 彈性日期結果永遠不顯示 | server `/jobs/{id}` done 時直接回傳結果物件（無 status 欄位），前端等 `status==='done'` 永遠配不到 | 改為 `else` 邏輯（不是 pending = 完成），同時修正取 `pollData.results` |
| 無法中斷查詢 | 無取消按鈕 | 新增「✕ 取消」按鈕 + 40次輪詢上限（10分鐘自動逾時）|
| 「避開聯航」標籤誤導 | 後端 `nonstop=true` 實為「只顯示直飛」，不是「避開聯航」| 改標籤為「僅限直飛（不中轉）」+ 小字說明 |

---

## 🔴 開發路線圖（2026-04-18 確認）

**大方向**：出國工具箱 + 購物工具箱，蒐集數據、找 CP 值、找標錯價

| 優先度 | 任務 | 說明 |
|--------|------|------|
| **1（現在）** | SIM 卡資料品質修正 | daily_gb 全是估算，先修好 |
| **2（下一個）** | 住宿跨平台比價 | Agoda vs Booking.com，有聯盟金 |
| **3** | 代購 CP 值計算器 | 日圓/韓圜 → 含代購費總成本 vs 台灣 |
| **4（長期）** | 降價追蹤 + 標錯價偵測 | 需後端排程，技術難度高 |

---

## 🔴 當前任務：SIM 卡資料品質調查

### 問題描述

目前 SIM 卡 CP 值是**虛假排名**，原因：

1. **`daily_gb` 全是「彈性」** — API 從 Trip.com 抓不到實際 GB 數字
2. **CP 分子寫死 `~0.5GB`** — 不管哪個方案都用同一個估算值，CP = 0.5 ÷ 日價格，排名等於純看最便宜
3. **資料來源是 Trip.com `/things-to-do/` 體驗頁** — 不是 SIM 卡專區，方案數量少（泰國只有 8 筆）

### 核實的 API 原始資料（Thailand 7天）

```json
{
  "daily_gb": "彈性",
  "formula": "~0.5GB ÷ $0.11/天 ≈ 4.545（估算）",
  "cp_score": "~4.545"
}
```

全部 5 筆的 `daily_gb` 都是「彈性」，~0.5GB 是寫死的估算。

### 調查方向

1. **opencli-api 能改嗎？**
   - 路徑：`https://opencli-api.liupony2000.workers.dev/api/sim-rank`
   - 這是自己架的 Cloudflare Worker，可以修改邏輯
   - 需要確認 Trip.com 回來的原始 HTML 裡有沒有 GB 資訊可以解析

2. **前端應加免責聲明**
   - 在結果區加上小字：「⚠️ GB 數為估算，實際以購買頁面為準」

3. **考慮換資料來源**（低優先）
   - Klook、kkday 也賣 SIM 卡，資料可能更完整
   - 不過會需要重寫 API，工程較大

### 建議的第一步

打開 opencli-api 的 Cloudflare Worker 原始碼，看它抓 Trip.com 資料時，實際拿到的 HTML/JSON 裡有沒有 GB 資訊，如果有就修解析邏輯。

---

## 🔗 相關 API 端點

| 服務 | URL | 說明 |
|------|-----|------|
| 機票比價 | `https://flight.twgolddigger.com/search` | 外站票 |
| 機票輪詢 | `https://flight.twgolddigger.com/jobs/{id}` | outer/mix/flex 非同步結果 |
| 彈性日期 | `https://flight.twgolddigger.com/flex` | 掃描區間最便宜日期 |
| 匯率 | `https://opencli-api.liupony2000.workers.dev/api/forex` | 台銀真實牌告匯率 |
| SIM卡 | `https://opencli-api.liupony2000.workers.dev/api/sim-rank` | CP 值排名（資料品質待改善）|
| 天氣 Geocoding | `https://geocoding-api.open-meteo.com/v1/search` | 免金鑰 |
| 天氣預報 | `https://api.open-meteo.com/v1/forecast` | 即時 / 未來 16 天 |
| 天氣歷史 | `https://archive-api.open-meteo.com/v1/archive` | 去年同期參考 |

---

## 開發環境

```bash
cd "/Users/liu/Documents/porject/肥宅老司機前進世界地圖"
npm run dev
```

部署：push 到 git → Cloudflare Pages 自動 CI/CD  
線上網址：`https://fattymap.pages.dev/`

---

## 🟡 下下個任務：住宿跨平台比價

### 目標
同一間飯店，Agoda vs Booking.com 自動比價，顯示哪邊便宜。

### 為什麼值得做
- 兩個平台都有聯盟計畫，導流有聯盟金收入
- 用戶出發前一定需要，流量場景明確

### 技術方向
- Agoda 有公開 Affiliate API（需申請）
- Booking.com 有 Demand API（需申請）
- 備案：直接串 RapidAPI 上的 Agoda/Booking 非官方 API（有免費額度）

### 建議 UI 位置
放在旅遊情報分頁（`DestinationInfoPanel.tsx`），輸入目的地 + 日期 → 列出 Top 5 飯店各平台比價

---

## ⚠️ 注意事項

1. flight-hack API 架在自己的 Mac（開機自啟）。Mac 關機，外站比價與彈性日期功能失效
2. API Log：`tail -f ~/.pw-pkg/flighthack-api.log`（舊路徑 /tmp/flighthack-api.log 已廢棄）
3. **2026-05-06 修復**：`/tmp/pw-pkg` 改為 `~/.pw-pkg`，不再怕 macOS 清 /tmp。`_run_cli` 有自動修復機制
3. Trip.com 聯盟 ID 在 `AboutOverlay.tsx` 的 `TRIP_AFFILIATE` 常數
4. Cloudflare Pages 環境變數在 CF Pages 後台設定（不是 .env 檔）
5. `/jobs/{id}` done 時直接回傳結果物件（無 status 包裝），前端要用 `else` 判斷，不能用 `status === 'done'`
6. 彈性日期查歐美需 4-11 分鐘，建議縮短區間至 2-3 週
