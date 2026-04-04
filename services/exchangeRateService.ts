/**
 * 多來源匯率服務
 * 整合 opencli API（台灣銀行、Vietcombank）和全球中間匯率
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

// opencli API 回傳格式
export interface OpenCliForexData {
    fetchedAt: string;
    bot: Array<{ iso: string; cashSell: number }>;      // 台灣銀行現鈔賣出
    twBanksUSD: Array<{ bank: string; usdSell: number }>; // 台灣各銀行 USD 賣出
    vcb: Array<{ iso: string; buy: number }>;           // 越南 Vietcombank 買入外幣
    cached?: boolean;
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
 * 從 opencli API 獲取今日匯率（每天快取一次）
 */
export async function fetchOpenCliRates(): Promise<OpenCliForexData | null> {
    try {
        const res = await fetch('https://opencli-api.liupony2000.workers.dev/api/forex');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json() as OpenCliForexData;
    } catch (e) {
        console.error('opencli forex 錯誤:', e);
        return null;
    }
}

/**
 * 從 ExchangeRate-API 獲取全球中間匯率（用於跨貨幣計算基礎）
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
 * 將 opencli bot 陣列轉成 ExchangeRateData（以 TWD 為基礎）
 *
 * bot[iso].cashSell = 台灣銀行現鈔賣出
 * 意思是：你要付多少 TWD 才能買到 1 單位外幣
 * 例如 { iso: 'USD', cashSell: 32.8 } → 1 美元需付 32.8 台幣
 */
function buildTaiwanRates(
    bot: Array<{ iso: string; cashSell: number }>,
    globalRates: Record<string, number>
): Record<string, ExchangeRateData> {
    const twdRate = globalRates['TWD'] ?? 32.5; // 1 USD = X TWD（全球中間匯率）
    const rates: Record<string, ExchangeRateData> = {};

    for (const { iso, cashSell } of bot) {
        const foreignRate = globalRates[iso];
        if (!foreignRate || cashSell <= 0) continue;

        // midRate：全球中間匯率換算（TWD per 1 外幣）
        const midRate = twdRate / foreignRate;
        const spread = Math.max(cashSell - midRate, 0);

        rates[iso] = {
            currency: iso,
            buyRate: Math.max(midRate - spread * 0.8, midRate * 0.96),
            sellRate: cashSell,  // 台灣銀行現鈔賣出（實際值）
            midRate,
            source: 'taiwan_bank',
            sourceName: '🇹🇼 台灣銀行',
            updatedAt: new Date().toISOString(),
        };
    }

    return rates;
}

/**
 * 根據全球中間匯率和流通性係數估算買賣價（兜底用）
 */
function estimateRates(currency: string, midRate: number): ExchangeRateData {
    const spread = CURRENCY_SPREAD[currency] || 0.03;
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
 *
 * 優先使用 opencli API（台灣銀行真實現鈔賣出）
 * 搭配 ExchangeRate-API 全球中間匯率做跨幣計算
 */
export async function getAllRates(_botApiKey?: string): Promise<{
    taiwanRates: Record<string, ExchangeRateData>;
    thailandRates: Record<string, ExchangeRateData>;
    globalRates: Record<string, number>;
    estimatedRates: Record<string, ExchangeRateData>;
    twBanksUSD: Array<{ bank: string; usdSell: number }>;
    vcbRates: Record<string, number>;
    lastUpdate: string;
}> {
    // 平行抓取
    const [openCliData, globalData] = await Promise.all([
        fetchOpenCliRates(),
        fetchGlobalRates(),
    ]);

    // 建立台灣銀行匯率（用 opencli bot 資料）
    const taiwanRates = openCliData
        ? buildTaiwanRates(openCliData.bot, globalData.rates)
        : {};

    // Vietcombank 買入外幣（以 iso 為 key，value = 1 外幣可換多少 VND）
    const vcbRates: Record<string, number> = {};
    if (openCliData?.vcb) {
        for (const { iso, buy } of openCliData.vcb) {
            vcbRates[iso] = buy;
        }
    }

    // 為沒有台灣銀行資料的貨幣建立估算值
    const estimatedRates: Record<string, ExchangeRateData> = {};
    for (const [currency, rate] of Object.entries(globalData.rates)) {
        if (!taiwanRates[currency]) {
            estimatedRates[currency] = estimateRates(currency, rate);
        }
    }

    return {
        taiwanRates,
        thailandRates: {},  // 已整合到 taiwanRates，不再單獨使用
        globalRates: globalData.rates,
        estimatedRates,
        twBanksUSD: openCliData?.twBanksUSD ?? [],
        vcbRates,
        lastUpdate: openCliData?.fetchedAt ?? globalData.lastUpdate,
    };
}

// ── 智能換匯比較 ──────────────────────────────────────────────────────────────

export interface SmartExchangeInput {
    amount: number;           // 台幣金額
    targetCurrency: string;   // 目標貨幣（如 THB、VND）
    taiwanRates: Record<string, ExchangeRateData>;
    thailandRates: Record<string, ExchangeRateData>;
    globalRates: Record<string, number>;
    vcbRates?: Record<string, number>;
    // 台灣各銀行 USD 現鈔賣出（用來找最優 USD 換匯銀行）
    twBanksUSD?: Array<{ bank: string; usdSell: number }>;
}

export interface ExchangePlan {
    id: 'A' | 'B' | 'C';
    name: string;
    description: string;
    steps: string[];
    amount: number;
    source: RateSource;
    sourceName: string;
    isAvailable: boolean;
    errorMargin: string;
}

export interface SmartExchangeResult {
    plans: ExchangePlan[];
    recommendation: 'A' | 'B' | 'C' | null;
    worstPlanId: 'A' | 'B' | 'C' | null;
    bestPlan: ExchangePlan | null;
    savings: number;
    savingsPercent: number;
    disclaimer: string;
    breakeven: {
        rate: number;
        currency: string;
        tip: string;
        referenceUrl: string;
    } | null;
}

// 取得貨幣的估算損失率
function getSpreadRate(currency: string, hasOfficialRate: boolean): number {
    if (hasOfficialRate) {
        return CURRENCY_SPREAD[currency] || 0.015;
    }
    return (CURRENCY_SPREAD[currency] || 0.025) * 1.5;
}

export function calculateSmartExchange(input: SmartExchangeInput): SmartExchangeResult | null {
    const { amount, targetCurrency, taiwanRates, globalRates, vcbRates, twBanksUSD } = input;

    if (!globalRates['TWD'] || !globalRates[targetCurrency]) {
        return null;
    }

    if (targetCurrency === 'USD' || targetCurrency === 'TWD') {
        return null;
    }

    const plans: ExchangePlan[] = [];

    // ========== 方案 A：台灣換 USD → 當地換 ==========
    // 找最優 USD 賣出銀行（越低越好，代表買美金花最少台幣）
    let bestUsdSell: number | null = null;
    let bestUsdBank = '台灣銀行';

    if (twBanksUSD && twBanksUSD.length > 0) {
        const sorted = [...twBanksUSD].filter(r => r.usdSell > 0).sort((a, b) => a.usdSell - b.usdSell);
        if (sorted.length > 0) {
            bestUsdSell = sorted[0].usdSell;
            bestUsdBank = sorted[0].bank;
        }
    }
    if (!bestUsdSell && taiwanRates['USD']) {
        bestUsdSell = taiwanRates['USD'].sellRate;
    }

    let usdAmount: number;
    if (bestUsdSell) {
        usdAmount = amount / bestUsdSell;
    } else {
        const twdToUsdSpread = getSpreadRate('TWD', false) + getSpreadRate('USD', false);
        usdAmount = amount / globalRates['TWD'] * (1 - twdToUsdSpread);
    }

    let planAAmount: number;
    let planASource: RateSource;
    let planASourceName: string;
    let planAErrorMargin: string;

    if (targetCurrency === 'VND' && vcbRates?.['USD']) {
        // VND 特例：用 Vietcombank 真實買入 USD 匯率 × 0.99（換匯所手續費估算）
        planAAmount = usdAmount * vcbRates['USD'] * 0.99;
        planASource = 'estimated';
        planASourceName = '🇻🇳 Vietcombank';
        planAErrorMargin = '±1-2%';
    } else {
        // 其他貨幣：用全球中間匯率 × 0.99（估算當地換匯手續費）
        const usdToTargetRate = globalRates[targetCurrency];
        planAAmount = usdAmount * usdToTargetRate * 0.99;
        planASource = 'estimated';
        planASourceName = '📊 估算值';
        planAErrorMargin = '±3-5%';
    }

    const planABankNote = bestUsdSell ? `${bestUsdBank} USD ${bestUsdSell.toFixed(2)}` : '';

    plans.push({
        id: 'A',
        name: `方案 A：台灣換美金 → 當地換`,
        description: `在台灣把台幣換成美金（${planABankNote}），帶美金去當地換`,
        steps: ['TWD', 'USD', targetCurrency],
        amount: planAAmount,
        source: planASource,
        sourceName: planASourceName,
        isAvailable: true,
        errorMargin: planAErrorMargin,
    });

    // ========== 方案 B：帶台幣去當地換 ==========
    let planBAmount: number;
    let planBSource: RateSource;
    let planBSourceName: string;
    let planBErrorMargin: string;

    const twdToTargetRate = globalRates[targetCurrency] / globalRates['TWD'];
    const twdToTargetSpread = 0.04; // 台幣在海外通常損失 ~4%
    planBAmount = amount * twdToTargetRate * (1 - twdToTargetSpread);
    planBSource = 'estimated';
    planBSourceName = '📊 估算值';
    planBErrorMargin = '±3-5%';

    plans.push({
        id: 'B',
        name: '方案 B：帶台幣去當地換',
        description: '直接帶台幣去當地的換匯店換成當地貨幣',
        steps: ['TWD', targetCurrency],
        amount: planBAmount,
        source: planBSource,
        sourceName: planBSourceName,
        isAvailable: true,
        errorMargin: planBErrorMargin,
    });

    // ========== 方案 C：台灣直接換當地貨幣 ==========
    let planCAmount: number;
    let planCSource: RateSource;
    let planCSourceName: string;
    let planCErrorMargin: string;
    let planCAvailable: boolean;

    if (taiwanRates[targetCurrency]) {
        // 用台灣銀行真實現鈔賣出價計算
        // sellRate = 付多少 TWD 買 1 外幣，所以 amount TWD 可換 amount / sellRate 外幣
        planCAmount = amount / taiwanRates[targetCurrency].sellRate;
        planCSource = 'taiwan_bank';
        planCSourceName = '🇹🇼 台灣銀行';
        planCErrorMargin = '現鈔賣出價';
        planCAvailable = true;
    } else {
        // 台灣銀行沒有此貨幣，用估算值
        const twdToTargetInTaiwan = globalRates[targetCurrency] / globalRates['TWD'];
        const taiwanSpread = getSpreadRate('TWD', false) + getSpreadRate(targetCurrency, false);
        planCAmount = amount * twdToTargetInTaiwan * (1 - taiwanSpread);
        planCSource = 'estimated';
        planCSourceName = '📊 估算值';
        planCErrorMargin = '±2-4%';
        planCAvailable = ['USD', 'JPY', 'EUR', 'HKD', 'GBP', 'AUD', 'SGD', 'CNY', 'THB'].includes(targetCurrency);
    }

    plans.push({
        id: 'C',
        name: '方案 C：在台灣直接換',
        description: '在台灣的銀行或機場直接換成當地貨幣',
        steps: ['TWD', targetCurrency],
        amount: planCAmount,
        source: planCSource,
        sourceName: planCSourceName,
        isAvailable: planCAvailable,
        errorMargin: planCErrorMargin,
    });

    // ========== 找出最佳 / 最差方案 ==========
    const availablePlans = plans.filter(p => p.isAvailable);
    const bestByAmount = availablePlans.reduce((best, plan) =>
        plan.amount > best.amount ? plan : best, availablePlans[0]);
    const worstPlan = availablePlans.reduce((worst, plan) =>
        plan.amount < worst.amount ? plan : worst, availablePlans[0]);

    const savings = bestByAmount.amount - worstPlan.amount;
    const savingsPercent = (savings / worstPlan.amount) * 100;

    // ========== 方便性修正：差距 < 2% 時優先推薦 C（台灣直換最省事）==========
    const planCResult = plans.find(p => p.id === 'C');
    let recommendation: 'A' | 'B' | 'C' | null = bestByAmount?.id ?? null;
    if (planCResult?.isAvailable && bestByAmount && bestByAmount.id !== 'C') {
        const CONVENIENCE_THRESHOLD = 0.98; // 方案C 能換到的 >= 最佳的 98%，選 C
        if (planCResult.amount >= bestByAmount.amount * CONVENIENCE_THRESHOLD) {
            recommendation = 'C';
        }
    }
    const bestPlan = plans.find(p => p.id === recommendation) ?? bestByAmount;

    // ========== 損益平衡點 ==========
    const planA = plans.find(p => p.id === 'A')!;
    const breakevenRate = planA.amount / amount;

    const currencyInfo: Record<string, { url: string; tip: string }> = {
        THB: {
            url: 'https://www.superrichthailand.com/#!/en',
            tip: `去 SuperRich 或 TT Exchange 查 TWD 賣出價，若 > ${breakevenRate.toFixed(3)} 選方案 B，否則選方案 A`,
        },
        VND: {
            url: 'https://www.vietcombank.com.vn/en/Personal/Cong-cu-Tien-ich/Ty-gia',
            tip: `越南銀行通常不收台幣，建議選方案 A（帶 USD 去越南換）`,
        },
        PHP: {
            url: 'https://www.bsp.gov.ph/SitePages/Statistics/ExchangeRate.aspx',
            tip: `菲律賓換匯店若有 TWD 匯率 > ${breakevenRate.toFixed(2)} 選方案 B，否則選方案 A`,
        },
        JPY: {
            url: 'https://www.gpa-net.co.jp/exchange/',
            tip: `日本機場換匯店若有 TWD 匯率 > ${breakevenRate.toFixed(2)} 選方案 B，否則選方案 A`,
        },
        KRW: {
            url: 'https://www.kebhana.com/cms/rate/index.do',
            tip: `韓國換匯店若有 TWD 匯率 > ${breakevenRate.toFixed(2)} 選方案 B，否則選方案 A`,
        },
        IDR: {
            url: 'https://www.bi.go.id/en/statistik/informasi-kurs/transaksi-bi/default.aspx',
            tip: `印尼銀行通常不收台幣，建議選方案 A（帶 USD 去印尼換）`,
        },
    };

    const info = currencyInfo[targetCurrency] ?? {
        url: 'https://www.x-rates.com/',
        tip: `查詢當地換匯店 TWD → ${targetCurrency} 匯率，若 > ${breakevenRate.toFixed(2)} 選方案 B，否則選方案 A`,
    };

    const disclaimer = taiwanRates[targetCurrency]
        ? '⚠️ 方案C使用台灣銀行今日現鈔賣出牌告價，其餘為估算值（±3-5%）。實際匯率依當天各銀行為準。'
        : '⚠️ 以上為參考值，使用全球中間匯率估算。實際匯率依當地換匯店為準，落差約 ±2-5%。';

    return {
        plans,
        recommendation,
        worstPlanId: availablePlans.length > 1 ? (worstPlan?.id ?? null) : null,
        bestPlan,
        savings,
        savingsPercent,
        disclaimer,
        breakeven: {
            rate: breakevenRate,
            currency: targetCurrency,
            tip: info.tip,
            referenceUrl: info.url,
        },
    };
}

// ── 舊介面保留（向下相容）────────────────────────────────────────────────────

export interface MultiSourceRates {
    baseCurrency: string;
    rates: Record<string, ExchangeRateData>;
    lastUpdated: string;
}

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

export function calculateSmartComparison(input: PathComparisonInput): PathComparisonResult | null {
    const result = calculateSmartExchange({
        amount: input.amount,
        targetCurrency: input.toCurrency,
        taiwanRates: input.taiwanRates,
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
