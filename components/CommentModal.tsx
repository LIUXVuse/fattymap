import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Image as ImageIcon, Loader2, User as UserIcon, Globe, Edit3, Upload, Edit2, Trash2, Check } from 'lucide-react';
import { Comment } from '../types';
import { subscribeToComments, addCommentToFirestore, uploadImage, updateCommentInFirestore, deleteCommentFromFirestore } from '../services/firebase';
import { User } from 'firebase/auth';

interface CommentModalProps {
    memoryId: string;
    memoryTitle: string;
    currentUser: User | null;
    onClose: () => void;
    defaultCustomName?: string;
    defaultCustomAvatar?: string;
    isAdmin?: boolean;
}

type IdentityType = 'google' | 'custom' | 'anonymous';

export const CommentModal: React.FC<CommentModalProps> = ({
    memoryId,
    memoryTitle,
    currentUser,
    onClose,
    defaultCustomName,
    defaultCustomAvatar,
    isAdmin
}) => {
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 編輯模式狀態
    const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
    const [editingContent, setEditingContent] = useState('');

    // 圖片上傳 (留言附圖 - 支援多圖)
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);

    // Identity State
    const [identityType, setIdentityType] = useState<IdentityType>('google');
    const [customName, setCustomName] = useState('');
    const [customAvatarFile, setCustomAvatarFile] = useState<File | null>(null);
    const [customAvatarPreview, setCustomAvatarPreview] = useState<string>('');

    const commentsEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const MAX_CHARS = 150;
    const MIN_CHARS = 2;
    const MAX_IMAGES = 5; // 留言最多上傳 5 張圖

    // 初始化身分設定
    useEffect(() => {
        // 優先讀取 LocalStorage (即時修正)
        const savedName = localStorage.getItem('lastCustomName');
        const savedAvatar = localStorage.getItem('lastCustomAvatar');

        if (savedName) setCustomName(savedName);
        if (savedAvatar) setCustomAvatarPreview(savedAvatar);
        else if (defaultCustomAvatar) setCustomAvatarPreview(defaultCustomAvatar);

        if (currentUser) {
            setIdentityType('google');
        } else if (savedName || defaultCustomName) {
            setIdentityType('custom');
        } else {
            setIdentityType('custom'); // 預設給 Custom 讓用戶輸入
        }
    }, [currentUser, defaultCustomName, defaultCustomAvatar]);

    useEffect(() => {
        const unsubscribe = subscribeToComments(memoryId, (data) => {
            setComments(data);
        });
        return () => unsubscribe();
    }, [memoryId]);

    useEffect(() => {
        // 自動捲動到底部
        if (commentsEndRef.current) {
            commentsEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [comments]);

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files);
            const remainingSlots = MAX_IMAGES - imageFiles.length;
            const filesToAdd = newFiles.slice(0, remainingSlots);

            filesToAdd.forEach(file => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setImagePreviews(prev => [...prev, reader.result as string]);
                };
                reader.readAsDataURL(file);
            });

            setImageFiles(prev => [...prev, ...filesToAdd]);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleCustomAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    const removeImage = (index: number) => {
        setImageFiles(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const clearAllImages = () => {
        setImageFiles([]);
        setImagePreviews([]);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newComment.length < MIN_CHARS || isSubmitting) return;

        setIsSubmitting(true);
        try {
            // 1. 上傳留言附圖 (支援多圖)
            const uploadedImageUrls: string[] = [];
            for (let i = 0; i < imageFiles.length; i++) {
                const url = await uploadImage(imageFiles[i], `comments/${memoryId}/${Date.now()}_reply_${i}`);
                uploadedImageUrls.push(url);
            }

            // 2. 決定身分與上傳自訂頭像
            let authorName = '匿名路人';
            let authorAvatar = '';
            let userId = currentUser?.uid;

            if (identityType === 'google' && currentUser) {
                authorName = currentUser.displayName || 'Google User';
                authorAvatar = currentUser.photoURL || '';
            } else if (identityType === 'custom') {
                authorName = customName || '老司機';

                // 處理自訂頭像上傳
                if (customAvatarFile) {
                    authorAvatar = await uploadImage(customAvatarFile, `avatars/guest/${Date.now()}_avatar`);
                } else {
                    authorAvatar = customAvatarPreview;
                }

                // **關鍵修復**: 寫入 LocalStorage 記住身分
                localStorage.setItem('lastCustomName', authorName);
                if (authorAvatar) {
                    localStorage.setItem('lastCustomAvatar', authorAvatar);
                }
            } else {
                // Anonymous
                authorName = '匿名老司機';
            }

            const commentData: Omit<Comment, "id"> = {
                memoryId,
                author: authorName,
                authorAvatar: authorAvatar,
                content: newComment,
                images: uploadedImageUrls, // 新的多圖欄位
                imageUrl: uploadedImageUrls[0] || '', // 向下相容
                timestamp: Date.now(),
                userId: userId
            };

            await addCommentToFirestore(memoryId, commentData);

            setNewComment('');
            clearAllImages();

        } catch (error) {
            console.error("Post comment error:", error);
            alert("留言失敗，請稍後再試");
        } finally {
            setIsSubmitting(false);
        }
    };

    // 判斷是否有權限編輯/刪除留言 (本人或管理員)
    const canEditComment = (comment: Comment) => {
        if (isAdmin) return true;
        if (currentUser && comment.userId === currentUser.uid) return true;
        return false;
    };

    // 開始編輯留言
    const handleEditComment = (comment: Comment) => {
        setEditingCommentId(comment.id);
        setEditingContent(comment.content);
    };

    // 儲存編輯
    const handleSaveEdit = async () => {
        if (!editingCommentId || !editingContent.trim()) return;

        try {
            await updateCommentInFirestore(memoryId, editingCommentId, {
                content: editingContent.trim()
            });
            setEditingCommentId(null);
            setEditingContent('');
        } catch (error) {
            console.error("Edit comment error:", error);
            alert("編輯失敗，請稍後再試");
        }
    };

    // 取消編輯
    const handleCancelEdit = () => {
        setEditingCommentId(null);
        setEditingContent('');
    };

    // 刪除留言
    const handleDeleteComment = async (commentId: string) => {
        if (!window.confirm("確定要刪除這則留言嗎？")) return;

        try {
            await deleteCommentFromFirestore(memoryId, commentId);
        } catch (error) {
            console.error("Delete comment error:", error);
            alert("刪除失敗，請稍後再試");
        }
    };

    return (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            {/* Modal Content */}
            <div className="relative w-full max-w-md bg-white/70 backdrop-blur-xl border border-white/50 shadow-2xl rounded-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="p-4 border-b border-gray-200/50 flex justify-between items-center bg-white/40">
                    <div>
                        <h3 className="font-bold text-gray-800">留言板</h3>
                        <p className="text-xs text-gray-500 truncate max-w-[200px]">關於: {memoryTitle}</p>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-black/10 rounded-full transition-colors">
                        <X size={20} className="text-gray-600" />
                    </button>
                </div>

                {/* Comments List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white/20">
                    {comments.length === 0 ? (
                        <div className="text-center py-10 text-gray-400 text-sm">
                            還沒有人留言，搶頭香！
                        </div>
                    ) : (
                        comments.map(comment => (
                            <div key={comment.id} className="flex gap-3 animate-in fade-in slide-in-from-bottom-2">
                                <div className="shrink-0 mt-1">
                                    {comment.authorAvatar ? (
                                        <img src={comment.authorAvatar} className="w-8 h-8 rounded-full object-cover shadow-sm border border-white" alt="avatar" />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold border border-white shadow-sm">
                                            {comment.author.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="bg-white/60 p-3 rounded-2xl rounded-tl-none shadow-sm border border-white/50">
                                        <div className="flex justify-between items-baseline mb-1">
                                            <span className="font-bold text-sm text-gray-800">{comment.author}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] text-gray-400">{new Date(comment.timestamp).toLocaleString()}</span>
                                                {/* 編輯/刪除按鈕 (僅本人或管理員可見) */}
                                                {canEditComment(comment) && editingCommentId !== comment.id && (
                                                    <div className="flex items-center gap-0.5">
                                                        <button
                                                            onClick={() => handleEditComment(comment)}
                                                            className="p-1 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors"
                                                            title="編輯"
                                                        >
                                                            <Edit2 size={12} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteComment(comment.id)}
                                                            className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                                            title="刪除"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* 編輯模式 vs 顯示模式 */}
                                        {editingCommentId === comment.id ? (
                                            <div className="space-y-2">
                                                <textarea
                                                    value={editingContent}
                                                    onChange={(e) => setEditingContent(e.target.value)}
                                                    className="w-full bg-white border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none resize-none"
                                                    rows={2}
                                                    maxLength={MAX_CHARS}
                                                    autoFocus
                                                />
                                                <div className="flex justify-end gap-1.5">
                                                    <button
                                                        onClick={handleCancelEdit}
                                                        className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                                                    >
                                                        取消
                                                    </button>
                                                    <button
                                                        onClick={handleSaveEdit}
                                                        disabled={!editingContent.trim()}
                                                        className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded flex items-center gap-1 transition-colors"
                                                    >
                                                        <Check size={12} /> 儲存
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-700 whitespace-pre-wrap break-words leading-relaxed">
                                                {comment.content}
                                            </p>
                                        )}

                                        {/* 留言圖片 - 支援多圖 (向下相容舊資料) */}
                                        {(comment.images && comment.images.length > 0) ? (
                                            <div className="mt-2 flex gap-1.5 overflow-x-auto">
                                                {comment.images.map((img, idx) => (
                                                    <div key={idx} className="rounded-lg overflow-hidden border border-gray-200 shrink-0">
                                                        <img src={img} className="w-20 h-20 object-cover" alt={`reply-${idx + 1}`} />
                                                    </div>
                                                ))}
                                            </div>
                                        ) : comment.imageUrl ? (
                                            <div className="mt-2 rounded-lg overflow-hidden border border-gray-200">
                                                <img src={comment.imageUrl} className="max-h-40 w-full object-cover" alt="reply" />
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                    <div ref={commentsEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-3 bg-white/80 border-t border-gray-200/50 flex flex-col gap-2">

                    {/* Identity Selector */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                        {currentUser && (
                            <button
                                type="button"
                                onClick={() => setIdentityType('google')}
                                className={`shrink-0 py-1 px-2 rounded-lg text-[10px] font-bold border transition-all flex items-center gap-1 ${identityType === 'google' ? 'bg-blue-50 border-blue-400 text-blue-600' : 'border-transparent text-gray-500 hover:bg-black/5'}`}
                            >
                                <UserIcon size={12} /> Google: {currentUser.displayName}
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => setIdentityType('custom')}
                            className={`shrink-0 py-1 px-2 rounded-lg text-[10px] font-bold border transition-all flex items-center gap-1 ${identityType === 'custom' ? 'bg-blue-50 border-blue-400 text-blue-600' : 'border-transparent text-gray-500 hover:bg-black/5'}`}
                        >
                            <Edit3 size={12} /> 自訂身分
                        </button>
                        <button
                            type="button"
                            onClick={() => setIdentityType('anonymous')}
                            className={`shrink-0 py-1 px-2 rounded-lg text-[10px] font-bold border transition-all flex items-center gap-1 ${identityType === 'anonymous' ? 'bg-blue-50 border-blue-400 text-blue-600' : 'border-transparent text-gray-500 hover:bg-black/5'}`}
                        >
                            <Globe size={12} /> 匿名
                        </button>
                    </div>

                    {/* Custom Identity Inputs */}
                    {identityType === 'custom' && (
                        <div className="flex items-center gap-2 p-2 bg-gray-50/80 rounded-lg animate-in fade-in slide-in-from-top-1">
                            <div className="relative group cursor-pointer w-8 h-8 shrink-0">
                                <div className="w-8 h-8 rounded-full bg-white overflow-hidden border border-gray-300 flex items-center justify-center">
                                    {customAvatarPreview ? <img src={customAvatarPreview} className="w-full h-full object-cover" /> : <Upload size={14} className="text-gray-400" />}
                                </div>
                                <input type="file" accept="image/*" onChange={handleCustomAvatarSelect} className="absolute inset-0 opacity-0 cursor-pointer" />
                            </div>
                            <input
                                type="text"
                                value={customName}
                                onChange={(e) => setCustomName(e.target.value)}
                                placeholder="輸入顯示暱稱..."
                                className="flex-1 bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none px-1 py-1 text-xs font-bold text-gray-700"
                                autoFocus
                            />
                        </div>
                    )}

                    {/* Image Preview (Comment Images - 多圖) */}
                    {imagePreviews.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto pb-2 mb-1">
                            {imagePreviews.map((preview, idx) => (
                                <div key={idx} className="relative w-14 h-14 shrink-0 group">
                                    <img src={preview} className="w-full h-full object-cover rounded-lg border border-gray-300" alt={`preview-${idx + 1}`} />
                                    <button
                                        type="button"
                                        onClick={() => removeImage(idx)}
                                        className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 shadow-md opacity-70 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X size={10} />
                                    </button>
                                    <div className="absolute bottom-0.5 right-0.5 bg-black/60 text-white text-[8px] px-1 rounded">
                                        {idx + 1}
                                    </div>
                                </div>
                            ))}
                            {imagePreviews.length < MAX_IMAGES && (
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-14 h-14 shrink-0 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors"
                                >
                                    <ImageIcon size={18} />
                                </button>
                            )}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="flex items-end gap-2">
                        <div className="flex-1 relative">
                            <textarea
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="寫下你的想法..."
                                className="w-full bg-gray-50/50 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none resize-none pr-10 min-h-[44px] max-h-[100px]"
                                rows={1}
                                maxLength={MAX_CHARS}
                                disabled={isSubmitting}
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute right-2 bottom-2 text-gray-400 hover:text-blue-500 transition-colors"
                            >
                                <ImageIcon size={18} />
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                accept="image/*"
                                multiple
                                onChange={handleImageSelect}
                                className="hidden"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={newComment.length < MIN_CHARS || isSubmitting}
                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white p-2.5 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center h-[44px] w-[44px]"
                        >
                            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                        </button>
                    </form>
                    <div className="text-[10px] text-gray-400 flex justify-end px-1">
                        <span className={newComment.length > MAX_CHARS ? 'text-red-500' : ''}>{newComment.length}/{MAX_CHARS}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};