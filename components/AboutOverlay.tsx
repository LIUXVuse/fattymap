import React, { useState, useEffect } from 'react';
import { X, Heart, ShoppingBag, Users, Headphones, Instagram, Globe, ExternalLink, Copy, Check, Bug, Plane, Building2, MapPin, ChevronDown, ChevronUp, Search, Loader2 } from 'lucide-react';
import { CurrencyExchangeCalculator } from './CurrencyExchangeCalculator';
import { SimRankPanel } from './SimRankPanel';
import { DestinationInfoPanel } from './DestinationInfoPanel';

// Spotify 圖示 SVG
const SpotifyIcon = () => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
);

// Telegram 圖示 SVG
const TelegramIcon = () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.96 6.502-1.36 8.627-.168.9-.5 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
);

// Discord 圖示 SVG
const DiscordIcon = () => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
);

interface AboutOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    initialTab?: 'about' | 'collab' | 'more' | 'travel' | 'podcast' | 'sim' | 'info';  // 新增：指定初始 Tab
}

type TabType = 'about' | 'collab' | 'more' | 'travel' | 'podcast' | 'sim' | 'info';

interface PodcastEpisode {
    episodeNumber: string;
    title: string;
    content: string;
    url?: string;  // 新增：Firstory 專屬連結
}

// 外站比價機場清單（按地區分組，出發地 & 目的地共用）
// ⚠️ 值必須與 flight-hack/api/server.py Airport enum 完全一致
const FH_AIRPORT_GROUPS: { group: string; airports: { label: string; value: string }[] }[] = [
    {
        group: '🇹🇼 台灣',
        airports: [
            { label: '台北桃園 (TPE)', value: 'TPE｜台北桃園' },
            { label: '台北松山 (TSA)', value: 'TSA｜台北松山' },
            { label: '高雄 (KHH)', value: 'KHH｜高雄' },
            { label: '台中 (RMQ)', value: 'RMQ｜台中' },
        ],
    },
    {
        group: '🇯🇵 日本',
        airports: [
            { label: '東京全部 NRT+HND (TYO)', value: 'TYO｜東京（含NRT/HND）' },
            { label: '東京成田 (NRT)', value: 'NRT｜東京成田' },
            { label: '東京羽田 (HND)', value: 'HND｜東京羽田' },
            { label: '大阪全部 KIX+ITM (OSA)', value: 'OSA｜大阪（含KIX/ITM）' },
            { label: '大阪關西 (KIX)', value: 'KIX｜大阪關西' },
            { label: '大阪伊丹 (ITM)', value: 'ITM｜大阪伊丹' },
            { label: '福岡 (FUK)', value: 'FUK｜福岡' },
            { label: '沖繩 (OKA)', value: 'OKA｜沖繩' },
            { label: '札幌千歲 (CTS)', value: 'CTS｜札幌千歲' },
            { label: '名古屋 (NGO)', value: 'NGO｜名古屋' },
            { label: '廣島 (HIJ)', value: 'HIJ｜廣島' },
            { label: '鹿兒島 (KOJ)', value: 'KOJ｜鹿兒島' },
        ],
    },
    {
        group: '🇰🇷 韓國',
        airports: [
            { label: '首爾全部 ICN+GMP (SEL)', value: 'SEL｜首爾（含ICN/GMP）' },
            { label: '首爾仁川 (ICN)', value: 'ICN｜首爾仁川' },
            { label: '首爾金浦 (GMP)', value: 'GMP｜首爾金浦' },
            { label: '釜山 (PUS)', value: 'PUS｜釜山' },
        ],
    },
    {
        group: '🇭🇰 香港 / 🇲🇴 澳門',
        airports: [
            { label: '香港 (HKG)', value: 'HKG｜香港' },
            { label: '澳門 (MFM)', value: 'MFM｜澳門' },
        ],
    },
    {
        group: '🇹🇭 泰國',
        airports: [
            { label: '曼谷素萬那普 (BKK)', value: 'BKK｜曼谷素萬那普' },
            { label: '曼谷廊曼 (DMK)', value: 'DMK｜曼谷廊曼' },
            { label: '普吉島 (HKT)', value: 'HKT｜普吉島' },
            { label: '清邁 (CNX)', value: 'CNX｜清邁' },
        ],
    },
    {
        group: '🇸🇬 新加坡',
        airports: [
            { label: '新加坡樟宜 (SIN)', value: 'SIN｜新加坡' },
        ],
    },
    {
        group: '🇲🇾 馬來西亞',
        airports: [
            { label: '吉隆坡 (KUL)', value: 'KUL｜吉隆坡' },
            { label: '檳城 (PEN)', value: 'PEN｜檳城' },
        ],
    },
    {
        group: '🇻🇳 越南',
        airports: [
            { label: '胡志明市 (SGN)', value: 'SGN｜胡志明市' },
            { label: '河內 (HAN)', value: 'HAN｜河內' },
            { label: '峴港 (DAD)', value: 'DAD｜峴港' },
        ],
    },
    {
        group: '🇵🇭 菲律賓',
        airports: [
            { label: '馬尼拉 (MNL)', value: 'MNL｜馬尼拉' },
            { label: '宿霧 (CEB)', value: 'CEB｜宿霧' },
        ],
    },
    {
        group: '🇮🇩 印尼',
        airports: [
            { label: '雅加達 (CGK)', value: 'CGK｜雅加達' },
            { label: '峇里島 (DPS)', value: 'DPS｜峇里島' },
            { label: '泗水 (SUB)', value: 'SUB｜泗水' },
        ],
    },
    {
        group: '🇦🇪 中東',
        airports: [
            { label: '杜拜 (DXB)', value: 'DXB｜杜拜' },
            { label: '多哈 (DOH)', value: 'DOH｜多哈' },
            { label: '阿布扎比 (AUH)', value: 'AUH｜阿布扎比' },
        ],
    },
    {
        group: '🇹🇷 土耳其',
        airports: [
            { label: '伊斯坦堡 (IST)', value: 'IST｜伊斯坦堡' },
        ],
    },
    {
        group: '🇬🇧 英國',
        airports: [
            { label: '倫敦全部 LHR+LGW+STN (LON)', value: 'LON｜倫敦（含LHR/LGW/STN）' },
            { label: '倫敦希斯洛 (LHR)', value: 'LHR｜倫敦希斯洛' },
            { label: '倫敦蓋威克 (LGW)', value: 'LGW｜倫敦蓋威克' },
        ],
    },
    {
        group: '🇫🇷 法國',
        airports: [
            { label: '巴黎戴高樂 (CDG)', value: 'CDG｜巴黎戴高樂' },
        ],
    },
    {
        group: '🇩🇪 德國',
        airports: [
            { label: '法蘭克福 (FRA)', value: 'FRA｜法蘭克福' },
            { label: '慕尼黑 (MUC)', value: 'MUC｜慕尼黑' },
        ],
    },
    {
        group: '🇳🇱 荷蘭',
        airports: [
            { label: '阿姆斯特丹 (AMS)', value: 'AMS｜阿姆斯特丹' },
        ],
    },
    {
        group: '🇮🇹 義大利',
        airports: [
            { label: '羅馬 (FCO)', value: 'FCO｜羅馬' },
            { label: '米蘭 (MXP)', value: 'MXP｜米蘭' },
        ],
    },
    {
        group: '🇪🇸 西班牙',
        airports: [
            { label: '馬德里 (MAD)', value: 'MAD｜馬德里' },
            { label: '巴塞隆納 (BCN)', value: 'BCN｜巴塞隆納' },
        ],
    },
    {
        group: '🇨🇭 瑞士',
        airports: [
            { label: '蘇黎世 (ZRH)', value: 'ZRH｜蘇黎世' },
        ],
    },
    {
        group: '🇦🇹 奧地利',
        airports: [
            { label: '維也納 (VIE)', value: 'VIE｜維也納' },
        ],
    },
    {
        group: '🇺🇸 美國',
        airports: [
            { label: '紐約全部 JFK+EWR+LGA (NYC)', value: 'NYC｜紐約（含JFK/EWR/LGA）' },
            { label: '紐約甘迺迪 (JFK)', value: 'JFK｜紐約甘迺迪' },
            { label: '紐約紐瓦克 (EWR)', value: 'EWR｜紐約紐瓦克' },
            { label: '洛杉磯 (LAX)', value: 'LAX｜洛杉磯' },
            { label: '舊金山 (SFO)', value: 'SFO｜舊金山' },
            { label: '芝加哥 (ORD)', value: 'ORD｜芝加哥' },
            { label: '西雅圖 (SEA)', value: 'SEA｜西雅圖' },
            { label: '邁阿密 (MIA)', value: 'MIA｜邁阿密' },
            { label: '丹佛 (DEN)', value: 'DEN｜丹佛' },
            { label: '波士頓 (BOS)', value: 'BOS｜波士頓' },
            { label: '拉斯維加斯 (LAS)', value: 'LAS｜拉斯維加斯' },
        ],
    },
    {
        group: '🇨🇦 加拿大',
        airports: [
            { label: '溫哥華 (YVR)', value: 'YVR｜溫哥華' },
            { label: '多倫多 (YYZ)', value: 'YYZ｜多倫多' },
            { label: '卡加利 (YYC)', value: 'YYC｜卡加利' },
        ],
    },
    {
        group: '🇦🇺 澳洲',
        airports: [
            { label: '雪梨 (SYD)', value: 'SYD｜雪梨' },
            { label: '墨爾本 (MEL)', value: 'MEL｜墨爾本' },
            { label: '布里斯本 (BNE)', value: 'BNE｜布里斯本' },
            { label: '柏斯 (PER)', value: 'PER｜柏斯' },
        ],
    },
    {
        group: '🇳🇿 紐西蘭',
        airports: [
            { label: '奧克蘭 (AKL)', value: 'AKL｜奧克蘭' },
        ],
    },
];

// Trip.com 聯盟行銷設定
const TRIP_AFFILIATE = {
    allianceId: '7162268',
    sid: '263802428',
    hotelSearchboxId: 'S8832714',
    flightSearchboxId: 'S8830985',
};

// 國家與地區酒店推薦資料 (cityId 是 Trip.com 的城市數字代碼，airportCode 是 IATA 機場代碼)
const TRAVEL_REGIONS = [
    {
        country: '🇹🇭 泰國',
        countryCode: 'thailand',
        areas: [
            { name: '曼谷', code: 'bangkok', cityId: '359', airportCode: 'BKK', emoji: '🏙️' },
            { name: '芭提雅', code: 'pattaya', cityId: '622', airportCode: 'BKK', emoji: '🏖️' }, // 使用曼谷機場
            { name: '清邁', code: 'chiangmai', cityId: '623', airportCode: 'CNX', emoji: '🏔️' },
            { name: '普吉島', code: 'phuket', cityId: '725', airportCode: 'HKT', emoji: '🏝️' },
        ],
    },
    {
        country: '🇻🇳 越南',
        countryCode: 'vietnam',
        areas: [
            { name: '胡志明市', code: 'hochiminhcity', cityId: '301', airportCode: 'SGN', emoji: '🌆' },
            { name: '河內', code: 'hanoi', cityId: '286', airportCode: 'HAN', emoji: '🏛️' },
            { name: '峴港', code: 'da-nang', cityId: '1356', airportCode: 'DAD', emoji: '🌊' },
        ],
    },
    {
        country: '🇵🇭 菲律賓',
        countryCode: 'philippines',
        areas: [
            { name: '馬尼拉', code: 'manila', cityId: 'province:12620:32', airportCode: 'MNL', emoji: '🏢' }, // 特殊格式: province:provinceId:countryId
            { name: '宿霧', code: 'cebu', cityId: '1239', airportCode: 'CEB', emoji: '🐚' },
            { name: '長灘島', code: 'boracay', cityId: '1391', airportCode: 'MPH', emoji: '🏖️' },
        ],
    },
    {
        country: '🇹🇼 台灣',
        countryCode: 'taiwan',
        areas: [
            { name: '台北', code: 'taipei', cityId: '617', airportCode: 'TPE', emoji: '🏙️' },
            { name: '高雄', code: 'kaohsiung', cityId: '720', airportCode: 'KHH', emoji: '⛵' },
            { name: '台中', code: 'taichung', cityId: '3849', airportCode: 'RMQ', emoji: '☀️' },
        ],
    },
    {
        country: '🇯🇵 日本',
        countryCode: 'japan',
        areas: [
            { name: '東京', code: 'tokyo', cityId: '228', airportCode: 'TYO', emoji: '🗼' },
            { name: '大阪', code: 'osaka', cityId: '219', airportCode: 'OSA', emoji: '🏯' },
            { name: '京都', code: 'kyoto', cityId: '734', airportCode: 'OSA', emoji: '⛩️' }, // 使用大阪機場
            { name: '沖繩', code: 'okinawa', cityId: '92573', airportCode: 'OKA', emoji: '🌺' },
        ],
    },
    {
        country: '🇮🇩 印尼',
        countryCode: 'indonesia',
        areas: [
            { name: '峇里島', code: 'bali', cityId: '723', airportCode: 'DPS', emoji: '🌴' },
            { name: '雅加達', code: 'jakarta', cityId: '524', airportCode: 'JKT', emoji: '🏛️' },
        ],
    },
];

export const AboutOverlay: React.FC<AboutOverlayProps> = ({ isOpen, onClose, initialTab = 'about' }) => {
    const [activeTab, setActiveTab] = useState<TabType>(initialTab);
    const [copiedField, setCopiedField] = useState<string | null>(null);
    // 搜尋類型切換 state (酒店/機票/當地體驗/機場接送/外站比價)
    const [searchType, setSearchType] = useState<'hotel' | 'flight' | 'experience' | 'transfer' | 'flight-hack'>('hotel');
    // 展開的國家
    const [expandedCountry, setExpandedCountry] = useState<string | null>(null);

    // ── 外站比價 state ─────────────────────────────────────
    const [fhOrigin, setFhOrigin] = useState('TPE｜台北桃園');
    const [fhDest, setFhDest] = useState('TYO｜東京（含NRT/HND）');
    const [fhDate, setFhDate] = useState(() => {
        const d = new Date(); d.setDate(d.getDate() + 30);
        return d.toISOString().split('T')[0];
    });
    const [fhReturnDate, setFhReturnDate] = useState('');
    const [fhBaggage, setFhBaggage] = useState(20);
    type FhStatus = 'idle' | 'loading-direct' | 'done-direct' | 'loading-outer' | 'done-outer' | 'error';
    const [fhStatus, setFhStatus] = useState<FhStatus>('idle');
    const [fhDirectResult, setFhDirectResult] = useState<any>(null);
    const [fhReturnResult, setFhReturnResult] = useState<any>(null);
    const [fhOuterResult, setFhOuterResult] = useState<any>(null);
    const [fhJobId, setFhJobId] = useState<string | null>(null);
    const [fhElapsed, setFhElapsed] = useState(0);
    const [fhError, setFhError] = useState('');
    const [fhShowMore, setFhShowMore] = useState(false);
    const [fhShowAdvanced, setFhShowAdvanced] = useState(false);
    const [fhDepartHour, setFhDepartHour] = useState('');   // '' = 不限；格式 HH-HH
    const [fhArriveHour, setFhArriveHour] = useState('');   // '' = 不限

    // Podcast 相關 state
    const [episodes, setEpisodes] = useState<PodcastEpisode[]>([]);
    const [loadingPodcasts, setLoadingPodcasts] = useState(false);
    const [podcastSearchQuery, setPodcastSearchQuery] = useState('');
    const [expandedEpisode, setExpandedEpisode] = useState<string | null>(null);

    // 當 initialTab 改變時同步更新
    useEffect(() => {
        setActiveTab(initialTab);
    }, [initialTab]);

    // 漸進式載入 Podcast 摘要：先載入前 20 集，背景自動載入剩餘集數
    const INITIAL_LOAD_COUNT = 20;
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [totalEpisodeCount, setTotalEpisodeCount] = useState(0);

    useEffect(() => {
        const loadEpisodes = async () => {
            if (activeTab !== 'podcast' || episodes.length > 0) return;

            setLoadingPodcasts(true);
            try {
                // 1. 從 podcast_episodes.json 讀取基本資料
                const response = await fetch('/podcast_episodes.json');
                const jsonEpisodes = await response.json();
                setTotalEpisodeCount(jsonEpisodes.length);

                // 2. 輔助函數：載入單集摘要
                const loadSingleEpisode = async (ep: any): Promise<PodcastEpisode> => {
                    let content = '';
                    const summaryPath = `/doc/${ep.episodeNumber}_摘要.txt`;

                    try {
                        const summaryResponse = await fetch(summaryPath);
                        if (summaryResponse.ok) {
                            const text = await summaryResponse.text();
                            if (!text.trim().startsWith('<!DOCTYPE') && !text.trim().startsWith('<html')) {
                                content = text;
                            }
                        }
                    } catch (error) {
                        console.log(`無法載入摘要: ${summaryPath}`);
                    }

                    return {
                        episodeNumber: ep.episodeNumber,
                        title: ep.title,
                        content: content || `${ep.title}\n\n發布日期：${ep.pubDate}\n\n(此集尚無摘要)`,
                        url: ep.url
                    };
                };

                // 3. 先載入前 20 集並立即顯示
                const firstBatch = jsonEpisodes.slice(0, INITIAL_LOAD_COUNT);
                const firstLoadedEpisodes = await Promise.all(firstBatch.map(loadSingleEpisode));
                setEpisodes(firstLoadedEpisodes);
                setLoadingPodcasts(false);

                // 4. 背景自動載入剩餘集數（不阻塞 UI）
                if (jsonEpisodes.length > INITIAL_LOAD_COUNT) {
                    setIsLoadingMore(true);
                    const remainingEpisodes = jsonEpisodes.slice(INITIAL_LOAD_COUNT);

                    // 批次載入，每批 10 集，避免同時發送太多請求
                    const BATCH_SIZE = 10;
                    for (let i = 0; i < remainingEpisodes.length; i += BATCH_SIZE) {
                        const batch = remainingEpisodes.slice(i, i + BATCH_SIZE);
                        const batchLoaded = await Promise.all(batch.map(loadSingleEpisode));

                        // 將新載入的集數附加到現有列表
                        setEpisodes(prev => [...prev, ...batchLoaded]);
                    }
                    setIsLoadingMore(false);
                }
            } catch (error) {
                console.error('載入 Podcast 摘要失敗:', error);
                setLoadingPodcasts(false);
            }
        };

        if (isOpen && activeTab === 'podcast') {
            loadEpisodes();
        }
    }, [isOpen, activeTab, episodes.length]);

    const handleCopy = async (text: string, field: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedField(field);
            setTimeout(() => setCopiedField(null), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    // 生成 Trip.com 酒店搜尋連結 (使用城市數字代碼)
    const getHotelSearchUrl = (cityId: string, areaCode: string) => {
        // 檢查是否是特殊的 province 格式 (province:provinceId:countryId)
        if (cityId.startsWith('province:')) {
            const parts = cityId.split(':');
            const provinceId = parts[1];
            const countryId = parts[2];
            return `https://tw.trip.com/hotels/list?city=-1&provinceId=${provinceId}&countryId=${countryId}&Allianceid=${TRIP_AFFILIATE.allianceId}&SID=${TRIP_AFFILIATE.sid}&trip_sub1=fattymap`;
        }
        // 如果有 cityId 就用 cityId，否則 fallback 到 areaCode
        const cityParam = cityId || areaCode;
        return `https://tw.trip.com/hotels/list?city=${cityParam}&Allianceid=${TRIP_AFFILIATE.allianceId}&SID=${TRIP_AFFILIATE.sid}&trip_sub1=fattymap`;
    };

    // 生成 Trip.com 機票搜尋連結 (使用 SEO 友善的 URL 格式)
    const getFlightSearchUrl = (destCityCode: string, destAirportCode: string) => {
        // Trip.com 機票搜尋連結格式：從台北出發，使用 SEO 友善格式
        return `https://tw.trip.com/flights/taipei-to-${destCityCode}/tickets-tpe-${destAirportCode.toLowerCase()}?Allianceid=${TRIP_AFFILIATE.allianceId}&SID=${TRIP_AFFILIATE.sid}&trip_sub1=fattymap`;
    };

    // 生成 Trip.com 當地體驗連結 (正確格式: /things-to-do/experiences/{cityCode}/)
    const getExperienceUrl = (cityCode: string) => {
        return `https://tw.trip.com/things-to-do/experiences/${cityCode}/?Allianceid=${TRIP_AFFILIATE.allianceId}&SID=${TRIP_AFFILIATE.sid}&trip_sub1=fattymap`;
    };

    // 生成 Trip.com 機場接送連結
    const getTransferUrl = (airportCode: string, cityName: string) => {
        return `https://tw.trip.com/airport-transfers/index?Allianceid=${TRIP_AFFILIATE.allianceId}&SID=${TRIP_AFFILIATE.sid}&trip_sub1=fattymap`;
    };

    // 取得預設出發日期 (7天後)
    const getDefaultDate = () => {
        const date = new Date();
        date.setDate(date.getDate() + 7);
        return date.toISOString().split('T')[0];
    };


    // ── 外站比價 API ───────────────────────────────────────
    const FH_API = 'https://flight.twgolddigger.com';

    const fhSearchDirect = async () => {
        setFhStatus('loading-direct');
        setFhDirectResult(null);
        setFhReturnResult(null);
        setFhOuterResult(null);
        setFhError('');
        setFhShowMore(false);
        try {
            const outParams = new URLSearchParams({
                origin: fhOrigin,
                destination: fhDest,
                date: fhDate,
                mode: 'direct｜只查直飛（最快，約15秒）',
                baggage: String(fhBaggage),
                top_n: '5',
                ...(fhDepartHour ? { depart_hour: fhDepartHour } : {}),
                ...(fhArriveHour ? { arrive_hour: fhArriveHour } : {}),
            });
            const retParams = fhReturnDate ? new URLSearchParams({
                origin: fhDest,
                destination: fhOrigin,
                date: fhReturnDate,
                mode: 'direct｜只查直飛（最快，約15秒）',
                baggage: String(fhBaggage),
                top_n: '5',
                ...(fhArriveHour ? { depart_hour: fhArriveHour } : {}),  // 回程：抵達時段反過來當出發
                ...(fhDepartHour ? { arrive_hour: fhDepartHour } : {}),
            }) : null;
            const [outData, retData] = await Promise.all([
                fetch(`${FH_API}/search?${outParams}`).then(r => r.json()),
                retParams ? fetch(`${FH_API}/search?${retParams}`).then(r => r.json()) : Promise.resolve(null),
            ]);
            if (outData.detail) {
                const msg = Array.isArray(outData.detail)
                    ? outData.detail.map((e: any) => e.msg ?? JSON.stringify(e)).join('; ')
                    : String(outData.detail);
                throw new Error(msg);
            }
            setFhDirectResult(outData);
            if (retData && !retData.detail) setFhReturnResult(retData);
            setFhStatus('done-direct');
        } catch (e: any) {
            setFhError(e.message || '查詢失敗');
            setFhStatus('error');
        }
    };

    const fhSearchOuter = async () => {
        setFhStatus('loading-outer');
        setFhDirectResult(null);  // 清除上一輪直飛，外站完成後會帶入新的直飛基準
        setFhReturnResult(null);
        setFhOuterResult(null);
        setFhElapsed(0);
        setFhError('');
        setFhShowMore(false);
        try {
            const params = new URLSearchParams({
                origin: fhOrigin,
                destination: fhDest,
                date: fhDate,
                mode: 'mix｜直飛＋外站合併排名（推薦，較慢）',
                baggage: String(fhBaggage),
                top_n: '10',
                ...(fhDepartHour ? { depart_hour: fhDepartHour } : {}),
                ...(fhArriveHour ? { arrive_hour: fhArriveHour } : {}),
            });
            const res = await fetch(`${FH_API}/search?${params}`);
            const data = await res.json();
            if (data.status === 'pending' && data.job_id) {
                setFhJobId(data.job_id);
            } else {
                const msg = Array.isArray(data.detail)
                    ? data.detail.map((e: any) => e.msg ?? JSON.stringify(e)).join('; ')
                    : String(data.detail ?? '未知錯誤');
                throw new Error(msg);
            }
        } catch (e: any) {
            setFhError(e.message || '查詢失敗');
            setFhStatus('error');
        }
    };

    // 輪詢 job 結果
    useEffect(() => {
        if (fhStatus !== 'loading-outer' || !fhJobId) return;
        let cancelled = false;
        const poll = async () => {
            if (cancelled) return;
            try {
                const res = await fetch(`${FH_API}/jobs/${fhJobId}`);
                const data = await res.json();
                if (cancelled) return;
                if (data.status === 'pending') {
                    setFhElapsed(data.elapsed_sec || 0);
                    setTimeout(poll, 15000);
                } else if (data.status === 'error') {
                    setFhError(data.detail || '查詢失敗');
                    setFhStatus('error');
                } else {
                    setFhOuterResult(data);
                    setFhStatus('done-outer');
                }
            } catch {
                if (!cancelled) { setFhError('網路錯誤'); setFhStatus('error'); }
            }
        };
        const t = setTimeout(poll, 15000);
        return () => { cancelled = true; clearTimeout(t); };
    }, [fhStatus, fhJobId]);

    if (!isOpen) return null;

    // Podcast 搜尋過濾
    const filteredEpisodes = episodes.filter(ep =>
        ep.episodeNumber.toLowerCase().includes(podcastSearchQuery.toLowerCase()) ||
        ep.title.toLowerCase().includes(podcastSearchQuery.toLowerCase()) ||
        ep.content.toLowerCase().includes(podcastSearchQuery.toLowerCase())
    );

    // 切換展開/收合
    const toggleExpand = (episodeNumber: string) => {
        setExpandedEpisode(prev => prev === episodeNumber ? null : episodeNumber);
    };

    const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
        { id: 'about', label: '關於我們', icon: <Users size={16} /> },
        { id: 'collab', label: '合作贊助', icon: <Heart size={16} /> },
        { id: 'podcast', label: 'Podcast', icon: <Headphones size={16} /> },
        { id: 'more', label: '智能換匯', icon: <ShoppingBag size={16} /> },
        { id: 'sim', label: 'SIM卡', icon: <span className="text-sm">📶</span> },
        { id: 'info', label: '旅遊情報', icon: <span className="text-sm">🌏</span> },
        { id: 'travel', label: '旅遊預訂', icon: <Plane size={16} /> },
    ];

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            onClick={onClose}
        >
            {/* 模糊背景 */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-md" />

            {/* 白玻璃面板 */}
            <div
                className="relative w-full max-w-2xl md:max-w-3xl max-h-[92vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: 'rgba(255, 255, 255, 0.85)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.5)',
                    borderRadius: '24px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    animation: 'fadeInScale 0.3s ease-out',
                }}
            >
                {/* 頂部裝飾條 */}
                <div className="h-1 bg-gradient-to-r from-pink-500 via-red-500 to-orange-500" />

                {/* 關閉按鈕 */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full bg-gray-100/80 hover:bg-gray-200/80 text-gray-600 hover:text-gray-800 transition-all z-10"
                >
                    <X size={20} />
                </button>

                {/* 頭部標題 */}
                <div className="p-6 pb-4 text-center">
                    <img
                        src="https://i.meee.com.tw/Xo1WINx.jpg"
                        alt="肥宅老司機"
                        className="w-20 h-20 mx-auto rounded-full object-cover border-4 border-white shadow-lg mb-4"
                    />
                    <h1 className="text-2xl font-black text-gray-800 mb-1">
                        🍜 肥宅老司機前進世界地圖
                    </h1>
                    <p className="text-sm text-gray-500">
                        老司機帶路，帶你吃遍全世界
                    </p>
                </div>

                {/* Tab 切換 — 手機可左右滑動 */}
                <div className="flex gap-1.5 px-4 mb-4 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap ${activeTab === tab.id
                                ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg'
                                : 'bg-gray-100/80 text-gray-600 hover:bg-gray-200/80'
                                }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* 內容區域 */}
                <div className="px-6 pb-6 overflow-y-auto max-h-[62vh]">
                    {activeTab === 'about' && (
                        <div className="space-y-4 text-gray-700">
                            {/* 關於肥宅老司機 */}
                            <div className="bg-white/60 rounded-2xl p-5 shadow-sm">
                                <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                                    <Headphones className="text-purple-500" size={20} />
                                    關於肥宅老司機
                                </h3>
                                <p className="text-sm leading-relaxed mb-3">
                                    由老司與老機共同主持的談話性 Podcast
                                </p>
                                <a
                                    href="https://open.firstory.me/user/fattyinsider/about"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-full text-sm font-bold transition-colors"
                                >
                                    <ExternalLink size={14} />
                                    收聽 Podcast
                                </a>
                            </div>

                            {/* 關於這個地圖 */}
                            <div className="bg-white/60 rounded-2xl p-5 shadow-sm">
                                <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                                    <Globe className="text-blue-500" size={20} />
                                    關於這個地圖
                                </h3>
                                <p className="text-sm leading-relaxed">
                                    「肥宅老司機前進世界地圖」是一個由每位司機們共同建立的美食景點地圖。
                                    我們走遍世界各地，親自探訪每一個角落，只為了給各位新老司機最真實的推薦！
                                </p>
                            </div>

                            {/* 我們的使命 */}
                            <div className="bg-white/60 rounded-2xl p-5 shadow-sm">
                                <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                                    <Users className="text-green-500" size={20} />
                                    我們的使命
                                </h3>
                                <p className="text-sm leading-relaxed">
                                    讓每一位旅人都能找到當地最道地的美食與景點，
                                    不再被觀光客陷阱所困擾。跟著老司機，絕對不會踩雷！
                                </p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'collab' && (
                        <div className="space-y-4 text-gray-700">
                            <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl p-5 shadow-sm border border-pink-100">
                                <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                                    <Heart className="text-pink-500" size={20} />
                                    合作與贊助
                                </h3>
                                <p className="text-sm leading-relaxed mb-4">
                                    如果你是店家或品牌，歡迎與我們合作！
                                    我們提供真實體驗分享，讓更多老司機認識你的好店。
                                </p>
                                <div className="text-center">
                                    <a
                                        href="https://t.me/scfanchaing"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white rounded-full text-sm font-bold transition-all shadow-lg"
                                    >
                                        <TelegramIcon />
                                        📧 合作邀約：請聯繫老雞 @scfanchaing
                                    </a>
                                </div>
                            </div>

                            {/* 斗內支持區塊 */}
                            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-5 shadow-sm border border-yellow-200">
                                <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                                    💖 支持創作者
                                </h3>
                                <p className="text-sm leading-relaxed mb-4 text-gray-600">
                                    如果您喜歡「肥宅老司機前進世界地圖」這個小工具，覺得對您有幫助，可以考慮斗內支持創作者 <span className="font-bold text-orange-600">"波尼"</span>，幫忙補貼 API 與開發費用，讓網站更好！🚀
                                </p>

                                <div className="space-y-3">
                                    {/* USDT TRC20 */}
                                    <div className="bg-white/70 rounded-xl p-3">
                                        <div className="text-sm font-bold text-gray-700 mb-1">💰 USDT (TRC20):</div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 font-mono text-xs bg-gray-100 p-2 rounded-lg break-all text-gray-600">
                                                TExxw25EaPKZdKr9uPJT8MLV2zHrQBbhQg
                                            </div>
                                            <button
                                                onClick={() => handleCopy('TExxw25EaPKZdKr9uPJT8MLV2zHrQBbhQg', 'usdt')}
                                                className={`p-2 rounded-lg transition-all ${copiedField === 'usdt' ? 'bg-green-100 text-green-600' : 'bg-gray-200 hover:bg-gray-300 text-gray-600'}`}
                                                title="複製地址"
                                            >
                                                {copiedField === 'usdt' ? <Check size={16} /> : <Copy size={16} />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* 多幣錢包 */}
                                    <div className="bg-white/70 rounded-xl p-3">
                                        <div className="text-sm font-bold text-gray-700 mb-1">💳 多幣錢包 (例如 .Wallet):</div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 font-mono text-xs bg-gray-100 p-2 rounded-lg text-gray-600">
                                                liupony2000.x
                                            </div>
                                            <button
                                                onClick={() => handleCopy('liupony2000.x', 'wallet')}
                                                className={`p-2 rounded-lg transition-all ${copiedField === 'wallet' ? 'bg-green-100 text-green-600' : 'bg-gray-200 hover:bg-gray-300 text-gray-600'}`}
                                                title="複製地址"
                                            >
                                                {copiedField === 'wallet' ? <Check size={16} /> : <Copy size={16} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'more' && (
                        <CurrencyExchangeCalculator />
                    )}

                    {activeTab === 'sim' && (
                        <SimRankPanel />
                    )}

                    {activeTab === 'info' && (
                        <DestinationInfoPanel />
                    )}

                    {activeTab === 'podcast' && (
                        <div className="space-y-4">
                            {/* 搜尋列 */}
                            <div className="relative">
                                <input
                                    type="text"
                                    value={podcastSearchQuery}
                                    onChange={(e) => setPodcastSearchQuery(e.target.value)}
                                    placeholder="搜尋關鍵字（例如：泰國、越南、酒店...）"
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white/80 backdrop-blur-sm"
                                />
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                    <Search size={18} />
                                </div>
                            </div>
                            {podcastSearchQuery && (
                                <p className="text-xs text-gray-500">
                                    找到 {filteredEpisodes.length} 集符合的結果
                                </p>
                            )}

                            {/* 集數列表 */}
                            {loadingPodcasts ? (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <Loader2 size={40} className="animate-spin text-purple-500 mb-4" />
                                    <p className="text-gray-500">載入摘要中...</p>
                                </div>
                            ) : filteredEpisodes.length === 0 ? (
                                <div className="text-center py-12">
                                    <p className="text-gray-400 text-lg">😢 沒有找到符合的集數</p>
                                    <p className="text-gray-400 text-sm mt-2">試試其他關鍵字吧！</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {filteredEpisodes.map((episode) => {
                                        // 使用 url 作為唯一識別符，因為有重複的 episodeNumber
                                        const uniqueId = episode.url || episode.episodeNumber;
                                        return (
                                            <div
                                                key={uniqueId}
                                                className="bg-white/60 rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all hover:shadow-md"
                                            >
                                                {/* 集數標題列 */}
                                                <button
                                                    onClick={() => toggleExpand(uniqueId)}
                                                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50/50 transition-colors"
                                                >
                                                    <div className="flex items-center gap-3 flex-1 text-left">
                                                        <a
                                                            href={episode.url || "https://open.firstory.me/user/fattyinsider/episodes"}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 hover:scale-110 hover:shadow-lg transition-all cursor-pointer"
                                                            title="點擊收聽這一集"
                                                        >
                                                            <Headphones size={20} className="text-white" />
                                                        </a>
                                                        <div>
                                                            <div className="font-bold text-gray-800">
                                                                {episode.episodeNumber}
                                                            </div>
                                                            <div className="text-sm text-gray-600 line-clamp-1">
                                                                {episode.title}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {expandedEpisode === uniqueId ? (
                                                        <ChevronUp size={20} className="text-gray-400 flex-shrink-0" />
                                                    ) : (
                                                        <ChevronDown size={20} className="text-gray-400 flex-shrink-0" />
                                                    )}
                                                </button>

                                                {/* 展開的摘要內容 */}
                                                {expandedEpisode === uniqueId && (
                                                    <div className="px-5 pb-5 border-t border-gray-100">
                                                        <div className="mt-4 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto">
                                                            {episode.content}
                                                        </div>
                                                        <div className="mt-4 flex justify-center">
                                                            <a
                                                                href={episode.url || "https://open.firstory.me/user/fattyinsider/episodes"}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-full font-bold transition-all shadow-lg hover:scale-105"
                                                            >
                                                                <Headphones size={18} />
                                                                收聽這一集
                                                                <ExternalLink size={16} />
                                                            </a>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}

                                    {/* 背景載入更多集數的提示 */}
                                    {isLoadingMore && (
                                        <div className="flex items-center justify-center gap-2 py-4 text-gray-500 text-sm">
                                            <Loader2 size={16} className="animate-spin" />
                                            <span>載入更多集數中... ({episodes.length}/{totalEpisodeCount})</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}


                    {activeTab === 'travel' && (
                        <div className="space-y-4">
                            {/* 搜尋類型切換 - 兩排設計 */}
                            <div className="space-y-2">
                                {/* 第一排：住宿 & 體驗 */}
                                <div className="flex gap-2 justify-center">
                                    <button
                                        onClick={() => setSearchType('hotel')}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${searchType === 'hotel'
                                            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        <Building2 size={16} />
                                        🏨 搜尋酒店
                                    </button>
                                    <button
                                        onClick={() => setSearchType('experience')}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${searchType === 'experience'
                                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        <MapPin size={16} />
                                        🎡 當地體驗
                                    </button>
                                </div>
                                {/* 第二排：交通 */}
                                <div className="flex gap-2 justify-center flex-wrap">
                                    <button
                                        onClick={() => setSearchType('flight')}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${searchType === 'flight'
                                            ? 'bg-gradient-to-r from-sky-500 to-cyan-500 text-white shadow-lg'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        <Plane size={16} />
                                        ✈️ 搜尋機票
                                    </button>
                                    <button
                                        onClick={() => setSearchType('transfer')}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${searchType === 'transfer'
                                            ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        <ExternalLink size={16} />
                                        🚗 機場接送
                                    </button>
                                    <button
                                        onClick={() => setSearchType('flight-hack')}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${searchType === 'flight-hack'
                                            ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        <span>💰</span>
                                        外站比價
                                    </button>
                                </div>
                            </div>

                            {/* Trip.com iFrame 搜尋框 - 只對酒店和機票顯示 */}
                            {(searchType === 'hotel' || searchType === 'flight') && searchType !== 'flight-hack' && (
                                <div className="bg-white/60 rounded-2xl p-4 shadow-sm flex justify-center">
                                    <iframe
                                        src={`https://tw.trip.com/partners/ad/${searchType === 'hotel' ? TRIP_AFFILIATE.hotelSearchboxId : TRIP_AFFILIATE.flightSearchboxId}?Allianceid=${TRIP_AFFILIATE.allianceId}&SID=${TRIP_AFFILIATE.sid}&trip_sub1=fattymap`}
                                        style={{ width: '320px', height: '320px', border: 'none' }}
                                        scrolling="no"
                                        title={searchType === 'hotel' ? 'Trip.com 酒店搜尋' : 'Trip.com 機票搜尋'}
                                    />
                                </div>
                            )}

                            {/* 當地體驗和機場接送的快速入口 */}
                            {(searchType === 'experience' || searchType === 'transfer') && (
                                <div className="bg-white/60 rounded-2xl p-4 shadow-sm text-center">
                                    <div className={`text-4xl mb-3 ${searchType === 'experience' ? '' : ''}`}>
                                        {searchType === 'experience' ? '🎡' : '🚗'}
                                    </div>
                                    <h4 className="font-bold text-lg text-gray-800 mb-2">
                                        {searchType === 'experience' ? '探索當地精彩體驗' : '預訂機場接送服務'}
                                    </h4>
                                    <p className="text-sm text-gray-600 mb-4">
                                        {searchType === 'experience'
                                            ? '一日遊、景點門票、美食體驗、探險活動等'
                                            : '專車接送、包車服務，輕鬆往返機場'}
                                    </p>
                                    <a
                                        href={searchType === 'experience'
                                            ? `https://tw.trip.com/things-to-do?Allianceid=${TRIP_AFFILIATE.allianceId}&SID=${TRIP_AFFILIATE.sid}&trip_sub1=fattymap`
                                            : `https://tw.trip.com/airport-transfers/index?Allianceid=${TRIP_AFFILIATE.allianceId}&SID=${TRIP_AFFILIATE.sid}&trip_sub1=fattymap`
                                        }
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`inline-flex items-center gap-2 px-6 py-3 rounded-full text-white font-bold transition-all hover:scale-105 shadow-lg ${searchType === 'experience'
                                            ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                                            : 'bg-gradient-to-r from-orange-500 to-red-500'
                                            }`}
                                    >
                                        <ExternalLink size={18} />
                                        {searchType === 'experience' ? '瀏覽所有體驗' : '查看機場接送'}
                                    </a>
                                </div>
                            )}

                            {/* 地區推薦列表 - 機場接送與外站比價不顯示 */}
                            {searchType !== 'transfer' && searchType !== 'flight-hack' && (
                                <div className="bg-white/60 rounded-2xl p-4 shadow-sm">
                                    <h3 className="font-bold text-lg mb-3 flex items-center gap-2 text-gray-800">
                                        <MapPin className="text-red-500" size={20} />
                                        {searchType === 'hotel' && '🌏 熱門地區酒店推薦'}
                                        {searchType === 'flight' && '✈️ 熱門航線機票搜尋'}
                                        {searchType === 'experience' && '🎡 熱門地區當地體驗'}
                                    </h3>
                                    <p className="text-xs text-gray-500 mb-3">
                                        {searchType === 'hotel' && '點擊地區直接查看 Trip.com 優惠酒店，透過此連結預訂可支持網站營運！'}
                                        {searchType === 'flight' && '點擊地區搜尋從台北出發的機票，透過此連結預訂可支持網站營運！'}
                                        {searchType === 'experience' && '點擊地區探索當地一日遊、門票與特色體驗活動！'}
                                    </p>
                                    <div className="space-y-2">
                                        {TRAVEL_REGIONS.map((region) => (
                                            <div key={region.countryCode} className="border border-gray-200 rounded-xl overflow-hidden">
                                                {/* 國家標題 */}
                                                <button
                                                    onClick={() => setExpandedCountry(
                                                        expandedCountry === region.countryCode ? null : region.countryCode
                                                    )}
                                                    className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-150 transition-colors"
                                                >
                                                    <span className="font-bold text-gray-800">{region.country}</span>
                                                    {expandedCountry === region.countryCode ? (
                                                        <ChevronUp size={18} className="text-gray-500" />
                                                    ) : (
                                                        <ChevronDown size={18} className="text-gray-500" />
                                                    )}
                                                </button>
                                                {/* 地區列表 */}
                                                {expandedCountry === region.countryCode && (
                                                    <div className="p-3 grid grid-cols-2 gap-2 bg-white">
                                                        {region.areas.map((area) => {
                                                            // 根據搜尋類型生成不同的 URL
                                                            const getAreaUrl = () => {
                                                                switch (searchType) {
                                                                    case 'hotel':
                                                                        return getHotelSearchUrl(area.cityId, area.code);
                                                                    case 'flight':
                                                                        return getFlightSearchUrl(area.code, area.airportCode);
                                                                    case 'experience':
                                                                        return getExperienceUrl(area.code);
                                                                    case 'transfer':
                                                                        return getTransferUrl(area.airportCode, area.name);
                                                                }
                                                            };

                                                            // 根據搜尋類型設定按鈕樣式
                                                            const getButtonStyle = () => {
                                                                switch (searchType) {
                                                                    case 'hotel':
                                                                        return 'bg-blue-50 hover:bg-blue-100 text-blue-700';
                                                                    case 'flight':
                                                                        return 'bg-sky-50 hover:bg-sky-100 text-sky-700';
                                                                    case 'experience':
                                                                        return 'bg-purple-50 hover:bg-purple-100 text-purple-700';
                                                                    case 'transfer':
                                                                        return 'bg-orange-50 hover:bg-orange-100 text-orange-700';
                                                                }
                                                            };

                                                            // 根據搜尋類型設定圖示
                                                            const getIcon = () => {
                                                                switch (searchType) {
                                                                    case 'hotel':
                                                                        return <Building2 size={12} className="ml-auto opacity-50" />;
                                                                    case 'flight':
                                                                        return <Plane size={12} className="ml-auto opacity-50" />;
                                                                    case 'experience':
                                                                        return <MapPin size={12} className="ml-auto opacity-50" />;
                                                                    case 'transfer':
                                                                        return <ExternalLink size={12} className="ml-auto opacity-50" />;
                                                                }
                                                            };

                                                            return (
                                                                <a
                                                                    key={area.code}
                                                                    href={getAreaUrl()}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${getButtonStyle()}`}
                                                                >
                                                                    <span>{area.emoji}</span>
                                                                    <span>{area.name}</span>
                                                                    {getIcon()}
                                                                </a>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ── 外站比價 UI ── */}
                            {searchType === 'flight-hack' && (
                                <div className="space-y-3">
                                    {/* 搜尋表單 */}
                                    <div className="bg-white/60 rounded-2xl p-4 shadow-sm space-y-3">
                                        {/* 出發地 + 目的地 */}
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="text-xs text-gray-500 mb-1 block">🛫 出發地</label>
                                                <select
                                                    value={fhOrigin}
                                                    onChange={e => setFhOrigin(e.target.value)}
                                                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                                                >
                                                    {FH_AIRPORT_GROUPS.map(g => (
                                                        <optgroup key={g.group} label={g.group}>
                                                            {g.airports.map(a => (
                                                                <option key={a.value} value={a.value}>{a.label}</option>
                                                            ))}
                                                        </optgroup>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-500 mb-1 block">🛬 目的地</label>
                                                <select
                                                    value={fhDest}
                                                    onChange={e => setFhDest(e.target.value)}
                                                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                                                >
                                                    {FH_AIRPORT_GROUPS.map(g => (
                                                        <optgroup key={g.group} label={g.group}>
                                                            {g.airports.map(a => (
                                                                <option key={a.value} value={a.value}>{a.label}</option>
                                                            ))}
                                                        </optgroup>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        {/* 去程日期 + 回程日期 */}
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="text-xs text-gray-500 mb-1 block">📅 去程日期</label>
                                                <input
                                                    type="date"
                                                    value={fhDate}
                                                    onChange={e => setFhDate(e.target.value)}
                                                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                                                    📅 回程日期
                                                    {fhReturnDate && (
                                                        <button onClick={() => setFhReturnDate('')} className="ml-1 text-red-400 hover:text-red-600 font-bold">✕</button>
                                                    )}
                                                </label>
                                                <input
                                                    type="date"
                                                    value={fhReturnDate}
                                                    onChange={e => setFhReturnDate(e.target.value)}
                                                    min={fhDate}
                                                    placeholder="選填"
                                                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                                                />
                                            </div>
                                        </div>

                                        {/* 行李 */}
                                        <div className="flex items-center gap-3">
                                            <label className="text-xs text-gray-500 whitespace-nowrap">🧳 托運行李</label>
                                            <select
                                                value={fhBaggage}
                                                onChange={e => setFhBaggage(Number(e.target.value))}
                                                className="flex-1 px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                                            >
                                                <option value={0}>僅手提</option>
                                                <option value={15}>15 kg</option>
                                                <option value={20}>20 kg</option>
                                                <option value={25}>25 kg</option>
                                                <option value={30}>30 kg</option>
                                            </select>
                                        </div>

                                        {/* 進階設定 toggle */}
                                        <button
                                            onClick={() => setFhShowAdvanced(v => !v)}
                                            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                                        >
                                            {fhShowAdvanced ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                                            進階設定（時段篩選）
                                            {(fhDepartHour || fhArriveHour) && <span className="ml-1 text-emerald-500">●</span>}
                                        </button>

                                        {/* 進階：出發 & 抵達時段 */}
                                        {fhShowAdvanced && (
                                            <div className="grid grid-cols-2 gap-2 bg-gray-50 rounded-xl p-3">
                                                <div>
                                                    <label className="text-xs text-gray-500 mb-1 block">🕐 去程出發時段</label>
                                                    <select
                                                        value={fhDepartHour}
                                                        onChange={e => setFhDepartHour(e.target.value)}
                                                        className="w-full px-2 py-1.5 rounded-lg border border-gray-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-400"
                                                    >
                                                        <option value="">不限</option>
                                                        <option value="0-6">清晨 00:00–06:00</option>
                                                        <option value="6-12">早上 06:00–12:00</option>
                                                        <option value="12-18">下午 12:00–18:00</option>
                                                        <option value="18-24">晚上 18:00–24:00</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="text-xs text-gray-500 mb-1 block">🕐 去程抵達時段</label>
                                                    <select
                                                        value={fhArriveHour}
                                                        onChange={e => setFhArriveHour(e.target.value)}
                                                        className="w-full px-2 py-1.5 rounded-lg border border-gray-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-400"
                                                    >
                                                        <option value="">不限</option>
                                                        <option value="0-6">清晨 00:00–06:00</option>
                                                        <option value="6-12">早上 06:00–12:00</option>
                                                        <option value="12-18">下午 12:00–18:00</option>
                                                        <option value="18-24">晚上 18:00–24:00</option>
                                                    </select>
                                                </div>
                                                <p className="col-span-2 text-xs text-gray-400">※ 時段篩選影響去程；回程出發/抵達時段相反方向套用</p>
                                            </div>
                                        )}

                                        {/* 按鈕 */}
                                        <div className="flex gap-2 pt-1">
                                            <button
                                                onClick={fhSearchDirect}
                                                disabled={fhStatus === 'loading-direct' || fhStatus === 'loading-outer'}
                                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white text-sm font-bold transition-all"
                                            >
                                                {fhStatus === 'loading-direct' ? <Loader2 size={15} className="animate-spin" /> : <Plane size={15} />}
                                                {fhReturnDate ? '查去回直飛（~30秒）' : '查直飛（15秒）'}
                                            </button>
                                            <button
                                                onClick={fhSearchOuter}
                                                disabled={fhStatus === 'loading-direct' || fhStatus === 'loading-outer'}
                                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-bold transition-all"
                                            >
                                                {fhStatus === 'loading-outer' ? <Loader2 size={15} className="animate-spin" /> : <span>💰</span>}
                                                查外站方案
                                            </button>
                                        </div>
                                    </div>

                                    {/* loading 外站中 */}
                                    {fhStatus === 'loading-outer' && (
                                        <div className="bg-emerald-50 rounded-2xl p-4 text-center space-y-2">
                                            <Loader2 size={28} className="animate-spin text-emerald-500 mx-auto" />
                                            <p className="text-sm font-bold text-emerald-700">正在掃描 22 個外站城市...</p>
                                            <p className="text-xs text-emerald-600">已等待 {fhElapsed} 秒，約需 3-5 分鐘</p>
                                            <p className="text-xs text-gray-400">外站完成後自動顯示結果</p>
                                        </div>
                                    )}

                                    {/* 錯誤 */}
                                    {fhStatus === 'error' && (
                                        <div className="bg-red-50 rounded-2xl p-4 text-center text-sm text-red-600">
                                            ⚠️ {fhError}
                                        </div>
                                    )}

                                    {/* 去程直飛結果 */}
                                    {(fhStatus === 'done-direct' || fhStatus === 'done-outer') && (() => {
                                        const results: any[] = fhDirectResult?.results ??
                                            (fhOuterResult?.direct ? [fhOuterResult.direct] : []);
                                        if (results.length === 0) return null;
                                        return (
                                            <div className="bg-white/60 rounded-2xl p-4 shadow-sm">
                                                <h4 className="font-bold text-sm text-gray-700 mb-3 flex items-center gap-1">
                                                    <Plane size={14} className="text-sky-500" />
                                                    ✈️ 去程直飛 Top {Math.min(results.length, 5)}
                                                </h4>
                                                <div className="space-y-2">
                                                    {results.slice(0, 5).map((r: any, i: number) => (
                                                        <div key={i} className={`rounded-xl px-4 py-3 flex items-center justify-between ${i === 0 ? 'bg-sky-50 border border-sky-200' : 'bg-gray-50'}`}>
                                                            <div className="flex-1 min-w-0">
                                                                {i === 0 && <div className="text-xs font-bold text-sky-600 mb-0.5">🥇 最低價</div>}
                                                                <div className="font-bold text-gray-800 text-sm">{r.airlines}</div>
                                                                <div className="text-xs text-gray-500">{r.duration} · {r.stops === 0 ? '直飛' : `${r.stops}轉`}</div>
                                                                {r.departure && (
                                                                    <div className="text-xs text-gray-400 mt-0.5">
                                                                        起 {r.departure} → 降 {r.arrival}
                                                                    </div>
                                                                )}
                                                                {r.baggage_note && (
                                                                    <div className="text-xs text-amber-600 mt-0.5">{r.baggage_note}</div>
                                                                )}
                                                            </div>
                                                            <div className="text-right ml-3 flex-shrink-0">
                                                                <div className={`text-lg font-black ${i === 0 ? 'text-sky-700' : 'text-gray-700'}`}>
                                                                    NT${(r.total ?? r.price_twd).toLocaleString()}
                                                                </div>
                                                                <a href={r.book_url} target="_blank" rel="noopener noreferrer"
                                                                    className="text-xs text-sky-500 hover:underline">Google Flights →</a>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {/* 回程直飛結果 */}
                                    {(fhStatus === 'done-direct' || fhStatus === 'done-outer') && fhReturnResult?.results?.length > 0 && (
                                        <div className="bg-white/60 rounded-2xl p-4 shadow-sm">
                                            <h4 className="font-bold text-sm text-gray-700 mb-3 flex items-center gap-1">
                                                <Plane size={14} className="text-indigo-500" />
                                                ↩️ 回程直飛 Top {Math.min(fhReturnResult.results.length, 5)}
                                            </h4>
                                            <div className="space-y-2">
                                                {fhReturnResult.results.slice(0, 5).map((r: any, i: number) => (
                                                    <div key={i} className={`rounded-xl px-4 py-3 flex items-center justify-between ${i === 0 ? 'bg-indigo-50 border border-indigo-200' : 'bg-gray-50'}`}>
                                                        <div className="flex-1 min-w-0">
                                                            {i === 0 && <div className="text-xs font-bold text-indigo-600 mb-0.5">🥇 最低價</div>}
                                                            <div className="font-bold text-gray-800 text-sm">{r.airlines}</div>
                                                            <div className="text-xs text-gray-500">{r.duration} · {r.stops === 0 ? '直飛' : `${r.stops}轉`}</div>
                                                            {r.departure && (
                                                                <div className="text-xs text-gray-400 mt-0.5">
                                                                    起 {r.departure} → 降 {r.arrival}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="text-right ml-3 flex-shrink-0">
                                                            <div className={`text-lg font-black ${i === 0 ? 'text-indigo-700' : 'text-gray-700'}`}>
                                                                NT${(r.total ?? r.price_twd).toLocaleString()}
                                                            </div>
                                                            <a href={r.book_url} target="_blank" rel="noopener noreferrer"
                                                                className="text-xs text-indigo-500 hover:underline">Google Flights →</a>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* 外站比較結果 */}
                                    {fhStatus === 'done-outer' && fhOuterResult && (() => {
                                        const baseline = fhOuterResult.direct?.price_twd ?? fhOuterResult.direct_baseline?.price_twd ?? 0;
                                        const combined: any[] = fhOuterResult.combined ?? [];
                                        const outerOnly = combined.filter((r: any) => r.origin !== (fhOrigin.split('｜')[0] || 'TPE'));
                                        const sorted = [...outerOnly].sort((a, b) => (a.total ?? a.price_twd) - (b.total ?? b.price_twd));
                                        const display = fhShowMore ? sorted : sorted.slice(0, 3);

                                        if (sorted.length === 0) return (
                                            <div className="bg-gray-50 rounded-2xl p-4 text-center text-sm text-gray-500">
                                                😮 沒有找到比直飛更便宜的外站方案
                                            </div>
                                        );

                                        return (
                                            <div className="bg-white/60 rounded-2xl p-4 shadow-sm space-y-2">
                                                <h4 className="font-bold text-sm text-gray-700 mb-1 flex items-center gap-1">
                                                    <span>💰</span> 外站比價方案（比直飛便宜）
                                                </h4>
                                                {baseline > 0 && (
                                                    <p className="text-xs text-gray-400 mb-2">直飛基準 NT${baseline.toLocaleString()}，以下皆更便宜</p>
                                                )}
                                                {display.map((r: any, i: number) => {
                                                    const total = r.total ?? r.price_twd;
                                                    const saving = baseline ? baseline - total : (r.saving_twd ?? 0);
                                                    const isTop = i === 0;
                                                    return (
                                                        <div key={i} className={`rounded-xl px-4 py-3 ${isTop ? 'bg-emerald-50 border border-emerald-200' : 'bg-gray-50'}`}>
                                                            <div className="flex items-start justify-between">
                                                                <div className="flex-1 min-w-0">
                                                                    {isTop && <div className="text-xs font-bold text-emerald-600 mb-0.5">🏆 最優惠</div>}
                                                                    <div className="font-bold text-gray-800 text-sm">{r.airlines}</div>
                                                                    <div className="text-xs text-gray-500 mt-0.5">
                                                                        定位段 <span className="font-bold text-orange-600">{fhOrigin.split('｜')[0] ?? 'TPE'}→{r.origin}</span> 再飛目的地 · {r.duration || '-'}
                                                                    </div>
                                                                    {r.price_twd && r.total && r.total !== r.price_twd && (
                                                                        <div className="text-xs text-gray-400 mt-0.5">
                                                                            外站票 NT${r.price_twd.toLocaleString()} + 定位費 NT${(r.total - r.price_twd).toLocaleString()}
                                                                        </div>
                                                                    )}
                                                                    {r.departure && (
                                                                        <div className="text-xs text-gray-400 mt-0.5">
                                                                            起 {r.departure} → 降 {r.arrival}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="text-right ml-3 flex-shrink-0">
                                                                    <div className={`text-lg font-black ${isTop ? 'text-emerald-700' : 'text-gray-700'}`}>
                                                                        NT${total.toLocaleString()}
                                                                    </div>
                                                                    {saving > 0 && (
                                                                        <div className="text-xs font-bold text-emerald-600">省 {saving.toLocaleString()} 元</div>
                                                                    )}
                                                                    {r.book_url && (
                                                                        <a href={r.book_url} target="_blank" rel="noopener noreferrer"
                                                                            className="text-xs text-emerald-500 hover:underline">查看 →</a>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                                {sorted.length > 3 && (
                                                    <button
                                                        onClick={() => setFhShowMore(v => !v)}
                                                        className="w-full text-sm text-emerald-600 font-bold py-2 hover:bg-emerald-50 rounded-xl transition-colors flex items-center justify-center gap-1"
                                                    >
                                                        {fhShowMore ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                        {fhShowMore ? '收起' : `顯示更多方案（共 ${sorted.length} 個）`}
                                                    </button>
                                                )}
                                                <p className="text-xs text-gray-400 text-center pt-1">
                                                    ⚠️ 外站票需自行安排定位段，購票前請確認航班規則
                                                </p>
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}

                            {/* 聯盟說明 */}
                            <div className="text-center text-xs text-gray-400 mt-2">
                                透過以上連結預訂，我們可獲得小額佣金以支持網站營運，感謝您的支持！💖
                            </div>
                        </div>
                    )}
                </div>

                {/* 底部社群連結 */}
                <div className="border-t border-gray-200/50 p-4 flex justify-center gap-4">
                    <a
                        href="https://www.instagram.com/fattyinsider/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white hover:scale-110 transition-transform shadow-lg"
                        title="Instagram"
                    >
                        <Instagram size={20} />
                    </a>
                    <a
                        href="https://open.spotify.com/show/1TVCbnnpv0QIuPo9LZWcGi"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 rounded-full bg-gradient-to-br from-green-500 to-green-600 text-white hover:scale-110 transition-transform shadow-lg"
                        title="Spotify"
                    >
                        <SpotifyIcon />
                    </a>
                    <a
                        href="https://fattyinsider.pages.dev"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:scale-110 transition-transform shadow-lg"
                        title="節目 RAG 網站"
                    >
                        <Globe size={20} />
                    </a>
                    <a
                        href="https://discordapp.com/users/307868714051829762"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 rounded-full bg-gradient-to-br from-red-500 to-orange-500 text-white hover:scale-110 transition-transform shadow-lg"
                        title="Bug 回報"
                    >
                        <Bug size={20} />
                    </a>
                </div>
            </div>
        </div>
    );
};
