/**
 * 多來源匯率服務
 * 整合台灣 FinMind、泰國 BOT 央行、以及全球中間匯率
 */

// 匯率來源類型
export type RateSource = 'taiwan_bank' | 'bot_thailand' | 'global' | 'estimated';

// 單一匯率資料
export interface ExchangeRateData {
    currency: string;
    buyRate: number;      // 買入價（銀行買入）
    sellRate: number;     // 賣出價（銀行賣出）
    midRate: number;      // 中間價
    source: RateSource;
    sourceName: string;   // 來源名稱（顯示用）
    updatedAt: string;
}

// 所有匯率
export interface MultiSourceRates {
    baseCurrency: string;
    rates: Record<string, ExchangeRateData>;
    lastUpdated: string;
}

// 貨幣流通性係數（用於沒有官方來源的估算）
const CURRENCY_SPREAD: Record<string, number> = {
    USD: 0.005,   // 0.5% - 最高流通性
    EUR: 0.008,   // 0.8%
    JPY: 0.012,   // 1.2%
    GBP: 0.010,   // 1.0%
    HKD: 0.010,   // 1.0%
    SGD: 0.015,   // 1.5%
    TWD: 0.015,   // 1.5%
    CNY: 0.020,   // 2.0%
    KRW: 0.020,   // 2.0%
    THB: 0.025,   // 2.5%
    MYR: 0.025,   // 2.5%
    PHP: 0.035,   // 3.5%
    IDR: 0.040,   // 4.0%
    VND: 0.045,   // 4.5%
    RUB: 0.050,   // 5.0%
};

/**
 * 從 FinMind 獲取台灣銀行牌告匯率
 * ⚠️ 注意：FinMind API 目前需要付費帳號才能使用
 * 未來如果需要，可以改用台灣央行開放資料或其他來源
 */
export async function fetchFinMindRates(): Promise<Record<string, ExchangeRateData>> {
    // FinMind 需要付費帳號，暫時返回空物件
    // 台灣匯率暫時使用全球中間匯率進行估算
    console.log('FinMind API 需要付費帳號，跳過台灣銀行匯率');
    return {};

    /* 原本的程式碼，等有付費帳號再啟用
    try {
        const response = await fetch(
            '/api/finmind/api/v4/data?dataset=TaiwanExchangeRate&start_date=2025-12-01'
        );
        const data = await response.json();
        // ... 
    } catch (error) {
        console.error('FinMind API 錯誤:', error);
        return {};
    }
    */
}

/**
 * 從泰國央行 BOT 獲取匯率
 * @param apiToken - Authorization token
 */
export async function fetchBotRates(apiToken?: string): Promise<Record<string, ExchangeRateData>> {
    if (!apiToken) {
        console.log('BOT API Token 未設定，跳過泰國央行匯率');
        return {};
    }

    try {
        // 使用 BOT Gateway API
        // 取最近 7 天的資料以確保有資料（週末不更新）
        const today = new Date();
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);

        const endDate = today.toISOString().split('T')[0];
        const startDate = weekAgo.toISOString().split('T')[0];

        const response = await fetch(
            `/api/bot/Stat-ExchangeRate/v2/DAILY_AVG_EXG_RATE/?start_period=${startDate}&end_period=${endDate}`,
            {
                headers: {
                    'Authorization': apiToken,
                    'Accept': 'application/json',
                },
            }
        );

        if (!response.ok) {
            throw new Error(`BOT API 回應錯誤: ${response.status}`);
        }

        const data = await response.json();
        console.log('BOT API 回應:', data);

        // 處理回應資料
        const rates: Record<string, ExchangeRateData> = {};

        // BOT API 回傳格式可能是 result.data.data_detail 或直接是陣列
        const dataDetail = data?.result?.data?.data_detail || data?.data?.data_detail || data?.data || [];

        if (Array.isArray(dataDetail) && dataDetail.length > 0) {
            // 找出最新日期
            const latestDate = dataDetail.reduce((max: string, item: any) =>
                (item.period && item.period > max) ? item.period : max, '');

            // 只取最新日期的資料
            const latestData = dataDetail.filter((item: any) => item.period === latestDate);

            for (const item of latestData) {
                const currency = item.currency_id || item.currency;
                if (!currency) continue;
                // 跳過沒有匯率的資料
                if (!item.buying_sight && !item.buying_transfer && !item.selling) continue;

                rates[currency] = {
                    currency,
                    buyRate: parseFloat(item.buying_sight) || parseFloat(item.buying_transfer) || parseFloat(item.buy) || 0,
                    sellRate: parseFloat(item.selling) || parseFloat(item.sell) || 0,
                    midRate: parseFloat(item.mid_rate) || 0,
                    source: 'bot_thailand',
                    sourceName: '🇹🇭 泰國央行',
                    updatedAt: item.period || new Date().toISOString(),
                };
            }
        }

        console.log('BOT 匯率資料:', Object.keys(rates));
        return rates;
    } catch (error) {
        console.error('BOT API 錯誤:', error);
        return {};
    }
}

/**
 * 從 ExchangeRate-API 獲取全球中間匯率
 */
export async function fetchGlobalRates(): Promise<{
    rates: Record<string, number>;
    lastUpdate: string;
}> {
    try {
        const response = await fetch('https://open.er-api.com/v6/latest/USD');
        const data = await response.json();

        if (data.result !== 'success') {
            throw new Error('ExchangeRate-API 回應錯誤');
        }

        return {
            rates: data.rates,
            lastUpdate: data.time_last_update_utc,
        };
    } catch (error) {
        console.error('ExchangeRate-API 錯誤:', error);
        return { rates: {}, lastUpdate: '' };
    }
}

/**
 * 根據全球中間匯率和流通性係數估算買賣價
 */
function estimateRates(
    currency: string,
    midRate: number,
    baseCurrency: string = 'USD'
): ExchangeRateData {
    const spread = CURRENCY_SPREAD[currency] || 0.03; // 預設 3%

    return {
        currency,
        buyRate: midRate * (1 - spread),
        sellRate: midRate * (1 + spread),
        midRate,
        source: 'estimated',
        sourceName: '📊 估算值',
        updatedAt: new Date().toISOString(),
    };
}

/**
 * 整合所有匯率來源
 */
export async function getAllRates(botApiKey?: string): Promise<{
    taiwanRates: Record<string, ExchangeRateData>;
    thailandRates: Record<string, ExchangeRateData>;
    globalRates: Record<string, number>;
    estimatedRates: Record<string, ExchangeRateData>;
    lastUpdate: string;
}> {
    // 並行獲取所有來源
    const [finmindRates, botRates, globalData] = await Promise.all([
        fetchFinMindRates(),
        fetchBotRates(botApiKey),
        fetchGlobalRates(),
    ]);

    // 為沒有官方來源的貨幣建立估算值
    const estimatedRates: Record<string, ExchangeRateData> = {};

    for (const [currency, rate] of Object.entries(globalData.rates)) {
        // 如果這個貨幣沒有官方來源，就用估算值
        if (!finmindRates[currency] && !botRates[currency]) {
            estimatedRates[currency] = estimateRates(currency, rate);
        }
    }

    return {
        taiwanRates: finmindRates,
        thailandRates: botRates,
        globalRates: globalData.rates,
        estimatedRates,
        lastUpdate: globalData.lastUpdate,
    };
}

/**
 * 智能換匯比較 - 三方案比較
 * 
 * 方案 A：台灣換 USD → 帶 USD 去當地換
 * 方案 B：帶台幣去當地換
 * 方案 C：在台灣直接換成當地貨幣
 */
export interface SmartExchangeInput {
    amount: number;           // 台幣金額
    targetCurrency: string;   // 目標貨幣（如 THB）
    thailandRates: Record<string, ExchangeRateData>;
    globalRates: Record<string, number>;
}

export interface ExchangePlan {
    id: 'A' | 'B' | 'C';
    name: string;
    description: string;
    steps: string[];
    amount: number;           // 最終換得金額
    source: RateSource;
    sourceName: string;
    isAvailable: boolean;     // 是否可行
    errorMargin: string;      // 誤差範圍說明
}

export interface SmartExchangeResult {
    plans: ExchangePlan[];
    recommendation: 'A' | 'B' | 'C' | null;
    bestPlan: ExchangePlan | null;
    savings: number;
    savingsPercent: number;
    disclaimer: string;       // 免責聲明
    // 損益平衡點提示
    breakeven: {
        rate: number;         // 損益平衡匯率（當地幣 / 1 TWD 或 1 USD）
        currency: string;     // 相關貨幣
        tip: string;          // 給用戶的提示
        referenceUrl: string; // 參考網站
    } | null;
}

// 取得貨幣的估算損失率
function getSpreadRate(currency: string, hasOfficialRate: boolean): number {
    if (hasOfficialRate) {
        // 有官方匯率，損失較小
        return CURRENCY_SPREAD[currency] || 0.015;
    }
    // 沒有官方匯率，使用估算（較高損失）
    return (CURRENCY_SPREAD[currency] || 0.025) * 1.5;
}

export function calculateSmartExchange(input: SmartExchangeInput): SmartExchangeResult | null {
    const { amount, targetCurrency, thailandRates, globalRates } = input;

    if (!globalRates['TWD'] || !globalRates[targetCurrency]) {
        return null;
    }

    // 如果目標就是 USD 或 TWD，不需要比較
    if (targetCurrency === 'USD' || targetCurrency === 'TWD') {
        return null;
    }

    const plans: ExchangePlan[] = [];

    // ========== 方案 A：台灣換 USD → 當地換 ==========
    // 步驟：TWD → USD（台灣）→ targetCurrency（當地）
    const twdToUsdSpread = getSpreadRate('TWD', false) + getSpreadRate('USD', false);
    const twdToUsdRate = 1 / globalRates['TWD']; // TWD to USD
    const usdAmount = amount * twdToUsdRate * (1 - twdToUsdSpread);

    // 當地 USD 換 targetCurrency
    // 重要：BOT API 只提供對 THB 的匯率！
    // 如果目標是 THB，使用 BOT 匯率；否則用全球中間匯率
    let planAAmount: number;
    let planASource: RateSource;
    let planASourceName: string;
    let planAErrorMargin: string;

    if (targetCurrency === 'THB' && thailandRates['USD']) {
        // 目標是 THB，用 BOT 官方匯率
        const usdToThbRate = thailandRates['USD'].midRate;
        const usdToThbSpread = (thailandRates['USD'].sellRate - thailandRates['USD'].buyRate) / thailandRates['USD'].midRate / 2;
        planAAmount = usdAmount * usdToThbRate * (1 - usdToThbSpread);
        planASource = 'bot_thailand';
        planASourceName = '🇹🇭 當地官方匯率';
        planAErrorMargin = '±1-2%';
    } else {
        // 目標不是 THB，用全球中間匯率估算
        const usdToTargetRate = globalRates[targetCurrency]; // USD to targetCurrency
        const usdToTargetSpread = getSpreadRate('USD', false) + getSpreadRate(targetCurrency, false);
        planAAmount = usdAmount * usdToTargetRate * (1 - usdToTargetSpread);
        planASource = 'estimated';
        planASourceName = '📊 估算值';
        planAErrorMargin = '±3-5%';
    }

    plans.push({
        id: 'A',
        name: '方案 A：台灣換美金 → 當地換',
        description: '在台灣先把台幣換成美金，再帶美金去當地換成當地貨幣',
        steps: ['TWD', 'USD', targetCurrency],
        amount: planAAmount,
        source: planASource,
        sourceName: planASourceName,
        isAvailable: true,
        errorMargin: planAErrorMargin,
    });

    // ========== 方案 B：帶台幣去當地換 ==========
    // 步驟：TWD → targetCurrency（當地）
    // 注意：BOT API 的 TWD 匯率只對 THB 有效！
    let planBAmount: number;
    let planBSource: RateSource;
    let planBSourceName: string;
    let planBErrorMargin: string;

    if (targetCurrency === 'THB' && thailandRates['TWD']) {
        // 目標是 THB 且 BOT 有 TWD 匯率
        const twdToThbRate = thailandRates['TWD'].midRate;
        const twdToThbSpread = (thailandRates['TWD'].sellRate - thailandRates['TWD'].buyRate) / thailandRates['TWD'].midRate / 2;
        planBAmount = amount * twdToThbRate * (1 - twdToThbSpread);
        planBSource = 'bot_thailand';
        planBSourceName = '🇹🇭 當地官方匯率';
        planBErrorMargin = '±2-3%';
    } else {
        // 目標不是 THB，或 BOT 沒有 TWD（台幣通常在海外不利）
        const twdToTargetRate = globalRates[targetCurrency] / globalRates['TWD'];
        // 台幣在海外通常損失較高（冷門貨幣）
        const twdToTargetSpread = 0.04; // 估算 4% 損失
        planBAmount = amount * twdToTargetRate * (1 - twdToTargetSpread);
        planBSource = 'estimated';
        planBSourceName = '📊 估算值';
        planBErrorMargin = '±3-5%';
    }

    plans.push({
        id: 'B',
        name: '方案 B：帶台幣去當地換',
        description: '直接帶台幣去當地的換匯店換成當地貨幣',
        steps: ['TWD', targetCurrency],
        amount: planBAmount,
        source: planBSource,
        sourceName: planBSourceName,
        isAvailable: true, // 當地私人換匯店通常會收
        errorMargin: planBErrorMargin,
    });

    // ========== 方案 C：台灣直接換當地貨幣 ==========
    // 步驟：TWD → targetCurrency（台灣）
    const twdToTargetInTaiwan = globalRates[targetCurrency] / globalRates['TWD'];
    const taiwanSpread = getSpreadRate('TWD', false) + getSpreadRate(targetCurrency, false);

    const planCAmount = amount * twdToTargetInTaiwan * (1 - taiwanSpread);

    // 台灣銀行不一定有所有貨幣
    const commonInTaiwan = ['USD', 'JPY', 'EUR', 'HKD', 'GBP', 'AUD', 'SGD', 'CNY', 'THB'].includes(targetCurrency);

    plans.push({
        id: 'C',
        name: '方案 C：在台灣直接換',
        description: '在台灣的銀行或機場直接換成當地貨幣',
        steps: ['TWD', targetCurrency],
        amount: planCAmount,
        source: 'estimated',
        sourceName: '📊 估算值',
        isAvailable: commonInTaiwan,
        errorMargin: '±2-4%',
    });

    // ========== 找出最佳方案 ==========
    const availablePlans = plans.filter(p => p.isAvailable);
    const bestPlan = availablePlans.reduce((best, plan) =>
        plan.amount > best.amount ? plan : best
        , availablePlans[0]);

    const worstPlan = availablePlans.reduce((worst, plan) =>
        plan.amount < worst.amount ? plan : worst
        , availablePlans[0]);

    const savings = bestPlan.amount - worstPlan.amount;
    const savingsPercent = (savings / worstPlan.amount) * 100;

    // ========== 計算損益平衡點 ==========
    // 比較方案 A（帶 USD）和方案 B（帶 TWD）
    const planA = plans.find(p => p.id === 'A')!;
    const planB = plans.find(p => p.id === 'B')!;

    // 損益平衡匯率 = 方案 A 金額 / 用戶台幣金額
    // 如果當地 TWD 賣出價 > 此值，選方案 B；< 此值，選方案 A
    const breakevenRate = planA.amount / amount;

    // 根據目標貨幣選擇參考網站
    const referenceUrls: Record<string, string> = {
        THB: 'https://www.superrichthailand.com/#!/en',
        VND: 'https://www.vietcombank.com.vn/en/exchangerates',
        PHP: 'https://www.bsp.gov.ph/SitePages/Statistics/ExchangeRate.aspx',
        JPY: 'https://www.bk.mufg.jp/gdocs/kinri/list_j/kinri/kawase.html',
        KRW: 'https://www.kebhana.com/cms/rate/index.do',
        IDR: 'https://www.bi.go.id/en/statistik/informasi-kurs/transaksi-bi/default.aspx',
    };

    const referenceUrl = referenceUrls[targetCurrency] || 'https://www.x-rates.com/';

    // 生成智能提示
    let breakevenTip = '';
    if (targetCurrency === 'THB') {
        breakevenTip = `去 SuperRich 或 TT Exchange 查 TWD 賣出價，若 > ${breakevenRate.toFixed(3)} 選方案 B，否則選方案 A`;
    } else {
        breakevenTip = `查詢當地換匯店 TWD → ${targetCurrency} 匯率，若 > ${breakevenRate.toFixed(2)} 選方案 B，否則選方案 A`;
    }

    return {
        plans,
        recommendation: bestPlan?.id || null,
        bestPlan,
        savings,
        savingsPercent,
        disclaimer: '⚠️ 以上為參考值，使用全球中間匯率估算。實際匯率依當地換匯店為準，落差約 ±2-5%。',
        breakeven: {
            rate: breakevenRate,
            currency: targetCurrency,
            tip: breakevenTip,
            referenceUrl,
        },
    };
}

// 保留舊的介面以維持相容性
export interface PathComparisonInput {
    amount: number;
    fromCurrency: string;
    toCurrency: string;
    taiwanRates: Record<string, ExchangeRateData>;
    thailandRates: Record<string, ExchangeRateData>;
    globalRates: Record<string, number>;
}

export interface PathComparisonResult {
    canDirectExchange: boolean;
    directPath: {
        amount: number;
        steps: string[];
        source: RateSource;
        sourceName: string;
        isAvailable: boolean;
    };
    transitPath: {
        amount: number;
        steps: string[];
        source: RateSource;
        sourceName: string;
    };
    recommendation: 'direct' | 'transit' | 'similar' | 'transit_only';
    savings: number;
    savingsPercent: number;
    message: string;
}

// 舊函數保留，但建議使用新的 calculateSmartExchange
export function calculateSmartComparison(input: PathComparisonInput): PathComparisonResult | null {
    // 轉換為新格式呼叫
    const result = calculateSmartExchange({
        amount: input.amount,
        targetCurrency: input.toCurrency,
        thailandRates: input.thailandRates,
        globalRates: input.globalRates,
    });

    if (!result) return null;

    const planA = result.plans.find(p => p.id === 'A')!;
    const planB = result.plans.find(p => p.id === 'B')!;

    return {
        canDirectExchange: planB.isAvailable,
        directPath: {
            amount: planB.amount,
            steps: planB.steps,
            source: planB.source,
            sourceName: planB.sourceName,
            isAvailable: planB.isAvailable,
        },
        transitPath: {
            amount: planA.amount,
            steps: planA.steps,
            source: planA.source,
            sourceName: planA.sourceName,
        },
        recommendation: result.recommendation === 'B' ? 'direct'
            : result.recommendation === 'A' ? 'transit'
                : 'similar',
        savings: result.savings,
        savingsPercent: result.savingsPercent,
        message: result.disclaimer,
    };
}

