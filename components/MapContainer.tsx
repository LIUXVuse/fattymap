import React, { useEffect, useMemo } from 'react';
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
    Wifi, Bath, ParkingSquare, User, Stethoscope, Library, GraduationCap, // Amenity (Replaced Hospital with Stethoscope)
    Dumbbell, Trophy, Medal, Gamepad2, Music, Ticket, Palmtree, // Activity
    Building2, Briefcase, Landmark, Flag, Bell, Info, AlertTriangle, Ghost, // Other
    // New Icons
    Smile, Laugh, Frown, Meh, Baby, Users, UserPlus, Skull, // Faces/People
    Crown, Gem, Sparkles, Zap, PartyPopper, Bomb, Umbrella, Key, Lock, Unlock, Eye, Ear, Hand, // Misc
    // More New Icons (Requested)
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
    user_round: UserRound, // Girl/Boy neutral
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
    wine: Wine, // Wine Glass
    martini: Martini, // Cocktail
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
    camera: Camera, // Sightseeing
    tree: TreePine,
    mountain: Mountain,
    flower: Flower,
    leaf: Leaf,
    sun: Sun,
    rain: CloudRain,
    snow: Snowflake,
    fire: Flame, // Dragon (Fire)
    water: Droplets,
    wind: Wind,
    umbrella: Umbrella,
    waves: Waves, // Snake (Curvy line)

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
    hospital: Stethoscope, // Map 'hospital' string to Stethoscope icon
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
    mic: Mic, // Singing/Lips related
    megaphone: Megaphone, // Speaker

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
        // 使用 inline style 確保陰影效果
        style={{ filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.3))' }}
        xmlns="http://www.w3.org/2000/svg"
    >
        {/* 標準 MapPin 路徑，但沒有中間的圓孔，填充後為實心 */}
        <path d="M20 10c0 6-9 13-9 13s-9-7-9-13a9 9 0 0 1 18 0Z" />
    </svg>
);

// Create a custom DivIcon with dynamic color SVG and Icon
const createCustomMarker = (color: string, iconType: MarkerIconType = 'default', isDraggable: boolean = false) => {
    const IconComponent = ICON_MAP[iconType] || MapPin;

    // 改用 Inline Styles 以確保在 Leaflet DivIcon 中定位絕對正確
    // 避免 Tailwind CSS 載入時序或權重問題導致 Icon 被遮擋
    const svgString = renderToStaticMarkup(
        <div style={{ position: 'relative', width: '40px', height: '40px', display: 'flex', justifyContent: 'center', alignItems: 'center' }} className={isDraggable ? 'animate-bounce' : ''}>
             {/* Background: 絕對定位在最底層 */}
             <div style={{ position: 'absolute', top: 0, left: 0, zIndex: 0 }}>
                 <SolidMapPin color={color} />
             </div>
             
             {/* Inner Icon: 相對定位，層級較高，並微調垂直位置以視覺置中 */}
             <div style={{ position: 'relative', zIndex: 10, marginTop: '-5px', color: 'white', display: 'flex' }}>
                <IconComponent size={18} strokeWidth={2.5} />
             </div>
        </div>
    );

    return L.divIcon({
        className: 'custom-marker-icon', 
        html: svgString,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40]
    });
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
  
  useEffect(() => {
    if (center) {
        map.flyTo(center, Math.max(map.getZoom(), 15), { duration: 1.5 });
    }
  }, [center, map]);
  
  return null;
};

// Draggable Pin Component
const DraggablePin: React.FC<{ position: [number, number], onDragEnd: (lat: number, lng: number) => void }> = ({ position, onDragEnd }) => {
    const markerRef = React.useRef<L.Marker>(null);
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
      <LeafletMap center={center} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false}>
        
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

        {memories.map((memory) => {
            const isSelectedInRoute = routePoints.includes(memory.id);
            const icon = createCustomMarker(memory.markerColor || '#3b82f6', memory.markerIcon || 'default');

            return (
              <Marker 
                key={memory.id} 
                position={[memory.location.lat, memory.location.lng]}
                icon={icon}
                eventHandlers={{
                    click: () => {
                        if (isRoutingMode && onMarkerClick) {
                            onMarkerClick(memory.id);
                        }
                    }
                }}
                opacity={isRoutingMode && !isSelectedInRoute && routePoints.length > 0 ? 0.5 : 1}
              >
                {!isRoutingMode && !isDraggablePinMode && (
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
        })}
      </LeafletMap>
    </div>
  );
};