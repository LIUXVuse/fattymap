# 肥宅老司機前進世界地圖 (Otaku Old Driver's World Map)

![Version](https://img.shields.io/badge/version-1.0.0-green) ![Status](https://img.shields.io/badge/status-穩定版-brightgreen)

這是一個基於地圖的互動式足跡紀錄應用程式。專為熱愛探索的使用者設計，結合了 Google Maps 的街景資訊，讓您輕鬆標記美食、景點與住宿，並規劃專屬的「老司機」路線。

## ✨ 主要功能

* **🗺️ Google 風格地圖**: 使用 Google Maps 圖磚，提供最熟悉的街道與地標資訊。
* **📍 自由標記與編輯**:
  * 點擊地圖任意處即可新增回憶。
  * **全彩標籤**: 內建常用色盤，並支援色票選擇器 (Color Picker)，讓地圖釘色彩繽紛。
  * **豐富圖示**: 支援各類生活、旅遊、人物、表情符號圖示，並具備「常用圖示」自動排序功能。
  * **手動分區**: 用戶可自定義標記點所屬的「國家」與「城市」，便於系統自動歸檔。
* **🔍 智慧搜尋建議**:
  * 即時搜尋建議 (Autocomplete)，輸入時自動顯示地點候選清單。
  * 支援 Google Places API 取得詳細地點資訊。
* **🌳 樹狀分類系統**:
  * 支援主分類（如：美食）與子分類（如：日式、甜點）。
  * 用戶可自由「新增」與「刪除」自訂分類。
* **🕶️ 匿名發文**: 支援切換為匿名模式，分享私房景點不留痕跡。
* **🚗 多點導航模式**:
  * 開啟導航模式後，依序點擊地圖上的標記點。
  * 自動繪製路徑連線，規劃順遊行程。
  * 支援一鍵跳轉 Google Maps 進行實際導航。
* **📸 照片紀錄 (自動壓縮)**:
  * 支援上傳多張照片紀錄當地風情。
  * **自動壓縮大圖**: 超過 9MB 的圖片會自動壓縮，解決 Cloudinary 免費方案的 10MB 限制。
* **🌏 旅遊預訂 (Trip.com 聯盟)**:
  * 內建酒店/機票搜尋框，直接查詢 Trip.com 優惠方案。
  * 六國熱門地區酒店推薦：泰國、越南、菲律賓、台灣、日本、印尼。
  * 點擊地區直接跳轉 Trip.com 查看優惠酒店。
* **🎲 隨機探索**:
  * 點擊左上角 Banner 可隨機傳送到一個回憶。
  * **自動展開圖釘**: 隨機探索或點擊側邊欄回憶時，地圖會自動移動並展開該圖釘的 Popup。

## 🛠️ 技術棧 (Tech Stack)

* **前端框架**: React 19, TypeScript
* **地圖引擎**: Leaflet, React-Leaflet
* **圖資來源**: Google Maps Tiles (Roadmap), Google Places API (搜尋建議)
* **樣式**: Tailwind CSS, Lucide React (Icons)
* **建置工具**: Vite
* **部署平台**: Cloudflare Pages (Git Integration)
* **後端與資料庫**:
  * **Google Firebase**: Authentication (登入), Firestore (資料庫)
  * **Cloudinary**: Image Hosting (免費圖床，無需綁卡，自動壓縮大圖)

## 🚀 快速開始

### 安裝依賴

確保您的環境已安裝 Node.js。

```bash
npm install
```

### 啟動開發伺服器

```bash
npm start
# 或
npm run dev
```

## ⚙️ 環境與後端設定 (重要)

本專案依賴 Firebase 與 Cloudinary，請務必完成以下設定：

### 1. Firebase 設定

1. 前往 [Firebase Console](https://console.firebase.google.com/) 建立專案。
2. **Authentication**: 啟用 Google Sign-In。
    * ⚠️ **重要**: 到 Authentication > Settings > **Authorized domains**，新增您的 Cloudflare 網址 (例如 `your-app.pages.dev`)。
3. **Firestore**: 建立資料庫 (選擇 `asia-east1` 或 `us-central1`，並以測試模式啟動)。
4. 取得 SDK Config (Project Settings > General > Your apps)。

### 2. Cloudinary 設定 (圖片上傳)

1. 註冊 [Cloudinary](https://cloudinary.com/) 免費帳號。
2. 前往 Settings > Upload > **Upload presets**。
3. 新增一個 Preset，將 **Signing Mode** 設為 **`Unsigned`**。
4. 記下 `Cloud Name` 與 `Upload Preset Name`。

**免費方案限制**:

| 項目 | 限制 |
|------|------|
| 單次上傳 | 10 MB (系統自動壓縮) |
| 總儲存空間 | 25 GB |
| 每月頻寬 | 25 GB |

### 3. Google Places API 設定 (搜尋建議)

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)。
2. 啟用 **Places API** 與 **Places API (New)**。
3. 建立 API Key 並限制使用範圍。

### 4. 環境變數 (.env)

請在專案根目錄建立 `.env` 檔案 (或在 Cloudflare Pages 後台設定)：

```env
# Firebase
VITE_FIREBASE_API_KEY=您的_API_KEY
VITE_FIREBASE_AUTH_DOMAIN=您的_專案ID.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=您的_專案ID
VITE_FIREBASE_STORAGE_BUCKET=您的_專案ID.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=您的_SENDER_ID
VITE_FIREBASE_APP_ID=您的_APP_ID

# Cloudinary
VITE_CLOUDINARY_CLOUD_NAME=您的_Cloud_Name
VITE_CLOUDINARY_UPLOAD_PRESET=您的_Upload_Preset_Name

# Google Places API
VITE_GOOGLE_PLACES_API_KEY=您的_Google_API_Key
```

## 📖 使用指南

1. **新增足跡**: 點擊地圖上的任意位置，彈出視窗會顯示該處座標，請手動填入地點名稱、選擇國家/地區、分類，並上傳照片。
2. **搜尋地點**: 在搜尋框輸入地點名稱，系統會即時顯示建議清單，點擊後自動跳轉並打開新增視窗。
3. **管理分類**: 在新增視窗中，點擊 `+` 號可新增主分類或子分類；點擊垃圾桶圖示可刪除自訂分類。
4. **瀏覽足跡**: 左側側邊欄採用「三層式導航」，依序選擇 **國家/地區** > **城市** > **分類** 即可查看所有相關文章。
5. **隨機探索**: 點擊左上角的 Banner 圖片，系統會隨機帶你到一個回憶並自動展開圖釘。
6. **路線規劃**: 點擊右上角的「開啟路線規劃」，依序點擊地圖上的標記，系統將畫出藍色虛線路徑，並可一鍵開啟 Google Maps 導航。

## 📝 版本記錄

### v1.0.0 (穩定版) - 2025-12-17

* ✅ 完整的地圖標記與編輯功能

* ✅ Google 登入與匿名發文
* ✅ 自動圖片壓縮 (解決 Cloudinary 10MB 限制)
* ✅ 搜尋建議 (Google Places Autocomplete)
* ✅ 隨機探索自動展開圖釘
* ✅ 多點 Google Maps 導航
* ✅ 留言板功能

### v1.4.1 - 2025-12-21

* ✅ **Trip.com 聯盟連結修正**
  * 機票連結改用 SEO 友善 URL 格式 (`/flights/taipei-to-{city}/tickets-tpe-{code}`)
  * 日本、印尼機票使用城市代碼 (TYO/OSA/JKT) 而非機場代碼
  * 所有酒店連結改用數字 cityId
  * 特殊處理馬尼拉 (使用 provinceId 格式)

### v1.4.0 - 2025-12-21

* ✅ **Trip.com 聯盟行銷整合**
  * 新增「🌏 旅遊預訂」按鈕於右上角
  * 酒店/機票搜尋框 (iFrame 嵌入)
  * 六國地區酒店推薦：泰國、越南、菲律賓、台灣、日本、印尼
