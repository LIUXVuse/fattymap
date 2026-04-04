# HANDOVER — 肥宅老司機前進世界地圖

> 上次更新：2026-04-04
> 當前狀態：v1.6.0 — 換匯計算器已接上 opencli 真實匯率 API，下一步：新增 SIM 卡查詢元件

---

## ✅ 本次完成（Step 1）

### 換匯計算器強化（接上 opencli API）

**`services/exchangeRateService.ts`** — 完整重寫匯率來源邏輯：
- 新增 `fetchOpenCliRates()` — 呼叫 `https://opencli-api.liupony2000.workers.dev/api/forex`
- 台灣銀行匯率：從 opencli `bot` 陣列取得**真實現鈔賣出牌告價**，取代原本永遠回空的 FinMind
- Vietcombank 匯率：從 opencli `vcb` 陣列取得，用於越南方案計算
- 保留 ExchangeRate-API（全球中間匯率）做跨幣計算基礎
- `SmartExchangeInput` 新增 `twBanksUSD` 和 `vcbRates` 參數
- **Plan A（帶USD去當地換）**：現在用 `twBanksUSD` 最低賣出價的銀行，而非只用台灣銀行
- **Plan C（台灣直換）**：有台灣銀行資料時，直接用 `cashSell / amount` 精確計算，非估算

**`components/CurrencyExchangeCalculator.tsx`**：
- `MultiRatesState` 新增 `twBanksUSD` 和 `vcbRates`
- 新增「台灣各銀行 USD 現鈔賣出比較」面板（依最低排序，標示最優）
- `calculateSmartExchange()` 現在接收完整的 `twBanksUSD` 和 `vcbRates`

### 對齊 opencli best.ts 邏輯
- 方案A 用最優銀行 USD 賣出，並乘以 0.99（當地換匯所手續費估算）
- VND 方案B 用 Vietcombank 真實買入 USD 匯率 × 0.99

---

## 🔴 下一個對話要做（高優先）

### Step 2：新增 SIM 卡查詢元件

新增 `components/SimRankPanel.tsx`，讓使用者可以在出發前查詢目的地的 SIM 卡 CP 值。

```ts
const res = await fetch(
  'https://opencli-api.liupony2000.workers.dev/api/sim-rank?country=Vietnam&days=7&sim_type=esim&no_real_name=true'
);
const { plans } = await res.json();
// plans[i] = { name, price, duration, speed, simType, ... }
```

可能的 UI 位置：地圖右側面板，旅遊資訊抽屜內（跟換匯計算器放一起）

---

## API 端點（直接可用，無需金鑰）

| 端點 | 說明 |
|------|------|
| `GET /api/forex` | 今日匯率，每天自動快取一次 |
| `GET /api/sim-rank?country=Vietnam&days=7` | SIM 卡 CP 值排名 |

完整文件：`/Users/liu/Documents/porject/opencli/api/worker.ts`

---

## 開發環境

```bash
cd "/Users/liu/Documents/porject/肥宅老司機前進世界地圖"
npm run dev
```

---

## ⚠️ 注意事項

1. opencli API 無金鑰保護（公開）—流量暴增再加限流
2. 匯率每天第一次呼叫時才抓取（冷啟動約 2-3 秒），之後當天都是快取
3. SIM 卡每次即時查詢 trip.com，約 0.5-1 秒
4. `bot` 陣列只有台灣銀行的資料（非多銀行比較）。多銀行比較只限 USD，在 `twBanksUSD` 裡
5. opencli `compare.ts` CLI 有完整多銀行比較，但尚未暴露到 API 端點
