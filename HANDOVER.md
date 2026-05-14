# HANDOVER — 肥宅老司機前進世界地圖

> 上次更新：2026-05-14
> 當前狀態：v1.10，出發攻略 UX 改善 + 簽證資料修正（印尼/泰國）+ 外交部連結

---

## ✅ 本次完成（2026-05-14）

- **出發攻略 UX 改善**：移除「選了才顯示」的空白提示，各 section（天氣/簽證/直飛/換匯/SIM/接送）始終顯示框架，未選目的地時顯示灰色 placeholder，選了後才填入真實資料
- **修正印尼簽證**：從「免簽」改為「落地簽」（Visa on Arrival），費用 IDR 500,000 ≈ USD 35，附 e-VOA 官方申請連結
- **泰國簽證更新**：免簽天數從 30 天改為正確的 60 天，並加入 DTV（Destination Thailand Visa）說明和申請連結
- **外交部連結**：所有國家的簽證卡片新增「🏛️ 外交部」按鈕（連到領事事務局出國旅遊資訊），需要申請的國家加「📝 申請」按鈕連到官方申請網站（VN/ID/TH-DTV/TR/GB/US/AU/NZ/MM/KH/LK/IN/KE）

---

## ✅ 本次完成（2026-05-13）

- **分頁重命名**：`旅遊情報` → `出發攻略`（tab label + icon 更新）
- **直飛快查**：取代原本 4-11 分鐘的彈性日期掃描，改為單日 `mode=direct`，約 15 秒出 Top 3 直飛班次
- **換錢策略卡**：自動從 `opencli /api/forex` 抓匯率，搭配 20+ 國靜態換錢建議 + 醒目 DCC 警告
- **SIM卡推薦卡**：依旅遊天數自動查 `/api/sim-rank`，顯示 CP 最高方案
- **機場接送卡**：呼叫新上線的 `/api/airport-transfer`，列出 Trip.com 接送選項 + USD 付款提醒
- **修 bug**：直飛查詢 422 錯誤 — 移除 `mode` 參數（FastAPI enum 值不是純 `"direct"`）
- **輸入整合**：旅遊天數 + 出發日共用於 SIM 推薦、天氣預報、機票查詢

---

## 🔴 下一個對話要先做

- **Step 1：驗證外交部連結正確性**（目前所有國家都指向 `boca.gov.tw/sp-foof-visitnoticelist-1.html` 列表頁，可考慮改為各國獨立頁，需先在外交部網站上確認各國 URL 格式）
- **Step 2：實測出發攻略各功能**（deploy 後在手機上驗證各卡片 skeleton → 選目的地後資料填入是否正常）
- **Step 3：SIM 卡資料品質**（`daily_gb` 部分仍為估算，需驗證越南/泰國真實資料是否正確）

---

## ⚠️ 已知問題 / 注意事項

1. **flight-hack 需 Mac 開著**：直飛查詢依賴 `https://flight.twgolddigger.com`，Mac 關機即失效
2. **機場接送資料稀少**：Trip.com CityPass 並非所有城市都有接送產品（雅加達測試為空）
3. **換錢策略依賴 COUNTRY_CONFIG**：目前覆蓋 20+ 國，未涵蓋的目的地不顯示換錢卡
4. **SIM 卡 CP 值部分估算**：`daily_gb` 顯示 `~` 開頭表示估算，實際以購買頁面為準
5. **Podcast 自動化**：launchd 每週日更新，SSH key 已設定 (`~/.ssh/id_ed25519`)

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
| v1.8.0 | 旅遊情報分頁（天氣 + 簽證 + 彈性日期查票）|
| v1.8.x | 彈性日期一連串 bug 修正 |
| v1.9 | 出發攻略升級：直飛快查 + 換錢策略 + SIM推薦 + 機場接送 |
| v1.10 | 出發攻略 UX：先顯示框架 + 簽證資料修正（印尼落地簽/泰國60天+DTV）+ 外交部連結 |

---

## 🔴 開發路線圖

**大方向**：出國工具箱 + 購物工具箱，蒐集數據、找 CP 值、找標錯價

| 優先度 | 任務 | 說明 |
|--------|------|------|
| **1（現在）** | 出發攻略各卡片驗證 | 實測換錢/SIM/接送在不同目的地的資料品質 |
| **2** | 住宿跨平台比價 | Agoda vs Booking.com，Trip.com 飯店 API 探索 |
| **3** | 代購 CP 值計算器 | 日圓/韓圜 → 含代購費總成本 vs 台灣 |
| **4（長期）** | 降價追蹤 + 標錯價偵測 | 需後端排程 |

---

## 🔗 相關 API 端點

| 服務 | URL | 說明 |
|------|-----|------|
| 機票比價 | `https://flight.twgolddigger.com/search` | 直飛（mode=direct，預設） |
| 機票輪詢 | `https://flight.twgolddigger.com/jobs/{id}` | outer/mix 非同步結果 |
| 彈性日期 | `https://flight.twgolddigger.com/flex` | 掃描區間最便宜日期 |
| 匯率 | `https://opencli-api.liupony2000.workers.dev/api/forex` | 台銀真實牌告匯率 |
| SIM卡 | `https://opencli-api.liupony2000.workers.dev/api/sim-rank` | CP 值排名 |
| 機場接送 | `https://opencli-api.liupony2000.workers.dev/api/airport-transfer` | Trip.com CityPass |
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
