import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageLightboxProps {
    images: string[];
    initialIndex?: number;
    onClose: () => void;
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({
    images,
    initialIndex = 0,
    onClose
}) => {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);

    // 鍵盤導航
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowLeft') goToPrev();
            if (e.key === 'ArrowRight') goToNext();
        };

        window.addEventListener('keydown', handleKeyDown);
        // 防止背景滾動
        document.body.style.overflow = 'hidden';

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [currentIndex]);

    const goToPrev = () => {
        setCurrentIndex(prev => prev > 0 ? prev - 1 : images.length - 1);
    };

    const goToNext = () => {
        setCurrentIndex(prev => prev < images.length - 1 ? prev + 1 : 0);
    };

    if (images.length === 0) return null;

    return (
        <div
            className="fixed inset-0 z-[9999] bg-black/95 animate-in fade-in duration-200"
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0
            }}
            onClick={onClose}
        >
            {/* 關閉按鈕 */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors z-10"
                style={{ position: 'fixed', top: '16px', right: '16px' }}
            >
                <X size={28} />
            </button>

            {/* 圖片計數器 */}
            {images.length > 1 && (
                <div
                    className="text-white/70 text-sm bg-black/50 px-3 py-1 rounded-full"
                    style={{ position: 'fixed', top: '16px', left: '50%', transform: 'translateX(-50%)' }}
                >
                    {currentIndex + 1} / {images.length}
                </div>
            )}

            {/* 左箭頭 */}
            {images.length > 1 && (
                <button
                    onClick={(e) => { e.stopPropagation(); goToPrev(); }}
                    className="text-white/70 hover:text-white p-3 rounded-full hover:bg-white/10 transition-colors"
                    style={{ position: 'fixed', left: '16px', top: '50%', transform: 'translateY(-50%)' }}
                >
                    <ChevronLeft size={36} />
                </button>
            )}

            {/* 主圖片 - 使用 fixed 定位確保居中 */}
            <img
                src={images[currentIndex]}
                alt={`Image ${currentIndex + 1}`}
                className="max-w-[90vw] max-h-[80vh] object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-200"
                style={{
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)'
                }}
                onClick={(e) => e.stopPropagation()}
            />

            {/* 右箭頭 */}
            {images.length > 1 && (
                <button
                    onClick={(e) => { e.stopPropagation(); goToNext(); }}
                    className="text-white/70 hover:text-white p-3 rounded-full hover:bg-white/10 transition-colors"
                    style={{ position: 'fixed', right: '16px', top: '50%', transform: 'translateY(-50%)' }}
                >
                    <ChevronRight size={36} />
                </button>
            )}

            {/* 縮圖列表 */}
            {images.length > 1 && (
                <div
                    className="flex gap-2 p-2 bg-black/50 rounded-lg max-w-[80vw] overflow-x-auto"
                    style={{ position: 'fixed', bottom: '16px', left: '50%', transform: 'translateX(-50%)' }}
                >
                    {images.map((img, idx) => (
                        <button
                            key={idx}
                            onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); }}
                            className={`shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${idx === currentIndex
                                ? 'border-white scale-105'
                                : 'border-transparent opacity-60 hover:opacity-100'
                                }`}
                        >
                            <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
