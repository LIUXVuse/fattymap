import React, { useState, useMemo } from 'react';
import { Memory } from '../types';
import { MapPin, Image as ImageIcon, ChevronRight, ArrowLeft, Globe, List, Building2, Edit2, Trash2, MessageCircle } from 'lucide-react';

interface MemoryFeedProps {
  memories: Memory[];
  onFocusLocation: (lat: number, lng: number) => void;
  onEdit?: (memory: Memory) => void;
  onDelete?: (id: string) => void;
  currentUserId?: string;
  isAdmin?: boolean; // 新增 Admin 權限判斷
  onViewComments: (memoryId: string) => void;
}

type ViewMode = 'countries' | 'areas' | 'categories' | 'posts';

export const MemoryFeed: React.FC<MemoryFeedProps> = ({ memories, onFocusLocation, onEdit, onDelete, currentUserId, isAdmin, onViewComments }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('countries');
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

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

  // Header Rendering
  const renderHeader = () => {
      if (viewMode === 'countries') {
          return (
            <div className="p-6 border-b border-gray-200 bg-gray-50">
                <h1 className="text-xl font-black text-gray-800 leading-tight">
                肥宅老司機<br/>
                <span className="text-blue-600">前進世界地圖</span>
                </h1>
                <p className="text-gray-500 text-xs mt-2 font-medium">
                選擇區域開始探索
                </p>
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
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
              <button onClick={goBack} className="p-2 hover:bg-gray-200 rounded-full text-gray-600 transition-colors">
                  <ArrowLeft size={20} />
              </button>
              <div className="overflow-hidden">
                  <h2 className="font-bold text-gray-800 text-lg truncate" title={title || ''}>{title}</h2>
                  <p className="text-xs text-gray-500 truncate">
                      {subtitle}
                  </p>
              </div>
          </div>
      );
  };

  return (
    <div className="h-full flex flex-col bg-white/95 backdrop-blur-xl border-r border-gray-200 shadow-xl">
      {renderHeader()}

      <div className="flex-1 overflow-y-auto p-4 space-y-3 scroll-smooth bg-gray-50">
        
        {/* VIEW 1: COUNTRIES LIST */}
        {viewMode === 'countries' && (
            <div className="space-y-2">
                {countryStats.length === 0 ? (
                     <div className="text-center text-gray-400 py-10">地圖上還沒有任何足跡</div>
                ) : (
                    countryStats.map(([country, count]) => (
                        <div 
                            key={country}
                            onClick={() => handleCountrySelect(country)}
                            className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:border-blue-300 hover:shadow-md cursor-pointer transition-all flex justify-between items-center group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                                    <Globe size={20} />
                                </div>
                                <span className="font-bold text-gray-700">{country}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-bold">{count}</span>
                                <ChevronRight size={16} className="text-gray-400 group-hover:text-blue-500" />
                            </div>
                        </div>
                    ))
                )}
            </div>
        )}

        {/* VIEW 2: AREAS LIST */}
        {viewMode === 'areas' && (
            <div className="space-y-2">
                 {areaStats.map(([area, count]) => (
                    <div 
                        key={area}
                        onClick={() => handleAreaSelect(area)}
                        className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:border-green-300 hover:shadow-md cursor-pointer transition-all flex justify-between items-center group"
                    >
                         <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                                <Building2 size={20} />
                            </div>
                            <span className="font-bold text-gray-700">{area}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-bold">{count}</span>
                            <ChevronRight size={16} className="text-gray-400 group-hover:text-green-500" />
                        </div>
                    </div>
                 ))}
            </div>
        )}

        {/* VIEW 3: CATEGORIES LIST */}
        {viewMode === 'categories' && (
            <div className="space-y-2">
                 {categoryStatsInArea.map(([cat, count]) => (
                    <div 
                        key={cat}
                        onClick={() => handleCategorySelect(cat)}
                        className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:border-orange-300 hover:shadow-md cursor-pointer transition-all flex justify-between items-center group"
                    >
                         <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
                                <List size={20} />
                            </div>
                            <span className="font-bold text-gray-700">{cat}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-bold">{count}</span>
                            <ChevronRight size={16} className="text-gray-400 group-hover:text-orange-500" />
                        </div>
                    </div>
                 ))}
            </div>
        )}

        {/* VIEW 4: POSTS LIST */}
        {viewMode === 'posts' && (
             <>
             {filteredMemories.map(memory => {
                 // 權限判斷：本人 或 管理員 可以編輯/刪除
                 const canEdit = isAdmin || (currentUserId && memory.creatorId === currentUserId);

                 return (
                    <div 
                        key={memory.id} 
                        className="bg-white hover:bg-gray-50 border border-gray-200 hover:border-blue-300 rounded-xl p-4 transition-all group shadow-sm hover:shadow-md relative"
                    >
                    <div className="cursor-pointer" onClick={() => onFocusLocation(memory.location.lat, memory.location.lng)}>
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
                                         <div className="w-full h-full bg-gray-300 flex items-center justify-center text-white"><Globe size={14}/></div>
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
                                            className="text-[10px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-0.5"
                                        >
                                            編輯
                                        </button>
                                        <span className="text-gray-300 text-[10px]">/</span>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); onDelete && onDelete(memory.id); }}
                                            className="text-[10px] text-red-500 hover:text-red-700 font-bold flex items-center gap-0.5"
                                        >
                                            刪除
                                        </button>
                                        <span className="text-gray-300 text-[10px]">|</span>
                                        </>
                                    )}
                                    
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); onViewComments(memory.id); }}
                                        className="text-[10px] text-gray-500 hover:text-gray-800 font-bold flex items-center gap-0.5"
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
                            <div className="relative w-full h-32 rounded-lg overflow-hidden mb-3 border border-gray-200">
                                <img src={memory.photos[0]} alt="memory" className="w-full h-full object-cover" />
                            </div>
                        )}
                    </div>
                    </div>
                 );
             })}
             </>
        )}

      </div>
      
      <div className="p-3 border-t border-gray-200 text-center text-[10px] text-gray-400 bg-white">
        {viewMode === 'posts' ? `${filteredMemories.length} 則回憶` : '分區導覽模式'}
      </div>
    </div>
  );
};