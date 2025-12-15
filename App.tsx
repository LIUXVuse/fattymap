import React, { useState, useEffect, useRef } from 'react';
import { AppMap } from './components/MapContainer';
import { MemoryFeed } from './components/MemoryFeed';
import { MemoryModal } from './components/MemoryModal';
import { Memory, Location, MarkerColor, CategoryNode, RegionInfo, PlaceSearchResult, MarkerIconType } from './types';
import { Menu, X, MapPin, Navigation, Play, RotateCcw, Search, Loader2, LogIn, LogOut } from 'lucide-react';
import { searchLocation } from './services/mapService';
import { auth, signInWithGoogle, logout, subscribeToMemories, subscribeToCategories, initCategoriesIfEmpty, addMemoryToFireStore, updateMemoryInFirestore, deleteMemoryFromFirestore, saveCategoriesToFirestore, uploadImage } from './services/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

// 管理員 Email 列表 (簡單實作，實際建議用 Custom Claims)
const ADMIN_EMAILS = ["admin@example.com"]; // 請將您自己的 Google Email 加入此處

// 初始分類樹 (僅用於首次初始化 DB)
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
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [memories, setMemories] = useState<Memory[]>([]);
  const [categories, setCategories] = useState<CategoryNode[]>([]);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tempLocation, setTempLocation] = useState<Location | null>(null);
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null);

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

  // 1. 初始化 Firebase 監聽
  useEffect(() => {
    // Auth Listener
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
        if (currentUser && currentUser.email && ADMIN_EMAILS.includes(currentUser.email)) {
            setIsAdmin(true);
        } else {
            setIsAdmin(false);
        }
    });

    // Data Listeners
    const unsubscribeMemories = subscribeToMemories((data) => {
        setMemories(data);
    });

    const unsubscribeCategories = subscribeToCategories((data) => {
        setCategories(data);
    });

    // 初始化分類 (僅執行一次檢查)
    initCategoriesIfEmpty(INITIAL_CATEGORIES);

    return () => {
        unsubscribeAuth();
        unsubscribeMemories();
        unsubscribeCategories(); // 注意：實際 onSnapshot 回傳的 unsub 函數
    };
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setMapCenter([position.coords.latitude, position.coords.longitude]);
        },
        (err) => console.log("Location access denied or error:", err)
      );
    }

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
    
    if (!user) {
        if(confirm("請先登入才能標記地點！\n是否現在登入？")) {
            signInWithGoogle();
        }
        return;
    }

    setTempLocation({ lat, lng });
    setEditingMemory(null);
    setIsModalOpen(true);
  };

  // 處理儲存邏輯 (上傳圖片 -> 寫入 Firestore)
  const handleSaveMemory = async (
      data: Omit<Memory, "id" | "creatorId" | "timestamp">, 
      photoFiles: File[], 
      customAvatarFile?: File
    ) => {
    
    if (!user) return;

    try {
        // 1. 上傳照片
        const photoUrls: string[] = [...data.photos]; // 保留既有照片
        for (const file of photoFiles) {
            const path = `memories/${user.uid}/${Date.now()}_${file.name}`;
            const url = await uploadImage(file, path);
            photoUrls.push(url);
        }

        // 2. 上傳自訂頭像 (如果有)
        let avatarUrl = data.authorAvatar;
        if (customAvatarFile) {
            const path = `avatars/${user.uid}/${Date.now()}_avatar`;
            avatarUrl = await uploadImage(customAvatarFile, path);
        }

        const finalData = {
            ...data,
            photos: photoUrls,
            authorAvatar: avatarUrl,
        };

        if (editingMemory) {
            await updateMemoryInFirestore(editingMemory.id, finalData);
        } else {
            await addMemoryToFireStore({
                ...finalData,
                creatorId: user.uid,
                timestamp: Date.now(),
            });
        }

        setIsModalOpen(false);
        setTempLocation(null);
        setEditingMemory(null);
        setMapCenter([data.location.lat, data.location.lng]);
        setIsDraggablePinMode(false); 
    } catch (error) {
        console.error("Error saving memory:", error);
        alert("儲存失敗");
    }
  };

  const handleDeleteMemory = async (id: string) => {
      if (window.confirm("確定要刪除這則回憶嗎？此操作無法復原。")) {
          await deleteMemoryFromFirestore(id);
          setRoutePoints(prev => prev.filter(pid => pid !== id));
      }
  };

  const handleEditMemory = (memory: Memory) => {
      // 權限檢查在 MemoryFeed 已經做過一次 UI 隱藏，這裡做二次檢查
      if (!isAdmin && (!user || memory.creatorId !== user.uid)) {
          alert("您沒有權限編輯此回憶");
          return;
      }
      setEditingMemory(memory);
      setTempLocation(memory.location);
      setIsModalOpen(true);
  };

  const handleAddCategory = async (name: string, parentId: string | null) => {
      if (!user) return;
      
      const newCategory: CategoryNode = {
          id: Date.now().toString(),
          name,
          parentId,
          children: [],
          isCustom: true,
          creatorId: user.uid
      };

      const newCategories = categories.map(cat => ({...cat})); // Deep copy slightly safer

      if (!parentId) {
          newCategories.push(newCategory);
      } else {
          const parent = newCategories.find(c => c.id === parentId);
          if (parent) {
              parent.children = [...(parent.children || []), newCategory];
          }
      }
      
      await saveCategoriesToFirestore(newCategories);
  };

  const handleDeleteCategory = async (id: string) => {
      if (!user) return;

      const newCategories = categories.filter(c => c.id !== id).map(c => {
          if (c.children) {
              return {
                  ...c,
                  children: c.children.filter(sub => sub.id !== id)
              }
          }
          return c;
      });
      // 注意：這裡簡化了邏輯，真實情況需要檢查 creatorId
      await saveCategoriesToFirestore(newCategories);
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
          {/* User Profile / Login Section */}
          <div className="bg-gray-800 text-white p-4 flex justify-between items-center shadow-md">
               {user ? (
                   <div className="flex items-center gap-3">
                       <img src={user.photoURL || ''} className="w-8 h-8 rounded-full border border-gray-600" alt="user" />
                       <div className="flex flex-col">
                           <span className="text-sm font-bold truncate max-w-[120px]">{user.displayName}</span>
                           <span className="text-[10px] text-gray-400">{isAdmin ? '管理員' : '老司機'}</span>
                       </div>
                   </div>
               ) : (
                   <span className="text-sm font-bold text-gray-300">訪客模式 (僅瀏覽)</span>
               )}
               
               {user ? (
                   <button onClick={logout} className="p-2 hover:bg-gray-700 rounded-lg text-xs flex items-center gap-1 transition-colors text-red-300">
                       <LogOut size={14} /> 登出
                   </button>
               ) : (
                   <button onClick={signInWithGoogle} className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors shadow">
                       <LogIn size={14} /> Google 登入
                   </button>
               )}
          </div>

          <MemoryFeed 
            memories={memories} 
            onFocusLocation={focusLocation} 
            onEdit={handleEditMemory}
            onDelete={handleDeleteMemory}
            currentUserId={user?.uid}
            isAdmin={isAdmin}
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

         {/* Search Bar */}
         <div ref={searchContainerRef} className="absolute top-4 left-16 md:left-4 md:ml-12 right-16 md:right-auto md:w-96 z-[1000]">
             <form onSubmit={handleSearchSubmit} className="relative">
                 <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => {
                        if (searchResults.length > 0) setShowSearchResults(true);
                    }}
                    placeholder="搜尋地點或座標..."
                    className="w-full pl-10 pr-4 py-3 rounded-xl shadow-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white/95 backdrop-blur-sm"
                 />
                 <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {isSearching ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                 </div>
                 
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
          currentUser={user}
        />
      )}
    </div>
  );
};

export default App;