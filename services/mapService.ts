import { PlaceSearchResult } from "../types";

/**
 * 使用 OpenStreetMap (Nominatim) 進行逆向地理編碼
 * 免費方案，無須 API Key，但須注意頻率限制 (1秒1次)
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

        let name = data.name || "";
        if (!name) {
            name = addr.amenity || addr.shop || addr.tourism || addr.historic || addr.building || addr.road || "未命名地點";
        }

        const fullAddress = data.display_name || "";
        const country = addr.country || "未知國度";
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

// API Keys
const GOOGLE_PLACES_API_KEY = import.meta.env.VITE_GOOGLE_PLACES_API_KEY || '';
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';

/**
 * 地點搜尋功能 - 使用 Google Places API (New) 作為主要搜尋
 * 備援：Mapbox -> Nominatim
 * 1. 支援座標格式 (lat, lng)
 * 2. 支援關鍵字搜尋，回傳多筆建議結果
 * 3. 全球 POI 搜尋，資料最完整
 */
export const searchLocation = async (query: string): Promise<PlaceSearchResult[]> => {
    // 1. 檢查是否為座標格式 (例如: 25.0330, 121.5654)
    const coordRegex = /^(-?\d+(\.\d+)?)[,\s]+(-?\d+(\.\d+)?)$/;
    const match = query.match(coordRegex);

    if (match) {
        const lat = parseFloat(match[1]);
        const lng = parseFloat(match[3]);
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

    // 2. 優先使用 Google Places API (New) - Text Search
    if (GOOGLE_PLACES_API_KEY) {
        try {
            const response = await fetch(
                'https://places.googleapis.com/v1/places:searchText',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
                        'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.location,places.shortFormattedAddress'
                    },
                    body: JSON.stringify({
                        textQuery: query,
                        languageCode: 'zh-TW',
                        maxResultCount: 10
                    })
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                console.error("Google Places API Error:", errorData);
                throw new Error(`Google API Error: ${response.status}`);
            }

            const data = await response.json();

            if (data.places && data.places.length > 0) {
                return data.places.map((place: any) => {
                    const lat = place.location?.latitude || 0;
                    const lng = place.location?.longitude || 0;

                    // 從地址解析國家和區域
                    const addressParts = (place.formattedAddress || '').split(', ');
                    const country = addressParts[addressParts.length - 1] || "未知國度";
                    const area = addressParts[addressParts.length - 2] || "未知區域";

                    return {
                        lat,
                        lng,
                        name: place.displayName?.text || place.shortFormattedAddress || "未命名地點",
                        address: place.formattedAddress || "",
                        region: { country, area },
                        uri: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
                    };
                });
            }
        } catch (error) {
            console.error("Google Places Search Error:", error);
        }
    }

    // 3. 備援：Mapbox Geocoding API
    if (MAPBOX_TOKEN) {
        console.log("降級使用 Mapbox...");
        try {
            const response = await fetch(
                `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?` +
                `access_token=${MAPBOX_TOKEN}` +
                `&types=poi,address,place,neighborhood,locality` +
                `&language=zh-TW` +
                `&limit=10`
            );

            if (response.ok) {
                const data = await response.json();

                if (data.features && data.features.length > 0) {
                    return data.features.map((feature: any) => {
                        const [lng, lat] = feature.center;
                        let country = "未知國度";
                        let area = "未知區域";

                        if (feature.context) {
                            for (const ctx of feature.context) {
                                if (ctx.id.startsWith('country')) country = ctx.text;
                                if (ctx.id.startsWith('place') || ctx.id.startsWith('locality')) area = ctx.text;
                                if (ctx.id.startsWith('district') && area === "未知區域") area = ctx.text;
                            }
                        }

                        return {
                            lat,
                            lng,
                            name: feature.text || feature.place_name.split(',')[0],
                            address: feature.place_name,
                            region: { country, area },
                            uri: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
                        };
                    });
                }
            }
        } catch (error) {
            console.error("Mapbox Search Error:", error);
        }
    }

    // 4. 最終備援：Nominatim
    console.log("降級使用 Nominatim...");
    try {
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
                    name: item.display_name.split(',')[0],
                    address: item.display_name,
                    region: { country, area }
                };
            });
        }
    } catch (fallbackError) {
        console.error("Nominatim Search Error:", fallbackError);
    }

    return [];
}