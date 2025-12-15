import React, { useEffect, useMemo, useRef } from 'react';
import { MapContainer as LeafletMap, TileLayer, Marker, Popup, useMapEvents, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { Memory, MarkerIconType } from '../types';
import { renderToStaticMarkup } from 'react-dom/server';
import { 
    MapPin, Utensils, Coffee, Camera, BedDouble, Train, ShoppingBag, Star, Heart, Home,
    Beer, Wine, Pizza, Cake, IceCream, // Eat & Drink
    Tent, Building, Castle, // Accommodation
    Bus, Car, Plane, Bike, Ship, Anchor, Rocket, Fuel, Footprints, // Transport
    TreePine, Mountain, Flower, Leaf, Sun, CloudRain, Snowflake, Flame, Droplets, Wind, // Nature
    ShoppingCart, Gift, CreditCard, Banknote, Tag, Store, // Shop
    Wifi, Bath, ParkingSquare, User, Stethoscope, Library, GraduationCap, // Amenity
    Dumbbell, Trophy, Medal, Gamepad2, Music, Ticket, Palmtree, // Activity
    Building2, Briefcase, Landmark, Flag, Bell, Info, AlertTriangle, Ghost, // Other
    // New Icons
    Smile, Laugh, Frown, Meh, Baby, Users, UserPlus, Skull, // Faces/People
    Crown, Gem, Sparkles, Zap, PartyPopper, Bomb, Umbrella, Key, Lock, Unlock, Eye, Ear, Hand, // Misc
    // More New Icons
    Martini, Megaphone, Mic, Sword, Shield, Waves, UserRound
} from 'lucide-react';

// 建立完整的圖示映射表
export const ICON_MAP: Record<string, React.ElementType> = {
    // Basic
    default: MapPin,
    star: Star,
    heart: Heart,
    home: Home,
    
    // Faces & People
    user: User,
    user_round: UserRound,
    users: Users,
    user_plus: UserPlus,
    baby: Baby,
    smile: Smile,
    laugh: Laugh,
    sad: Frown,
    meh: Meh,
    skull: Skull,
    eye: Eye,
    ear: Ear,
    hand: Hand,
    ghost: Ghost,

    // Eat & Drink
    food: Utensils,
    coffee: Coffee,
    beer: Beer,
    wine: Wine,
    martini: Martini,
    pizza: Pizza,
    cake: Cake,
    icecream: IceCream,

    // Accommodation
    bed: BedDouble,
    tent: Tent,
    hotel: Building,
    castle: Castle,

    // Transport
    train: Train,
    bus: Bus,
    car: Car,
    plane: Plane,
    bike: Bike,
    ship: Ship,
    anchor: Anchor,
    rocket: Rocket,
    fuel: Fuel,
    walk: Footprints,

    // Nature
    camera: Camera,
    tree: TreePine,
    mountain: Mountain,
    flower: Flower,
    leaf: Leaf,
    sun: Sun,
    rain: CloudRain,
    snow: Snowflake,
    fire: Flame,
    water: Droplets,
    wind: Wind,
    umbrella: Umbrella,
    waves: Waves,

    // Shopping
    shopping: ShoppingBag,
    cart: ShoppingCart,
    gift: Gift,
    card: CreditCard,
    money: Banknote,
    tag: Tag,
    store: Store,
    gem: Gem,

    // Amenity & Service
    wifi: Wifi,
    bath: Bath,
    parking: ParkingSquare,
    restroom: User,
    hospital: Stethoscope,
    library: Library,
    school: GraduationCap,
    key: Key,
    lock: Lock,
    unlock: Unlock,

    // Activity
    gym: Dumbbell,
    trophy: Trophy,
    medal: Medal,
    game: Gamepad2,
    music: Music,
    ticket: Ticket,
    beach: Palmtree,
    party: PartyPopper,
    mic: Mic,
    megaphone: Megaphone,

    // Admin / Misc
    office: Building2,
    work: Briefcase,
    museum: Landmark,
    flag: Flag,
    bell: Bell,
    info: Info,
    alert: AlertTriangle,
    
    crown: Crown,
    sparkles: Sparkles,
    zap: Zap,
    bomb: Bomb,
    sword: Sword, 
    shield: Shield
};

// Custom Solid Map Pin SVG (No hole in center)
const SolidMapPin = ({ color }: { color: string }) => (
    <svg 
        width="40" 
        height="40" 
        viewBox="0 0 24 24" 
        fill={color} 
        stroke={color} 
        strokeWidth="1" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        style={{ filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.3))' }}
        xmlns="http://www.w3.org/2000/svg"
    >
        <path d="M20 10c0 6-9 13-9 13s-9-7-9-13a9 9 0 0 1 18 0Z" />
    </svg>
);

// ----------------------------------------------------------------------
// 優化重點 1: Icon 快取 (Global Cache)
// 避免每次 Render 都重新執行 renderToStaticMarkup
// ----------------------------------------------------------------------
const iconCache: Record<string, L.DivIcon> = {};

const createCustomMarker = (color: string, iconType: MarkerIconType = 'default', isDraggable: boolean = false) => {
    // 建立快取 Key
    const cacheKey = `${color}-${iconType}-${isDraggable}`;

    // 如果快取中有，直接回傳
    if (iconCache[cacheKey]) {
        return iconCache[cacheKey];
    }

    // 如果沒有，則生成並寫入快取
    const IconComponent = ICON_MAP[iconType] || MapPin;

    const svgString = renderToStaticMarkup(
        <div style={{ position: 'relative', width: '40px', height: '40px', display: 'flex', justifyContent: 'center', alignItems: 'center' }} className={isDraggable ? 'animate-bounce' : ''}>
             <div style={{ position: 'absolute', top: 0, left: 0, zIndex: 0 }}>
                 <SolidMapPin color={color} />
             </div>
             
             <div style={{ position: 'relative', zIndex: 10, marginTop: '-5px', color: 'white', display: 'flex' }}>
                <IconComponent size={18} strokeWidth={2.5} />
             </div>
        </div>
    );

    const newIcon = L.divIcon({
        className: 'custom-marker-icon', 
        html: svgString,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40]
    });

    iconCache[cacheKey] = newIcon;
    return newIcon;
};

interface MapContainerProps {
  memories: Memory[];
  onMapClick: (lat: number, lng: number) => void;
  center: [number, number];
  routePoints: string[]; 
  onMarkerClick?: (memoryId: string) => void;
  isRoutingMode: boolean;
  isDraggablePinMode: boolean; 
  onDragEnd: (lat: number, lng: number) => void; 
}

// Map Events Handler (Click)
const MapEvents: React.FC<{ onClick: (lat: number, lng: number) => void, isRouting: boolean, isDragging: boolean }> = ({ onClick, isRouting, isDragging }) => {
  useMapEvents({
    click(e) {
      if (!isRouting && !isDragging) {
         onClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
};

// Map View Updater
const MapUpdater: React.FC<{ center: [number, number] }> = ({ center }) => {
  const map = useMap();
  // 使用 useRef 紀錄上次的 center，避免微小變動造成的重複呼叫
  const lastCenter = useRef<string>('');

  useEffect(() => {
    if (center) {
        const centerKey = `${center[0]},${center[1]}`;
        if (lastCenter.current !== centerKey) {
            map.flyTo(center, Math.max(map.getZoom(), 15), { duration: 1.5 });
            lastCenter.current = centerKey;
        }
    }
  }, [center, map]);
  
  return null;
};

// Draggable Pin Component
const DraggablePin: React.FC<{ position: [number, number], onDragEnd: (lat: number, lng: number) => void }> = ({ position, onDragEnd }) => {
    const markerRef = useRef<L.Marker>(null);
    // 使用 useMemo 確保 icon 不會因為 re-render 而重新建立實例
    const icon = useMemo(() => createCustomMarker('#ef4444', 'default', true), []);
    
    const eventHandlers = useMemo(
        () => ({
            dragend() {
                const marker = markerRef.current;
                if (marker != null) {
                    const { lat, lng } = marker.getLatLng();
                    onDragEnd(lat, lng);
                }
            },
        }),
        [onDragEnd],
    );

    return (
        <Marker
            draggable={true}
            eventHandlers={eventHandlers}
            position={position}
            ref={markerRef}
            icon={icon}
            zIndexOffset={1000} 
        />
    )
}

// ----------------------------------------------------------------------
// 優化重點 2: 獨立的 Marker Component 並使用 React.memo
// 這樣當地圖移動時，個別的 Marker 不會重新渲染，大幅降低 DOM 操作
// ----------------------------------------------------------------------
interface MemoryMarkerProps {
    memory: Memory;
    isRoutingMode: boolean;
    isSelectedInRoute: boolean;
    hasRoutePoints: boolean;
    onMarkerClick?: (memoryId: string) => void;
}

const MemoryMarker = React.memo(({ memory, isRoutingMode, isSelectedInRoute, hasRoutePoints, onMarkerClick }: MemoryMarkerProps) => {
    
    // 從快取取得 icon，依賴項改變時才會重新計算 (雖然有 global cache，但 useMemo 確保 reference 穩定)
    const icon = useMemo(() => 
        createCustomMarker(memory.markerColor || '#3b82f6', memory.markerIcon || 'default'), 
        [memory.markerColor, memory.markerIcon]
    );

    const eventHandlers = useMemo(() => ({
        click: () => {
            if (isRoutingMode && onMarkerClick) {
                onMarkerClick(memory.id);
            }
        }
    }), [isRoutingMode, onMarkerClick, memory.id]);

    const opacity = isRoutingMode && !isSelectedInRoute && hasRoutePoints ? 0.5 : 1;

    return (
        <Marker 
            position={[memory.location.lat, memory.location.lng]}
            icon={icon}
            eventHandlers={eventHandlers}
            opacity={opacity}
        >
            {!isRoutingMode && (
                <Popup className="custom-popup" minWidth={280}>
                    <div className="p-1">
                        {/* Category Badge */}
                        <div className="flex gap-1 mb-2">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold text-white shadow-sm" style={{ backgroundColor: memory.markerColor }}>
                                {memory.category.main}
                                </span>
                                {memory.category.sub && (
                                <span className="px-2 py-0.5 rounded text-[10px] bg-gray-100 text-gray-600 border border-gray-200">
                                    {memory.category.sub}
                                </span>
                                )}
                                <span className="px-2 py-0.5 rounded text-[10px] bg-gray-100 text-gray-600 border border-gray-200 ml-auto">
                                {memory.region.country}
                                </span>
                        </div>

                        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-100">
                                <div 
                                className="w-8 h-8 rounded-full flex items-center justify-center text-xs text-white font-bold shadow-sm"
                                style={{ backgroundColor: memory.markerColor }}
                                >
                                {memory.isAnonymous ? '?' : memory.author.charAt(0)}
                                </div>
                                <div>
                                <h3 className="font-bold text-gray-800 text-sm">
                                    {memory.isAnonymous ? '匿名老司機' : memory.author}
                                </h3>
                                <div className="text-[10px] text-gray-500">{new Date(memory.timestamp).toLocaleDateString()}</div>
                                </div>
                        </div>
                        
                        <h4 className="font-bold text-gray-900 text-base mb-1">{memory.location.name}</h4>
                        <p className="text-gray-500 text-xs mb-2">{memory.location.address}</p>

                        <p className="text-gray-700 text-sm mb-3 leading-relaxed bg-gray-50 p-2 rounded">{memory.content}</p>
                        
                        {memory.photos.length > 0 && (
                            <div className="rounded-lg overflow-hidden border border-gray-200 mb-2 shadow-sm">
                                    <img src={memory.photos[0]} className="w-full h-32 object-cover" alt="story" />
                            </div>
                        )}
                        
                        <a href={`https://www.google.com/maps/dir/?api=1&destination=${memory.location.lat},${memory.location.lng}`} 
                            target="_blank" 
                            rel="noreferrer"
                            className="block text-center mt-3 text-xs bg-blue-50 text-blue-600 py-2 rounded-lg hover:bg-blue-100 font-bold transition-colors"
                        >
                            前進此地 (Google 導航)
                        </a>
                    </div>
                </Popup>
            )}
        </Marker>
    );
});


export const AppMap: React.FC<MapContainerProps> = ({ 
    memories, 
    onMapClick, 
    center, 
    routePoints, 
    onMarkerClick, 
    isRoutingMode,
    isDraggablePinMode,
    onDragEnd
}) => {
  
  const routePositions = useMemo(() => {
      return routePoints
        .map(id => memories.find(m => m.id === id))
        .filter((m): m is Memory => !!m)
        .map(m => [m.location.lat, m.location.lng] as [number, number]);
  }, [routePoints, memories]);

  return (
    <div className="h-full w-full z-0 bg-white">
      {/* 關閉 zoomControl 以獲得更乾淨的 UI，若有需要可開啟 */}
      <LeafletMap center={center} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false} preferCanvas={true}>
        
        {/* GOOGLE MAPS TILE LAYER */}
        <TileLayer
          attribution='&copy; Google Maps'
          url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&hl=zh-TW"
          maxZoom={20}
        />
        
        <MapEvents onClick={onMapClick} isRouting={isRoutingMode} isDragging={isDraggablePinMode} />
        <MapUpdater center={center} />

        {/* Navigation Route Line */}
        {routePositions.length > 1 && (
            <Polyline 
                positions={routePositions} 
                pathOptions={{ color: '#3b82f6', weight: 5, opacity: 0.7, dashArray: '10, 10' }} 
            />
        )}
        
        {/* Special Draggable Pin for creating new memories */}
        {isDraggablePinMode && (
            <DraggablePin position={center} onDragEnd={onDragEnd} />
        )}

        {/* Render Memoized Markers */}
        {memories.map((memory) => (
            <MemoryMarker 
                key={memory.id}
                memory={memory}
                isRoutingMode={isRoutingMode}
                isSelectedInRoute={routePoints.includes(memory.id)}
                hasRoutePoints={routePoints.length > 0}
                onMarkerClick={onMarkerClick}
            />
        ))}

      </LeafletMap>
    </div>
  );
};