# 技術規格書 (Technical Specification)

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
  isAnonymous: boolean; // 是否匿名
  location: Location;   // 地理位置資訊
  content: string;      // 心得內容
  photos: string[];     // 照片 (Base64 string array 或 Firebase Storage URL)
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

## 3. 外部服務

### 3.1 Google Maps Tiles
本專案**不使用** Google Maps JavaScript API，而是透過 Leaflet 的 `TileLayer` 直接載入 Google 的圖磚服務。
*   **URL Template**: `https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&hl=zh-TW`

### 3.2 OpenStreetMap (Nominatim)
用於地點搜尋與逆向地理編碼 (Reverse Geocoding)。

## 4. 前端元件邏輯

### 4.1 MapContainer (`components/MapContainer.tsx`)
*   **核心庫**: `react-leaflet`
*   **自訂 Marker**: 使用 `L.divIcon` 結合 React 渲染的 SVG (`<MapPin />`)。
    *   **動態著色**: SVG 的 `fill` 屬性直接綁定 `Memory.markerColor`。
    *   **圖示映射**: 使用 `ICON_MAP` 將字串代碼轉換為 Lucide React 元件。
*   **路線繪製**: 使用 `<Polyline />` 元件，根據 `routePoints` 狀態中的 ID 順序連接座標。

### 4.2 MemoryModal (`components/MemoryModal.tsx`)
*   **狀態管理**: 
    *   `recentIcons`: 紀錄用戶最近使用的 6 個圖示，並自動排序。
*   **互動流程**:
    *   點擊地圖 -> 彈出 Modal (帶入經緯度) -> 用戶填寫資訊 -> 提交。

### 4.3 MemoryFeed (`components/MemoryFeed.tsx`)
*   **三層式導航**: 
    1.  **Regions View**: 顯示已建立足跡的國家列表。
    2.  **Areas View**: 顯示該國家下的區域/城市列表。
    3.  **Categories View**: 顯示該區域下的分類。
    4.  **Posts View**: 顯示文章列表。

## 5. 系統架構與部署規劃 (Architecture & Deployment)

本專案採用 **Serverless** 架構，確保高擴展性與低維護成本。

### 5.1 前端部署 (Frontend Hosting)
*   **平台**: **Cloudflare Pages**。
*   **流程**: 
    1.  程式碼託管於 Git Repository (GitHub/GitLab)。
    2.  Cloudflare Pages 連結 Git Repo。
    3.  Push to `main` branch 自動觸發 Build (`npm run build`) 與 Deploy。
*   **優勢**: 全球 CDN 加速、HTTPS 自動配置、與 Git 深度整合。

### 5.2 後端服務 (Backend Services)
*   **平台**: **Google Firebase**。
*   **Authentication (身份驗證)**:
    *   使用 Firebase Auth 處理註冊、登入。
    *   支援 Google, Facebook 等 Social Login。
*   **Database (資料庫)**:
    *   使用 **Cloud Firestore** (NoSQL)。
    *   資料結構映射前端的 Types。
*   **Storage (檔案儲存)**:
    *   使用 **Firebase Storage** 儲存用戶上傳的圖片。
    *   前端將圖片壓縮後上傳，並取得 Download URL 存入 Firestore。

### 5.3 安全性 (Security)
*   **Firestore Security Rules**:
    *   公開讀取 (Public Read)：允許所有人查看地圖上的公開標記。
    *   權限寫入 (Authorized Write)：
        *   新增/編輯/刪除：僅限 `request.auth.uid == resource.data.creatorId` (僅本人能修改自己的資料)。
*   **Environment Variables**:
    *   Firebase Config (API Key, Project ID) 將透過環境變數注入，不直接提交於 Git 中。
