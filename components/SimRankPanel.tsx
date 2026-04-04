import React, { useState } from 'react';
import { Search, Loader2, Wifi, Smartphone, ExternalLink, RefreshCw } from 'lucide-react';

// Trip.com 推薦碼
const TRIP_AFFILIATE = {
    allianceId: '7162268',
    sid: '263802428',
};

function buildAffiliateUrl(url: string): string {
    if (!url) return 'https://tw.trip.com/sim-card/';
    const sep = url.includes('?') ? '&' : '?';
    return `${url}${sep}Allianceid=${TRIP_AFFILIATE.allianceId}&SID=${TRIP_AFFILIATE.sid}&trip_sub1=fattymap`;
}

// 可選國家列表
const COUNTRIES = [
    { name: '越南', en: 'Vietnam', flag: '🇻🇳' },
    { name: '泰國', en: 'Thailand', flag: '🇹🇭' },
    { name: '日本', en: 'Japan', flag: '🇯🇵' },
    { name: '韓國', en: 'South Korea', flag: '🇰🇷' },
    { name: '印尼', en: 'Indonesia', flag: '🇮🇩' },
    { name: '馬來西亞', en: 'Malaysia', flag: '🇲🇾' },
    { name: '菲律賓', en: 'Philippines', flag: '🇵🇭' },
    { name: '新加坡', en: 'Singapore', flag: '🇸🇬' },
    { name: '香港', en: 'China Hong Kong', flag: '🇭🇰' },
    { name: '中國', en: 'China', flag: '🇨🇳' },
];

const DAY_OPTIONS = [3, 5, 7, 10, 14, 30];

interface SimPlan {
    rank: number;
    name: string;
    type: 'eSIM' | 'SIM card';
    plan: string;
    days: number | '?';
    daily_gb: string;
    min_price_usd: number;
    formula: string;
    cp_score: string;
    real_name_req: 'Yes' | 'No';
    url: string;
}

interface ApiResponse {
    country: string;
    total: number;
    plans: SimPlan[];
}

export const SimRankPanel: React.FC = () => {
    const [country, setCountry] = useState<typeof COUNTRIES[0] | null>(null);
    const [days, setDays] = useState<number>(7);
    const [simType, setSimType] = useState<'all' | 'esim' | 'physical'>('all');
    const [noRealName, setNoRealName] = useState(true);
    const [result, setResult] = useState<ApiResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSearch = async () => {
        if (!country) return;
        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            const params = new URLSearchParams({
                country: country.en,
                days: String(days),
                sim_type: simType,
                no_real_name: String(noRealName),
                limit: '8',
            });
            const res = await fetch(
                `https://opencli-api.liupony2000.workers.dev/api/sim-rank?${params}`
            );
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json() as ApiResponse;
            setResult(data);
        } catch (e) {
            setError('查詢失敗，請稍後再試');
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-4 text-gray-700">
            {/* 標題 */}
            <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg flex items-center gap-2">
                    📶 SIM 卡 CP 值查詢
                </h3>
                {result && (
                    <button
                        onClick={handleSearch}
                        disabled={isLoading}
                        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50"
                    >
                        <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                        重新查詢
                    </button>
                )}
            </div>

            {/* 說明 */}
            <div className="text-xs text-gray-500 bg-blue-50 rounded-xl p-3">
                比較 Trip.com 上目的地的 SIM 卡方案，依每日 GB ÷ 每日價格排名，找最划算的。
            </div>

            {/* 主設定區 */}
            <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl p-4 shadow-sm border border-cyan-100 space-y-4">

                {/* 國家選擇 */}
                <div>
                    <label className="text-xs text-gray-500 mb-2 block">目的地</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {COUNTRIES.map(c => (
                            <button
                                key={c.en}
                                onClick={() => setCountry(c)}
                                className={`py-2 px-2 rounded-xl text-sm font-medium transition-all border-2 text-left ${
                                    country?.en === c.en
                                        ? 'border-blue-400 bg-blue-500 text-white shadow-md'
                                        : 'border-gray-200 bg-white/70 text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                                }`}
                            >
                                {c.flag} {c.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 天數選擇 */}
                <div>
                    <label className="text-xs text-gray-500 mb-2 block">旅遊天數</label>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                        {DAY_OPTIONS.map(d => (
                            <button
                                key={d}
                                onClick={() => setDays(d)}
                                className={`py-2 text-sm rounded-xl font-medium transition-all ${
                                    days === d
                                        ? 'bg-blue-500 text-white shadow-sm'
                                        : 'bg-white/70 text-gray-600 hover:bg-white border border-gray-200'
                                }`}
                            >
                                {d}天
                            </button>
                        ))}
                    </div>
                </div>

                {/* 類型 + 實名制過濾 */}
                <div className="flex flex-wrap gap-2 items-center justify-between">
                    <div className="flex gap-1 bg-white/70 rounded-xl p-1 border border-gray-200 flex-1">
                        {(['all', 'esim', 'physical'] as const).map(t => (
                            <button
                                key={t}
                                onClick={() => setSimType(t)}
                                className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                    simType === t
                                        ? 'bg-blue-500 text-white shadow-sm'
                                        : 'text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                {t === 'all' ? '全部' : t === 'esim' ? (
                                    <><Wifi size={12} /> eSIM</>
                                ) : (
                                    <><Smartphone size={12} /> 實體</>
                                )}
                            </button>
                        ))}
                    </div>

                    <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer select-none flex-shrink-0">
                        <div
                            onClick={() => setNoRealName(!noRealName)}
                            className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                                noRealName ? 'bg-blue-500' : 'bg-gray-300'
                            }`}
                        >
                            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                                noRealName ? 'translate-x-4' : 'translate-x-0.5'
                            }`} />
                        </div>
                        過濾實名制
                    </label>
                </div>

                {/* 查詢按鈕 */}
                <button
                    onClick={handleSearch}
                    disabled={!country || isLoading}
                    className="w-full py-3 rounded-xl font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    style={{ background: country ? 'linear-gradient(135deg, #3b82f6, #06b6d4)' : undefined, backgroundColor: !country ? '#9ca3af' : undefined }}
                >
                    {isLoading ? (
                        <><Loader2 size={18} className="animate-spin" /> 查詢中...</>
                    ) : (
                        <><Search size={18} /> {country ? `查詢 ${country.flag} ${country.name}` : '請先選擇目的地'}</>
                    )}
                </button>
            </div>

            {/* 錯誤訊息 */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center text-red-600 text-sm">
                    {error}
                </div>
            )}

            {/* 結果列表 */}
            {result && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="text-sm font-bold text-gray-700">
                            {result.country} — 找到 {result.total} 個方案，依 CP 值排序
                        </div>
                        <div className="text-[10px] text-gray-400">CP = GB/天 ÷ USD/天</div>
                    </div>

                    {result.plans.length === 0 ? (
                        <div className="text-center text-gray-500 text-sm py-6">
                            沒有符合條件的方案，試試調整過濾條件
                        </div>
                    ) : (
                        result.plans.map((plan, idx) => (
                            <a
                                key={idx}
                                href={buildAffiliateUrl(plan.url)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block"
                            >
                                <div className={`p-3 rounded-xl border-2 transition-all hover:shadow-md hover:scale-[1.01] ${
                                    idx === 0
                                        ? 'border-yellow-400 bg-gradient-to-br from-yellow-50 to-orange-50'
                                        : 'border-gray-200 bg-white/70 hover:border-blue-200'
                                }`}>
                                    <div className="flex items-start justify-between gap-2">
                                        {/* 左側 */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                                                {idx === 0 && <span className="text-xs bg-yellow-400 text-white px-1.5 py-0.5 rounded-full font-bold">🏆 最優</span>}
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                                                    plan.type === 'eSIM'
                                                        ? 'bg-cyan-100 text-cyan-700'
                                                        : 'bg-purple-100 text-purple-700'
                                                }`}>
                                                    {plan.type === 'eSIM' ? <span className="flex items-center gap-0.5"><Wifi size={10} /> eSIM</span> : <span className="flex items-center gap-0.5"><Smartphone size={10} /> 實體</span>}
                                                </span>
                                                {plan.days !== '?' && (
                                                    <span className="text-[10px] text-gray-500">{plan.days}天</span>
                                                )}
                                            </div>
                                            <div className="text-sm font-medium text-gray-800 leading-tight truncate">
                                                {plan.name}
                                            </div>
                                            <div className="text-[10px] text-gray-400 mt-1 truncate">{plan.formula}</div>
                                        </div>

                                        {/* 右側：價格 + CP */}
                                        <div className="text-right flex-shrink-0">
                                            <div className={`text-base font-bold ${idx === 0 ? 'text-orange-600' : 'text-gray-800'}`}>
                                                ${plan.min_price_usd.toFixed(2)}
                                            </div>
                                            <div className="text-[10px] text-gray-500">USD</div>
                                            {plan.cp_score !== 'N/A' && (
                                                <div className={`text-xs font-bold mt-0.5 ${idx === 0 ? 'text-yellow-600' : 'text-blue-600'}`}>
                                                    CP {plan.cp_score}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between mt-2">
                                        <div className="flex gap-1">
                                            {plan.daily_gb !== '彈性' && (
                                                <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">
                                                    {plan.daily_gb}GB/天
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-[10px] text-blue-500 flex items-center gap-0.5">
                                            Trip.com <ExternalLink size={10} />
                                        </span>
                                    </div>
                                </div>
                            </a>
                        ))
                    )}

                    <div className="text-[10px] text-gray-400 text-center">
                        透過以上連結購買可支持本網站營運 🙏 價格以 Trip.com 當時顯示為準
                    </div>
                </div>
            )}
        </div>
    );
};
