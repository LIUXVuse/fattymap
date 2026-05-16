# HANDOVER — 肥宅老司機前進世界地圖

> 上次更新：2026-05-16
> 當前狀態：v1.13，簡體中文全面修正完畢（資料庫 61 筆 + 程式碼邏輯 3 處）

---

## ✅ 本次完成（2026-05-16，第五次）

- **全站 RWD 手機平板深度適配（v1.14）**：
  - `App.tsx`：`w-screen` → `w-full`、`h-screen` → `h-[100dvh]`（修 iOS Safari viewport 遮底問題）
  - Sidebar：手機改為 `w-full sm:w-80`，全寬展開不留縫
  - 右側按鈕欄：`right-2 sm:right-4`、`gap-1.5 sm:gap-2`、padding `sm:` 斷點化
  - Helper 提示浮動文字：`bottom-24 sm:bottom-10`（避開手機虛擬鍵盤）
  - 路線規劃面板：`w-44 sm:w-48 md:w-64`
  - 登入 Modal：`p-5 sm:p-8`、頭像 `w-24 sm:w-32`、標題 `text-2xl sm:text-3xl`、說明文字縮小
  - `MemoryFeed.tsx`：Banner `h-40 sm:h-56`、列表 `p-2 sm:p-4`
  - `MemoryModal.tsx`：外框 `p-2 sm:p-4`、內容 `p-4 sm:p-6`、`max-h-[92dvh]`、region input 改 `flex-1`、textarea `h-20 sm:h-24`
  - `CommentModal.tsx`：`p-2 sm:p-4`、`max-h-[92dvh]`
  - `ImageLightbox.tsx`：主圖 `max-h-[75vh] sm:max-h-[80vh]`、縮圖 `w-12 sm:w-14`、箭頭 `p-2 sm:p-3`
  - Build 零錯誤，已 push → Cloudflare Pages 自動部署

## ✅ 本次完成（2026-05-16，第四次）

- **補修俄羅斯漏網**：`俄罗斯` → `俄羅斯`（第三次掃描遺漏，本次補上，共 61 筆全數修正）
- **程式碼修正確認**：三處修改均驗證正確（mapService namedetails、App.tsx region 傳遞、MemoryModal 邏輯）

---

## ✅ 本次完成（2026-05-16，第三次）

- **資料庫簡體修正**：
  - 透過 Firebase Admin SDK + Service Account 連進 Firestore
  - 批次修正 60 筆 memories 的 region 欄位（泰国→泰國、菲律宾→菲律賓、德国→德國、印度尼西亚→印度尼西亞、河内市→河內市、富国特区→富國特區、计顺市→計順市、马尼拉→馬尼拉、三宝垄→三寶壟）
- **程式碼修正（防止再出現簡體）**：
  - `types.ts`：Location 介面加 `region?` 欄位
  - `App.tsx`：搜尋選地點時把 Google Places region 帶進 tempLocation
  - `MemoryModal.tsx`：有 region 就直接用，不再重查 Nominatim
  - `mapService.ts`：Nominatim 加 `namedetails=1`，優先取 `name:zh-TW` 繁體標籤
- **Service Account 金鑰管理**：
  - `serviceAccountKey.json` 存進專案根目錄
  - `.gitignore` 加入 `serviceAccountKey.json` 防止上傳
- **firebase-admin** 加入 devDependencies

---

## ✅ 本次完成（2026-05-16，第二次）

- **圖片載入優化**：
  - Banner 圖片（登入畫面 + 側邊欄）加 `fetchPriority="high"` + `decoding="async"`，第一眼畫面更快顯示
  - 所有 memory 照片加 `decoding="async"`，圖片解碼移到背景執行緒，捲動不卡頓
  - Avatar 小圖加 `loading="lazy"`，減少初始並行請求數
- **地圖 tile 預載優化**：TileLayer `keepBuffer` 從 1 升到 3，地圖拖動時空白格子減少

---

## ✅ 本次完成（2026-05-16，第一次）

- **全專案 Code Audit**：跑 `tsc --noEmit` + `npm run build` + 靜態掃描
- **修 TypeScript 21 個錯誤**（全清零）：
  - 移除未用 import：`MarkerColor`, `RegionInfo`, `MarkerIconType`（App.tsx）、`ImageIcon`, `MapIcon`（MemoryFeed）、`useRef`, `Trash2`（MemoryModal）、`getDocs`, `where`（firebase.ts）
  - 刪未用元件：`DiscordIcon`（AboutOverlay）、`DraggablePin`（MapContainer）
  - 刪未用函式：`getDefaultDate`、`getTransferUrl`（AboutOverlay）
  - 刪未用 prop：`onDeleteCategory`、`uploadImage`（MemoryModal）
  - 修死碼條件：`searchType !== 'flight-hack'`（永遠 true 的冗餘判斷）
  - 移除 3 個不可達的 `case 'transfer':` switch 分支
  - 修 `memory.videos` null 警告（加 `!`）
- **清 console.log**：CurrencyExchangeCalculator × 3、mapService × 2、firebase × 3
- **App.tsx**：geolocation error handler 改用 `console.error`
- Build 結果：零 TS 錯誤，bundle 縮小 0.76 kB

---

## ✅ 本次完成（2026-05-14，第二次）

- **換錢策略 UX 升級**：主顯示從「0.0022 IDR/1 TWD」改為「NT$10,000 → 4,545,454 IDR」，直覺顯示台幣能換多少
- **1萬/5萬切換按鈕**：新增 `twdAmount` state，兩顆按鈕切換基準金額，即時更新換算結果
- **台幣本位匯率小字**：灰色說明從「1 IDR = 0.0022 TWD」改為「1 TWD ≈ 459 IDR（台銀現鈔賣出）」

---

## ✅ 本次完成（2026-05-14，第一次）

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

- **Step 1：手機實機驗證 RWD**：用手機開 `fattymap.pages.dev`，確認：
  - iOS Safari 底部不被工具列遮住（`100dvh` 生效）
  - Sidebar 手機全寬展開 / 點外部收起
  - 登入 Modal 在小螢幕上文字不被截斷
  - MemoryModal / CommentModal 虛擬鍵盤彈出時 Modal 不縮到看不到
- **Step 2：上網站驗證繁體**：確認泰國、菲律賓、俄羅斯等地側邊欄分類全為繁體
- **Step 3：換錢策略驗證**（THB 等 rate >= 1 的貨幣，1萬/5萬切換換算是否正確）
- **Step 4：SIM 卡資料品質**（`daily_gb` 部分仍為估算，需驗證越南/泰國真實資料）

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
| v1.11 | Code Audit：TS 21錯→0、清 console.log、刪死碼 |
| v1.12 | 效能優化：圖片 fetchPriority/decoding/lazy + TileLayer keepBuffer 1→3 |
| v1.13 | 簡體修正：DB 60筆批次更新 + Nominatim namedetails + region 傳遞邏輯 |
| v1.14 | 手機平板深度 RWD 適配：100dvh / Sidebar 全寬 / Modal dvh / 所有元件 sm: 斷點 |

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
