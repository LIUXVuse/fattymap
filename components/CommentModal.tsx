import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Image as ImageIcon, Loader2, User as UserIcon, Globe, Edit3, Upload } from 'lucide-react';
import { Comment } from '../types';
import { subscribeToComments, addCommentToFirestore, uploadImage } from '../services/firebase';
import { User } from 'firebase/auth';

interface CommentModalProps {
  memoryId: string;
  memoryTitle: string;
  currentUser: User | null;
  onClose: () => void;
  defaultCustomName?: string;
  defaultCustomAvatar?: string;
}

type IdentityType = 'google' | 'custom' | 'anonymous';

export const CommentModal: React.FC<CommentModalProps> = ({ 
    memoryId, 
    memoryTitle, 
    currentUser, 
    onClose,
    defaultCustomName,
    defaultCustomAvatar
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 圖片上傳 (留言附圖)
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // Identity State
  const [identityType, setIdentityType] = useState<IdentityType>('google');
  const [customName, setCustomName] = useState('');
  const [customAvatarFile, setCustomAvatarFile] = useState<File | null>(null);
  const [customAvatarPreview, setCustomAvatarPreview] = useState<string>('');

  const commentsEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_CHARS = 150;
  const MIN_CHARS = 2;

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
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          setImageFile(file);
          const reader = new FileReader();
          reader.onloadend = () => {
              setImagePreview(reader.result as string);
          };
          reader.readAsDataURL(file);
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

  const removeImage = () => {
      setImageFile(null);
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (newComment.length < MIN_CHARS || isSubmitting) return;

      setIsSubmitting(true);
      try {
          // 1. 上傳留言附圖
          let imageUrl = '';
          if (imageFile) {
              imageUrl = await uploadImage(imageFile, `comments/${memoryId}/${Date.now()}_reply`);
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
              imageUrl: imageUrl,
              timestamp: Date.now(),
              userId: userId
          };

          await addCommentToFirestore(memoryId, commentData);
          
          setNewComment('');
          removeImage();

      } catch (error) {
          console.error("Post comment error:", error);
          alert("留言失敗，請稍後再試");
      } finally {
          setIsSubmitting(false);
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
                                        <span className="text-[10px] text-gray-400">{new Date(comment.timestamp).toLocaleString()}</span>
                                    </div>
                                    <p className="text-sm text-gray-700 whitespace-pre-wrap break-words leading-relaxed">
                                        {comment.content}
                                    </p>
                                    {comment.imageUrl && (
                                        <div className="mt-2 rounded-lg overflow-hidden border border-gray-200">
                                            <img src={comment.imageUrl} className="max-h-40 w-full object-cover" alt="reply" />
                                        </div>
                                    )}
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
                                {customAvatarPreview ? <img src={customAvatarPreview} className="w-full h-full object-cover"/> : <Upload size={14} className="text-gray-400"/>}
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

                {/* Image Preview (Comment Image) */}
                {imagePreview && (
                    <div className="relative w-16 h-16 mb-1 group">
                        <img src={imagePreview} className="w-full h-full object-cover rounded-lg border border-gray-300" alt="preview" />
                        <button onClick={removeImage} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 shadow-md">
                            <X size={12} />
                        </button>
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