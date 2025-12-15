# 肥宅老司機前進世界地圖 (Otaku Old Driver's World Map)

這是一個基於地圖的互動式足跡紀錄應用程式。專為熱愛探索的使用者設計，結合了 Google Maps 的街景資訊，讓您輕鬆標記美食、景點與住宿，並規劃專屬的「老司機」路線。

## ✨ 主要功能

*   **🗺️ Google 風格地圖**: 使用 Google Maps 圖磚，提供最熟悉的街道與地標資訊。
*   **📍 自由標記與編輯**: 
    *   點擊地圖任意處即可新增回憶。
    *   **全彩標籤**: 內建常用色盤，並支援色票選擇器 (Color Picker)，讓地圖釘色彩繽紛。
    *   **豐富圖示**: 支援各類生活、旅遊、人物、表情符號圖示，並具備「常用圖示」自動排序功能。
    *   **手動分區**: 用戶可自定義標記點所屬的「國家」與「城市」，便於系統自動歸檔。
*   **🌳 樹狀分類系統**:
    *   支援主分類（如：美食）與子分類（如：日式、甜點）。
    *   用戶可自由「新增」與「刪除」自訂分類。
*   **🕶️ 匿名發文**: 支援切換為匿名模式，分享私房景點不留痕跡。
*   **🚗 多點導航模式**: 
    *   開啟導航模式後，依序點擊地圖上的標記點。
    *   自動繪製路徑連線，規劃順遊行程。
    *   支援一鍵跳轉 Google Maps 進行實際導航。
*   **📸 照片紀錄**: 支援上傳多張照片紀錄當地風情。

## 🛠️ 技術棧 (Tech Stack)

*   **前端框架**: React 19, TypeScript
*   **地圖引擎**: Leaflet, React-Leaflet
*   **圖資來源**: Google Maps Tiles (Roadmap), OpenStreetMap (Nominatim Search)
*   **樣式**: Tailwind CSS, Lucide React (Icons)
*   **建置工具**: Vite
*   **部署平台**: Cloudflare Pages (Git Integration)
*   **後端與資料庫**: 
    *   **Google Firebase**: Authentication (登入), Firestore (資料庫)
    *   **Cloudinary**: Image Hosting (免費圖床，無需綁卡)

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
1.  前往 [Firebase Console](https://console.firebase.google.com/) 建立專案。
2.  **Authentication**: 啟用 Google Sign-In。
    *   ⚠️ **重要**: 到 Authentication > Settings > **Authorized domains**，新增您的 Cloudflare 網址 (例如 `your-app.pages.dev`)。
3.  **Firestore**: 建立資料庫 (選擇 `asia-east1` 或 `us-central1`，並以測試模式啟動)。
4.  取得 SDK Config (Project Settings > General > Your apps)。

### 2. Cloudinary 設定 (圖片上傳)
1.  註冊 [Cloudinary](https://cloudinary.com/) 免費帳號。
2.  前往 Settings > Upload > **Upload presets**。
3.  新增一個 Preset，將 **Signing Mode** 設為 **`Unsigned`**。
4.  記下 `Cloud Name` 與 `Upload Preset Name`。

### 3. 環境變數 (.env)
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
```

## 📖 使用指南

1.  **新增足跡**: 點擊地圖上的任意位置，彈出視窗會顯示該處座標，請手動填入地點名稱、選擇國家/地區、分類，並上傳照片。
2.  **管理分類**: 在新增視窗中，點擊 `+` 號可新增主分類或子分類；點擊垃圾桶圖示可刪除自訂分類。
3.  **瀏覽足跡**: 左側側邊欄採用「三層式導航」，依序選擇 **國家/地區** > **分類** 即可查看所有相關文章。
4.  **路線規劃**: 點擊右上角的「開啟路線規劃」，依序點擊地圖上的標記，系統將畫出藍色虛線路徑。
