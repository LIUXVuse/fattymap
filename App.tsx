import React, { useState, useEffect, useRef } from 'react';
import { AppMap } from './components/MapContainer';
import { MemoryFeed } from './components/MemoryFeed';
import { MemoryModal } from './components/MemoryModal';
import { Memory, Location, MarkerColor, CategoryNode, RegionInfo, PlaceSearchResult, MarkerIconType } from './types';
import { Menu, X, MapPin, Navigation, Play, RotateCcw, Search, Loader2 } from 'lucide-react';
import { searchLocation } from './services/mapService';

// 模擬當前用戶 ID
const CURRENT_USER_ID = "user-123456";

// 初始示範資料
const INITIAL_MEMORIES: Memory[] = [
  {
    id: '1',
    creatorId: 'user-000',
    author: 'Alice',
    isAnonymous: false,
    content: '台北 101 的景觀真的很棒！',
    location: {
      lat: 25.0330,
      lng: 121.5654,
      name: '台北 101',
      address: '台北市信義區信義路五段7號',
      googleMapsUri: 'https://maps.google.com/?q=Taipei+101'
    },
    photos: ['https://images.unsplash.com/photo-1596720524456-11b0b740702d?auto=format&fit=crop&q=80&w=600'],
    timestamp: Date.now() - 10000000,
    markerColor: '#ef4444',
    markerIcon: 'camera',
    category: { main: '景點', sub: '地標' },
    region: { country: '台灣', area: '台北市' }
  },
  {
    id: '2',
    creatorId: CURRENT_USER_ID,
    author: 'Tom',
    isAnonymous: true,
    content: '這裡的拉麵湯頭非常濃郁，推薦！',
    location: {
      lat: 35.6895,
      lng: 139.6917,
      name: '新宿某拉麵店',
      address: '東京都新宿區',
    },
    photos: [],
    timestamp: Date.now() - 500000,
    markerColor: '#f59e0b',
    markerIcon: 'food',
    category: { main: '美食', sub: '日式' },
    region: { country: '日本', area: '東京都' }
  }
];

// 初始分類樹
const INITIAL_CATEGORIES: CategoryNode[] = [
    {
        id: 'c1', name: '美食', parentId: null, children: [
            { id: 'c1-1', name: '中式', parentId: 'c1' },
            { id: 'c1-2', name: '日式', parentId: 'c1' },
            { id: 'c1-3', name: '美式', parentId: 'c1' },
            { id: 'c1-4', name: '甜點', parentId: 'c1' },
        ]
    },
    {
        id: 'c2', name: '景點', parentId: null, children: [
            { id: 'c2-1', name: '自然', parentId: 'c2' },
            { id: 'c2-2', name: '室內', parentId: 'c2' },
        ]
    },
    {
        id: 'c3', name: '住宿', parentId: null, children: []
    }
];

const App: React.FC = () => {
  const [memories, setMemories] = useState<Memory[]>(INITIAL_MEMORIES);
  const [categories, setCategories] = useState<CategoryNode[]>(INITIAL_CATEGORIES);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tempLocation, setTempLocation] = useState<Location | null>(null);
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null); // 新增：正在編輯的回憶

  const [mapCenter, setMapCenter] = useState<[number, number]>([25.0330, 121.5654]);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  
  // Navigation State
  const [isRoutingMode, setIsRoutingMode] = useState(false);
  const [routePoints, setRoutePoints] = useState<string[]>([]);

  // Search & Pin State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<PlaceSearchResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isDraggablePinMode, setIsDraggablePinMode] = useState(false);
  
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setMapCenter([position.coords.latitude, position.coords.longitude]);
        },
        (err) => console.log("Location access denied or error:", err)
      );
    }

    // 點擊外部關閉搜尋結果
    const handleClickOutside = (event: MouseEvent) => {
        if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
            setShowSearchResults(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMapClick = (lat: number, lng: number) => {
    if (isRoutingMode || isDraggablePinMode) return; 
    setTempLocation({ lat, lng });
    setEditingMemory(null); // 清除編輯狀態
    setIsModalOpen(true);
  };

  const handleSaveMemory = (data: { author: string; isAnonymous: boolean; content: string; photos: string[]; location: Location; markerColor: MarkerColor; markerIcon?: MarkerIconType; category: { main: string, sub?: string }, region: RegionInfo }) => {
    
    if (editingMemory) {
        // 更新現有回憶
        setMemories(prev => prev.map(m => m.id === editingMemory.id ? {
            ...m,
            ...data,
            // 保持原有的 id 和 creatorId, timestamp 可以選擇更新或不更新，這裡假設修改不改變建立時間
        } : m));
    } else {
        // 建立新回憶
        const newMemory: Memory = {
            id: Date.now().toString(),
            creatorId: CURRENT_USER_ID,
            ...data,
            timestamp: Date.now(),
        };
        setMemories(prev => [...prev, newMemory]);
    }

    setIsModalOpen(false);
    setTempLocation(null);
    setEditingMemory(null);
    setMapCenter([data.location.lat, data.location.lng]);
    setIsDraggablePinMode(false); 
  };

  const handleDeleteMemory = (id: string) => {
      if (window.confirm("確定要刪除這則回憶嗎？")) {
          setMemories(prev => prev.filter(m => m.id !== id));
          setRoutePoints(prev => prev.filter(pid => pid !== id));
      }
  };

  const handleEditMemory = (memory: Memory) => {
      setEditingMemory(memory);
      setTempLocation(memory.location);
      setIsModalOpen(true);
      
      // 如果是在手機版，可能需要關閉側邊欄以便看到 Modal (雖然 Modal 是全螢幕 overlay)
      // 但為了體驗，可以暫時保持側邊欄開啟或不變
  };

  // 新增分類邏輯
  const handleAddCategory = (name: string, parentId: string | null) => {
      const newCategory: CategoryNode = {
          id: Date.now().toString(),
          name,
          parentId,
          children: [],
          isCustom: true,
          creatorId: CURRENT_USER_ID
      };

      setCategories(prev => {
          if (!parentId) {
              return [...prev, newCategory];
          } else {
              return prev.map(cat => {
                  if (cat.id === parentId) {
                      return {
                          ...cat,
                          children: [...(cat.children || []), newCategory]
                      };
                  }
                  return cat;
              });
          }
      });
  };

  const handleDeleteCategory = (id: string) => {
      setCategories(prev => {
          const isMain = prev.find(c => c.id === id);
          if (isMain) {
              if (isMain.creatorId !== CURRENT_USER_ID) {
                  alert("這不是你建立的分類，無法刪除！");
                  return prev;
              }
              return prev.filter(c => c.id !== id);
          }
          return prev.map(mainCat => {
              if (mainCat.children?.some(sub => sub.id === id)) {
                   const targetSub = mainCat.children.find(sub => sub.id === id);
                   if (targetSub && targetSub.creatorId !== CURRENT_USER_ID) {
                       alert("這不是你建立的分類，無法刪除！");
                       return mainCat;
                   }
                   return {
                       ...mainCat,
                       children: mainCat.children.filter(sub => sub.id !== id)
                   };
              }
              return mainCat;
          });
      });
  };

  const focusLocation = (lat: number, lng: number) => {
    setMapCenter([lat, lng]);
    if (window.innerWidth < 768) {
        setSidebarOpen(false);
    }
  };

  const toggleRoutingMode = () => {
      setIsRoutingMode(!isRoutingMode);
      setRoutePoints([]); 
      if (isDraggablePinMode) setIsDraggablePinMode(false);
  };

  const toggleDraggablePinMode = () => {
      setIsDraggablePinMode(!isDraggablePinMode);
      if (isRoutingMode) setIsRoutingMode(false);
  };

  const handleMarkerClick = (id: string) => {
      if (isRoutingMode) {
          setRoutePoints(prev => {
              if (prev.includes(id)) return prev.filter(p => p !== id);
              return [...prev, id];
          });
      }
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!searchQuery.trim()) return;
      
      setIsSearching(true);
      setShowSearchResults(true);
      
      const results = await searchLocation(searchQuery);
      setSearchResults(results);
      setIsSearching(false);

      if (results.length === 0) {
          alert("找不到該地點，請嘗試輸入更具體的地址、名稱或經緯度 (lat, lng)。");
      } else if (results.length === 1 && searchQuery.match(/^(-?\d+(\.\d+)?)[,\s]+(-?\d+(\.\d+)?)$/)) {
           handleSearchResultClick(results[0]);
      }
  };

  const handleSearchResultClick = (result: PlaceSearchResult) => {
      setMapCenter([result.lat, result.lng]);
      setTempLocation({
        lat: result.lat,
        lng: result.lng,
        name: result.name, 
        address: result.address
      });
      setEditingMemory(null);
      setIsModalOpen(true);
      setSearchQuery('');
      setShowSearchResults(false);
  };

  const handlePinDragEnd = (lat: number, lng: number) => {
      setTempLocation({ lat, lng });
      setEditingMemory(null);
      setIsModalOpen(true);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden flex bg-gray-100 text-gray-800 font-sans">
      
      {/* Sidebar */}
      <div 
        className={`fixed inset-y-0 left-0 w-80 md:w-96 z-[1100] transform transition-transform duration-300 md:relative md:translate-x-0 shadow-2xl ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
          <MemoryFeed 
            memories={memories} 
            onFocusLocation={focusLocation} 
            onEdit={handleEditMemory}
            onDelete={handleDeleteMemory}
            currentUserId={CURRENT_USER_ID}
          />
          
          <button 
            onClick={() => setSidebarOpen(false)}
            className="md:hidden absolute top-4 right-4 text-gray-500 hover:text-gray-800 bg-white/80 rounded-full p-1 shadow-sm"
          >
             <X size={20} />
          </button>
      </div>

      {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/20 z-[1050] md:hidden backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
      )}

      {/* Main Map Area */}
      <div className="flex-1 relative h-full">
         <button 
            onClick={() => setSidebarOpen(true)}
            className="md:hidden absolute top-4 left-4 z-[1000] bg-white text-gray-700 p-3 rounded-xl shadow-md border border-gray-200 active:scale-95 transition-transform"
         >
            <Menu size={24} />
         </button>

         {/* Search Bar (Floating) */}
         <div ref={searchContainerRef} className="absolute top-4 left-16 md:left-4 md:ml-12 right-16 md:right-auto md:w-96 z-[1000]">
             <form onSubmit={handleSearchSubmit} className="relative">
                 <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => {
                        if (searchResults.length > 0) setShowSearchResults(true);
                    }}
                    placeholder="搜尋地點或座標 (例如: 台北車站 或 25.03, 121.56)"
                    className="w-full pl-10 pr-4 py-3 rounded-xl shadow-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white/95 backdrop-blur-sm"
                 />
                 <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {isSearching ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                 </div>
                 
                 {/* Search Results Dropdown */}
                 {showSearchResults && searchResults.length > 0 && (
                     <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden max-h-80 overflow-y-auto animate-in fade-in slide-in-from-top-2">
                         {searchResults.map((result, index) => (
                             <button
                                key={index}
                                type="button"
                                onClick={() => handleSearchResultClick(result)}
                                className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-0 flex items-start gap-3 transition-colors group"
                             >
                                 <div className="mt-1 text-gray-400 group-hover:text-blue-500">
                                    <MapPin size={18} />
                                 </div>
                                 <div>
                                     <div className="font-bold text-gray-800 text-sm">{result.name}</div>
                                     <div className="text-xs text-gray-500 line-clamp-1">{result.address}</div>
                                 </div>
                             </button>
                         ))}
                     </div>
                 )}
             </form>
         </div>

         {/* Right Controls */}
         <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2 items-end">
             {/* Draggable Pin Toggle */}
             <button
                onClick={toggleDraggablePinMode}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg font-bold transition-all ${
                    isDraggablePinMode 
                    ? 'bg-red-600 text-white ring-4 ring-red-200' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
             >
                 <MapPin size={18} className={isDraggablePinMode ? 'animate-bounce' : ''} />
                 {isDraggablePinMode ? '請拖曳地圖上的紅釘' : '放置圖釘'}
             </button>

             {/* Navigation Toggle */}
             <button
                onClick={toggleRoutingMode}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg font-bold transition-all ${
                    isRoutingMode 
                    ? 'bg-blue-600 text-white ring-4 ring-blue-200' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
             >
                 {isRoutingMode ? <X size={18} /> : <Navigation size={18} />}
                 {isRoutingMode ? '結束導航模式' : '開啟路線規劃'}
             </button>

             {isRoutingMode && (
                 <div className="bg-white p-4 rounded-xl shadow-xl border border-gray-100 w-64 animate-in slide-in-from-top-4">
                     {/* ... Routing UI ... */}
                     <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                        <Play size={16} className="text-green-500 fill-current" />
                        規劃您的旅程
                     </h3>
                     <p className="text-xs text-gray-500 mb-3">
                        請依序點擊地圖上的標記點來建立路線。
                     </p>
                     <div className="flex flex-col gap-2 mb-3 max-h-32 overflow-y-auto">
                        {routePoints.length === 0 ? (
                            <span className="text-sm text-gray-400 italic py-2 text-center border-2 border-dashed border-gray-200 rounded">尚未選擇地點</span>
                        ) : (
                            routePoints.map((id, index) => {
                                const m = memories.find(mem => mem.id === id);
                                return (
                                    <div key={id} className="text-sm bg-blue-50 text-blue-800 px-2 py-1 rounded flex justify-between items-center">
                                        <span className="truncate flex-1">{index + 1}. {m?.location.name}</span>
                                        <button onClick={() => handleMarkerClick(id)} className="text-blue-400 hover:text-blue-600 ml-2"><X size={12} /></button>
                                    </div>
                                )
                            })
                        )}
                     </div>
                     <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                         <span className="text-xs font-bold text-blue-600">總計: {routePoints.length} 個點</span>
                         <button onClick={() => setRoutePoints([])} className="text-xs text-gray-500 hover:text-red-500 flex items-center gap-1"><RotateCcw size={12} /> 重置</button>
                     </div>
                 </div>
             )}
         </div>

         <AppMap 
            memories={memories} 
            onMapClick={handleMapClick} 
            center={mapCenter}
            routePoints={routePoints}
            onMarkerClick={handleMarkerClick}
            isRoutingMode={isRoutingMode}
            isDraggablePinMode={isDraggablePinMode}
            onDragEnd={handlePinDragEnd}
         />

         {/* Helper Overlay */}
         {!isModalOpen && !isRoutingMode && !isDraggablePinMode && (
            <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-[400] pointer-events-none">
                <div className="bg-white/90 backdrop-blur-md text-gray-800 px-6 py-2.5 rounded-full text-sm font-bold border border-white/50 shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <MapPin size={16} className="text-red-500 fill-current" />
                    點擊地圖任意處，釘選您的回憶
                </div>
            </div>
         )}
      </div>

      {isModalOpen && tempLocation && (
        <MemoryModal 
          location={tempLocation} 
          categories={categories}
          initialData={editingMemory || undefined}
          onClose={() => {
              setIsModalOpen(false);
              setEditingMemory(null);
          }} 
          onSubmit={handleSaveMemory} 
          onAddCategory={handleAddCategory}
          onDeleteCategory={handleDeleteCategory}
          currentUser={CURRENT_USER_ID}
        />
      )}
    </div>
  );
};

export default App;