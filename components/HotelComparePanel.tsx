import React, { useState } from 'react';
import { Search, ExternalLink } from 'lucide-react';

// ── 平台定義（只保留驗證可用的三個）─────────────────────────────────────────

const PLATFORMS = [
    {
        id: 'booking',
        name: 'Booking.com',
        emoji: '🔵',
        buildUrl: (city: string, hotel: string, checkIn: string, checkOut: string, adults: number) => {
            const q = [hotel, city].filter(Boolean).join(' ');
            return `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(q)}&checkin=${checkIn}&checkout=${checkOut}&group_adults=${adults}&no_rooms=1&lang=en-us`;
        },
    },
    {
        id: 'agoda',
        name: 'Agoda',
        emoji: '🔴',
        buildUrl: (city: string, hotel: string, checkIn: string, checkOut: string, adults: number) => {
            const nights = Math.max(1, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000));
            const q = [hotel, city].filter(Boolean).join(' ');
            return `https://www.agoda.com/en-gb/search?q=${encodeURIComponent(q)}&checkIn=${checkIn}&los=${nights}&adults=${adults}&rooms=1&currencyCode=USD`;
        },
    },
    {
        id: 'trip',
        name: 'Trip.com',
        emoji: '🟡',
        buildUrl: (city: string, hotel: string, checkIn: string, checkOut: string, adults: number) => {
            const ci = checkIn.replace(/-/g, '%2F');
            const co = checkOut.replace(/-/g, '%2F');
            const q = [hotel, city].filter(Boolean).join(' ');
            return `https://www.trip.com/hotels/list?cityEnName=${encodeURIComponent(city)}&keyword=${encodeURIComponent(q)}&checkin=${ci}&checkout=${co}&adult=${adults}&curr=USD&locale=en-XX`;
        },
    },
];

const QUICK_CITIES = ["Pattaya", "Bangkok", "Phuket", "Chiang Mai", "Hanoi", "Ho Chi Minh City", "Tokyo", "Osaka", "Seoul", "Singapore"];

// ── Component ─────────────────────────────────────────────────────────────────

export const HotelComparePanel: React.FC = () => {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    const [city, setCity] = useState('');
    const [hotel, setHotel] = useState('');
    const [checkIn, setCheckIn] = useState(today);
    const [checkOut, setCheckOut] = useState(tomorrow);
    const [adults, setAdults] = useState(2);
    const [checked, setChecked] = useState<Record<string, boolean>>(
        Object.fromEntries(PLATFORMS.map(p => [p.id, true]))
    );

    const nights = Math.max(1, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000));
    const selectedCount = Object.values(checked).filter(Boolean).length;
    const canSearch = city.trim() && checkIn && checkOut && checkIn < checkOut && selectedCount > 0;

    const handleSearch = () => {
        if (!canSearch) return;
        PLATFORMS.forEach(p => {
            if (!checked[p.id]) return;
            window.open(p.buildUrl(city.trim(), hotel.trim(), checkIn, checkOut, adults), '_blank', 'noopener');
        });
    };

    return (
        <div className="space-y-4 text-gray-700">
            {/* 說明 */}
            <div className="text-xs text-gray-500 bg-orange-50 rounded-xl p-3">
                輸入目的地與飯店名稱，一鍵同時開多個訂房平台，自己比價找最便宜的！
            </div>

            {/* 輸入區 */}
            <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-2xl p-4 shadow-sm border border-orange-100 space-y-3">

                {/* 城市 */}
                <div>
                    <label className="text-xs text-gray-500 mb-1 block">目的地城市 <span className="text-red-400">*</span></label>
                    <input
                        type="text"
                        value={city}
                        onChange={e => setCity(e.target.value)}
                        placeholder="例：Pattaya、Bangkok、Tokyo"
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-orange-400"
                    />
                    <div className="flex flex-wrap gap-2 mt-2">
                        {QUICK_CITIES.map(item => (
                            <button
                                key={item}
                                type="button"
                                onClick={() => setCity(city === item ? '' : item)}
                                className={`px-2 py-1 rounded-full text-xs transition-colors ${
                                    city === item
                                        ? 'bg-orange-400 text-white'
                                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                }`}
                            >
                                {item}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 飯店名稱 */}
                <div>
                    <label className="text-xs text-gray-500 mb-1 block">飯店名稱（選填，不填則搜整個城市）</label>
                    <input
                        type="text"
                        value={hotel}
                        onChange={e => setHotel(e.target.value)}
                        placeholder="例：RB Resort、Marriott、Hilton"
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-orange-400"
                    />
                </div>

                {/* 日期 */}
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="text-xs text-gray-500 mb-1 block">入住</label>
                        <input
                            type="date"
                            value={checkIn}
                            min={today}
                            onChange={e => {
                                setCheckIn(e.target.value);
                                if (e.target.value >= checkOut) {
                                    const next = new Date(new Date(e.target.value).getTime() + 86400000).toISOString().split('T')[0];
                                    setCheckOut(next);
                                }
                            }}
                            className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-orange-400"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 mb-1 block">退房</label>
                        <input
                            type="date"
                            value={checkOut}
                            min={checkIn || today}
                            onChange={e => setCheckOut(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-orange-400"
                        />
                    </div>
                </div>

                {/* 人數 + 晚數顯示 */}
                <div className="flex items-center gap-4">
                    <div className="flex-1">
                        <label className="text-xs text-gray-500 mb-1 block">大人人數</label>
                        <div className="flex items-center gap-2">
                            <button type="button" onClick={() => setAdults(a => Math.max(1, a - 1))} className="w-8 h-8 rounded-full bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 font-bold text-lg flex items-center justify-center">−</button>
                            <span className="text-sm font-bold w-4 text-center">{adults}</span>
                            <button type="button" onClick={() => setAdults(a => Math.min(8, a + 1))} className="w-8 h-8 rounded-full bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 font-bold text-lg flex items-center justify-center">+</button>
                        </div>
                    </div>
                    {checkIn && checkOut && checkIn < checkOut && (
                        <div className="text-right">
                            <span className="text-2xl font-bold text-orange-500">{nights}</span>
                            <span className="text-xs text-gray-500 ml-1">晚</span>
                        </div>
                    )}
                </div>
            </div>

            {/* 平台選擇 */}
            <div className="bg-white/70 rounded-2xl p-4 border border-gray-200 space-y-2">
                <span className="text-xs font-bold text-gray-600">選擇平台</span>
                <div className="grid grid-cols-3 gap-2">
                    {PLATFORMS.map(p => (
                        <label key={p.id} className={`flex items-center gap-1.5 p-2 rounded-xl border-2 cursor-pointer transition-all text-xs font-medium ${checked[p.id] ? 'border-orange-400 bg-orange-50 text-orange-700' : 'border-gray-200 bg-white text-gray-500'}`}>
                            <input
                                type="checkbox"
                                checked={!!checked[p.id]}
                                onChange={e => setChecked(c => ({ ...c, [p.id]: e.target.checked }))}
                                className="hidden"
                            />
                            <span>{p.emoji}</span>
                            <span>{p.name}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* 搜尋按鈕 */}
            <button
                type="button"
                onClick={handleSearch}
                disabled={!canSearch}
                className="w-full py-3 rounded-xl font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ background: canSearch ? 'linear-gradient(135deg, #f97316, #eab308)' : undefined, backgroundColor: !canSearch ? '#9ca3af' : undefined }}
            >
                <Search size={18} />
                {!city.trim()
                    ? '請輸入目的地城市'
                    : selectedCount === 0
                    ? '請至少選一個平台'
                    : checkIn >= checkOut
                    ? '退房日需在入住日之後'
                    : `同時開啟 ${selectedCount} 個平台比價`}
                {canSearch && <ExternalLink size={14} />}
            </button>

            <div className="text-[10px] text-gray-400 text-center">
                各平台會在新分頁開啟，直接比較真實即時價格
            </div>
        </div>
    );
};
