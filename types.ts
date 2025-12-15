export interface Location {
  lat: number;
  lng: number;
  name?: string;
  address?: string;
  googleMapsUri?: string;
}

// 支援任意 HEX 顏色
export type MarkerColor = string;
// 支援的圖示代碼 (擴充為 string 以支援大量圖示)
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
  creatorId: string; // 新增：建立者 ID
  location: Location;
  author: string; // 真實暱稱 (存入資料庫)
  isAnonymous: boolean; // 是否開啟匿名
  content: string;
  timestamp: number;
  photos: string[]; // Base64 strings
  markerColor: MarkerColor;
  markerIcon?: MarkerIconType; // 新增：圖示類型
  category: {
      main: string;
      sub?: string;
  };
  region: RegionInfo; // 新增地理分區
}

export interface PlaceSearchResult {
  lat: number;
  lng: number;
  name: string;
  address: string;
  uri?: string;
  region: RegionInfo; 
}