import React, { useState, useEffect, useCallback } from 'react';
import { ArrowRightLeft, RefreshCw, TrendingUp, Loader2 } from 'lucide-react';

// 常用貨幣列表 (你常跑的國家)
const CURRENCIES = [
    { code: 'TWD', name: '新台幣', flag: '🇹🇼' },
    { code: 'THB', name: '泰銖', flag: '🇹🇭' },
    { code: 'VND', name: '越南盾', flag: '🇻🇳' },
    { code: 'PHP', name: '菲律賓披索', flag: '🇵🇭' },
    { code: 'JPY', name: '日圓', flag: '🇯🇵' },
    { code: 'USD', name: '美元', flag: '🇺🇸' },
    { code: 'CNY', name: '人民幣', flag: '🇨🇳' },
    { code: 'MYR', name: '馬來西亞林吉特', flag: '🇲🇾' },
    { code: 'SGD', name: '新加坡幣', flag: '🇸🇬' },
    { code: 'KRW', name: '韓圓', flag: '🇰🇷' },
    { code: 'HKD', name: '港幣', flag: '🇭🇰' },
    { code: 'IDR', name: '印尼盾', flag: '🇮🇩' },
    { code: 'RUB', name: '俄羅斯盧布', flag: '🇷🇺' },
];

interface ExchangeRates {
    [key: string]: number;
}

export const CurrencyExchangeCalculator: React.FC = () => {
    const [amount, setAmount] = useState<string>('1000');
    const [fromCurrency, setFromCurrency] = useState<string>('TWD');
    const [toCurrency, setToCurrency] = useState<string>('THB');
    const [rates, setRates] = useState<ExchangeRates>({});
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdate, setLastUpdate] = useState<string>('');

    // 從 ExchangeRate-API 獲取匯率 (免費無需 API Key)
    const fetchRates = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            // 使用 ExchangeRate-API 的免費 Open API
            const response = await fetch(`https://open.er-api.com/v6/latest/USD`);
            const data = await response.json();

            if (data.result === 'success') {
                setRates(data.rates);
                // 格式化更新時間 (自動轉換為使用者本地時區)
                const updateTime = new Date(data.time_last_update_utc);
                setLastUpdate(updateTime.toLocaleString(undefined, {
                    month: 'numeric',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                }));
            } else {
                throw new Error('API 回應錯誤');
            }
        } catch (err) {
            console.error('獲取匯率失敗:', err);
            setError('無法獲取匯率，請稍後再試');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRates();
    }, [fetchRates]);

    // 計算換算結果
    const calculateResult = (): string => {
        if (!rates[fromCurrency] || !rates[toCurrency] || !amount) {
            return '---';
        }
        const amountNum = parseFloat(amount.replace(/,/g, ''));
        if (isNaN(amountNum)) return '---';

        // 先換成 USD，再換成目標貨幣
        const inUSD = amountNum / rates[fromCurrency];
        const result = inUSD * rates[toCurrency];

        // 格式化結果
        return result.toLocaleString('zh-TW', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    // 取得當前匯率
    const getCurrentRate = (): string => {
        if (!rates[fromCurrency] || !rates[toCurrency]) return '---';
        const rate = rates[toCurrency] / rates[fromCurrency];
        return rate.toLocaleString('zh-TW', {
            minimumFractionDigits: 4,
            maximumFractionDigits: 4
        });
    };

    // 交換貨幣
    const swapCurrencies = () => {
        setFromCurrency(toCurrency);
        setToCurrency(fromCurrency);
    };

    // 處理金額輸入
    const handleAmountChange = (value: string) => {
        // 移除非數字字符（保留小數點）
        const cleaned = value.replace(/[^\d.]/g, '');
        setAmount(cleaned);
    };

    // 快速金額按鈕
    const quickAmounts = ['1000', '5000', '10000', '50000'];

    return (
        <div className="space-y-4 text-gray-700">
            {/* 標題區 */}
            <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg flex items-center gap-2">
                    💱 快速換匯計算
                </h3>
                <button
                    onClick={fetchRates}
                    disabled={isLoading}
                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50"
                >
                    <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                    更新匯率
                </button>
            </div>

            {error ? (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center text-red-600 text-sm">
                    {error}
                </div>
            ) : (
                <>
                    {/* 主計算區 */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 shadow-sm border border-blue-100">
                        {/* 來源貨幣 */}
                        <div className="mb-3">
                            <label className="text-xs text-gray-500 mb-1 block">我有</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    value={amount}
                                    onChange={(e) => handleAmountChange(e.target.value)}
                                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-lg font-bold focus:ring-2 focus:ring-blue-300 focus:border-blue-300 outline-none"
                                    placeholder="輸入金額"
                                />
                                <select
                                    value={fromCurrency}
                                    onChange={(e) => setFromCurrency(e.target.value)}
                                    className="px-3 py-3 rounded-xl border border-gray-200 bg-white font-bold text-sm focus:ring-2 focus:ring-blue-300 focus:border-blue-300 outline-none min-w-[120px]"
                                >
                                    {CURRENCIES.map(c => (
                                        <option key={c.code} value={c.code}>
                                            {c.flag} {c.code}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* 快速金額按鈕 */}
                        <div className="flex gap-2 mb-3">
                            {quickAmounts.map(qa => (
                                <button
                                    key={qa}
                                    onClick={() => setAmount(qa)}
                                    className={`flex-1 py-1.5 text-xs rounded-lg font-medium transition-all ${amount === qa
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-white/70 text-gray-600 hover:bg-white'
                                        }`}
                                >
                                    {parseInt(qa).toLocaleString()}
                                </button>
                            ))}
                        </div>

                        {/* 交換按鈕 */}
                        <div className="flex justify-center my-2">
                            <button
                                onClick={swapCurrencies}
                                className="p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-all hover:scale-110 active:scale-95"
                            >
                                <ArrowRightLeft size={20} className="text-blue-500" />
                            </button>
                        </div>

                        {/* 目標貨幣 */}
                        <div>
                            <label className="text-xs text-gray-500 mb-1 block">可換得</label>
                            <div className="flex gap-2">
                                <div className="flex-1 px-4 py-3 rounded-xl bg-white border border-gray-200 text-lg font-bold text-green-600">
                                    {isLoading ? (
                                        <Loader2 size={20} className="animate-spin text-gray-400" />
                                    ) : (
                                        calculateResult()
                                    )}
                                </div>
                                <select
                                    value={toCurrency}
                                    onChange={(e) => setToCurrency(e.target.value)}
                                    className="px-3 py-3 rounded-xl border border-gray-200 bg-white font-bold text-sm focus:ring-2 focus:ring-blue-300 focus:border-blue-300 outline-none min-w-[120px]"
                                >
                                    {CURRENCIES.map(c => (
                                        <option key={c.code} value={c.code}>
                                            {c.flag} {c.code}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* 匯率資訊 */}
                    <div className="bg-white/70 rounded-xl p-3 text-center">
                        <div className="flex items-center justify-center gap-2 text-sm">
                            <TrendingUp size={16} className="text-green-500" />
                            <span className="text-gray-600">
                                1 {CURRENCIES.find(c => c.code === fromCurrency)?.flag} {fromCurrency} =
                                <span className="font-bold text-gray-800 ml-1">
                                    {getCurrentRate()}
                                </span>
                                <span className="ml-1">
                                    {CURRENCIES.find(c => c.code === toCurrency)?.flag} {toCurrency}
                                </span>
                            </span>
                        </div>
                        {lastUpdate && (
                            <div className="text-[10px] text-gray-400 mt-1">
                                🕐 資料來源: 中央銀行參考匯率 ｜ 每日更新: {lastUpdate} (您的本地時間)
                            </div>
                        )}
                    </div>

                    {/* 芭提雅換匯提示 */}
                    <div className="bg-gradient-to-r from-pink-50 to-orange-50 rounded-xl p-3 text-xs text-gray-600">
                        <div className="font-bold text-pink-600 mb-1">💡 芭提雅換匯小提示</div>
                        <ul className="space-y-1 text-gray-500">
                            <li>• TT Exchange 通常有較好的匯率</li>
                            <li>• 避免在機場或觀光區換匯，匯率較差</li>
                            <li>• 帶 USD 或 TWD 現金換匯通常比較划算</li>
                        </ul>
                    </div>
                </>
            )}
        </div>
    );
};
