import React, { useState, useEffect } from 'react';
import { X, MapPin, Image as ImageIcon, Check, Palette, Globe, Edit3, Loader2, Plus, Trash2, ChevronRight, Grid } from 'lucide-react';
import { Location, MarkerColor, CategoryNode, RegionInfo, MarkerIconType, Memory } from '../types';
import { findPlaceDetails } from '../services/mapService';
import { ICON_MAP } from './MapContainer';

interface MemoryModalProps {
  location: Location;
  categories: CategoryNode[];
  initialData?: Memory; // 新增：用於編輯模式
  onClose: () => void;
  onSubmit: (data: { author: string; isAnonymous: boolean; content: string; photos: string[]; location: Location; markerColor: MarkerColor; markerIcon?: MarkerIconType; category: { main: string, sub?: string }, region: RegionInfo }) => void;
  onAddCategory: (name: string, parentId: string | null) => void;
  onDeleteCategory: (id: string) => void;
  currentUser: string; 
}

// 靜態分類定義
const ICON_CATEGORIES = {
    "人物/心情": ['user', 'user_round', 'users', 'baby', 'smile', 'laugh', 'sad', 'meh', 'skull', 'ghost', 'eye', 'ear', 'hand'],
    "餐飲/夜生活": ['food', 'coffee', 'beer', 'wine', 'martini', 'pizza', 'cake', 'icecream', 'mic', 'megaphone'],
    "住宿": ['bed', 'tent', 'hotel', 'castle', 'home', 'key'],
    "交通": ['train', 'bus', 'car', 'plane', 'bike', 'ship', 'anchor', 'rocket', 'fuel', 'walk'],
    "購物": ['shopping', 'cart', 'gift', 'card', 'money', 'tag', 'store', 'gem'],
    "自然/冒險": ['tree', 'mountain', 'flower', 'leaf', 'sun', 'rain', 'snow', 'fire', 'water', 'wind', 'beach', 'umbrella', 'waves', 'sword', 'shield'],
    "設施": ['wifi', 'bath', 'parking', 'restroom', 'hospital', 'library', 'school', 'office', 'work', 'museum', 'lock', 'unlock'],
    "其他": ['flag', 'bell', 'info', 'alert', 'crown', 'zap', 'bomb', 'sparkles']
};

// 預設的常用圖示列表
const DEFAULT_RECENT_ICONS = ['default', 'food', 'coffee', 'camera', 'star', 'heart', 'smile'];

export const MemoryModal: React.FC<MemoryModalProps> = ({ 
    location: initialLocation, 
    categories,
    initialData,
    onClose, 
    onSubmit,
    onAddCategory,
    onDeleteCategory,
    currentUser
}) => {
  const [author, setAuthor] = useState(currentUser || '老司機');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [content, setContent] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  
  // 顏色、圖示與分類狀態
  const [markerColor, setMarkerColor] = useState<MarkerColor>('#ef4444');
  const [markerIcon, setMarkerIcon] = useState<MarkerIconType>('default');
  const [showIconPicker, setShowIconPicker] = useState(false);
  
  // **NEW: 常用圖示狀態**
  const [recentIcons, setRecentIcons] = useState<string[]>(DEFAULT_RECENT_ICONS);

  const [selectedIconCategory, setSelectedIconCategory] = useState<keyof typeof ICON_CATEGORIES>("人物/心情");
  
  const [selectedMainCatId, setSelectedMainCatId] = useState<string>('');
  const [selectedSubCatId, setSelectedSubCatId] = useState<string>('');
  const [isAddingCategory, setIsAddingCategory] = useState<{ type: 'main' | 'sub', parentId?: string } | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  
  // 可編輯的地點與區域資訊
  const [currentLocation, setCurrentLocation] = useState<Location>(initialLocation);
  const [region, setRegion] = useState<RegionInfo>({ country: '', area: '' });
  const [isLoadingDetails, setIsLoadingDetails] = useState(true);

  // 初始化資料 (編輯模式)
  useEffect(() => {
    if (initialData) {
        setAuthor(initialData.author);
        setIsAnonymous(initialData.isAnonymous);
        setContent(initialData.content);
        setPhotos(initialData.photos);
        setMarkerColor(initialData.markerColor);
        setMarkerIcon(initialData.markerIcon || 'default');
        
        // 如果目前圖示不在常用列表中，把它加進去
        if (initialData.markerIcon && !DEFAULT_RECENT_ICONS.includes(initialData.markerIcon)) {
             setRecentIcons(prev => {
                 const filtered = prev.filter(k => k !== initialData.markerIcon);
                 return [initialData.markerIcon!, ...filtered].slice(0, 6);
             });
        }

        setCurrentLocation(initialData.location);
        setRegion(initialData.region);
        
        // 設定分類
        const main = categories.find(c => c.name === initialData.category.main);
        if (main) {
            setSelectedMainCatId(main.id);
            if (initialData.category.sub) {
                const sub = main.children?.find(c => c.name === initialData.category.sub);
                if (sub) setSelectedSubCatId(sub.id);
            }
        }
        setIsLoadingDetails(false);
    }
  }, [initialData, categories]);

  // 初始化地點資訊 (自動抓取) - 僅在非編輯模式下執行，避免覆蓋舊資料
  useEffect(() => {
    if (initialData) return; // 如果是編輯模式，不重新抓取

    const identify = async () => {
        setIsLoadingDetails(true);
        if (initialLocation.address && initialLocation.name && initialLocation.name !== 'Coordinates') {
            setIsLoadingDetails(false);
            try {
                 const details = await findPlaceDetails(initialLocation.lat, initialLocation.lng);
                 if (details) {
                     setRegion(details.region);
                 }
            } catch(e) { console.error(e) }
            return;
        }

        try {
            const details = await findPlaceDetails(initialLocation.lat, initialLocation.lng);
            if (details) {
                setCurrentLocation(prev => ({
                    ...prev,
                    name: details.name,
                    address: details.address,
                    googleMapsUri: details.uri
                }));
                setRegion(details.region);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoadingDetails(false);
        }
    };
    identify();
  }, [initialLocation, initialData]);

  // 設定預設分類 (僅在新增模式且未選擇時)
  useEffect(() => {
      if (!initialData && categories.length > 0 && !selectedMainCatId) {
          setSelectedMainCatId(categories[0].id);
      }
  }, [categories, selectedMainCatId, initialData]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      Array.from(e.target.files).forEach((file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPhotos(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleAddCategorySubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (newCategoryName.trim()) {
          const parentId = isAddingCategory?.type === 'sub' ? selectedMainCatId : null;
          onAddCategory(newCategoryName, parentId);
          setNewCategoryName('');
          setIsAddingCategory(null);
      }
  };

  // **NEW: 處理圖示選擇，並將其加入「常用」列表**
  const handleIconSelect = (iconKey: string) => {
      setMarkerIcon(iconKey);
      setRecentIcons(prev => {
          // 移除已存在的 (避免重複)，然後將新的加到最前面
          const filtered = prev.filter(k => k !== iconKey);
          // 保持列表長度為 6 個
          return [iconKey, ...filtered].slice(0, 6);
      });
      setShowIconPicker(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const mainCat = categories.find(c => c.id === selectedMainCatId);
    const subCat = mainCat?.children?.find(c => c.id === selectedSubCatId);

    if (!mainCat) {
        alert("請選擇一個分類");
        return;
    }
    
    const finalRegion = {
        country: region.country || "未知國度",
        area: region.area || "未知區域"
    };

    onSubmit({ 
        author,
        isAnonymous,
        content, 
        photos, 
        location: currentLocation, 
        markerColor,
        markerIcon,
        category: {
            main: mainCat.name,
            sub: subCat?.name
        },
        region: finalRegion
    });
  };

  const presetColors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <MapPin size={20} className="text-red-500" />
            {initialData ? '編輯回憶' : '標記這個地點'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-200 rounded-full">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 relative">
          
          {/* Region Info */}
          <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 p-2 rounded-lg border border-gray-100">
             <Globe size={16} className="text-blue-500" />
             <span>歸檔區域：</span>
             {isLoadingDetails ? (
                 <span className="flex items-center gap-1 text-gray-400"><Loader2 size={12} className="animate-spin"/> 搜尋中...</span>
             ) : (
                <div className="flex gap-2 w-full">
                    <input 
                        type="text" 
                        value={region.country}
                        onChange={(e) => setRegion({...region, country: e.target.value})}
                        className="bg-white border border-gray-300 rounded px-2 py-1 text-xs w-20 focus:outline-none focus:border-blue-500 font-bold text-gray-700"
                        placeholder="國家"
                    />
                    <span className="text-gray-400 self-center">&gt;</span>
                    <input 
                        type="text" 
                        value={region.area}
                        onChange={(e) => setRegion({...region, area: e.target.value})}
                        className="bg-white border border-gray-300 rounded px-2 py-1 text-xs w-24 focus:outline-none focus:border-blue-500 font-bold text-gray-700"
                        placeholder="城市/區域"
                    />
                </div>
             )}
          </div>

          {/* Editable Location Info */}
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 space-y-3">
            <div className="flex items-center gap-2 mb-1 justify-between">
                 <div className="flex items-center gap-2">
                     <h3 className="font-bold text-blue-900 text-sm whitespace-nowrap">地點名稱</h3>
                     <Edit3 size={14} className="text-blue-400" />
                 </div>
                 {isLoadingDetails && <Loader2 size={14} className="animate-spin text-blue-500" />}
            </div>
            <input 
                type="text" 
                value={currentLocation.name || ''} 
                onChange={(e) => setCurrentLocation({...currentLocation, name: e.target.value})}
                className="w-full bg-white/80 border border-blue-200 rounded px-3 py-2 text-blue-900 font-bold focus:ring-2 focus:ring-blue-400 focus:outline-none placeholder-blue-300"
                placeholder={isLoadingDetails ? "載入中..." : "輸入地點名稱"}
                disabled={isLoadingDetails}
            />
            
            <div>
                <h3 className="font-bold text-blue-900 text-sm mb-1">地址 / 備註</h3>
                <input 
                    type="text" 
                    value={currentLocation.address || ''} 
                    onChange={(e) => setCurrentLocation({...currentLocation, address: e.target.value})}
                    className="w-full bg-white/80 border border-blue-200 rounded px-3 py-2 text-sm text-blue-800 focus:ring-2 focus:ring-blue-400 focus:outline-none placeholder-blue-300"
                    placeholder={isLoadingDetails ? "載入中..." : "輸入地址"}
                    disabled={isLoadingDetails}
                />
            </div>
          </div>

          <form id="memoryForm" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Color & Icon Selector */}
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 space-y-4">
                {/* 1. 顏色選擇 */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <Palette size={16} /> 標記顏色
                    </label>
                    <div className="flex flex-wrap gap-2 items-center">
                        {presetColors.map((color) => (
                            <button
                                key={color}
                                type="button"
                                onClick={() => setMarkerColor(color)}
                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110 shadow-sm ${markerColor === color ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''}`}
                                style={{ backgroundColor: color }}
                            >
                                {markerColor === color && <Check size={14} className="text-white drop-shadow-md" />}
                            </button>
                        ))}
                        <div className="relative group ml-2">
                            <input 
                                type="color" 
                                value={markerColor}
                                onChange={(e) => setMarkerColor(e.target.value)}
                                className="w-8 h-8 p-0 border-0 rounded-full overflow-hidden cursor-pointer shadow-sm ring-1 ring-gray-200"
                            />
                        </div>
                    </div>
                </div>

                {/* 2. 圖示選擇 (Quick View - Now Dynamic!) */}
                <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <Grid size={16} /> 標記圖示
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {/* 這裡改成 render recentIcons 狀態 */}
                        {recentIcons.map((iconKey) => {
                            const IconComp = ICON_MAP[iconKey] || MapPin;
                            return (
                                <button
                                    key={iconKey}
                                    type="button"
                                    onClick={() => handleIconSelect(iconKey)}
                                    className={`flex items-center justify-center w-9 h-9 rounded-lg border transition-all ${
                                        markerIcon === iconKey 
                                        ? 'bg-blue-600 text-white border-blue-600 shadow-md transform scale-105' 
                                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'
                                    }`}
                                >
                                    <IconComp size={18} />
                                </button>
                            );
                        })}
                        {/* More Button */}
                        <button
                            type="button"
                            onClick={() => setShowIconPicker(true)}
                            className="flex items-center justify-center gap-1 px-3 h-9 rounded-lg border border-dashed border-gray-300 text-gray-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 text-xs font-bold transition-all"
                        >
                            <Grid size={14} /> 更多...
                        </button>
                    </div>
                </div>
            </div>

            {/* Icon Picker Overlay */}
            {showIconPicker && (
                <div className="absolute inset-0 bg-white z-50 flex flex-col animate-in fade-in slide-in-from-bottom-5">
                    <div className="p-3 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                         <h3 className="font-bold text-gray-700 flex items-center gap-2"><Grid size={18}/> 選擇圖示</h3>
                         <button type="button" onClick={() => setShowIconPicker(false)} className="p-1 hover:bg-gray-200 rounded-full"><X size={20}/></button>
                    </div>
                    <div className="flex flex-1 overflow-hidden">
                        {/* Sidebar */}
                        <div className="w-24 bg-gray-50 border-r border-gray-200 overflow-y-auto">
                            {Object.keys(ICON_CATEGORIES).map(cat => (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => setSelectedIconCategory(cat as keyof typeof ICON_CATEGORIES)}
                                    className={`w-full text-left px-3 py-3 text-xs font-bold border-l-4 transition-colors ${
                                        selectedIconCategory === cat 
                                        ? 'bg-white border-blue-500 text-blue-600' 
                                        : 'border-transparent text-gray-500 hover:bg-gray-100'
                                    }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                        {/* Grid */}
                        <div className="flex-1 overflow-y-auto p-4">
                            <h4 className="text-sm font-bold text-gray-800 mb-3">{selectedIconCategory}</h4>
                            <div className="grid grid-cols-5 gap-3">
                                {ICON_CATEGORIES[selectedIconCategory].map(iconKey => {
                                    const IconComp = ICON_MAP[iconKey] || MapPin;
                                    return (
                                        <button
                                            key={iconKey}
                                            type="button"
                                            // 點選後觸發 handleIconSelect，更新狀態並加入 Quick View
                                            onClick={() => handleIconSelect(iconKey)}
                                            className={`aspect-square rounded-xl flex flex-col items-center justify-center gap-1 border transition-all ${
                                                markerIcon === iconKey 
                                                ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-105' 
                                                : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                                            }`}
                                        >
                                            <IconComp size={24} />
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Category Tree Selector */}
            <div className="space-y-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                {/* ... Category logic ... */}
                <label className="block text-sm font-medium text-gray-700 mb-1">分類歸檔</label>
                <div className="flex items-center gap-2">
                    <select 
                        value={selectedMainCatId}
                        onChange={(e) => {
                            setSelectedMainCatId(e.target.value);
                            setSelectedSubCatId(''); 
                        }}
                        className="flex-1 bg-white border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                        <option value="" disabled>選擇主分類...</option>
                        {categories.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                    
                    <button 
                        type="button"
                        onClick={() => setIsAddingCategory({ type: 'main' })}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg border border-transparent hover:border-blue-200 transition-colors"
                    >
                        <Plus size={18} />
                    </button>
                    
                    {selectedMainCatId && categories.find(c => c.id === selectedMainCatId)?.isCustom && (
                        <button type="button" onClick={() => { if (window.confirm('確定刪除?')) onDeleteCategory(selectedMainCatId); }} className="p-2 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 size={18}/></button>
                    )}
                </div>

                {selectedMainCatId && (
                    <div className="flex items-center gap-2 pl-4 border-l-2 border-gray-200 ml-2">
                        <ChevronRight size={16} className="text-gray-400" />
                        <select 
                            value={selectedSubCatId}
                            onChange={(e) => setSelectedSubCatId(e.target.value)}
                            className="flex-1 bg-white border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        >
                            <option value="">(無子分類)</option>
                            {categories.find(c => c.id === selectedMainCatId)?.children?.map(sub => (
                                <option key={sub.id} value={sub.id}>{sub.name}</option>
                            ))}
                        </select>

                        <button 
                            type="button"
                            onClick={() => setIsAddingCategory({ type: 'sub', parentId: selectedMainCatId })}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg border border-transparent hover:border-blue-200 transition-colors"
                        >
                            <Plus size={18} />
                        </button>
                        
                        {selectedSubCatId && categories.find(c => c.id === selectedMainCatId)?.children?.find(s => s.id === selectedSubCatId)?.isCustom && (
                            <button type="button" onClick={() => { if (window.confirm('確定刪除?')) onDeleteCategory(selectedSubCatId); }} className="p-2 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 size={18}/></button>
                        )}
                    </div>
                )}
                
                {/* Add Category Overlay ... */}
                {isAddingCategory && (
                    <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <label className="text-xs font-bold text-blue-700 mb-1 block">新增分類:</label>
                        <div className="flex gap-2">
                            <input type="text" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} className="flex-1 border rounded px-2 py-1 text-sm" placeholder="輸入名稱..." autoFocus />
                            <button type="button" onClick={handleAddCategorySubmit} className="bg-blue-600 text-white px-3 py-1 rounded text-xs">確定</button>
                            <button type="button" onClick={() => setIsAddingCategory(null)} className="text-gray-500 px-2 text-xs">取消</button>
                        </div>
                    </div>
                )}
            </div>

            {/* Author & Content */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-sm font-medium text-gray-700">您的暱稱</label>
                  <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} className="rounded text-blue-600" />
                      <span className="text-xs text-gray-500 select-none">匿名發佈</span>
                  </label>
              </div>
              <input
                type="text"
                required
                value={isAnonymous ? "匿名老司機" : author}
                onChange={(e) => !isAnonymous && setAuthor(e.target.value)}
                disabled={isAnonymous}
                className={`w-full border rounded-lg p-3 ${isAnonymous ? 'bg-gray-100' : 'bg-gray-50'}`}
                placeholder="怎麼稱呼您？"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">您的故事</label>
              <textarea
                required
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 h-24 resize-none"
                placeholder="寫下這裡發生的故事..."
              />
            </div>

            {/* Photo Upload */}
            <div className="flex flex-wrap gap-3">
                <div className="relative">
                    <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" id="photo-upload" />
                    <label htmlFor="photo-upload" className="flex items-center gap-2 cursor-pointer bg-white hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-lg border border-gray-300 shadow-sm text-sm font-medium">
                        <ImageIcon size={18} />
                        <span>新增照片</span>
                    </label>
                </div>
            </div>

            {/* Photo Previews */}
            {photos.length > 0 && (
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 flex gap-2 overflow-x-auto">
                    {photos.map((p, idx) => (
                        <div key={idx} className="relative shrink-0 w-20 h-20 group">
                            <img src={p} className="w-full h-full object-cover rounded-lg" alt="preview"/>
                            <button type="button" onClick={() => setPhotos(photos.filter((_, i) => i !== idx))} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100"><X size={12}/></button>
                        </div>
                    ))}
                </div>
            )}

          </form>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-200 text-sm">放棄</button>
          <button form="memoryForm" type="submit" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm shadow-md">
            <Check size={16} /> {initialData ? '更新足跡' : '發佈足跡'}
          </button>
        </div>
      </div>
    </div>
  );
};