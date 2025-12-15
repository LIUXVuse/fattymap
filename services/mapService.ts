import { PlaceSearchResult } from "../types";

/**
 * 使用 OpenStreetMap (Nominatim) 進行逆向地理編碼
 * 免費方案，無須 API Key，但須注意頻率限制 (1秒1次)
 * 修正：將 accept-language 移至 URL 參數以避免 CORS 問題
 */
export const findPlaceDetails = async (
  lat: number,
  lng: number
): Promise<PlaceSearchResult | null> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=zh-TW`
    );
    
    if (!response.ok) throw new Error("Network response was not ok");
    
    const data = await response.json();
    const addr = data.address || {};

    // 組合地點名稱 (優先順序: 設施名 > 路名 > 區域)
    let name = data.name || "";
    if (!name) {
        name = addr.amenity || addr.shop || addr.tourism || addr.historic || addr.building || addr.road || "未命名地點";
    }

    // 組合完整地址
    const fullAddress = data.display_name || "";

    // 解析區域
    const country = addr.country || "未知國度";
    // 城市/區域判定邏輯
    const area = addr.city || addr.town || addr.village || addr.county || addr.suburb || addr.district || "未知區域";

    return {
        lat: parseFloat(data.lat),
        lng: parseFloat(data.lon),
        name: name,
        address: fullAddress,
        uri: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
        region: { country, area }
    };

  } catch (error) {
    console.error("Geocoding Error:", error);
    // 失敗時回傳基礎座標
    return {
        lat: lat,
        lng: lng,
        name: `新地點 (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
        address: `${lat}, ${lng}`,
        uri: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
        region: { country: "", area: "" }
    };
  }
};

/**
 * 地點搜尋功能
 * 1. 支援座標格式 (lat, lng)
 * 2. 支援關鍵字搜尋，回傳多筆建議結果
 * 修正：增加 limit 上限，避免過度編碼導致關鍵字失效
 */
export const searchLocation = async (query: string): Promise<PlaceSearchResult[]> => {
    // 1. 檢查是否為座標格式 (例如: 25.0330, 121.5654)
    const coordRegex = /^(-?\d+(\.\d+)?)[,\s]+(-?\d+(\.\d+)?)$/;
    const match = query.match(coordRegex);

    if (match) {
        const lat = parseFloat(match[1]);
        const lng = parseFloat(match[3]);
        // 驗證經緯度範圍
        if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
            return [{
                lat,
                lng,
                name: `座標地點 (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
                address: `經度: ${lng}, 緯度: ${lat}`,
                region: { country: "未知", area: "座標導航" }
            }];
        }
    }

    // 2. 關鍵字搜尋 (Nominatim)
    try {
        // limit 增加到 10 筆，增加找到正確地點的機率
        // 移除不必要的編碼處理，只使用 encodeURIComponent
        // 使用 q 參數進行通用搜尋，這對組合關鍵字 (例如: 台北 美食) 支援較好
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=10&addressdetails=1&accept-language=zh-TW`
        );
        const data = await response.json();
        
        if (data && data.length > 0) {
            return data.map((item: any) => {
                const addr = item.address || {};
                const country = addr.country || "未知國度";
                const area = addr.city || addr.town || addr.village || addr.county || addr.suburb || addr.district || "未知區域";

                return {
                    lat: parseFloat(item.lat),
                    lng: parseFloat(item.lon),
                    name: item.display_name.split(',')[0], // 簡短名稱
                    address: item.display_name, // 完整地址
                    region: { country, area }
                };
            });
        }
        return [];
    } catch (error) {
        console.error("Search Error:", error);
        return [];
    }
}