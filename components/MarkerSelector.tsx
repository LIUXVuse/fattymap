import React from 'react';
import { Memory, Sponsor } from '../types';
import { MapPin, Star, X } from 'lucide-react';

// 可選項目類型：可以是 Memory 或 Sponsor
export type SelectableItem =
    | { type: 'memory'; data: Memory }
    | { type: 'sponsor'; data: Sponsor };

interface MarkerSelectorProps {
    items: SelectableItem[];
    position: { x: number; y: number };  // 螢幕座標
    onSelect: (item: SelectableItem) => void;
    onClose: () => void;
}

export const MarkerSelector: React.FC<MarkerSelectorProps> = ({
    items,
    position,
    onSelect,
    onClose
}) => {
    if (items.length === 0) return null;

    // 調整位置避免超出螢幕
    const adjustedPosition = {
        x: Math.min(position.x, window.innerWidth - 280),
        y: Math.min(position.y, window.innerHeight - 300)
    };

    return (
        <div
            className="fixed inset-0 z-[1000]"
            onClick={onClose}
        >
            {/* 選擇器面板 */}
            <div
                className="absolute bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-200"
                style={{
                    left: adjustedPosition.x,
                    top: adjustedPosition.y,
                    minWidth: '240px',
                    maxWidth: '300px',
                    maxHeight: '280px'
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                    <span className="text-sm font-bold">🎯 選擇要查看的回憶</span>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full hover:bg-white/20 transition-colors"
                    >
                        <X size={14} />
                    </button>
                </div>

                {/* 項目列表 */}
                <div className="overflow-y-auto max-h-[220px] divide-y divide-gray-100">
                    {items.map((item, index) => (
                        <button
                            key={item.type === 'memory' ? item.data.id : item.data.id}
                            className="w-full flex items-center gap-3 p-3 hover:bg-blue-50 transition-colors text-left group"
                            onClick={() => onSelect(item)}
                            style={{
                                animation: `slideIn 0.2s ease-out ${index * 0.05}s both`
                            }}
                        >
                            {item.type === 'memory' ? (
                                <>
                                    {/* Memory 項目 */}
                                    <div
                                        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                                        style={{ backgroundColor: item.data.markerColor || '#3b82f6' }}
                                    >
                                        <MapPin size={14} className="text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-bold text-gray-800 text-sm truncate group-hover:text-blue-600">
                                            {item.data.location.name || item.data.content.substring(0, 20)}
                                        </div>
                                        <div className="text-xs text-gray-500 truncate">
                                            {item.data.author || '匿名用戶'}
                                        </div>
                                    </div>
                                    {item.data.photos && item.data.photos.length > 0 && (
                                        <img
                                            src={item.data.photos[0]}
                                            alt=""
                                            className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                                        />
                                    )}
                                </>
                            ) : (
                                <>
                                    {/* Sponsor 項目 */}
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center flex-shrink-0">
                                        <Star size={14} className="text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-bold text-gray-800 text-sm truncate group-hover:text-orange-600 flex items-center gap-1">
                                            ⭐ {item.data.name}
                                        </div>
                                        <div className="text-xs text-orange-500">
                                            贊助商
                                        </div>
                                    </div>
                                    <img
                                        src={item.data.imageUrl}
                                        alt=""
                                        className="w-10 h-10 rounded-lg object-contain flex-shrink-0 bg-gray-50"
                                    />
                                </>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* CSS 動畫 */}
            <style>{`
                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateX(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
            `}</style>
        </div>
    );
};
