import React, { useState, useEffect, useRef } from 'react';
import { AppMap } from './components/MapContainer';
import { MemoryFeed } from './components/MemoryFeed';
import { MemoryModal } from './components/MemoryModal';
import { CommentModal } from './components/CommentModal';
import { ImageLightbox } from './components/ImageLightbox';
import { AboutOverlay } from './components/AboutOverlay';
import { SponsorAdminPanel } from './components/SponsorAdminPanel';
import { Memory, Location, CategoryNode, PlaceSearchResult, Sponsor } from './types';
import { Menu, X, MapPin, Navigation, Play, RotateCcw, Search, Loader2, LogIn, LogOut, ExternalLink, Info, LocateFixed } from 'lucide-react';
import { searchLocation, getAutocomplete, getPlaceDetails, openGoogleMapsNavigation } from './services/mapService';
import { auth, signInWithGoogle, logout, subscribeToMemories, subscribeToCategories, initCategoriesIfEmpty, addMemoryToFireStore, updateMemoryInFirestore, deleteMemoryFromFirestore, saveCategoriesToFirestore, uploadImage, uploadVideo, subscribeToSponsors } from './services/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

// 管理員 Email 列表 (簡單實作，實際建議用 Custom Claims)
const ADMIN_EMAILS = ["liupony2000@gmail.com"]; // 管理員 Email

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
    const [sponsors, setSponsors] = useState<Sponsor[]>([]);  // 贊助商列表

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [tempLocation, setTempLocation] = useState<Location | null>(null);
    const [editingMemory, setEditingMemory] = useState<Memory | null>(null);

    // Comment Modal State
    const [activeMemoryIdForComments, setActiveMemoryIdForComments] = useState<string | null>(null);

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

    // User Identity Persistence (記憶自訂身分)
    const [lastCustomName, setLastCustomName] = useState('');
    const [lastCustomAvatar, setLastCustomAvatar] = useState('');

    // Global Lightbox State (for image zoom)
    const [lightboxImages, setLightboxImages] = useState<string[]>([]);
    const [lightboxIndex, setLightboxIndex] = useState(0);

    // Focused Memory State (用於自動展開圖釘 Popup)
    const [focusedMemoryId, setFocusedMemoryId] = useState<string | null>(null);

    // Synced Memory State (當點擊圖釘時同步側邊欄)
    const [syncedMemory, setSyncedMemory] = useState<Memory | null>(null);

    // About Overlay State
    const [isAboutOpen, setIsAboutOpen] = useState(false);
    const [aboutTab, setAboutTab] = useState<'about' | 'collab' | 'more' | 'travel' | 'podcast'>('about');

    // 贊助商管理面板 State (管理員專用)
    const [isSponsorAdminOpen, setIsSponsorAdminOpen] = useState(false);

    // 打開贊助商合作頁面
    const handleOpenSponsorInfo = () => {
        setAboutTab('collab');
        setIsAboutOpen(true);
    };

    const searchContainerRef = useRef<HTMLDivElement>(null);

    // 1. 初始化 Firebase 監聽與 LocalStorage
    useEffect(() => {
        // 讀取上次的身分
        const savedName = localStorage.getItem('lastCustomName');
        const savedAvatar = localStorage.getItem('lastCustomAvatar');
        if (savedName) setLastCustomName(savedName);
        if (savedAvatar) setLastCustomAvatar(savedAvatar);

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

        // 監聽贊助商列表
        const unsubscribeSponsors = subscribeToSponsors((data) => {
            setSponsors(data);
        });

        // 初始化分類 (僅執行一次檢查)
        initCategoriesIfEmpty(INITIAL_CATEGORIES);

        return () => {
            unsubscribeAuth();
            unsubscribeMemories();
            unsubscribeCategories();
            unsubscribeSponsors();
        };
    }, []);

    // 偵測 URL 參數，自動導航到分享的回憶或贊助商
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const sharedMemoryId = urlParams.get('memory');
        const sharedSponsorId = urlParams.get('sponsor');

        // 處理分享的回憶連結
        if (sharedMemoryId && memories.length > 0) {
            const memory = memories.find(m => m.id === sharedMemoryId);
            if (memory) {
                // 移動地圖到該位置
                setMapCenter([memory.location.lat, memory.location.lng]);
                // 設定 focusedMemory 觸發 Popup 打開
                setFocusedMemoryId(sharedMemoryId);
                // 同步側邊欄
                setSyncedMemory(memory);

                // 清除 URL 參數，避免重複觸發
                window.history.replaceState({}, '', window.location.pathname);
            }
        }

        // 處理分享的贊助商連結
        if (sharedSponsorId && sponsors.length > 0) {
            const sponsor = sponsors.find(s => s.id === sharedSponsorId);
            if (sponsor) {
                // 移動地圖到贊助商位置
                setMapCenter([sponsor.location.lat, sponsor.location.lng]);
                // 打開「合作贊助」頁面
                setAboutTab('collab');
                setIsAboutOpen(true);

                // 清除 URL 參數，避免重複觸發
                window.history.replaceState({}, '', window.location.pathname);
            }
        }
    }, [memories, sponsors]); // 當 memories 或 sponsors 載入完成後執行

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setMapCenter([position.coords.latitude, position.coords.longitude]);
                },
                (err) => console.error("Location access denied or error:", err)
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

        // 取消強制登入限制，允許訪客標記但受限
        // if (!user) { ... } 

        setTempLocation({ lat, lng });
        setEditingMemory(null);
        setIsModalOpen(true);
    };

    // 處理儲存邏輯 (上傳圖片 -> 寫入 Firestore)
    const handleSaveMemory = async (
        data: Omit<Memory, "id" | "creatorId" | "timestamp">,
        photoFiles: File[],
        customAvatarFile?: File,
        videoFiles?: File[]
    ) => {

        // 允許匿名發文，若沒登入給一個 Guest ID
        const userId = user ? user.uid : 'guest_user';

        try {
            // 1. 上傳照片
            const photoUrls: string[] = [...data.photos]; // 保留既有照片
            for (const file of photoFiles) {
                const path = `memories/${userId}/${Date.now()}_${file.name}`;
                const url = await uploadImage(file, path);
                photoUrls.push(url);
            }

            // 2. 上傳自訂頭像 (如果有)
            let avatarUrl = data.authorAvatar;
            if (customAvatarFile) {
                const path = `avatars/${userId}/${Date.now()}_avatar`;
                avatarUrl = await uploadImage(customAvatarFile, path);
            }

            // 3. 記憶自訂身分 (如果不是匿名且有自訂名字)
            if (!data.isAnonymous && !user) {
                if (data.author && data.author !== '匿名老司機') {
                    localStorage.setItem('lastCustomName', data.author);
                    setLastCustomName(data.author);
                }
                if (avatarUrl) {
                    localStorage.setItem('lastCustomAvatar', avatarUrl);
                    setLastCustomAvatar(avatarUrl);
                }
            }

            const finalData = {
                ...data,
                photos: photoUrls,
                authorAvatar: avatarUrl,
                videos: data.videos || [], // 保留既有影片 URL
            };

            // 4. 上傳新影片
            if (videoFiles && videoFiles.length > 0) {
                const videoUrls: string[] = [...(finalData.videos || [])];
                for (const file of videoFiles) {
                    const path = `videos/${userId}/${Date.now()}_${file.name}`;
                    const url = await uploadVideo(file, path);
                    videoUrls.push(url);
                }
                finalData.videos = videoUrls;
            }

            if (editingMemory) {
                await updateMemoryInFirestore(editingMemory.id, finalData);
            } else {
                await addMemoryToFireStore({
                    ...finalData,
                    creatorId: userId,
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
        if (!isAdmin && (!user || memory.creatorId !== user.uid) && memory.creatorId !== 'guest_user') {
            alert("您沒有權限編輯此回憶");
            return;
        }
        setEditingMemory(memory);
        setTempLocation(memory.location);
        setIsModalOpen(true);
    };

    const handleAddCategory = async (name: string, parentId: string | null) => {
        // if (!user) return; // 暫時允許訪客操作分類

        const newCategory: CategoryNode = {
            id: Date.now().toString(),
            name,
            parentId,
            children: [],
            isCustom: true,
            creatorId: user?.uid || 'guest'
        };

        const newCategories = categories.map(cat => ({ ...cat })); // Deep copy slightly safer

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
        // if (!user) return;

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

    const focusLocation = (lat: number, lng: number, memoryId?: string) => {
        setMapCenter([lat, lng]);
        if (memoryId) {
            setFocusedMemoryId(memoryId);
        }
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

    const handleViewComments = (memoryId: string) => {
        setActiveMemoryIdForComments(memoryId);
    };

    // Debounce 實時搜尋建議
    useEffect(() => {
        if (!searchQuery || searchQuery.length < 2) {
            setSearchResults([]);
            setShowSearchResults(false);
            return;
        }

        const debounceTimer = setTimeout(async () => {
            setIsSearching(true);
            setShowSearchResults(true);
            try {
                const results = await getAutocomplete(searchQuery);
                setSearchResults(results);
            } catch (error) {
                console.error('Autocomplete error:', error);
            }
            setIsSearching(false);
        }, 300); // 300ms debounce

        return () => clearTimeout(debounceTimer);
    }, [searchQuery]);

    const handleSearchSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        setIsSearching(true);
        setShowSearchResults(true);

        // 使用完整搜尋（按 Enter 時）
        const results = await searchLocation(searchQuery);
        setSearchResults(results);
        setIsSearching(false);

        if (results.length === 0) {
            alert("找不到該地點，請嘗試輸入更具體的地址、名稱或經緯度 (lat, lng)。");
        } else if (results.length === 1 && searchQuery.match(/^(-?\d+(\.\d+)?)[,\s]+(-?\d+(\.\d+)?)$/)) {
            handleSearchResultClick(results[0]);
        }
    };

    const handleSearchResultClick = async (result: PlaceSearchResult) => {
        // 如果結果來自 Autocomplete（只有 placeId，沒有座標）
        if (result.placeId && result.lat === 0 && result.lng === 0) {
            setIsSearching(true);
            const details = await getPlaceDetails(result.placeId);
            setIsSearching(false);
            if (details) {
                result = details;
            } else {
                alert('無法取得地點詳細資訊');
                return;
            }
        }

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

    // 開始 Google Maps 導航
    const handleStartNavigation = () => {
        if (routePoints.length === 0) {
            alert('請先選擇至少一個地點');
            return;
        }

        const destinations = routePoints.map(id => {
            const m = memories.find(mem => mem.id === id);
            if (m) {
                return { lat: m.location.lat, lng: m.location.lng, name: m.location.name };
            }
            return null;
        }).filter(Boolean) as Array<{ lat: number; lng: number; name?: string }>;

        openGoogleMapsNavigation(destinations);
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
                className={`fixed inset-y-0 left-0 w-80 md:w-96 z-[1100] transform transition-transform duration-300 md:relative md:translate-x-0 shadow-2xl ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
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
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-gray-300">訪客模式</span>
                            <span className="text-[10px] text-gray-500">{lastCustomName ? `以 ${lastCustomName} 發文` : '未設定身分'}</span>
                        </div>
                    )}

                    <div className="flex items-center gap-2">
                        {/* About 按鈕 */}
                        <button
                            onClick={() => setIsAboutOpen(true)}
                            className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-300 hover:text-white"
                            title="關於我們"
                        >
                            <Info size={18} />
                        </button>

                        {/* 贊助商管理按鈕 (管理員專用) */}
                        {isAdmin && (
                            <button
                                onClick={() => setIsSponsorAdminOpen(true)}
                                className="p-2 hover:bg-yellow-600 rounded-lg transition-colors bg-yellow-500 text-white"
                                title="贊助商管理"
                            >
                                ⭐
                            </button>
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
                </div>

                <MemoryFeed
                    memories={memories}
                    onFocusLocation={focusLocation}
                    onEdit={handleEditMemory}
                    onDelete={handleDeleteMemory}
                    currentUserId={user?.uid}
                    isAdmin={isAdmin}
                    onViewComments={handleViewComments}
                    syncToMemory={syncedMemory}
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
                        className={`flex items-center gap-2 px-2.5 py-2.5 md:px-4 md:py-2 rounded-lg shadow-lg font-bold transition-all ${isDraggablePinMode
                            ? 'bg-red-600 text-white ring-4 ring-red-200'
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        <MapPin size={18} className={isDraggablePinMode ? 'animate-bounce' : ''} />
                        <span className="hidden md:inline">{isDraggablePinMode ? '請拖曳地圖上的紅釘' : '放置圖釘'}</span>
                    </button>

                    <button
                        onClick={toggleRoutingMode}
                        className={`flex items-center gap-2 px-2.5 py-2.5 md:px-4 md:py-2 rounded-lg shadow-lg font-bold transition-all ${isRoutingMode
                            ? 'bg-blue-600 text-white ring-4 ring-blue-200'
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        {isRoutingMode ? <X size={18} /> : <Navigation size={18} />}
                        <span className="hidden md:inline">{isRoutingMode ? '結束導航模式' : '開啟路線規劃'}</span>
                    </button>

                    {/* Podcast 摘要按鈕 */}
                    <button
                        onClick={() => { setAboutTab('podcast'); setIsAboutOpen(true); }}
                        className="flex items-center gap-2 px-2.5 py-2.5 md:px-4 md:py-2 rounded-lg shadow-lg font-bold transition-all bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
                    >
                        <span>📻</span>
                        <span className="hidden md:inline">Podcast 摘要</span>
                    </button>

                    {/* 換匯計算器 */}
                    <button
                        onClick={() => { setAboutTab('more'); setIsAboutOpen(true); }}
                        className="flex items-center gap-2 px-2.5 py-2.5 md:px-4 md:py-2 rounded-lg shadow-lg font-bold transition-all bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:from-orange-400 hover:to-pink-400"
                    >
                        <span>💱</span>
                        <span className="hidden md:inline">智能換匯</span>
                    </button>

                    {/* 旅遊預訂 */}
                    <button
                        onClick={() => { setAboutTab('travel'); setIsAboutOpen(true); }}
                        className="flex items-center gap-2 px-2.5 py-2.5 md:px-4 md:py-2 rounded-lg shadow-lg font-bold transition-all bg-gradient-to-r from-sky-500 to-blue-600 text-white hover:from-sky-400 hover:to-blue-500"
                    >
                        <span>🌏</span>
                        <span className="hidden md:inline">旅遊預訂</span>
                    </button>

                    {isRoutingMode && (
                        <div className="bg-white p-3 md:p-4 rounded-xl shadow-xl border border-gray-100 w-48 md:w-64 animate-in slide-in-from-top-4">
                            <h3 className="font-bold text-gray-800 mb-1.5 flex items-center gap-2 text-sm">
                                <Play size={14} className="text-green-500 fill-current" />
                                規劃旅程
                            </h3>
                            <div className="flex flex-col gap-1.5 mb-2 max-h-24 md:max-h-32 overflow-y-auto">
                                {routePoints.length === 0 ? (
                                    <span className="text-xs text-gray-400 italic py-2 text-center border-2 border-dashed border-gray-200 rounded">尚未選擇地點</span>
                                ) : (
                                    routePoints.map((id, index) => {
                                        const m = memories.find(mem => mem.id === id);
                                        return (
                                            <div key={id} className="text-xs bg-blue-50 text-blue-800 px-2 py-1 rounded flex justify-between items-center">
                                                <span className="truncate flex-1">{index + 1}. {m?.location.name}</span>
                                                <button onClick={() => handleMarkerClick(id)} className="text-blue-400 hover:text-blue-600 ml-1"><X size={11} /></button>
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                            <div className="flex justify-between items-center pt-1.5 border-t border-gray-100">
                                <span className="text-xs font-bold text-blue-600">{routePoints.length} 個點</span>
                                <button onClick={() => setRoutePoints([])} className="text-xs text-gray-500 hover:text-red-500 flex items-center gap-1"><RotateCcw size={11} /> 重置</button>
                            </div>
                            {routePoints.length > 0 && (
                                <button
                                    onClick={handleStartNavigation}
                                    className="mt-2 w-full py-2 px-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all shadow text-xs"
                                >
                                    <ExternalLink size={13} />
                                    Google Maps 導航
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* 回到我的位置按鈕（手機右下角） */}
                <button
                    onClick={() => {
                        navigator.geolocation?.getCurrentPosition(
                            (pos) => setMapCenter([pos.coords.latitude, pos.coords.longitude]),
                            () => alert('無法取得定位，請確認已授權位置權限')
                        );
                    }}
                    className="absolute bottom-20 right-4 z-[1000] md:bottom-8 bg-white text-blue-600 p-3 rounded-full shadow-lg border border-gray-200 hover:bg-blue-50 active:scale-95 transition-all"
                    title="回到我的位置"
                >
                    <LocateFixed size={20} />
                </button>

                <AppMap
                    memories={memories}
                    sponsors={sponsors}
                    onMapClick={handleMapClick}
                    center={mapCenter}
                    routePoints={routePoints}
                    onMarkerClick={handleMarkerClick}
                    isRoutingMode={isRoutingMode}
                    isDraggablePinMode={isDraggablePinMode}
                    onDragEnd={handlePinDragEnd}
                    onViewComments={handleViewComments}
                    onImageClick={(images, index) => {
                        setLightboxImages(images);
                        setLightboxIndex(index);
                    }}
                    focusedMemoryId={focusedMemoryId}
                    onClearFocus={() => setFocusedMemoryId(null)}
                    onPopupOpen={(memory) => setSyncedMemory(memory)}
                    onSponsorInfoClick={handleOpenSponsorInfo}
                />

                {/* Helper Overlay */}
                {!isModalOpen && !isRoutingMode && !isDraggablePinMode && !activeMemoryIdForComments && (
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
                    defaultCustomName={lastCustomName}
                    defaultCustomAvatar={lastCustomAvatar}
                />
            )}

            {activeMemoryIdForComments && (
                <CommentModal
                    memoryId={activeMemoryIdForComments}
                    memoryTitle={memories.find(m => m.id === activeMemoryIdForComments)?.location.name || '回憶'}
                    currentUser={user}
                    onClose={() => setActiveMemoryIdForComments(null)}
                    defaultCustomName={lastCustomName}
                    defaultCustomAvatar={lastCustomAvatar}
                    isAdmin={isAdmin}
                />
            )}

            {/* Age Verification & Login Modal - 未登入時強制顯示 */}
            {!user && (
                <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-2xl border border-gray-700 max-w-md w-full p-8 text-center">
                        {/* Header Image */}
                        <div className="mb-6">
                            <img
                                src="https://i.meee.com.tw/Xo1WINx.jpg"
                                alt="肥宅老司機"
                                className="w-32 h-32 mx-auto rounded-full object-cover border-4 border-red-500 shadow-lg shadow-red-500/30"
                            />
                        </div>

                        {/* Title */}
                        <h1 className="text-3xl font-black text-white mb-4">
                            🔞 駕駛資格確認 🔞
                        </h1>

                        {/* Description */}
                        <p className="text-gray-300 text-lg mb-8 leading-relaxed">
                            請問這位老司機，你是否已年滿十八歲，<br />
                            具備合法上路的資格了呢？
                        </p>

                        {/* Buttons */}
                        <div className="flex flex-col gap-4">
                            <button
                                onClick={() => {
                                    // Redirect underage users away
                                    window.location.href = 'https://www.google.com';
                                }}
                                className="w-full py-4 px-6 bg-gray-700 hover:bg-gray-600 text-gray-300 font-bold rounded-xl transition-all duration-300 hover:scale-[1.02] border border-gray-600"
                            >
                                ⬅️ 未滿18歲 請甩尾往左 (確定)
                            </button>

                            <button
                                onClick={async () => {
                                    // Trigger Google login - 登入成功後 user 狀態會改變，Modal 自動消失
                                    await signInWithGoogle();
                                }}
                                className="w-full py-4 px-6 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white font-black rounded-xl transition-all duration-300 hover:scale-[1.02] shadow-lg shadow-red-500/30 text-lg"
                            >
                                🚗 師傅嘗試切他中路 (確定)
                            </button>
                        </div>

                        {/* Footer Note */}
                        <p className="text-gray-500 text-xs mt-6">
                            本站僅供成年人瀏覽，請確認您已年滿18歲
                        </p>
                    </div>
                </div>
            )}

            {/* Global Image Lightbox */}
            {/* About Overlay */}
            <AboutOverlay
                isOpen={isAboutOpen}
                onClose={() => {
                    setIsAboutOpen(false);
                    setAboutTab('about');  // 關閉後重置為預設 tab
                }}
                initialTab={aboutTab}
            />

            {/* 贊助商管理面板 (管理員專用) */}
            {isAdmin && (
                <SponsorAdminPanel
                    isOpen={isSponsorAdminOpen}
                    onClose={() => setIsSponsorAdminOpen(false)}
                    sponsors={sponsors}
                />
            )}

            {lightboxImages.length > 0 && (
                <ImageLightbox
                    images={lightboxImages}
                    initialIndex={lightboxIndex}
                    onClose={() => setLightboxImages([])}
                />
            )}
        </div>
    );
};

export default App;