import React, { useState, useMemo, useEffect } from 'react';
import { Memory } from '../types';
import { MapPin, Image as ImageIcon, ChevronRight, ArrowLeft, Globe, List, Building2, Edit2, Trash2, MessageCircle, Map as MapIcon, Dices } from 'lucide-react';

interface MemoryFeedProps {
    memories: Memory[];
    onFocusLocation: (lat: number, lng: number, memoryId?: string) => void;
    onEdit?: (memory: Memory) => void;
    onDelete?: (id: string) => void;
    currentUserId?: string;
    isAdmin?: boolean; // 新增 Admin 權限判斷
    onViewComments: (memoryId: string) => void;
    syncToMemory?: Memory | null; // 當點擊地圖圖釘時同步導航
}

type ViewMode = 'countries' | 'areas' | 'categories' | 'posts';

export const MemoryFeed: React.FC<MemoryFeedProps> = ({ memories, onFocusLocation, onEdit, onDelete, currentUserId, isAdmin, onViewComments, syncToMemory }) => {
    const [viewMode, setViewMode] = useState<ViewMode>('countries');
    const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
    const [selectedArea, setSelectedArea] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    // 當外部傳入 syncToMemory 時，自動導航到該回憶所在位置並滾動到對應卡片
    useEffect(() => {
        if (syncToMemory) {
            setSelectedCountry(syncToMemory.region.country || "其他");
            setSelectedArea(syncToMemory.region.area || "未知區域");
            setSelectedCategory(syncToMemory.category.main);
            setViewMode('posts');

            // 延遲滾動，等待 DOM 更新完成
            setTimeout(() => {
                const element = document.getElementById(`memory-card-${syncToMemory.id}`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    // 加入高亮動畫
                    element.classList.add('ring-2', 'ring-blue-500', 'ring-offset-2');
                    setTimeout(() => {
                        element.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-2');
                    }, 2000);
                }
            }, 300);
        }
    }, [syncToMemory]);

    // 1. 整理出所有國家清單與數量
    const countryStats = useMemo(() => {
        const stats: Record<string, number> = {};
        memories.forEach(m => {
            const c = m.region.country || "其他";
            stats[c] = (stats[c] || 0) + 1;
        });
        return Object.entries(stats).sort((a, b) => b[1] - a[1]);
    }, [memories]);

    // 2. 根據選定國家，整理出該國家的城市/區域清單
    const areaStats = useMemo(() => {
        if (!selectedCountry) return [];
        const stats: Record<string, number> = {};
        memories
            .filter(m => (m.region.country || "其他") === selectedCountry)
            .forEach(m => {
                const area = m.region.area || "未知區域";
                stats[area] = (stats[area] || 0) + 1;
            });
        return Object.entries(stats).sort((a, b) => b[1] - a[1]);
    }, [memories, selectedCountry]);

    // 3. 根據選定區域，整理出該區域的分類清單
    const categoryStatsInArea = useMemo(() => {
        if (!selectedCountry || !selectedArea) return [];
        const stats: Record<string, number> = {};
        memories
            .filter(m =>
                (m.region.country || "其他") === selectedCountry &&
                (m.region.area || "未知區域") === selectedArea
            )
            .forEach(m => {
                const cat = m.category.main;
                stats[cat] = (stats[cat] || 0) + 1;
            });
        return Object.entries(stats).sort((a, b) => b[1] - a[1]);
    }, [memories, selectedCountry, selectedArea]);

    // 4. 最後的文章列表
    const filteredMemories = useMemo(() => {
        if (!selectedCountry || !selectedArea || !selectedCategory) return [];
        return memories
            .filter(m =>
                (m.region.country || "其他") === selectedCountry &&
                (m.region.area || "未知區域") === selectedArea &&
                m.category.main === selectedCategory
            )
            .sort((a, b) => b.timestamp - a.timestamp);
    }, [memories, selectedCountry, selectedArea, selectedCategory]);

    const handleCountrySelect = (country: string) => {
        setSelectedCountry(country);
        setViewMode('areas');
    };

    const handleAreaSelect = (area: string) => {
        setSelectedArea(area);
        setViewMode('categories');
    };

    const handleCategorySelect = (category: string) => {
        setSelectedCategory(category);
        setViewMode('posts');
    };

    const goBack = () => {
        if (viewMode === 'posts') {
            setViewMode('categories');
            setSelectedCategory(null);
        } else if (viewMode === 'categories') {
            setViewMode('areas');
            setSelectedArea(null);
        } else if (viewMode === 'areas') {
            setViewMode('countries');
            setSelectedCountry(null);
        }
    };

    // 隨機探索功能
    const handleRandomExplore = () => {
        if (memories.length === 0) {
            alert("目前地圖上還沒有任何回憶喔！");
            return;
        }

        // 1. 隨機選取一個回憶
        const randomIndex = Math.floor(Math.random() * memories.length);
        const randomMemory = memories[randomIndex];

        // 2. 移動地圖並自動展開圖釘
        onFocusLocation(randomMemory.location.lat, randomMemory.location.lng, randomMemory.id);

        // 3. 強制切換側邊欄狀態，進入該文章所在的列表
        setSelectedCountry(randomMemory.region.country || "其他");
        setSelectedArea(randomMemory.region.area || "未知區域");
        setSelectedCategory(randomMemory.category.main);
        setViewMode('posts');
    };

    // Header Rendering
    const renderHeader = () => {
        if (viewMode === 'countries') {
            return (
                <div
                    className="relative w-full h-56 shrink-0 group overflow-hidden bg-gray-900 cursor-pointer"
                    onClick={handleRandomExplore}
                    title="點擊隨機探索一個回憶"
                >
                    {/* 
                   使用外部圖床的圖片
                */}
                    <img
                        src="https://i.meee.com.tw/Xo1WINx.jpg"
                        alt="Travel Banner"
                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-90 group-hover:opacity-100"
                    />

                    {/* 隨機探索提示 (Hover 時顯示更明顯) */}
                    <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md border border-white/30 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0">
                        <Dices size={14} /> 隨機傳送
                    </div>

                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/30 to-transparent flex flex-col justify-end p-6">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">
                                Interactive Map
                            </div>
                        </div>
                        <h1 className="text-2xl font-black text-white leading-tight drop-shadow-lg tracking-tight group-hover:scale-[1.02] transition-transform origin-bottom-left">
                            肥宅老司機<br />
                            <span className="text-blue-300">前進世界地圖</span>
                        </h1>
                        <p className="text-gray-200 text-xs mt-2 font-medium drop-shadow-md flex items-center gap-1.5 opacity-90">
                            <Dices size={14} className="text-blue-300 animate-pulse" />
                            點擊圖片開始隨機冒險
                        </p>
                    </div>
                </div>
            );
        }

        let title = selectedCountry;
        let subtitle = '請選擇城市/區域';

        if (viewMode === 'categories') {
            title = `${selectedCountry} > ${selectedArea}`;
            subtitle = '請選擇分類';
        } else if (viewMode === 'posts') {
            title = `${selectedArea} > ${selectedCategory}`;
            subtitle = '最新心得';
        }

        return (
            <div className="p-4 border-b border-gray-200 bg-white/50 backdrop-blur-md flex items-center gap-3 sticky top-0 z-10">
                <button onClick={goBack} className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors border border-gray-200 shadow-sm bg-white">
                    <ArrowLeft size={18} />
                </button>
                <div className="flex-1 overflow-hidden">
                    <h2 className="font-bold text-gray-800 text-lg truncate" title={title || ''}>{title}</h2>
                    <p className="text-xs text-gray-500 truncate flex items-center gap-1">
                        {subtitle}
                    </p>
                </div>
                {/* 隨機探索按鈕 - 老司機帶你遊世界 */}
                <button
                    onClick={handleRandomExplore}
                    className="shrink-0 w-10 h-10 rounded-full overflow-hidden border-2 border-blue-400 hover:border-blue-600 shadow-md hover:shadow-lg transition-all hover:scale-110 active:scale-95 group"
                    title="🎲 老司機帶你遊世界"
                >
                    <img
                        src="https://i.meee.com.tw/Xo1WINx.jpg"
                        alt="隨機探索"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                </button>
            </div>
        );
    };

    return (
        <div className="h-full flex flex-col bg-white/95 backdrop-blur-xl border-r border-gray-200 shadow-xl font-sans">
            {renderHeader()}

            <div className="flex-1 overflow-y-auto p-4 space-y-3 scroll-smooth bg-gray-50">

                {/* VIEW 1: COUNTRIES LIST */}
                {viewMode === 'countries' && (
                    <div className="space-y-2">
                        {countryStats.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-3">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                                    <MapPin size={24} className="text-gray-300" />
                                </div>
                                <p className="text-sm">地圖上還沒有任何足跡</p>
                                <p className="text-xs text-gray-400">點擊地圖開始新增</p>
                            </div>
                        ) : (
                            countryStats.map(([country, count]) => (
                                <div
                                    key={country}
                                    onClick={() => handleCountrySelect(country)}
                                    className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:border-blue-300 hover:shadow-md cursor-pointer transition-all flex justify-between items-center group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                                            <Globe size={20} />
                                        </div>
                                        <span className="font-bold text-gray-700">{country}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full text-xs font-bold min-w-[1.5rem] text-center">{count}</span>
                                        <ChevronRight size={16} className="text-gray-300 group-hover:text-blue-500 transition-colors" />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* VIEW 2: AREAS LIST */}
                {viewMode === 'areas' && (
                    <div className="space-y-2 animate-in slide-in-from-right-4 duration-300">
                        {areaStats.map(([area, count]) => (
                            <div
                                key={area}
                                onClick={() => handleAreaSelect(area)}
                                className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:border-green-300 hover:shadow-md cursor-pointer transition-all flex justify-between items-center group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center border border-green-100">
                                        <Building2 size={20} />
                                    </div>
                                    <span className="font-bold text-gray-700">{area}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full text-xs font-bold min-w-[1.5rem] text-center">{count}</span>
                                    <ChevronRight size={16} className="text-gray-300 group-hover:text-green-500 transition-colors" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* VIEW 3: CATEGORIES LIST */}
                {viewMode === 'categories' && (
                    <div className="space-y-2 animate-in slide-in-from-right-4 duration-300">
                        {categoryStatsInArea.map(([cat, count]) => (
                            <div
                                key={cat}
                                onClick={() => handleCategorySelect(cat)}
                                className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:border-orange-300 hover:shadow-md cursor-pointer transition-all flex justify-between items-center group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-100">
                                        <List size={20} />
                                    </div>
                                    <span className="font-bold text-gray-700">{cat}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full text-xs font-bold min-w-[1.5rem] text-center">{count}</span>
                                    <ChevronRight size={16} className="text-gray-300 group-hover:text-orange-500 transition-colors" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* VIEW 4: POSTS LIST */}
                {viewMode === 'posts' && (
                    <div className="animate-in slide-in-from-right-4 duration-300 space-y-3">
                        {filteredMemories.map(memory => {
                            // 權限判斷：本人 或 管理員 可以編輯/刪除
                            const canEdit = isAdmin || (currentUserId && memory.creatorId === currentUserId);

                            return (
                                <div
                                    id={`memory-card-${memory.id}`}
                                    key={memory.id}
                                    className="bg-white hover:bg-gray-50 border border-gray-200 hover:border-blue-300 rounded-xl p-4 transition-all group shadow-sm hover:shadow-md relative"
                                >
                                    <div className="cursor-pointer" onClick={() => onFocusLocation(memory.location.lat, memory.location.lng, memory.id)}>
                                        <div className="flex gap-1 mb-2">
                                            <span
                                                className="px-2 py-0.5 rounded text-[10px] font-bold text-white shadow-sm"
                                                style={{ backgroundColor: memory.markerColor }}
                                            >
                                                {memory.category.main}
                                            </span>
                                            {memory.category.sub && (
                                                <span className="px-2 py-0.5 rounded text-[10px] bg-gray-100 text-gray-600 border border-gray-200">
                                                    {memory.category.sub}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-100 shadow-sm">
                                                    {memory.isAnonymous ? (
                                                        <div className="w-full h-full bg-gray-300 flex items-center justify-center text-white"><Globe size={14} /></div>
                                                    ) : memory.authorAvatar ? (
                                                        <img src={memory.authorAvatar} alt="avatar" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div
                                                            className="w-full h-full flex items-center justify-center text-white text-xs font-bold"
                                                            style={{ backgroundColor: memory.markerColor }}
                                                        >
                                                            {memory.author.charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-gray-800">
                                                        {memory.isAnonymous ? '匿名老司機' : memory.author}
                                                    </span>
                                                    <span className="text-[10px] text-gray-500">
                                                        {new Date(memory.timestamp).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mb-3 pl-1">
                                            <div className="flex justify-between items-start gap-2">
                                                <h4
                                                    className="font-bold text-gray-700 text-sm mb-1 flex items-center gap-1.5 flex-1"
                                                >
                                                    <MapPin size={14} style={{ color: memory.markerColor }} />
                                                    <span className="line-clamp-1">{memory.location.name || "未命名地點"}</span>
                                                </h4>

                                                <div className="flex items-center gap-2 shrink-0">
                                                    {canEdit && (
                                                        <>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); onEdit && onEdit(memory); }}
                                                                className="text-[10px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-0.5 p-1 hover:bg-blue-50 rounded"
                                                            >
                                                                <Edit2 size={12} />
                                                            </button>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); onDelete && onDelete(memory.id); }}
                                                                className="text-[10px] text-red-500 hover:text-red-700 font-bold flex items-center gap-0.5 p-1 hover:bg-red-50 rounded"
                                                            >
                                                                <Trash2 size={12} />
                                                            </button>
                                                            <span className="text-gray-300 text-[10px]">|</span>
                                                        </>
                                                    )}

                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); onViewComments(memory.id); }}
                                                        className="text-[10px] text-gray-500 hover:text-gray-800 font-bold flex items-center gap-0.5 hover:bg-gray-100 p-1 rounded"
                                                    >
                                                        <MessageCircle size={12} /> 留言
                                                    </button>
                                                </div>
                                            </div>

                                            <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
                                                {memory.content}
                                            </p>
                                        </div>

                                        {memory.photos.length > 0 && (
                                            <div className="mb-3">
                                                {memory.photos.length === 1 ? (
                                                    <div className="relative w-full h-32 rounded-lg overflow-hidden border border-gray-200">
                                                        <img src={memory.photos[0]} alt="memory" className="w-full h-full object-cover" />
                                                    </div>
                                                ) : (
                                                    <div className="relative">
                                                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300">
                                                            {memory.photos.map((photo, idx) => (
                                                                <div
                                                                    key={idx}
                                                                    className="relative w-28 h-28 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0"
                                                                >
                                                                    <img src={photo} alt={`memory-${idx + 1}`} className="w-full h-full object-cover" />
                                                                    <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                                                                        {idx + 1}/{memory.photos.length}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        {/* 滾動提示 */}
                                                        {memory.photos.length > 2 && (
                                                            <div className="absolute right-0 top-1/2 -translate-y-1/2 bg-gradient-to-l from-white via-white/80 to-transparent pr-1 pl-4 py-6 pointer-events-none">
                                                                <ChevronRight size={20} className="text-gray-400 animate-pulse" />
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

            </div>

            <div className="p-3 border-t border-gray-200 text-center text-[10px] text-gray-400 bg-white">
                {viewMode === 'posts' ? `${filteredMemories.length} 則回憶` : '分區導覽模式'}
            </div>
        </div>
    );
};