import React, { useState, useEffect, useRef } from 'react';
import { Loader2, Search } from 'lucide-react';

// 目的地清單（含 ISO 國碼、英文城市名用於天氣查詢、機場 API 值）
const DEST_GROUPS: {
    group: string;
    dests: { label: string; country: string; cityEn: string; airport: string }[];
}[] = [
    {
        group: '🇯🇵 日本',
        dests: [
            { label: '東京', country: 'JP', cityEn: 'Tokyo', airport: 'TYO｜東京（含NRT/HND）' },
            { label: '大阪', country: 'JP', cityEn: 'Osaka', airport: 'OSA｜大阪（含KIX/ITM）' },
            { label: '福岡', country: 'JP', cityEn: 'Fukuoka', airport: 'FUK｜福岡' },
            { label: '沖繩', country: 'JP', cityEn: 'Naha', airport: 'OKA｜沖繩' },
            { label: '札幌', country: 'JP', cityEn: 'Sapporo', airport: 'CTS｜札幌千歲' },
            { label: '名古屋', country: 'JP', cityEn: 'Nagoya', airport: 'NGO｜名古屋' },
        ],
    },
    {
        group: '🇰🇷 韓國',
        dests: [
            { label: '首爾', country: 'KR', cityEn: 'Seoul', airport: 'ICN｜首爾仁川' },
            { label: '釜山', country: 'KR', cityEn: 'Busan', airport: 'PUS｜釜山' },
        ],
    },
    {
        group: '🇭🇰 香港 / 🇲🇴 澳門',
        dests: [
            { label: '香港', country: 'HK', cityEn: 'Hong Kong', airport: 'HKG｜香港' },
            { label: '澳門', country: 'MO', cityEn: 'Macau', airport: 'MFM｜澳門' },
        ],
    },
    {
        group: '🇹🇭 泰國',
        dests: [
            { label: '曼谷', country: 'TH', cityEn: 'Bangkok', airport: 'BKK｜曼谷素萬那普' },
            { label: '普吉島', country: 'TH', cityEn: 'Phuket', airport: 'HKT｜普吉島' },
            { label: '清邁', country: 'TH', cityEn: 'Chiang Mai', airport: 'CNX｜清邁' },
        ],
    },
    {
        group: '🇸🇬 新加坡',
        dests: [
            { label: '新加坡', country: 'SG', cityEn: 'Singapore', airport: 'SIN｜新加坡' },
        ],
    },
    {
        group: '🇲🇾 馬來西亞',
        dests: [
            { label: '吉隆坡', country: 'MY', cityEn: 'Kuala Lumpur', airport: 'KUL｜吉隆坡' },
            { label: '檳城', country: 'MY', cityEn: 'Penang', airport: 'PEN｜檳城' },
        ],
    },
    {
        group: '🇻🇳 越南',
        dests: [
            { label: '胡志明市', country: 'VN', cityEn: 'Ho Chi Minh City', airport: 'SGN｜胡志明市' },
            { label: '河內', country: 'VN', cityEn: 'Hanoi', airport: 'HAN｜河內' },
            { label: '峴港', country: 'VN', cityEn: 'Da Nang', airport: 'DAD｜峴港' },
        ],
    },
    {
        group: '🇵🇭 菲律賓',
        dests: [
            { label: '馬尼拉', country: 'PH', cityEn: 'Manila', airport: 'MNL｜馬尼拉' },
            { label: '宿霧', country: 'PH', cityEn: 'Cebu', airport: 'CEB｜宿霧' },
        ],
    },
    {
        group: '🇲🇲 緬甸',
        dests: [
            { label: '仰光', country: 'MM', cityEn: 'Yangon', airport: 'RGN｜仰光' },
        ],
    },
    {
        group: '🇰🇭 柬埔寨',
        dests: [
            { label: '金邊', country: 'KH', cityEn: 'Phnom Penh', airport: 'PNH｜金邊' },
            { label: '暹粒', country: 'KH', cityEn: 'Siem Reap', airport: 'REP｜暹粒' },
        ],
    },
    {
        group: '🇱🇦 寮國',
        dests: [
            { label: '永珍', country: 'LA', cityEn: 'Vientiane', airport: 'VTE｜永珍' },
        ],
    },
    {
        group: '🇱🇰 斯里蘭卡',
        dests: [
            { label: '可倫坡', country: 'LK', cityEn: 'Colombo', airport: 'CMB｜可倫坡' },
        ],
    },
    {
        group: '🇳🇵 尼泊爾',
        dests: [
            { label: '加德滿都', country: 'NP', cityEn: 'Kathmandu', airport: 'KTM｜加德滿都' },
        ],
    },
    {
        group: '🇮🇩 印尼',
        dests: [
            { label: '雅加達', country: 'ID', cityEn: 'Jakarta', airport: 'CGK｜雅加達' },
            { label: '峇里島', country: 'ID', cityEn: 'Denpasar', airport: 'DPS｜峇里島' },
        ],
    },
    {
        group: '🇮🇳 印度',
        dests: [
            { label: '新德里', country: 'IN', cityEn: 'New Delhi', airport: 'DEL｜新德里' },
            { label: '孟買', country: 'IN', cityEn: 'Mumbai', airport: 'BOM｜孟買' },
            { label: '班加羅爾', country: 'IN', cityEn: 'Bangalore', airport: 'BLR｜班加羅爾' },
        ],
    },
    {
        group: '🇨🇳 中國大陸',
        dests: [
            { label: '北京', country: 'CN', cityEn: 'Beijing', airport: 'PEK｜北京首都' },
            { label: '上海', country: 'CN', cityEn: 'Shanghai', airport: 'PVG｜上海浦東' },
            { label: '廣州', country: 'CN', cityEn: 'Guangzhou', airport: 'CAN｜廣州' },
            { label: '成都', country: 'CN', cityEn: 'Chengdu', airport: 'CTU｜成都' },
            { label: '昆明', country: 'CN', cityEn: 'Kunming', airport: 'KMG｜昆明' },
        ],
    },
    {
        group: '🇦🇪 中東',
        dests: [
            { label: '杜拜', country: 'AE', cityEn: 'Dubai', airport: 'DXB｜杜拜' },
            { label: '多哈', country: 'QA', cityEn: 'Doha', airport: 'DOH｜多哈' },
            { label: '特拉維夫', country: 'IL', cityEn: 'Tel Aviv', airport: 'TLV｜特拉維夫' },
        ],
    },
    {
        group: '🌍 非洲',
        dests: [
            { label: '開羅', country: 'EG', cityEn: 'Cairo', airport: 'CAI｜開羅' },
            { label: '約翰尼斯堡', country: 'ZA', cityEn: 'Johannesburg', airport: 'JNB｜約翰尼斯堡' },
            { label: '奈洛比', country: 'KE', cityEn: 'Nairobi', airport: 'NBO｜奈洛比' },
        ],
    },
    {
        group: '🇹🇷 土耳其',
        dests: [
            { label: '伊斯坦堡', country: 'TR', cityEn: 'Istanbul', airport: 'IST｜伊斯坦堡' },
        ],
    },
    {
        group: '🇬🇧 英國',
        dests: [
            { label: '倫敦', country: 'GB', cityEn: 'London', airport: 'LON｜倫敦（含LHR/LGW/STN）' },
        ],
    },
    {
        group: '🇫🇷 法國',
        dests: [
            { label: '巴黎', country: 'FR', cityEn: 'Paris', airport: 'CDG｜巴黎戴高樂' },
        ],
    },
    {
        group: '🇩🇪 德國',
        dests: [
            { label: '法蘭克福', country: 'DE', cityEn: 'Frankfurt', airport: 'FRA｜法蘭克福' },
        ],
    },
    {
        group: '🇮🇹 義大利',
        dests: [
            { label: '羅馬', country: 'IT', cityEn: 'Rome', airport: 'FCO｜羅馬' },
            { label: '米蘭', country: 'IT', cityEn: 'Milan', airport: 'MXP｜米蘭' },
        ],
    },
    {
        group: '🇵🇹 葡萄牙',
        dests: [
            { label: '里斯本', country: 'PT', cityEn: 'Lisbon', airport: 'LIS｜里斯本' },
        ],
    },
    {
        group: '🇬🇷 希臘',
        dests: [
            { label: '雅典', country: 'GR', cityEn: 'Athens', airport: 'ATH｜雅典' },
        ],
    },
    {
        group: '🇪🇸 西班牙',
        dests: [
            { label: '馬德里', country: 'ES', cityEn: 'Madrid', airport: 'MAD｜馬德里' },
            { label: '巴塞隆納', country: 'ES', cityEn: 'Barcelona', airport: 'BCN｜巴塞隆納' },
        ],
    },
    {
        group: '🇨🇭 瑞士',
        dests: [
            { label: '蘇黎世', country: 'CH', cityEn: 'Zurich', airport: 'ZRH｜蘇黎世' },
        ],
    },
    {
        group: '🇦🇹 奧地利',
        dests: [
            { label: '維也納', country: 'AT', cityEn: 'Vienna', airport: 'VIE｜維也納' },
        ],
    },
    {
        group: '🇸🇪🇩🇰🇳🇴🇫🇮 北歐',
        dests: [
            { label: '斯德哥爾摩', country: 'SE', cityEn: 'Stockholm', airport: 'ARN｜斯德哥爾摩' },
            { label: '哥本哈根', country: 'DK', cityEn: 'Copenhagen', airport: 'CPH｜哥本哈根' },
            { label: '奧斯陸', country: 'NO', cityEn: 'Oslo', airport: 'OSL｜奧斯陸' },
            { label: '赫爾辛基', country: 'FI', cityEn: 'Helsinki', airport: 'HEL｜赫爾辛基' },
        ],
    },
    {
        group: '🇵🇱🇨🇿🇭🇺 東歐',
        dests: [
            { label: '華沙', country: 'PL', cityEn: 'Warsaw', airport: 'WAW｜華沙' },
            { label: '布拉格', country: 'CZ', cityEn: 'Prague', airport: 'PRG｜布拉格' },
            { label: '布達佩斯', country: 'HU', cityEn: 'Budapest', airport: 'BUD｜布達佩斯' },
        ],
    },
    {
        group: '🇺🇸 美國',
        dests: [
            { label: '紐約', country: 'US', cityEn: 'New York', airport: 'NYC｜紐約（含JFK/EWR/LGA）' },
            { label: '洛杉磯', country: 'US', cityEn: 'Los Angeles', airport: 'LAX｜洛杉磯' },
            { label: '舊金山', country: 'US', cityEn: 'San Francisco', airport: 'SFO｜舊金山' },
            { label: '拉斯維加斯', country: 'US', cityEn: 'Las Vegas', airport: 'LAS｜拉斯維加斯' },
        ],
    },
    {
        group: '🇲🇽 墨西哥',
        dests: [
            { label: '墨西哥城', country: 'MX', cityEn: 'Mexico City', airport: 'MEX｜墨西哥城' },
            { label: '坎昆', country: 'MX', cityEn: 'Cancun', airport: 'CUN｜坎昆' },
        ],
    },
    {
        group: '🇧🇷 巴西',
        dests: [
            { label: '聖保羅', country: 'BR', cityEn: 'Sao Paulo', airport: 'GRU｜聖保羅' },
        ],
    },
    {
        group: '🇦🇺 澳洲',
        dests: [
            { label: '雪梨', country: 'AU', cityEn: 'Sydney', airport: 'SYD｜雪梨' },
            { label: '墨爾本', country: 'AU', cityEn: 'Melbourne', airport: 'MEL｜墨爾本' },
        ],
    },
    {
        group: '🇳🇿 紐西蘭',
        dests: [
            { label: '奧克蘭', country: 'NZ', cityEn: 'Auckland', airport: 'AKL｜奧克蘭' },
        ],
    },
];

// 台灣護照（中華民國）簽證資訊
// type: 免簽 | 落地簽 | 電子簽 | 需申請
interface VisaInfo {
    type: '免簽' | '落地簽' | '電子簽' | '需申請';
    days?: number;
    fee?: string;
    note?: string;
}

const VISA_DATA: Record<string, VisaInfo> = {
    JP: { type: '免簽', days: 90, note: '每90天免簽，日本旅遊最受歡迎' },
    KR: { type: '免簽', days: 90, note: '免簽入境，單次停留最多90天' },
    HK: { type: '免簽', days: 30, note: '免簽，可延簽至最多90天' },
    MO: { type: '免簽', days: 30, note: '免簽入境，30天內可停留' },
    TH: { type: '免簽', days: 30, note: '2024年起免簽60天' },
    SG: { type: '免簽', days: 30, note: '免簽入境' },
    MY: { type: '免簽', days: 30, note: '免簽入境，一般旅遊30天' },
    VN: { type: '電子簽', days: 90, fee: '約 USD 25', note: 'E-visa 最多90天，可多次入境' },
    PH: { type: '免簽', days: 30, note: '可延簽，最長停留36個月' },
    ID: { type: '免簽', days: 30, note: 'Bali & 部分入境口免簽30天' },
    AE: { type: '落地簽', days: 30, fee: '約 USD 35', note: '抵達後辦落地簽，或可網路申請' },
    QA: { type: '免簽', days: 30, note: '2023年起台灣護照免簽' },
    TR: { type: '電子簽', days: 30, fee: '約 USD 60', note: 'e-Visa 需提前申請，多次入境' },
    GB: { type: '電子簽', days: 180, fee: '約 GBP 10', note: 'ETA (Electronic Travel Authorisation)，2024年起實施' },
    FR: { type: '免簽', days: 90, note: '申根免簽，180天內最多90天' },
    DE: { type: '免簽', days: 90, note: '申根免簽，同法國規則' },
    CH: { type: '免簽', days: 90, note: '申根免簽（瑞士為申根成員）' },
    AT: { type: '免簽', days: 90, note: '申根免簽' },
    ES: { type: '免簽', days: 90, note: '申根免簽' },
    NL: { type: '免簽', days: 90, note: '申根免簽' },
    IT: { type: '免簽', days: 90, note: '申根免簽' },
    US: { type: '需申請', fee: '約 USD 14 (ESTA)', note: 'ESTA 電子旅行授權，最多90天，需提前上網申請' },
    AU: { type: '需申請', fee: '約 AUD 20 (ETA)', note: 'ETA 電子旅行授權，可線上申請，12個月多次入境' },
    NZ: { type: '需申請', fee: '約 NZD 23 (NZeTA)', note: 'NZeTA 電子旅行授權，需提前申請' },
    // 東南亞補充
    MM: { type: '電子簽', days: 28, fee: '約 USD 50', note: 'e-Visa 需提前申請，單次入境' },
    KH: { type: '電子簽', days: 30, fee: '約 USD 36', note: 'e-Visa 線上申請，落地簽也可辦' },
    LA: { type: '落地簽', days: 30, fee: '約 USD 35', note: '可辦落地簽，或事先申請 e-Visa' },
    LK: { type: '電子簽', days: 30, fee: '約 USD 20 (ETA)', note: '需提前申請電子旅行授權' },
    NP: { type: '落地簽', days: 15, fee: '約 USD 30', note: '抵達後辦落地簽，15/30/90天不同費用' },
    // 印度
    IN: { type: '電子簽', days: 60, fee: '約 USD 25 (e-Visa)', note: '需提前申請 e-Visa，可多次入境' },
    // 中國大陸
    CN: { type: '需申請', note: '一般需辦理中國簽證，部分城市過境可享免簽政策（如上海、廣州144小時過境免簽）' },
    // 中東/非洲
    IL: { type: '免簽', days: 90, note: '台灣護照免簽入境以色列，停留最多90天' },
    EG: { type: '落地簽', days: 30, fee: '約 USD 25', note: '抵達後可辦落地簽，或事先辦理' },
    ZA: { type: '免簽', days: 30, note: '台灣護照免簽入境南非' },
    KE: { type: '電子簽', days: 90, fee: '約 USD 50 (eTA)', note: '需事先申請 e-Travel Authorization' },
    // 歐洲
    PT: { type: '免簽', days: 90, note: '申根免簽，同法國規則' },
    GR: { type: '免簽', days: 90, note: '申根免簽' },
    SE: { type: '免簽', days: 90, note: '申根免簽' },
    DK: { type: '免簽', days: 90, note: '申根免簽' },
    NO: { type: '免簽', days: 90, note: '申根免簽（挪威為申根成員）' },
    FI: { type: '免簽', days: 90, note: '申根免簽' },
    PL: { type: '免簽', days: 90, note: '申根免簽' },
    CZ: { type: '免簽', days: 90, note: '申根免簽' },
    HU: { type: '免簽', days: 90, note: '申根免簽' },
    // 美洲
    MX: { type: '免簽', days: 180, note: '台灣護照可免簽入境墨西哥，最多180天' },
    BR: { type: '免簽', days: 90, note: '2023年起台灣護照可免簽入境巴西' },
};

// WMO 天氣碼轉文字
function getWeatherDesc(code: number): { desc: string; emoji: string } {
    if (code === 0) return { desc: '晴天', emoji: '☀️' };
    if (code <= 3) return { desc: '多雲', emoji: '⛅' };
    if (code <= 48) return { desc: '霧', emoji: '🌫️' };
    if (code <= 57) return { desc: '毛毛雨', emoji: '🌦️' };
    if (code <= 65) return { desc: '雨天', emoji: '🌧️' };
    if (code <= 77) return { desc: '雪', emoji: '❄️' };
    if (code <= 82) return { desc: '陣雨', emoji: '🌧️' };
    if (code <= 99) return { desc: '雷暴', emoji: '⛈️' };
    return { desc: '未知', emoji: '🌡️' };
}

// 台灣出發地（僅台灣機場）
const FLEX_ORIGINS = [
    { label: '台北桃園 (TPE)', value: 'TPE｜台北桃園' },
    { label: '台北松山 (TSA)', value: 'TSA｜台北松山' },
    { label: '高雄 (KHH)', value: 'KHH｜高雄' },
    { label: '台中 (RMQ)', value: 'RMQ｜台中' },
];

const FH_API = 'https://flight.twgolddigger.com';

export const DestinationInfoPanel: React.FC = () => {
    // 目的地選擇
    const [selectedKey, setSelectedKey] = useState('');  // "group|label" key

    // 查找當前選擇的目的地物件
    const selectedDest = (() => {
        if (!selectedKey) return null;
        for (const g of DEST_GROUPS) {
            for (const d of g.dests) {
                if (`${g.group}|${d.label}` === selectedKey) return d;
            }
        }
        return null;
    })();

    // 天氣狀態
    const [weather, setWeather] = useState<{
        temp: number;
        weathercode: number;
        tempMax?: number;
        tempMin?: number;
        humidity?: number;
        windspeed?: number;
        precipitation?: number;
    } | null>(null);
    const [weatherLoading, setWeatherLoading] = useState(false);
    const [weatherError, setWeatherError] = useState('');
    const [weatherLabel, setWeatherLabel] = useState('即時天氣');
    // 快取 geocoding 結果，避免換日期時重複查
    const geoCacheRef = useRef<{ cityEn: string; lat: number; lon: number } | null>(null);

    // 彈性日期查詢狀態
    const [flexOrigin, setFlexOrigin] = useState('TPE｜台北桃園');
    const [flexStart, setFlexStart] = useState('');
    const [flexEnd, setFlexEnd] = useState('');
    const [flexBaggage, setFlexBaggage] = useState(0);
    const [flexNonstop, setFlexNonstop] = useState(false);
    const [flexLoading, setFlexLoading] = useState(false);
    const [flexResult, setFlexResult] = useState<any>(null);
    const [flexError, setFlexError] = useState('');
    const [flexJobId, setFlexJobId] = useState('');
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const pollCountRef = useRef(0);

    // 切換目的地時自動查即時天氣
    useEffect(() => {
        if (!selectedDest) {
            setWeather(null);
            setWeatherError('');
            setWeatherLabel('即時天氣');
            geoCacheRef.current = null;
            return;
        }
        fetchWeather(selectedDest.cityEn, null);
    }, [selectedKey]);

    // 填寫出發日時，自動切換天氣到「出發日」
    useEffect(() => {
        if (!selectedDest || !flexStart) return;
        fetchWeather(selectedDest.cityEn, flexStart);
    }, [flexStart]);

    // 清理 polling
    useEffect(() => {
        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, []);

    // targetDate = null → 查即時天氣；填日期 → 看天數決定用預報或歷史
    async function fetchWeather(cityEn: string, targetDate: string | null) {
        setWeatherLoading(true);
        setWeather(null);
        setWeatherError('');

        try {
            // Step1: geocoding（有快取就直接用）
            let lat: number, lon: number;
            if (geoCacheRef.current?.cityEn === cityEn) {
                lat = geoCacheRef.current.lat;
                lon = geoCacheRef.current.lon;
            } else {
                const geoRes = await fetch(
                    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityEn)}&count=1&language=en&format=json`
                );
                const geoData = await geoRes.json();
                if (!geoData.results?.length) {
                    setWeatherError('找不到城市座標');
                    return;
                }
                lat = geoData.results[0].latitude;
                lon = geoData.results[0].longitude;
                geoCacheRef.current = { cityEn, lat, lon };
            }

            if (!targetDate) {
                // 即時天氣
                const wxRes = await fetch(
                    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weathercode,windspeed_10m&timezone=auto`
                );
                const wxData = await wxRes.json();
                const c = wxData.current;
                setWeather({
                    temp: Math.round(c.temperature_2m),
                    weathercode: c.weathercode,
                    humidity: c.relative_humidity_2m,
                    windspeed: Math.round(c.windspeed_10m),
                });
                setWeatherLabel('即時天氣');
            } else {
                // 計算距今幾天
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const target = new Date(targetDate);
                const diffDays = Math.round((target.getTime() - today.getTime()) / 86400000);

                if (diffDays >= 0 && diffDays <= 15) {
                    // 16天內：用預報 API
                    const wxRes = await fetch(
                        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,weathercode,precipitation_sum&timezone=auto&start_date=${targetDate}&end_date=${targetDate}`
                    );
                    const wxData = await wxRes.json();
                    const d = wxData.daily;
                    const avg = Math.round((d.temperature_2m_max[0] + d.temperature_2m_min[0]) / 2);
                    setWeather({
                        temp: avg,
                        tempMax: Math.round(d.temperature_2m_max[0]),
                        tempMin: Math.round(d.temperature_2m_min[0]),
                        weathercode: d.weathercode[0],
                        precipitation: d.precipitation_sum[0],
                    });
                    setWeatherLabel(`出發日預報 ${targetDate}`);
                } else {
                    // 超過 16 天：用去年同期歷史資料
                    const lastYear = new Date(targetDate);
                    lastYear.setFullYear(lastYear.getFullYear() - 1);
                    const lyStr = lastYear.toISOString().split('T')[0];
                    const wxRes = await fetch(
                        `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${lyStr}&end_date=${lyStr}&daily=temperature_2m_max,temperature_2m_min,weathercode,precipitation_sum&timezone=auto`
                    );
                    const wxData = await wxRes.json();
                    const d = wxData.daily;
                    const avg = Math.round((d.temperature_2m_max[0] + d.temperature_2m_min[0]) / 2);
                    setWeather({
                        temp: avg,
                        tempMax: Math.round(d.temperature_2m_max[0]),
                        tempMin: Math.round(d.temperature_2m_min[0]),
                        weathercode: d.weathercode[0],
                        precipitation: d.precipitation_sum[0],
                    });
                    setWeatherLabel(`去年同期參考 (${lyStr})`);
                }
            }
        } catch (e) {
            setWeatherError('天氣查詢失敗');
        } finally {
            setWeatherLoading(false);
        }
    }

    function cancelFlex() {
        if (pollRef.current) clearInterval(pollRef.current);
        pollCountRef.current = 0;
        setFlexLoading(false);
        setFlexJobId('');
        setFlexError('已取消查詢');
    }

    async function searchFlex() {
        if (!selectedDest) return;
        if (!flexStart || !flexEnd) {
            setFlexError('請填寫查詢區間起迄日期');
            return;
        }
        if (pollRef.current) clearInterval(pollRef.current);
        pollCountRef.current = 0;
        setFlexLoading(true);
        setFlexResult(null);
        setFlexError('');
        setFlexJobId('');

        try {
            const originCode = flexOrigin.split('｜')[0];
            const destCode = selectedDest.airport.split('｜')[0];
            const params = new URLSearchParams({
                origin: flexOrigin,
                destination: selectedDest.airport,
                start_date: flexStart,
                end_date: flexEnd,
                adults: '1',
                baggage: String(flexBaggage),
                nonstop: String(flexNonstop),
                top_n: '3',
            });
            const res = await fetch(`${FH_API}/flex?${params}`);
            const data = await res.json();

            if (!res.ok) {
                const msg = Array.isArray(data.detail)
                    ? data.detail.map((e: any) => e.msg ?? JSON.stringify(e)).join('; ')
                    : String(data.detail ?? data.message ?? '查詢失敗');
                setFlexError(msg);
                setFlexLoading(false);
                return;
            }

            if (data.status === 'pending' && data.job_id) {
                setFlexJobId(data.job_id);
                // 開始輪詢，最多 40 次（40×15s = 10分鐘）
                const MAX_POLLS = 40;
                pollRef.current = setInterval(async () => {
                    pollCountRef.current += 1;
                    if (pollCountRef.current > MAX_POLLS) {
                        clearInterval(pollRef.current!);
                        setFlexLoading(false);
                        setFlexJobId('');
                        setFlexError('查詢逾時（超過10分鐘）。建議縮短日期區間，例如2-3週內。');
                        return;
                    }
                    try {
                        const pollRes = await fetch(`${FH_API}/jobs/${data.job_id}`);
                        const pollData = await pollRes.json();
                        if (pollData.status === 'pending') {
                            // 還在跑，繼續等
                        } else if (pollData.status === 'error') {
                            clearInterval(pollRef.current!);
                            pollCountRef.current = 0;
                            setFlexLoading(false);
                            setFlexJobId('');
                            setFlexError(pollData.detail ?? pollData.error ?? '查詢失敗');
                        } else {
                            // 沒有 status 欄位 = server 直接回傳結果物件（{ results: [...] }）
                            clearInterval(pollRef.current!);
                            pollCountRef.current = 0;
                            setFlexLoading(false);
                            setFlexJobId('');
                            setFlexResult(Array.isArray(pollData) ? pollData : (pollData.results ?? []));
                        }
                    } catch {
                        // 繼續等
                    }
                }, 15000);
            } else {
                // 同步回傳（不應發生，保留備用）
                setFlexResult(data);
                setFlexLoading(false);
            }
        } catch (e: any) {
            setFlexError('無法連線到比價 API，請確認服務是否啟動');
            setFlexLoading(false);
        }
    }

    const visa = selectedDest ? VISA_DATA[selectedDest.country] : null;
    const visaColor = visa
        ? visa.type === '免簽' ? 'bg-green-50 border-green-200 text-green-800'
            : visa.type === '落地簽' ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
            : visa.type === '電子簽' ? 'bg-blue-50 border-blue-200 text-blue-800'
            : 'bg-red-50 border-red-200 text-red-800'
        : '';
    const visaBadgeColor = visa
        ? visa.type === '免簽' ? 'bg-green-500'
            : visa.type === '落地簽' ? 'bg-yellow-500'
            : visa.type === '電子簽' ? 'bg-blue-500'
            : 'bg-red-500'
        : '';

    return (
        <div className="space-y-5">
            {/* 目的地選擇 */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    選擇目的地
                </label>
                <select
                    value={selectedKey}
                    onChange={(e) => {
                        setSelectedKey(e.target.value);
                        setFlexResult(null);
                        setFlexError('');
                        if (pollRef.current) clearInterval(pollRef.current);
                        setFlexLoading(false);
                    }}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 bg-white focus:ring-2 focus:ring-indigo-400 focus:outline-none text-sm"
                >
                    <option value="">— 請選擇目的地 —</option>
                    {DEST_GROUPS.map((g) => (
                        <optgroup key={g.group} label={g.group}>
                            {g.dests.map((d) => (
                                <option key={d.label} value={`${g.group}|${d.label}`}>
                                    {d.label}
                                </option>
                            ))}
                        </optgroup>
                    ))}
                </select>
            </div>

            {/* 天氣 + 簽證 卡片 */}
            {selectedDest && (
                <div className="grid grid-cols-2 gap-3">
                    {/* 天氣卡 */}
                    <div className="rounded-2xl bg-gradient-to-br from-sky-50 to-blue-100 border border-blue-200 p-4">
                        <div className="text-xs font-semibold text-blue-600 mb-2">
                            🌤️ {weatherLabel}
                        </div>
                        {weatherLoading && (
                            <div className="flex items-center gap-2 text-blue-500 text-sm">
                                <Loader2 size={14} className="animate-spin" />
                                <span>查詢中...</span>
                            </div>
                        )}
                        {weatherError && !weatherLoading && (
                            <div className="text-xs text-red-500">{weatherError}</div>
                        )}
                        {weather && !weatherLoading && (
                            <>
                                <div className="flex items-end gap-2">
                                    <span className="text-3xl">{getWeatherDesc(weather.weathercode).emoji}</span>
                                    <span className="text-2xl font-bold text-blue-800">{weather.temp}°C</span>
                                </div>
                                <div className="text-sm text-blue-700 mt-1">
                                    {getWeatherDesc(weather.weathercode).desc}
                                </div>
                                <div className="text-xs text-blue-500 mt-1.5 space-y-0.5">
                                    {weather.tempMax !== undefined && weather.tempMin !== undefined ? (
                                        <>
                                            <div>🌡️ 最高 {weather.tempMax}° / 最低 {weather.tempMin}°</div>
                                            {weather.precipitation !== undefined && (
                                                <div>🌧️ 降雨 {weather.precipitation.toFixed(1)} mm</div>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            {weather.humidity !== undefined && <div>💧 濕度 {weather.humidity}%</div>}
                                            {weather.windspeed !== undefined && <div>💨 風速 {weather.windspeed} km/h</div>}
                                        </>
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    {/* 簽證卡 */}
                    <div className={`rounded-2xl border p-4 ${visa ? visaColor : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                        <div className="text-xs font-semibold mb-2" style={{ opacity: 0.7 }}>
                            🛂 台灣護照簽證
                        </div>
                        {visa ? (
                            <>
                                <div className="flex items-center gap-2 mb-1.5">
                                    <span className={`text-xs font-bold text-white px-2 py-0.5 rounded-full ${visaBadgeColor}`}>
                                        {visa.type}
                                    </span>
                                    {visa.days && (
                                        <span className="text-sm font-semibold">{visa.days} 天</span>
                                    )}
                                </div>
                                {visa.fee && (
                                    <div className="text-xs mb-1">費用：{visa.fee}</div>
                                )}
                                <div className="text-xs leading-relaxed opacity-80">{visa.note}</div>
                            </>
                        ) : (
                            <div className="text-xs">無簽證資料</div>
                        )}
                    </div>
                </div>
            )}

            {/* 彈性日期最便宜機票 */}
            {selectedDest && (
                <div className="rounded-2xl border border-orange-200 bg-orange-50/60 p-4">
                    <div className="text-sm font-bold text-orange-700 mb-3">
                        📅 彈性日期查最便宜
                        <span className="text-xs font-normal text-orange-500 ml-2">（掃描區間內 Top 3）</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                        <div>
                            <label className="block text-xs text-gray-600 mb-1">出發地</label>
                            <select
                                value={flexOrigin}
                                onChange={(e) => setFlexOrigin(e.target.value)}
                                disabled={flexLoading}
                                className="w-full px-2 py-1.5 rounded-lg border border-gray-300 bg-white text-xs focus:ring-2 focus:ring-orange-400 focus:outline-none disabled:opacity-50"
                            >
                                {FLEX_ORIGINS.map((o) => (
                                    <option key={o.value} value={o.value}>{o.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-gray-600 mb-1">目的地</label>
                            <div className="px-2 py-1.5 rounded-lg border border-orange-200 bg-orange-100 text-xs text-orange-700 font-medium">
                                {selectedDest.label} ({selectedDest.airport.split('｜')[0]})
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                        <div>
                            <label className="block text-xs text-gray-600 mb-1">查詢起始日</label>
                            <input
                                type="date"
                                value={flexStart}
                                onChange={(e) => setFlexStart(e.target.value)}
                                disabled={flexLoading}
                                className="w-full px-2 py-1.5 rounded-lg border border-gray-300 bg-white text-xs focus:ring-2 focus:ring-orange-400 focus:outline-none disabled:opacity-50"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-600 mb-1">查詢截止日</label>
                            <input
                                type="date"
                                value={flexEnd}
                                onChange={(e) => setFlexEnd(e.target.value)}
                                disabled={flexLoading}
                                className="w-full px-2 py-1.5 rounded-lg border border-gray-300 bg-white text-xs focus:ring-2 focus:ring-orange-400 focus:outline-none disabled:opacity-50"
                            />
                        </div>
                    </div>
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <label className="text-xs text-gray-600">
                                行李：
                                <select
                                    value={flexBaggage}
                                    onChange={(e) => setFlexBaggage(Number(e.target.value))}
                                    disabled={flexLoading}
                                    className="ml-1 px-1 py-0.5 rounded border border-gray-300 bg-white text-xs disabled:opacity-50"
                                >
                                    <option value={0}>手提</option>
                                    <option value={1}>托運 1件</option>
                                    <option value={2}>托運 2件</option>
                                </select>
                            </label>
                            <div className="flex flex-col gap-0.5">
                                <label className="flex items-center gap-1 text-xs text-gray-600 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={flexNonstop}
                                        onChange={(e) => setFlexNonstop(e.target.checked)}
                                        disabled={flexLoading}
                                        className="rounded disabled:opacity-50"
                                    />
                                    僅限直飛（不中轉）
                                </label>
                                <span className="text-[10px] text-gray-400 pl-4">適合日韓東南亞短程</span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={searchFlex}
                                disabled={flexLoading || !flexStart || !flexEnd}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {flexLoading ? (
                                    <><Loader2 size={12} className="animate-spin" />掃描中</>
                                ) : (
                                    <><Search size={12} />查最便宜</>
                                )}
                            </button>
                            {flexLoading && (
                                <button
                                    onClick={cancelFlex}
                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-600 text-xs font-bold transition-colors"
                                >
                                    ✕ 取消
                                </button>
                            )}
                        </div>
                    </div>
                    {flexLoading && flexJobId && (() => {
                        const days = flexStart && flexEnd
                            ? Math.round((new Date(flexEnd).getTime() - new Date(flexStart).getTime()) / 86400000) + 1
                            : 0;
                        const minMin = Math.ceil(days * 5 / 60);
                        const maxMin = Math.ceil(days * 15 / 60);
                        return (
                            <div className="text-xs text-orange-600 bg-orange-100 rounded-lg px-3 py-2 space-y-1">
                                <div>⏳ 掃描中，每 15 秒自動更新…</div>
                                <div className="text-orange-500">
                                    共 {days} 天 · 預估 {minMin}-{maxMin} 分鐘
                                    {days > 20 && <span className="ml-1 text-red-500">（範圍較大，建議縮短至 2-3 週）</span>}
                                </div>
                            </div>
                        );
                    })()}
                    {flexError && (
                        <div className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{flexError}</div>
                    )}
                    {flexResult && (
                        <div className="mt-3 space-y-2">
                            {Array.isArray(flexResult) && flexResult.length === 0 && (
                                <div className="text-xs text-gray-500 text-center py-3">
                                    查詢區間內找不到符合條件的航班
                                </div>
                            )}
                            {Array.isArray(flexResult) && flexResult.map((item: any, i: number) => (
                                <div
                                    key={i}
                                    className={`rounded-xl border px-3 py-2.5 ${i === 0
                                        ? 'bg-green-50 border-green-300'
                                        : 'bg-white border-gray-200'
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-1.5">
                                            {i === 0 && <span className="text-sm">🏆</span>}
                                            <span className="text-xs font-semibold text-gray-700">
                                                {item.date ?? item.departure_date ?? '—'}
                                            </span>
                                            <span className="text-xs text-gray-400">
                                                {item.airline ?? ''}
                                            </span>
                                        </div>
                                        <span className={`text-sm font-bold ${i === 0 ? 'text-green-700' : 'text-gray-700'}`}>
                                            NT$ {item.price_twd?.toLocaleString() ?? '—'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                        {item.departure && <span>起飛 {item.departure}</span>}
                                        {item.arrival && <span>降落 {item.arrival}</span>}
                                        {item.stops !== undefined && (
                                            <span className={item.stops === 0 ? 'text-green-600 font-medium' : ''}>
                                                {item.stops === 0 ? '直飛' : `${item.stops} 轉`}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* 尚未選擇時的提示 */}
            {!selectedDest && (
                <div className="text-center py-10 text-gray-400">
                    <div className="text-4xl mb-3">🌏</div>
                    <div className="text-sm">選擇目的地，即可查看天氣、簽證與最便宜出發日</div>
                </div>
            )}
        </div>
    );
};
