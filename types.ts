export interface Location {
  lat: number;
  lng: number;
  name?: string;
  address?: string;
  googleMapsUri?: string;
}

// 支援任意 HEX 顏色
export type MarkerColor = string;
// 支援的圖示代碼
export type MarkerIconType = string;

export interface RegionInfo {
  country: string; // 例如：台灣
  area: string;    // 例如：台北市
}

export interface CategoryNode {
  id: string;
  name: string;
  parentId: string | null;
  children?: CategoryNode[];
  isCustom?: boolean; // 標記是否為用戶自訂
  creatorId?: string; // 模擬擁有者 ID
}

export interface Memory {
  id: string;
  creatorId: string; // Firebase UID

  // 身分識別
  author: string;        // 顯示名稱 (可能是 Google 名稱、自訂名稱或 '匿名')
  authorAvatar?: string; // 顯示頭像 (可能是 Google Photo、自訂上傳 URL)
  isAnonymous: boolean;  // UI 標記，若為真則顯示匿名圖示(或忽略 authorAvatar)
  identityType?: 'google' | 'custom' | 'anonymous'; // 用於追蹤用戶選擇的身分類型

  location: Location;
  content: string;
  timestamp: number;
  photos: string[]; // Firebase Storage URLs
  markerColor: MarkerColor;
  markerIcon?: MarkerIconType;
  category: {
    main: string;
    sub?: string;
  };
  region: RegionInfo;
}

export interface Comment {
  id: string;
  memoryId: string;
  author: string;
  authorAvatar?: string;
  content: string;
  imageUrl?: string; // 向下相容舊資料
  images?: string[]; // 新的多圖欄位
  timestamp: number;
  userId?: string; // 如果是登入用戶
}

export interface PlaceSearchResult {
  lat: number;
  lng: number;
  name: string;
  address: string;
  uri?: string;
  region: RegionInfo;
  placeId?: string; // Google Places ID，用於取得詳細資訊
}

export interface UserInfo {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

// 贊助商定義
export interface Sponsor {
  id: string;
  name: string;           // 贊助商名稱
  imageUrl: string;       // 去背後的 PNG 圖片網址
  location: {
    lat: number;
    lng: number;
  };
  linkUrl?: string;       // 點擊後連結（可選）
  description?: string;   // 簡短描述（可選）
  isActive: boolean;      // 是否啟用
  scale?: number;         // 圖示縮放比例 (0.5~2.0)，預設 1.0
}