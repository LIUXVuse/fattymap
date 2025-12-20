import React, { useState } from 'react';
import { Sponsor } from '../types';
import { addSponsorToFirestore, updateSponsorInFirestore, deleteSponsorFromFirestore } from '../services/firebase';
import { Plus, Edit2, Trash2, X, Save, MapPin, Image, Link, FileText, Power } from 'lucide-react';

interface SponsorAdminPanelProps {
    isOpen: boolean;
    onClose: () => void;
    sponsors: Sponsor[];
}

interface SponsorFormData {
    name: string;
    imageUrl: string;
    lat: string;
    lng: string;
    linkUrl: string;
    description: string;
    isActive: boolean;
}

const emptyForm: SponsorFormData = {
    name: '',
    imageUrl: '',
    lat: '',
    lng: '',
    linkUrl: '',
    description: '',
    isActive: true
};

export const SponsorAdminPanel: React.FC<SponsorAdminPanelProps> = ({ isOpen, onClose, sponsors }) => {
    const [mode, setMode] = useState<'list' | 'add' | 'edit'>('list');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<SponsorFormData>(emptyForm);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleAdd = () => {
        setMode('add');
        setFormData(emptyForm);
        setEditingId(null);
        setError(null);
    };

    const handleEdit = (sponsor: Sponsor) => {
        setMode('edit');
        setEditingId(sponsor.id);
        setFormData({
            name: sponsor.name,
            imageUrl: sponsor.imageUrl,
            lat: sponsor.location.lat.toString(),
            lng: sponsor.location.lng.toString(),
            linkUrl: sponsor.linkUrl || '',
            description: sponsor.description || '',
            isActive: sponsor.isActive
        });
        setError(null);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('確定要刪除這個贊助商嗎？')) return;

        setIsLoading(true);
        try {
            await deleteSponsorFromFirestore(id);
        } catch (e) {
            console.error('Delete error:', e);
            setError('刪除失敗');
        }
        setIsLoading(false);
    };

    const handleSubmit = async () => {
        // 驗證
        if (!formData.name.trim()) {
            setError('請輸入贊助商名稱');
            return;
        }
        if (!formData.imageUrl.trim()) {
            setError('請輸入圖片網址');
            return;
        }
        if (!formData.lat || !formData.lng) {
            setError('請輸入經緯度');
            return;
        }

        const lat = parseFloat(formData.lat);
        const lng = parseFloat(formData.lng);
        if (isNaN(lat) || isNaN(lng)) {
            setError('經緯度格式錯誤');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // 構建資料物件，排除空值欄位 (Firestore 不接受 undefined)
            const sponsorData: Record<string, any> = {
                name: formData.name.trim(),
                imageUrl: formData.imageUrl.trim(),
                location: { lat, lng },
                isActive: formData.isActive
            };

            // 只有非空才加入 (避免 undefined)
            if (formData.linkUrl.trim()) {
                sponsorData.linkUrl = formData.linkUrl.trim();
            }
            if (formData.description.trim()) {
                sponsorData.description = formData.description.trim();
            }

            if (mode === 'add') {
                await addSponsorToFirestore(sponsorData as Omit<Sponsor, 'id'>);
            } else if (mode === 'edit' && editingId) {
                await updateSponsorInFirestore(editingId, sponsorData);
            }

            setMode('list');
            setFormData(emptyForm);
            setEditingId(null);
        } catch (e) {
            console.error('Submit error:', e);
            setError('儲存失敗，請確認權限');
        }
        setIsLoading(false);
    };

    const handleCancel = () => {
        setMode('list');
        setFormData(emptyForm);
        setEditingId(null);
        setError(null);
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

            <div
                className="relative w-full max-w-lg max-h-[85vh] overflow-hidden bg-white rounded-2xl shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-yellow-500 to-orange-500">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        ⭐ 贊助商管理
                        {mode !== 'list' && (
                            <span className="text-sm font-normal opacity-80">
                                - {mode === 'add' ? '新增' : '編輯'}
                            </span>
                        )}
                    </h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-white/20 text-white">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 overflow-y-auto max-h-[calc(85vh-120px)]">
                    {error && (
                        <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    {mode === 'list' ? (
                        <>
                            {/* Add Button */}
                            <button
                                onClick={handleAdd}
                                className="w-full mb-4 py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-md"
                            >
                                <Plus size={20} />
                                新增贊助商
                            </button>

                            {/* Sponsor List */}
                            {sponsors.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    目前沒有贊助商
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {sponsors.map(sponsor => (
                                        <div
                                            key={sponsor.id}
                                            className={`flex items-center gap-3 p-3 rounded-xl border ${sponsor.isActive ? 'bg-white border-gray-200' : 'bg-gray-100 border-gray-300 opacity-60'}`}
                                        >
                                            <img
                                                src={sponsor.imageUrl}
                                                alt={sponsor.name}
                                                className="w-12 h-12 object-contain rounded-lg bg-gray-50"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="font-bold text-gray-800 truncate">{sponsor.name}</div>
                                                <div className="text-xs text-gray-500 truncate">
                                                    📍 {sponsor.location.lat.toFixed(4)}, {sponsor.location.lng.toFixed(4)}
                                                </div>
                                            </div>
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => handleEdit(sponsor)}
                                                    className="p-2 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-600"
                                                    title="編輯"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(sponsor.id)}
                                                    className="p-2 rounded-lg bg-red-100 hover:bg-red-200 text-red-600"
                                                    title="刪除"
                                                    disabled={isLoading}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    ) : (
                        /* Add/Edit Form */
                        <div className="space-y-4">
                            {/* Name */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-1">
                                    <FileText size={14} /> 贊助商名稱 *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    placeholder="例如：肥宅老司機"
                                />
                            </div>

                            {/* Image URL */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-1">
                                    <Image size={14} /> 圖片網址 (PNG 去背) *
                                </label>
                                <input
                                    type="text"
                                    value={formData.imageUrl}
                                    onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    placeholder="https://..."
                                />
                                {formData.imageUrl && (
                                    <div className="mt-2 p-2 bg-gray-100 rounded-lg">
                                        <img src={formData.imageUrl} alt="預覽" className="w-16 h-16 object-contain mx-auto" />
                                    </div>
                                )}
                            </div>

                            {/* Location */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-1">
                                        <MapPin size={14} /> 緯度 (Lat) *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.lat}
                                        onChange={e => setFormData({ ...formData, lat: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        placeholder="25.0330"
                                    />
                                </div>
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-1">
                                        <MapPin size={14} /> 經度 (Lng) *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.lng}
                                        onChange={e => setFormData({ ...formData, lng: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        placeholder="121.5654"
                                    />
                                </div>
                            </div>

                            {/* Link URL */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-1">
                                    <Link size={14} /> 連結網址 (選填)
                                </label>
                                <input
                                    type="text"
                                    value={formData.linkUrl}
                                    onChange={e => setFormData({ ...formData, linkUrl: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    placeholder="https://..."
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-1">
                                    <FileText size={14} /> 說明 (選填)
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                                    rows={2}
                                    placeholder="簡短說明..."
                                />
                            </div>

                            {/* isActive Toggle */}
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
                                    <Power size={14} /> 啟用狀態
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                                    className={`relative w-12 h-6 rounded-full transition-colors ${formData.isActive ? 'bg-green-500' : 'bg-gray-300'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${formData.isActive ? 'left-7' : 'left-1'}`} />
                                </button>
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={handleCancel}
                                    className="flex-1 py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-lg transition-colors"
                                    disabled={isLoading}
                                >
                                    取消
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    className="flex-1 py-2 px-4 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-400 hover:to-yellow-400 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <span className="animate-spin">⏳</span>
                                    ) : (
                                        <>
                                            <Save size={16} />
                                            儲存
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
