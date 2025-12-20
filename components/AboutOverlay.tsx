import React, { useState } from 'react';
import { X, Heart, ShoppingBag, Users, Headphones, Instagram, Globe, ExternalLink, Copy, Check, Bug } from 'lucide-react';

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
}

type TabType = 'about' | 'collab' | 'more';

export const AboutOverlay: React.FC<AboutOverlayProps> = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState<TabType>('about');
    const [copiedField, setCopiedField] = useState<string | null>(null);

    const handleCopy = async (text: string, field: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedField(field);
            setTimeout(() => setCopiedField(null), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    if (!isOpen) return null;

    const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
        { id: 'about', label: '關於我們', icon: <Users size={16} /> },
        { id: 'collab', label: '合作贊助', icon: <Heart size={16} /> },
        { id: 'more', label: '更多功能', icon: <ShoppingBag size={16} /> },
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
                className="relative w-full max-w-2xl max-h-[85vh] overflow-hidden"
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

                {/* Tab 切換 */}
                <div className="flex justify-center gap-2 px-6 mb-4">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${activeTab === tab.id
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
                <div className="px-6 pb-6 overflow-y-auto max-h-[45vh]">
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
                        <div className="space-y-4 text-gray-700">
                            <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-2xl p-8 shadow-sm border border-orange-100 text-center">
                                <div className="inline-block px-6 py-3 bg-gradient-to-r from-orange-200 to-yellow-200 rounded-full text-orange-700 font-bold text-lg">
                                    🚧 敬請期待 Coming Soon...
                                </div>
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
