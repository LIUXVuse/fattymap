import React, { useState, useEffect, useRef } from 'react';
import { X, MapPin, Image as ImageIcon, Check, Palette, Globe, Edit3, Loader2, Plus, Trash2, ChevronRight, Grid, User as UserIcon, Upload } from 'lucide-react';
import { Location, MarkerColor, CategoryNode, RegionInfo, MarkerIconType, Memory } from '../types';
import { findPlaceDetails } from '../services/mapService';
import { ICON_MAP } from './MapContainer';
import { User } from 'firebase/auth';
import { uploadImage } from '../services/firebase';

interface MemoryModalProps {
  location: Location;
  categories: CategoryNode[];
  initialData?: Memory; 
  onClose: () => void;
  // 更新 onSubmit 簽名以配合 Firebase 邏輯
  onSubmit: (data: Omit<Memory, "id" | "creatorId" | "timestamp">, photoFiles: File[], customAvatarFile?: File) => Promise<void>;
  onAddCategory: (name: string, parentId: string | null) => void;
  onDeleteCategory: (id: string) => void;
  currentUser: User | null; 
  // 新增 props 用於記憶用戶身分
  defaultCustomName?: string;
  defaultCustomAvatar?: string;
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

const DEFAULT_RECENT_ICONS = ['default', 'food', 'coffee', 'camera', 'star', 'heart', 'smile'];

type IdentityType = 'google' | 'custom' | 'anonymous';

export const MemoryModal: React.FC<MemoryModalProps> = ({ 
    location: initialLocation, 
    categories,
    initialData,
    onClose, 
    onSubmit,
    onAddCategory,
    onDeleteCategory,
    currentUser,
    defaultCustomName,
    defaultCustomAvatar
}) => {
  // Identity State
  const [identityType, setIdentityType] = useState<IdentityType>('google');
  const [customName, setCustomName] = useState('');
  const [customAvatarFile, setCustomAvatarFile] = useState<File | null>(null);
  const [customAvatarPreview, setCustomAvatarPreview] = useState<string>('');

  const [content, setContent] = useState('');
  
  // Photos State: 區分已上傳(URL)和新選擇(File)
  const [existingPhotos, setExistingPhotos] = useState<string[]>([]);
  const [newPhotoFiles, setNewPhotoFiles] = useState<File[]>([]);
  const [newPhotoPreviews, setNewPhotoPreviews] = useState<string[]>([]);
  
  // Map/Category State
  const [markerColor, setMarkerColor] = useState<MarkerColor>('#ef4444');
  const [markerIcon, setMarkerIcon] = useState<MarkerIconType>('default');
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [recentIcons, setRecentIcons] = useState<string[]>(DEFAULT_RECENT_ICONS);
  const [selectedIconCategory, setSelectedIconCategory] = useState<keyof typeof ICON_CATEGORIES>("人物/心情");
  
  const [selectedMainCatId, setSelectedMainCatId] = useState<string>('');
  const [selectedSubCatId, setSelectedSubCatId] = useState<string>('');
  const [isAddingCategory, setIsAddingCategory] = useState<{ type: 'main' | 'sub', parentId?: string } | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  
  const [currentLocation, setCurrentLocation] = useState<Location>(initialLocation);
  const [region, setRegion] = useState<RegionInfo>({ country: '', area: '' });
  const [isLoadingDetails, setIsLoadingDetails] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 初始化資料 (編輯模式 或 新增模式)
  useEffect(() => {
    if (initialData) {
        // 編輯模式
        if (initialData.isAnonymous) {
            setIdentityType('anonymous');
        } else if (currentUser && initialData.author === currentUser.displayName && initialData.authorAvatar === currentUser.photoURL) {
            setIdentityType('google');
        } else {
            setIdentityType('custom');
            setCustomName(initialData.author);
            if (initialData.authorAvatar) setCustomAvatarPreview(initialData.authorAvatar);
        }

        setContent(initialData.content);
        setExistingPhotos(initialData.photos);
        setMarkerColor(initialData.markerColor);
        setMarkerIcon(initialData.markerIcon || 'default');
        
        if (initialData.markerIcon && !DEFAULT_RECENT_ICONS.includes(initialData.markerIcon)) {
             setRecentIcons(prev => {
                 const filtered = prev.filter(k => k !== initialData.markerIcon);
                 return [initialData.markerIcon!, ...filtered].slice(0, 6);
             });
        }

        setCurrentLocation(initialData.location);
        setRegion(initialData.region);
        
        const main = categories.find(c => c.name === initialData.category.main);
        if (main) {
            setSelectedMainCatId(main.id);
            if (initialData.category.sub) {
                const sub = main.children?.find(c => c.name === initialData.category.sub);
                if (sub) setSelectedSubCatId(sub.id);
            }
        }
        setIsLoadingDetails(false);
    } else {
        // 新增模式：設定預設身分
        if (currentUser) {
            setIdentityType('google');
        } else if (defaultCustomName) {
            // 如果有記憶的自訂身分
            setIdentityType('custom');
            setCustomName(defaultCustomName);
            if (defaultCustomAvatar) setCustomAvatarPreview(defaultCustomAvatar);
        } else {
            // 完全沒資料，預設匿名 (會讓用戶手動切換去自訂)
            setIdentityType('custom'); // 為了讓用戶有機會輸入，預設切到 custom 比較好，anonymous 太隱晦
        }
    }
  }, [initialData, categories, currentUser, defaultCustomName, defaultCustomAvatar]);

  // 自動抓取地點資訊 (非編輯模式)
  useEffect(() => {
    if (initialData) return;

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

  // 預設分類
  useEffect(() => {
      if (!initialData && categories.length > 0 && !selectedMainCatId) {
          setSelectedMainCatId(categories[0].id);
      }
  }, [categories, selectedMainCatId, initialData]);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setNewPhotoFiles(prev => [...prev, ...files]);
      
      files.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setNewPhotoPreviews(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          setCustomAvatarFile(file);
          const reader = new FileReader();
          reader.onloadend = () => {
              setCustomAvatarPreview(reader.result as string);
          };
          reader.readAsDataURL(file);
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

  const handleIconSelect = (iconKey: string) => {
      setMarkerIcon(iconKey);
      setRecentIcons(prev => {
          const filtered = prev.filter(k => k !== iconKey);
          return [iconKey, ...filtered].slice(0, 6);
      });
      setShowIconPicker(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const mainCat = categories.find(c => c.id === selectedMainCatId);
    const subCat = mainCat?.children?.find(c => c.id === selectedSubCatId);

    if (!mainCat) {
        alert("請選擇一個分類");
        return;
    }

    setIsSubmitting(true);

    try {
        let finalAuthor = '匿名老司機';
        let finalAvatar = '';
        let finalIsAnonymous = false;

        if (identityType === 'google' && currentUser) {
            finalAuthor = currentUser.displayName || 'Google User';
            finalAvatar = currentUser.photoURL || '';
        } else if (identityType === 'custom') {
            finalAuthor = customName || '老司機';
            // Avatar file will be handled by parent component or service via callback
            // We pass the file, and if there is an existing preview URL (from edit mode or default), we pass it as initial
            finalAvatar = customAvatarPreview; 
        } else {
            finalIsAnonymous = true;
        }

        const finalRegion = {
            country: region.country || "未知國度",
            area: region.area || "未知區域"
        };

        // Construct Data Payload
        const submitData = {
            author: finalAuthor,
            authorAvatar: finalAvatar, // Note: If file exists, it will be replaced by URL in service
            isAnonymous: finalIsAnonymous,
            content,
            photos: existingPhotos, // Pass existing URLs
            location: currentLocation,
            markerColor,
            markerIcon,
            category: {
                main: mainCat.name,
                sub: subCat?.name
            },
            region: finalRegion
        };

        await onSubmit(submitData, newPhotoFiles, customAvatarFile || undefined);
        
    } catch (error) {
        console.error("Submission error:", error);
        alert("發佈失敗，請重試");
        setIsSubmitting(false);
    }
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
          
          {/* 1. Identity Selection */}
          <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
             <label className="block text-sm font-bold text-gray-700 mb-2">發佈身分</label>
             
             <div className="flex gap-2 mb-3">
                 {currentUser && (
                     <button 
                        type="button"
                        onClick={() => setIdentityType('google')}
                        className={`flex-1 py-2 px-1 rounded-lg text-xs font-bold border transition-all flex flex-col items-center gap-1 ${identityType === 'google' ? 'bg-white border-blue-500 text-blue-600 shadow-sm' : 'border-transparent text-gray-500 hover:bg-gray-100'}`}
                     >
                         <UserIcon size={16} /> Google 帳號
                     </button>
                 )}
                 <button 
                    type="button"
                    onClick={() => setIdentityType('custom')}
                    className={`flex-1 py-2 px-1 rounded-lg text-xs font-bold border transition-all flex flex-col items-center gap-1 ${identityType === 'custom' ? 'bg-white border-blue-500 text-blue-600 shadow-sm' : 'border-transparent text-gray-500 hover:bg-gray-100'}`}
                 >
                     <Edit3 size={16} /> 自訂身分
                 </button>
                 <button 
                    type="button"
                    onClick={() => setIdentityType('anonymous')}
                    className={`flex-1 py-2 px-1 rounded-lg text-xs font-bold border transition-all flex flex-col items-center gap-1 ${identityType === 'anonymous' ? 'bg-white border-blue-500 text-blue-600 shadow-sm' : 'border-transparent text-gray-500 hover:bg-gray-100'}`}
                 >
                     <Globe size={16} /> 匿名發佈
                 </button>
             </div>

             {/* Identity Preview / Input */}
             <div className="flex items-center gap-3 p-2 bg-white rounded-lg border border-gray-200">
                {identityType === 'google' && currentUser && (
                    <>
                        <img src={currentUser.photoURL || ''} className="w-10 h-10 rounded-full bg-gray-200" alt="avatar" />
                        <span className="font-bold text-gray-700">{currentUser.displayName}</span>
                    </>
                )}
                
                {identityType === 'anonymous' && (
                    <>
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500"><Globe size={20}/></div>
                        <span className="font-bold text-gray-500">匿名老司機</span>
                    </>
                )}

                {identityType === 'custom' && (
                    <>
                        <div className="relative group cursor-pointer">
                            <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden border border-gray-200 flex items-center justify-center">
                                {customAvatarPreview ? <img src={customAvatarPreview} className="w-full h-full object-cover"/> : <Upload size={16} className="text-gray-400"/>}
                            </div>
                            <input type="file" accept="image/*" onChange={handleAvatarSelect} className="absolute inset-0 opacity-0 cursor-pointer" />
                        </div>
                        <input 
                            type="text" 
                            value={customName}
                            onChange={(e) => setCustomName(e.target.value)}
                            placeholder="輸入顯示暱稱..."
                            className="flex-1 bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none px-1 py-1 text-sm font-bold"
                            autoFocus
                        />
                    </>
                )}
             </div>
          </div>

          {/* Region Info (Read-onlyish) */}
          <div className="flex items-center gap-2 text-sm text-gray-500">
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
                        className="bg-gray-50 border border-gray-200 rounded px-2 py-1 text-xs w-20 font-bold text-gray-700"
                        placeholder="國家"
                    />
                    <span className="text-gray-400 self-center">&gt;</span>
                    <input 
                        type="text" 
                        value={region.area}
                        onChange={(e) => setRegion({...region, area: e.target.value})}
                        className="bg-gray-50 border border-gray-200 rounded px-2 py-1 text-xs w-24 font-bold text-gray-700"
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
                    </div>
                </div>

                {/* 2. 圖示選擇 */}
                <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <Grid size={16} /> 標記圖示
                    </label>
                    <div className="flex flex-wrap gap-2">
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

            {/* Icon Picker Overlay (省略詳細實作，保持原樣) */}
            {showIconPicker && (
                <div className="absolute inset-0 bg-white z-50 flex flex-col animate-in fade-in slide-in-from-bottom-5">
                    <div className="p-3 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                         <h3 className="font-bold text-gray-700 flex items-center gap-2"><Grid size={18}/> 選擇圖示</h3>
                         <button type="button" onClick={() => setShowIconPicker(false)} className="p-1 hover:bg-gray-200 rounded-full"><X size={20}/></button>
                    </div>
                    <div className="flex flex-1 overflow-hidden">
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
                        <div className="flex-1 overflow-y-auto p-4">
                            <h4 className="text-sm font-bold text-gray-800 mb-3">{selectedIconCategory}</h4>
                            <div className="grid grid-cols-5 gap-3">
                                {ICON_CATEGORIES[selectedIconCategory].map(iconKey => {
                                    const IconComp = ICON_MAP[iconKey] || MapPin;
                                    return (
                                        <button
                                            key={iconKey}
                                            type="button"
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

            {/* Category Tree Selector (保持原樣，僅省略內容) */}
            <div className="space-y-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
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
                    </div>
                )}
                
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

            {/* Story Content */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">您的故事</label>
              <textarea
                required
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 h-24 resize-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none"
                placeholder="寫下這裡發生的故事..."
              />
            </div>

            {/* Photo Upload */}
            <div className="flex flex-wrap gap-3">
                <div className="relative">
                    <input type="file" accept="image/*" multiple onChange={handlePhotoSelect} className="hidden" id="photo-upload" />
                    <label htmlFor="photo-upload" className="flex items-center gap-2 cursor-pointer bg-white hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-lg border border-gray-300 shadow-sm text-sm font-medium">
                        <ImageIcon size={18} />
                        <span>新增照片</span>
                    </label>
                </div>
            </div>

            {/* Photo Previews */}
            {(existingPhotos.length > 0 || newPhotoPreviews.length > 0) && (
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 flex gap-2 overflow-x-auto">
                    {/* Existing Photos (URLs) */}
                    {existingPhotos.map((p, idx) => (
                        <div key={`exist-${idx}`} className="relative shrink-0 w-20 h-20 group">
                            <img src={p} className="w-full h-full object-cover rounded-lg border border-gray-300" alt="preview"/>
                            <div className="absolute top-0 right-0 bg-blue-500 text-white text-[8px] px-1 rounded-bl">已上傳</div>
                            <button type="button" onClick={() => setExistingPhotos(prev => prev.filter((_, i) => i !== idx))} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100"><X size={12}/></button>
                        </div>
                    ))}
                    {/* New Photos (Local Previews) */}
                    {newPhotoPreviews.map((p, idx) => (
                        <div key={`new-${idx}`} className="relative shrink-0 w-20 h-20 group">
                            <img src={p} className="w-full h-full object-cover rounded-lg border border-gray-300 opacity-80" alt="preview"/>
                            <div className="absolute top-0 right-0 bg-green-500 text-white text-[8px] px-1 rounded-bl">待上傳</div>
                            <button type="button" onClick={() => {
                                setNewPhotoPreviews(prev => prev.filter((_, i) => i !== idx));
                                setNewPhotoFiles(prev => prev.filter((_, i) => i !== idx));
                            }} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100"><X size={12}/></button>
                        </div>
                    ))}
                </div>
            )}

          </form>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-200 text-sm" disabled={isSubmitting}>放棄</button>
          <button form="memoryForm" type="submit" disabled={isSubmitting} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg text-sm shadow-md transition-colors">
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} 
            {isSubmitting ? '上傳中...' : (initialData ? '更新足跡' : '發佈足跡')}
          </button>
        </div>
      </div>
    </div>
  );
};