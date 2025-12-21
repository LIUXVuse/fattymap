import React, { useState, useEffect, useCallback } from 'react';
import { ArrowRightLeft, RefreshCw, TrendingUp, Loader2, ChevronDown, ChevronUp, Lightbulb, Info } from 'lucide-react';
import {
    getAllRates,
    calculateSmartExchange,
    ExchangeRateData,
    SmartExchangeResult,
    RateSource
} from '../services/exchangeRateService';

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

interface MultiRatesState {
    taiwanRates: Record<string, ExchangeRateData>;
    thailandRates: Record<string, ExchangeRateData>;
    globalRates: Record<string, number>;
    estimatedRates: Record<string, ExchangeRateData>;
    lastUpdate: string;
}

export const CurrencyExchangeCalculator: React.FC = () => {
    const [amount, setAmount] = useState<string>('1000');
    const [fromCurrency, setFromCurrency] = useState<string>('TWD');
    const [toCurrency, setToCurrency] = useState<string>('THB');
    const [multiRates, setMultiRates] = useState<MultiRatesState | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdate, setLastUpdate] = useState<string>('');
    const [isComparisonOpen, setIsComparisonOpen] = useState<boolean>(true); // 預設展開

    // 獲取多來源匯率
    const fetchRates = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            // BOT API Token 從環境變數讀取
            const botApiToken = import.meta.env.VITE_BOT_API_TOKEN;
            console.log('BOT Token 是否存在:', !!botApiToken);

            const rates = await getAllRates(botApiToken);
            console.log('台灣匯率數量:', Object.keys(rates.taiwanRates).length);
            console.log('泰國匯率數量:', Object.keys(rates.thailandRates).length);
            console.log('台灣匯率清單:', Object.keys(rates.taiwanRates));
            console.log('泰國匯率清單:', Object.keys(rates.thailandRates));

            setMultiRates(rates);

            // 格式化更新時間
            if (rates.lastUpdate) {
                const updateTime = new Date(rates.lastUpdate);
                setLastUpdate(updateTime.toLocaleString(undefined, {
                    month: 'numeric',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                }));
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

    // 取得某貨幣的匯率資訊
    const getRateInfo = (currency: string): { rate: number; source: RateSource; sourceName: string } | null => {
        if (!multiRates) return null;

        // 優先順序：台灣銀行 > 泰國央行 > 全球中間匯率
        if (multiRates.taiwanRates[currency]) {
            const tw = multiRates.taiwanRates[currency];
            return { rate: tw.midRate, source: tw.source, sourceName: tw.sourceName };
        }
        if (multiRates.thailandRates[currency]) {
            const th = multiRates.thailandRates[currency];
            return { rate: th.midRate, source: th.source, sourceName: th.sourceName };
        }
        if (multiRates.globalRates[currency]) {
            return {
                rate: multiRates.globalRates[currency],
                source: 'estimated',
                sourceName: '📊 估算值'
            };
        }
        return null;
    };

    // 計算換算結果
    const calculateResult = (): string => {
        if (!multiRates?.globalRates[fromCurrency] || !multiRates?.globalRates[toCurrency] || !amount) {
            return '---';
        }
        const amountNum = parseFloat(amount.replace(/,/g, ''));
        if (isNaN(amountNum)) return '---';

        // 使用全球中間匯率計算
        const fromRate = multiRates.globalRates[fromCurrency];
        const toRate = multiRates.globalRates[toCurrency];
        const result = amountNum / fromRate * toRate;

        return result.toLocaleString('zh-TW', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    // 取得當前匯率
    const getCurrentRate = (): string => {
        if (!multiRates?.globalRates[fromCurrency] || !multiRates?.globalRates[toCurrency]) return '---';
        const rate = multiRates.globalRates[toCurrency] / multiRates.globalRates[fromCurrency];
        return rate.toLocaleString('zh-TW', {
            minimumFractionDigits: 4,
            maximumFractionDigits: 4
        });
    };

    // 取得來源標籤
    const getSourceBadge = (currency: string): React.ReactNode => {
        const info = getRateInfo(currency);
        if (!info) return null;

        const colorClass = {
            'taiwan_bank': 'bg-green-100 text-green-700',
            'bot_thailand': 'bg-blue-100 text-blue-700',
            'global': 'bg-gray-100 text-gray-600',
            'estimated': 'bg-yellow-100 text-yellow-700',
        }[info.source];

        return (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${colorClass}`}>
                {info.sourceName}
            </span>
        );
    };

    // 智能路徑比較 - 三方案
    const getSmartComparison = (): SmartExchangeResult | null => {
        if (!multiRates || !amount) return null;

        const amountNum = parseFloat(amount.replace(/,/g, ''));
        if (isNaN(amountNum) || amountNum <= 0) return null;

        // 固定來源為 TWD，比較不同方案換到目標貨幣
        return calculateSmartExchange({
            amount: amountNum,
            targetCurrency: toCurrency,
            thailandRates: multiRates.thailandRates,
            globalRates: multiRates.globalRates,
        });
    };

    // 交換貨幣
    const swapCurrencies = () => {
        setFromCurrency(toCurrency);
        setToCurrency(fromCurrency);
    };

    // 處理金額輸入
    const handleAmountChange = (value: string) => {
        const cleaned = value.replace(/[^\d.]/g, '');
        setAmount(cleaned);
    };

    // 快速金額按鈕
    const quickAmounts = ['5000', '10000', '20000', '30000', '50000', '100000'];

    return (
        <div className="space-y-4 text-gray-700">
            {/* 標題區 */}
            <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg flex items-center gap-2">
                    💱 智能換匯
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

            {/* 資料來源說明 */}
            <div className="flex flex-wrap gap-2 text-[10px]">
                <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full">🇹🇼 台灣銀行</span>
                <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">🇹🇭 泰國央行</span>
                <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">📊 估算值</span>
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
                            <div className="flex items-center justify-between mb-1">
                                <label className="text-xs text-gray-500">我有</label>
                                {getSourceBadge(fromCurrency)}
                            </div>
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
                            <div className="flex items-center justify-between mb-1">
                                <label className="text-xs text-gray-500">可換得</label>
                                {getSourceBadge(toCurrency)}
                            </div>
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
                                🕐 更新時間: {lastUpdate} (您的本地時間)
                            </div>
                        )}
                    </div>

                    {/* 智能路徑比較 - 三方案 */}
                    {fromCurrency === 'TWD' && toCurrency !== 'USD' && (
                        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-100 overflow-hidden">
                            <button
                                onClick={() => setIsComparisonOpen(!isComparisonOpen)}
                                className="w-full flex items-center justify-between p-3 hover:bg-purple-100/50 transition-colors"
                            >
                                <div className="flex items-center gap-2 font-bold text-purple-700">
                                    <Lightbulb size={18} className="text-yellow-500" />
                                    🧠 智能換匯比較
                                </div>
                                {isComparisonOpen ? (
                                    <ChevronUp size={18} className="text-purple-500" />
                                ) : (
                                    <ChevronDown size={18} className="text-purple-500" />
                                )}
                            </button>

                            {isComparisonOpen && (() => {
                                const result = getSmartComparison();
                                if (!result) return null;

                                const toFlag = CURRENCIES.find(c => c.code === toCurrency)?.flag || '';

                                return (
                                    <div className="p-3 pt-0 space-y-3">
                                        {/* 免責聲明 */}
                                        <div className="flex items-start gap-2 text-xs text-orange-700 bg-orange-50 p-2 rounded-lg">
                                            <Info size={14} className="flex-shrink-0 mt-0.5" />
                                            <span>{result.disclaimer}</span>
                                        </div>

                                        {/* 三個方案卡片 */}
                                        {result.plans.map((plan) => (
                                            <div
                                                key={plan.id}
                                                className={`p-3 rounded-xl border-2 transition-all ${!plan.isAvailable
                                                    ? 'border-gray-300 bg-gray-100 opacity-60'
                                                    : result.recommendation === plan.id
                                                        ? 'border-green-400 bg-green-50'
                                                        : 'border-gray-200 bg-white/70'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="font-bold text-sm flex items-center gap-1">
                                                        {result.recommendation === plan.id && plan.isAvailable && '✅ '}
                                                        {!plan.isAvailable && '❌ '}
                                                        {plan.name}
                                                    </span>
                                                    <div className="flex items-center gap-1">
                                                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${plan.source === 'bot_thailand'
                                                            ? 'bg-blue-100 text-blue-700'
                                                            : 'bg-yellow-100 text-yellow-700'
                                                            }`}>
                                                            {plan.sourceName}
                                                        </span>
                                                        <span className="text-[10px] text-gray-400">
                                                            {plan.errorMargin}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="text-xs text-gray-500 mb-1">
                                                    {plan.description}
                                                </div>
                                                <div className="text-xs text-gray-600 mb-2">
                                                    {plan.steps.map((step, i) => (
                                                        <span key={i}>
                                                            {CURRENCIES.find(c => c.code === step)?.flag || ''} {step}
                                                            {i < plan.steps.length - 1 && ' → '}
                                                        </span>
                                                    ))}
                                                </div>
                                                <div className="text-lg font-bold text-gray-800">
                                                    {plan.isAvailable
                                                        ? `≈ ${plan.amount.toLocaleString('zh-TW', { maximumFractionDigits: 0 })} ${toCurrency}`
                                                        : '台灣銀行可能沒有此貨幣'}
                                                </div>
                                            </div>
                                        ))}

                                        {/* 建議 */}
                                        {result.bestPlan && (
                                            <div className="p-3 rounded-xl text-sm bg-green-100 text-green-800">
                                                <p><strong>💡 建議：</strong>{result.bestPlan.name} 最划算！</p>
                                                {result.savings > 0 && (
                                                    <p className="mt-1 text-xs opacity-80">
                                                        比最差方案多換得約 {result.savings.toLocaleString('zh-TW', { maximumFractionDigits: 0 })} {toCurrency} ({result.savingsPercent.toFixed(1)}%)
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}
                        </div>
                    )}

                    {/* 向下滑動提示 */}
                    <div className="text-center text-xs text-gray-400 animate-bounce">
                        ↓ 向下滑動查看換匯小提示 ↓
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
