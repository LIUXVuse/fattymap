# 技術規格書 (Technical Specification)

![Version](https://img.shields.io/badge/version-1.2.0-green) ![Status](https://img.shields.io/badge/status-穩定版-brightgreen)

> 最後更新: 2025-12-20

## 1. 專案概述

本專案為單頁式應用程式 (SPA)，旨在提供高互動性的地圖筆記功能。核心邏輯圍繞在 `MapContainer` (地圖呈現)、`MemoryModal` (資料輸入) 與 `MemoryFeed` (多層級列表呈現)。

## 2. 資料結構定義 (Data Structures)

### 2.1 Memory (回憶節點)

儲存單一地圖標記的所有資訊。

```typescript
interface Memory {
  id: string;           // 唯一識別碼 (Timestamp string 或 Firestore Document ID)
  creatorId: string;    // 建立者 ID (Firebase Auth UID)
  author: string;       // 建立者暱稱
  authorAvatar?: string; // 頭像 URL (Cloudinary)
  isAnonymous: boolean; // 是否匿名
  location: Location;   // 地理位置資訊
  content: string;      // 心得內容
  photos: string[];     // 照片 URL 陣列 (Cloudinary URLs)
  timestamp: number;    // 建立時間
  markerColor: string;  // 標記顏色 (HEX code, e.g., "#ef4444")
  markerIcon?: string;  // 標記圖示代碼 (e.g., "food", "smile")
  category: {           // 分類資訊
      main: string;     // 主分類名稱
      sub?: string;     // 子分類名稱 (Optional)
  };
  region: RegionInfo;   // 地理分區資訊
}
```

### 2.2 CategoryNode (樹狀分類)

支援無限層級擴充，目前實作兩層 (Main > Sub)。

```typescript
interface CategoryNode {
    id: string;
    name: string;
    parentId: string | null; // 若為 null 則為主分類
    children?: CategoryNode[];
    isCustom?: boolean;      // 標記是否為用戶自訂 (決定可否刪除)
    creatorId?: string;      // 建立者 ID (用於權限模擬與 Firestore 規則判定)
}
```

### 2.3 RegionInfo (區域資訊)

```typescript
interface RegionInfo {
    country: string; // 例如：台灣
    area: string;    // 例如：台北市
}
```

### 2.4 Location (地理資訊)

```typescript
interface Location {
  lat: number;
  lng: number;
  name?: string;        // 地點名稱 (手動輸入)
  address?: string;     // 地址或經緯度備註
  googleMapsUri?: string; // Google Maps 連結
}
```

### 2.5 PlaceSearchResult (搜尋結果)

```typescript
interface PlaceSearchResult {
    name: string;
    address: string;
    lat: number;
    lng: number;
    placeId?: string;  // Google Place ID (用於取得詳細資訊)
}
```

### 2.6 Sponsor (贊助商)

支援在地圖上顯示 3D 懸浮效果的贊助商標記。

```typescript
interface Sponsor {
  id: string;           // 唯一識別碼
  name: string;         // 贊助商名稱
  imageUrl: string;     // 去背圖片 URL (PNG/WebP，支援圖床)
  location: {
    lat: number;
    lng: number;
  };
  linkUrl?: string;     // 點擊後連結 (可選)
  description?: string; // 簡短描述 (可選)
  isActive: boolean;    // 是否啟用
}
```

**圖片規格**:

- 格式: PNG 或 WebP (需透明背景)
- 建議尺寸: 300-500px 寬
- 檔案大小: < 500KB
- 來源: 可使用任何圖床 (imgur, Cloudinary, meee.com.tw 等)

## 3. 外部服務

### 3.1 Google Maps Tiles

本專案**不使用** Google Maps JavaScript API，而是透過 Leaflet 的 `TileLayer` 直接載入 Google 的圖磚服務。

- **URL Template**: `https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&hl=zh-TW`

### 3.2 Google Places API (搜尋建議)

提供即時搜尋建議與地點詳細資訊。

- **Autocomplete**: 輸入時即時回傳地點候選清單 (Debounce 300ms)
- **Place Details**: 根據 `placeId` 取得完整座標與地址

### 3.3 Cloudinary (圖片儲存)

- **上傳模式**: Unsigned Upload (無需後端簽章)
- **免費方案限制**: 單檔 10MB、總量 25GB
- **自動壓縮**: 前端會自動將超過 9MB 的圖片壓縮
  - 最大尺寸: 2048px
  - 品質: 從 90% 逐步降低至 30%

## 4. 前端元件邏輯

### 4.1 MapContainer (`components/MapContainer.tsx`)

- **核心庫**: `react-leaflet`
- **自訂 Marker**: 使用 `L.divIcon` 結合 React 渲染的 SVG (`<MapPin />`)。
  - **動態著色**: SVG 的 `fill` 屬性直接綁定 `Memory.markerColor`。
  - **圖示映射**: 使用 `ICON_MAP` 將字串代碼轉換為 Lucide React 元件。
- **路線繪製**: 使用 `<Polyline />` 元件，根據 `routePoints` 狀態中的 ID 順序連接座標。
- **自動展開 Popup**:
  - 使用 `focusedMemoryId` 狀態追蹤目標圖釘
  - 透過 `markerRef.current?.openPopup()` 程式化打開 Popup
  - 延遲 800ms 等待地圖移動動畫完成
- **重疊 Marker 選擇器**: 當多個 Marker 重疊時，顯示選擇器讓用戶選擇

### 4.2 MemoryModal (`components/MemoryModal.tsx`)

- **狀態管理**:
  - `recentIcons`: 紀錄用戶最近使用的 6 個圖示，並自動排序。
- **互動流程**:
  - 點擊地圖 -> 彈出 Modal (帶入經緯度) -> 用戶填寫資訊 -> 提交。

### 4.3 MemoryFeed (`components/MemoryFeed.tsx`)

- **四層式導航**:
    1. **Countries View**: 顯示已建立足跡的國家列表。
    2. **Areas View**: 顯示該國家下的區域/城市列表。
    3. **Categories View**: 顯示該區域下的分類。
    4. **Posts View**: 顯示文章列表。
- **隨機探索功能**:
  - 隨機選取一個回憶
  - 移動地圖視角並自動展開圖釘 Popup
  - 更新側邊欄導航至該回憶所在的區域
- **自動滾動**: 點擊地圖 Marker 時自動滾動到對應回憶卡片

### 4.4 圖片壓縮服務 (`services/firebase.ts`)

```typescript
const compressImage = async (file: File): Promise<Blob> => {
  // 如果檔案 <= 9MB 直接回傳
  // 否則使用 Canvas API 進行壓縮:
  // 1. 限制最大尺寸 2048px
  // 2. 從 90% 品質開始嘗試
  // 3. 每次降低 10% 直到符合限制 (最低 30%)
}
```

### 4.5 搜尋服務 (`services/mapService.ts`)

- **getAutocomplete**: 即時搜尋建議 (Google Places Autocomplete)
- **getPlaceDetails**: 根據 placeId 取得座標與地址
- **openGoogleMapsNavigation**: 產生 Google Maps 多點導航 URL

### 4.6 SponsorMarker (`components/SponsorMarker.tsx`)

專為贊助商設計的特殊地圖標記元件。

- **視覺效果**:
  - CSS 3D 傾斜效果 (`perspective` + `rotateX`)
  - 上下懸浮動畫
  - 金色光暈效果
  - 「⭐ SPONSOR」徽章
- **互動功能**:
  - 點擊顯示贊助商資訊 Popup
  - 支援外部連結跳轉
  - 分享連結功能 (複製 `?sponsor=xxx` URL)
- **渲染優先級**: `zIndexOffset: 500` 確保顯示在一般 Marker 上方

### 4.7 贊助商管理面板 (`components/SponsorAdminPanel.tsx`)

- **管理員專用**: 僅限管理員帳號可見
- **CRUD 功能**: 新增、編輯、刪除贊助商
- **即時預覽**: 圖片 URL 即時預覽

## 5. URL 分享功能

支援透過 URL 參數分享特定回憶或贊助商。

### 5.1 分享回憶

- **URL 格式**: `?memory={memoryId}`
- **效果**: 自動定位地圖、打開 Popup、側邊欄導航

### 5.2 分享贊助商

- **URL 格式**: `?sponsor={sponsorId}`
- **效果**: 自動定位地圖、打開「合作贊助」頁面

## 6. 系統架構與部署規劃 (Architecture & Deployment)

本專案採用 **Serverless** 架構，確保高擴展性與低維護成本。

### 6.1 前端部署 (Frontend Hosting)

- **平台**: **Cloudflare Pages**。
- **流程**:
    1. 程式碼託管於 Git Repository (GitHub/GitLab)。
    2. Cloudflare Pages 連結 Git Repo。
    3. Push to `main` branch 自動觸發 Build (`npm run build`) 與 Deploy。
- **優勢**: 全球 CDN 加速、HTTPS 自動配置、與 Git 深度整合。

### 6.2 後端服務 (Backend Services)

- **平台**: **Google Firebase**。
- **Authentication (身份驗證)**:
  - 使用 Firebase Auth 處理註冊、登入。
  - 支援 Google Social Login。
- **Database (資料庫)**:
  - 使用 **Cloud Firestore** (NoSQL)。
  - 資料結構映射前端的 Types。
- **Storage (檔案儲存)**:
  - 使用 **Cloudinary** 儲存用戶上傳的圖片 (取代 Firebase Storage)。
  - 前端將圖片自動壓縮後上傳，並取得 URL 存入 Firestore。

### 6.3 安全性 (Security)

- **Firestore Security Rules**:
  - 公開讀取 (Public Read)：允許所有人查看地圖上的公開標記。
  - 權限寫入 (Authorized Write)：
    - 新增/編輯/刪除：僅限 `request.auth.uid == resource.data.creatorId` (僅本人能修改自己的資料)。
- **Environment Variables**:
  - Firebase Config (API Key, Project ID) 將透過環境變數注入，不直接提交於 Git 中。

## 7. 版本記錄

### v1.2.0 (穩定版) - 2025-12-20

- ✅ **重疊 Marker 選擇器** - 多個 Marker 重疊時顯示選擇列表
- ✅ **側邊欄自動滾動** - 點擊地圖 Marker 自動滾動到對應回憶卡片
- ✅ **回憶分享連結** - 複製 `?memory=xxx` URL 分享單篇回憶
- ✅ **贊助商分享連結** - 複製 `?sponsor=xxx` URL 分享贊助商
- ✅ **贊助商管理面板** - 管理員可 CRUD 管理贊助商
- ✅ **贊助商連結行為優化** - 有填 URL 跳轉外部、無填則開啟合作頁面

### v1.1.0 - 2025-12-20

- ✅ **贊助商 3D 懸浮 Marker** - 支援去背圖片、浮動動畫、金色光暈效果

### v1.0.0 (穩定版) - 2025-12-17

- ✅ 完整的地圖標記與編輯功能
- ✅ Google 登入與匿名發文
- ✅ 自動圖片壓縮 (解決 Cloudinary 10MB 限制)
- ✅ 搜尋建議 (Google Places Autocomplete)
- ✅ 隨機探索自動展開圖釘
- ✅ 多點 Google Maps 導航
- ✅ 留言板功能
