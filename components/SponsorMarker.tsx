import React, { useMemo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { renderToStaticMarkup } from 'react-dom/server';
import { Sponsor } from '../types';
import { Star, Heart } from 'lucide-react';

interface SponsorMarkerProps {
    sponsor: Sponsor;
    onInfoClick?: () => void;  // 新增：點擊「了解更多」時的 callback
}

// 建立贊助商專用的 3D 懸浮圖示
const createSponsorIcon = (imageUrl: string, name: string) => {
    const svgString = renderToStaticMarkup(
        <div className="sponsor-marker-container">
            {/* 主圖片區域 */}
            <div className="sponsor-marker">
                <img
                    src={imageUrl}
                    alt={name}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        pointerEvents: 'none'
                    }}
                />
            </div>
            {/* 底部光暈效果 */}
            <div className="sponsor-marker-glow"></div>
            {/* 贊助商標籤 */}
            <div className="sponsor-marker-badge">
                <span>⭐ SPONSOR</span>
            </div>
        </div>
    );

    return L.divIcon({
        className: 'sponsor-marker-icon',
        html: svgString,
        iconSize: [120, 160],
        iconAnchor: [60, 150],
        popupAnchor: [0, -140]
    });
};

export const SponsorMarker: React.FC<SponsorMarkerProps> = ({ sponsor, onInfoClick }) => {
    const icon = useMemo(
        () => createSponsorIcon(sponsor.imageUrl, sponsor.name),
        [sponsor.imageUrl, sponsor.name]
    );

    const handleInfoClick = () => {
        // 如果有填連結網址，開啟外部連結
        if (sponsor.linkUrl) {
            window.open(sponsor.linkUrl, '_blank');
        } else {
            // 沒填的話，打開「關於我們」贊助頁面
            if (onInfoClick) {
                onInfoClick();
            }
        }
    };

    return (
        <Marker
            position={[sponsor.location.lat, sponsor.location.lng]}
            icon={icon}
            zIndexOffset={500} // 讓贊助商 Marker 顯示在其他 Marker 上方
        >
            <Popup className="sponsor-popup" minWidth={200}>
                <div className="p-2 text-center">
                    {/* 贊助商圖片 */}
                    <div className="mb-3">
                        <img
                            src={sponsor.imageUrl}
                            alt={sponsor.name}
                            className="w-24 h-24 object-contain mx-auto"
                        />
                    </div>

                    {/* 贊助商名稱 */}
                    <div className="flex items-center justify-center gap-1 mb-2">
                        <Star size={14} className="text-yellow-500 fill-current" />
                        <h3 className="font-bold text-gray-800">{sponsor.name}</h3>
                    </div>

                    {/* 描述 */}
                    {sponsor.description && (
                        <p className="text-xs text-gray-600 mb-3">{sponsor.description}</p>
                    )}

                    {/* 按鈕區域 */}
                    <div className="flex gap-2">
                        {/* 了解更多/前往官網 按鈕 */}
                        <button
                            onClick={handleInfoClick}
                            className="flex-1 py-2 px-3 bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-400 hover:to-red-400 text-white font-bold rounded-lg flex items-center justify-center gap-1 transition-all text-xs shadow-md"
                        >
                            <Heart size={12} />
                            {sponsor.linkUrl ? '前往官網' : '了解更多'}
                        </button>

                        {/* 分享按鈕 */}
                        <button
                            onClick={() => {
                                const shareUrl = `${window.location.origin}${window.location.pathname}?sponsor=${sponsor.id}`;
                                navigator.clipboard.writeText(shareUrl).then(() => {
                                    const btn = document.getElementById(`sponsor-share-btn-${sponsor.id}`);
                                    if (btn) {
                                        btn.textContent = '✅';
                                        setTimeout(() => { btn.textContent = '🔗'; }, 1500);
                                    }
                                });
                            }}
                            id={`sponsor-share-btn-${sponsor.id}`}
                            className="py-2 px-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white font-bold rounded-lg text-xs shadow-md transition-all"
                            title="複製分享連結"
                        >
                            🔗
                        </button>
                    </div>
                </div>
            </Popup>
        </Marker>
    );
};
