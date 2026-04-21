import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, ArrowLeft, MoreVertical, Ban, UserMinus, ShieldAlert, ChevronDown, MessageCircle, Check, CheckCheck, Camera, ImagePlus, Trash2, Edit3, X, PlusCircle, Smile } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { db } from '../services/firebase';
import { doc, collection, onSnapshot, query, orderBy, addDoc, setDoc } from 'firebase/firestore';
import { dataSync } from '../services/dataSync';
import { compressImage } from '../lib/imageUtils';

interface Message {
  id: string;
  senderId: string;
  text: string;
  imageUrl?: string;
  timestamp: string;
  deletedFor?: string[];
  edited?: boolean;
}

export default function PrivateChat({ chatId, otherUser, onBack }: { chatId: string, otherUser: any, onBack: () => void }) {
  const { user } = useAppStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const lastMessagesLength = React.useRef(0);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const [text, setText] = useState('');
  const [chatData, setChatData] = useState<any>(null);
  const [showOptions, setShowOptions] = useState(false);
  const [otherUserPresence, setOtherUserPresence] = useState<any>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const cameraInputRef = React.useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);
  const [isEmojiMenuOpen, setIsEmojiMenuOpen] = useState(false);
  const QUICK_EMOJIS = ['😀', '😂', '❤️', '🙏', '👍', '🔥', '😢', '🥺', '😮', '🤔'];

  // Auto-scroll to bottom
  useEffect(() => {
    if (messages.length > 0) {
        const isNewMessage = messages.length > lastMessagesLength.current;
        const behavior = (isNewMessage && lastMessagesLength.current > 0) ? 'smooth' : 'auto';
        
        const timeoutId = setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior });
        }, 50);
        
        lastMessagesLength.current = messages.length;
        return () => clearTimeout(timeoutId);
    }
  }, [messages]);

  useEffect(() => {
    if (!user?.uid) return;

    // Presence update: I am in this chat
    dataSync.updateUserPresence(user.uid, true, chatId);
    dataSync.markFriendMessagesAsSeen(chatId, user.uid);

    // Listen for other user's presence
    const unsubPresence = onSnapshot(doc(db, 'users', otherUser.id), (doc) => {
        setOtherUserPresence(doc.data());
    });

    // Listen for chat state (blocking)
    const unsubChat = onSnapshot(doc(db, 'private_chats', chatId), (doc) => {
        setChatData(doc.data());
    });

    // Listen for messages and mark as seen if coming from other user
    const q = query(collection(db, 'private_chats', chatId, 'messages'), orderBy('timestamp', 'asc'));
    const unsubMsg = onSnapshot(q, (snapshot) => {
        const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
        setMessages(msgs);
        
        // If there are new messages from the other user, mark them as seen
        const hasUnseen = msgs.some(m => m.senderId !== user.uid && (m as any).status !== 'seen');
        if (hasUnseen) {
             dataSync.markFriendMessagesAsSeen(chatId, user.uid);
        }
    });

    return () => { 
        unsubPresence();
        unsubChat(); 
        unsubMsg(); 
        dataSync.updateUserPresence(user.uid, true, null); // Leave chat but still online
    };
  }, [chatId, otherUser.id, user?.uid]);

  const isBlocked = chatData?.blockedBy === (chatData?.participants?.find((p: string) => p !== user?.uid));
  const IBlockedThem = chatData?.blockedBy === user?.uid;

  const isOtherUserOnline = () => {
    if (!otherUserPresence) return false;
    if (!otherUserPresence.isOnline) return false;
    
    // Heartbeat check: If lastSeen was more than 2 minutes ago, consider offline
    const lastSeen = otherUserPresence.lastSeen ? new Date(otherUserPresence.lastSeen).getTime() : 0;
    const now = Date.now();
    return (now - lastSeen) < 120000; // 2 minutes
  };

  const handleBlock = async () => {
    const targetBlockState = !IBlockedThem ? user?.uid : null;
    await setDoc(doc(db, 'private_chats', chatId), { blockedBy: targetBlockState }, { merge: true });
    setShowOptions(false);
  };

  const handleRemoveFriend = async () => {
    if (confirm(`Remove ${otherUser.name} from friends?`)) {
        await dataSync.removeFriend(user?.uid || '', otherUser.id);
        onBack();
    }
  };

  const handleEditClick = (m: Message) => {
    const diffMs = new Date().getTime() - new Date(m.timestamp).getTime();
    if (diffMs > 5 * 60 * 1000) {
        alert("Time's up! Messages can only be edited within 5 minutes of sending.");
        setSelectedMessageId(null);
        return;
    }
    setEditingMsgId(m.id);
    setText(m.text);
    setSelectedMessageId(null);
  };

  const handleDeleteForMe = async (msgId: string) => {
    if (!user?.uid) return;
    setMessages(prev => prev.filter(m => m.id !== msgId)); // Optimistic
    await dataSync.deletePrivateMessageForMe(chatId, msgId, user.uid);
    setSelectedMessageId(null);
  };

  const handleDeleteForEveryone = async (msgId: string) => {
    setMessages(prev => prev.filter(m => m.id !== msgId)); // Optimistic
    await dataSync.deletePrivateMessageForEveryone(chatId, msgId);
    setSelectedMessageId(null);
  };

  const sendMessage = async (imageUrl?: string) => {
    if ((!text.trim() && !imageUrl) || isBlocked || IBlockedThem || !user?.uid) return;
    
    if (editingMsgId && text.trim()) {
      await dataSync.editPrivateMessage(chatId, editingMsgId, text);
      const currentId = editingMsgId;
      setMessages(prev => prev.map(m => m.id === currentId ? { ...m, text, edited: true } : m)); // Optimistic Update
      setEditingMsgId(null);
      setText('');
      return;
    }

    const newMsg: Message = {
        id: 'temp-' + Date.now(),
        senderId: user.uid,
        text,
        imageUrl,
        timestamp: new Date().toISOString(),
        status: 'sent',
        isOptimistic: true
    } as any;
    
    // Optimistic Update
    setMessages(prev => [...prev, newMsg]);
    const messageText = text;
    setText('');

    try {
        await addDoc(collection(db, 'private_chats', chatId, 'messages'), {
            senderId: user.uid,
            text: messageText,
            imageUrl: imageUrl || null,
            status: 'sent',
            timestamp: new Date().toISOString()
        });
    } catch (e) {
        console.error("Failed to send private message:", e);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    try {
      const compressedDataUrl = await compressImage(file, 200); // 200KB max
      await sendMessage(compressedDataUrl);
    } catch (err) {
      console.error("Upload failed", err);
      alert("Failed to upload image. Please try a smaller file.");
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-[60] flex flex-col">
      {/* Clickable Header Area */}
      <header className="relative bg-zinc-900 border-b border-zinc-800 shadow-sm z-50">
          <div 
            onClick={() => setShowOptions(!showOptions)}
            className="p-4 flex items-center justify-between cursor-pointer hover:bg-zinc-800 transition-colors"
          >
            <div className="flex items-center gap-3">
                <button 
                  onClick={(e) => { e.stopPropagation(); onBack(); }}
                  className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400 transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h2 className="font-black text-white leading-tight flex items-center gap-1">
                        {otherUser.name}
                        <ChevronDown size={14} className={`transition-transform text-zinc-500 ${showOptions ? 'rotate-180' : ''}`} />
                    </h2>
                    <div className="flex items-center gap-1">
                        <div className={`w-1.5 h-1.5 rounded-full ${isOtherUserOnline() ? 'bg-green-500' : 'bg-zinc-600'}`}></div>
                        <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">
                            {isOtherUserOnline() ? 'Online' : 'Offline'}
                        </p>
                    </div>
                </div>
            </div>
            
            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 font-bold border-2 border-zinc-700 shadow-sm">
                {otherUser.name[0]}
            </div>
          </div>

          {/* Options Dropdown Panel */}
          <AnimatePresence>
            {showOptions && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -20 }}
                className="absolute top-full left-0 right-0 bg-white border-b shadow-xl p-4 flex gap-3 overflow-x-auto whitespace-nowrap scrollbar-hide"
              >
                  <button 
                    onClick={handleBlock}
                    className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-2xl font-bold text-xs transition-colors ${IBlockedThem ? 'bg-green-100 text-green-600' : 'bg-red-50 text-red-500'}`}
                  >
                      {IBlockedThem ? <ShieldAlert size={16}/> : <Ban size={16}/>}
                      {IBlockedThem ? 'Unblock User' : 'Block User'}
                  </button>
                  <button 
                    onClick={handleRemoveFriend}
                    className="flex-1 flex items-center justify-center gap-2 p-3 bg-slate-100 text-slate-600 rounded-2xl font-bold text-xs"
                  >
                      <UserMinus size={16}/>
                      Remove Friend
                  </button>
              </motion.div>
            )}
          </AnimatePresence>
      </header>
      
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center p-10 opacity-30">
                <MessageCircle size={60} className="mb-4 text-sky-200" />
                <p className="text-sm font-bold text-sky-900">Say hi to {otherUser.name}!</p>
                <p className="text-[10px]">Messages are private between you two.</p>
            </div>
        )}
        {messages.filter(m => !m.deletedFor?.includes(user?.uid || '')).map(m => (
            <div key={m.id} className={`flex flex-col ${m.senderId === user?.uid ? 'items-end' : 'items-start'} relative mb-1`}>
                <div 
                  onClick={() => setSelectedMessageId(selectedMessageId === m.id ? null : m.id)}
                  className={`p-4 rounded-2xl max-w-[85%] shadow-sm cursor-pointer transition-transform active:scale-[0.98] ${m.senderId === user?.uid ? 'bg-sky-500 text-white rounded-tr-none' : 'bg-zinc-800 text-white rounded-tl-none border border-zinc-700'}`}
                >
                    {m.imageUrl && (
                        <div className="mb-2 rounded-xl overflow-hidden bg-black/10">
                            <img src={m.imageUrl} alt="attachment" className="w-full h-auto object-cover max-h-60" referrerPolicy="no-referrer" />
                        </div>
                    )}
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {m.text}
                        {m.edited && <span className="text-[10px] opacity-70 ml-2 italic font-bold">edited</span>}
                    </p>
                </div>
                
                {/* Options Panel */}
                <AnimatePresence>
                    {selectedMessageId === m.id && (
                        <motion.div 
                            initial={{ opacity: 0, height: 0, scale: 0.95 }}
                            animate={{ opacity: 1, height: 'auto', scale: 1 }}
                            exit={{ opacity: 0, height: 0, scale: 0.95 }}
                            className={`flex flex-wrap gap-2 mt-2 max-w-[85%] ${m.senderId === user?.uid ? 'justify-end' : 'justify-start'}`}
                        >
                            {m.senderId === user?.uid ? (
                                <>
                                    {!m.imageUrl && (new Date().getTime() - new Date(m.timestamp).getTime()) <= 5 * 60 * 1000 && (
                                        <button onClick={() => handleEditClick(m)} className="flex items-center gap-1.5 bg-zinc-800 text-sky-400 px-3 py-1.5 rounded-full text-[10px] font-bold border border-zinc-700 hover:bg-zinc-700 transition-colors">
                                            <Edit3 size={12}/> Edit
                                        </button>
                                    )}
                                    <button onClick={() => handleDeleteForMe(m.id)} className="flex items-center gap-1.5 bg-zinc-800 text-zinc-300 px-3 py-1.5 rounded-full text-[10px] font-bold border border-zinc-700 hover:bg-zinc-700 transition-colors">
                                        <Trash2 size={12}/> Delete for Me
                                    </button>
                                    <button onClick={() => handleDeleteForEveryone(m.id)} className="flex items-center gap-1.5 bg-zinc-800 text-red-400 px-3 py-1.5 rounded-full text-[10px] font-bold border border-zinc-700 hover:bg-zinc-700 transition-colors">
                                        <Trash2 size={12}/> Delete for Everyone
                                    </button>
                                </>
                            ) : (
                                <button onClick={() => handleDeleteForMe(m.id)} className="flex items-center gap-1.5 bg-zinc-800 text-zinc-300 px-3 py-1.5 rounded-full text-[10px] font-bold border border-zinc-700 hover:bg-zinc-700 transition-colors">
                                    <Trash2 size={12}/> Delete for Me
                                </button>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="flex items-center gap-1 mt-1">
                    <span className="text-[8px] text-slate-400 uppercase font-bold">
                        {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {m.senderId === user?.uid && (
                        <div className="flex items-center">
                            {(m as any).status === 'seen' ? (
                                <CheckCheck size={14} strokeWidth={2.5} className="text-blue-500 !animate-none" style={{ animation: 'none' }} />
                            ) : otherUserPresence?.isOnline ? (
                                <CheckCheck size={14} strokeWidth={2.5} className="text-slate-400 !animate-none" style={{ animation: 'none' }} />
                            ) : (
                                <Check size={14} strokeWidth={2.5} className="text-slate-400 !animate-none" style={{ animation: 'none' }} />
                            )}
                        </div>
                    )}
                </div>
            </div>
        ))}
        <div ref={messagesEndRef} className="h-2" />
      </div>

      <div className="py-2.5 px-4 bg-zinc-900 border-t border-zinc-800 safe-bottom">
          {(isBlocked || IBlockedThem) ? (
              <div className="py-3 px-4 text-center rounded-2xl bg-zinc-800 border border-zinc-700">
                  <p className="text-[10px] text-red-500 font-bold flex items-center justify-center gap-2 uppercase tracking-widest">
                      <ShieldAlert size={12} />
                      {isBlocked ? 'Blocked you.' : 'You blocked them.'}
                  </p>
                  {IBlockedThem && (
                      <button onClick={handleBlock} className="mt-1 text-[9px] text-sky-400 font-black uppercase underline decoration-2 underline-offset-4">
                          Unblock
                      </button>
                  )}
              </div>
          ) : (
              <div className="relative">
                {editingMsgId && (
                    <div className="flex items-center justify-between px-3 py-2 bg-sky-900/30 rounded-xl border border-sky-500/20 mb-2">
                        <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5"><Edit3 size={12}/> Editing Message</span>
                        <button onClick={() => { setEditingMsgId(null); setText(''); }} className="text-red-400 hover:text-red-300 transition-colors p-1"><X size={14}/></button>
                    </div>
                )}
                
                {/* Popups */}
                <AnimatePresence>
                    {isAttachmentMenuOpen && (
                        <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:10}} className="absolute bottom-full left-0 mb-2 bg-zinc-800 border border-zinc-700 p-2 rounded-2xl flex gap-2 shadow-xl z-50">
                            <button onClick={() => { cameraInputRef.current?.click(); setIsAttachmentMenuOpen(false); }} disabled={isUploading} className="p-3 bg-zinc-700 rounded-xl text-sky-400 hover:text-white transition-colors flex flex-col items-center gap-1 min-w-[60px]">
                                <Camera size={24} />
                                <span className="text-[9px] font-bold">Camera</span>
                            </button>
                            <button onClick={() => { fileInputRef.current?.click(); setIsAttachmentMenuOpen(false); }} disabled={isUploading} className="p-3 bg-zinc-700 rounded-xl text-emerald-400 hover:text-white transition-colors flex flex-col items-center gap-1 min-w-[60px]">
                                <ImagePlus size={24} />
                                <span className="text-[9px] font-bold">Gallery</span>
                            </button>
                        </motion.div>
                    )}
                    {isEmojiMenuOpen && (
                        <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:10}} className="absolute bottom-full right-16 mb-2 bg-zinc-800 border border-zinc-700 p-3 rounded-2xl flex flex-wrap max-w-[180px] gap-2 shadow-xl z-50">
                            {QUICK_EMOJIS.map(em => (
                                <button key={em} onClick={() => { setText(text + em); setIsEmojiMenuOpen(false); }} className="text-xl hover:scale-110 transition-transform">{em}</button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="flex gap-2 items-center">
                    <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                    <input type="file" accept="image/*" capture="environment" className="hidden" ref={cameraInputRef} onChange={handleFileUpload} />
                    
                    <div className="flex-1 bg-zinc-800 rounded-[28px] flex items-center px-1.5 shadow-inner border-2 border-transparent focus-within:border-zinc-700 transition-colors">
                        {!editingMsgId && (
                            <button onClick={() => { setIsAttachmentMenuOpen(!isAttachmentMenuOpen); setIsEmojiMenuOpen(false); }} className="p-2 text-zinc-400 hover:text-white transition-transform">
                                <PlusCircle size={22} className={isAttachmentMenuOpen ? "rotate-45" : ""} />
                            </button>
                        )}
                        
                        <input 
                            value={text} 
                            onChange={(e) => setText(e.target.value)} 
                            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                            disabled={isUploading}
                            className={`flex-1 py-3 px-2 bg-transparent text-white font-bold outline-none text-sm disabled:opacity-70 placeholder:font-normal placeholder:text-zinc-500 ${editingMsgId ? "ml-2" : ""}`} 
                            placeholder={editingMsgId ? "Edit message..." : isUploading ? "Uploading image..." : "Start chat..."} 
                        />

                        <button onClick={() => { setIsEmojiMenuOpen(!isEmojiMenuOpen); setIsAttachmentMenuOpen(false); }} className="p-2 text-zinc-400 hover:text-white">
                            <Smile size={22} className={isEmojiMenuOpen ? "text-orange-brand" : ""} />
                        </button>
                    </div>

                    <button 
                        onClick={() => sendMessage()} 
                        disabled={isUploading || (!text.trim() && !isUploading)}
                        className={`w-12 h-12 flex items-center justify-center rounded-full flex-shrink-0 shadow-lg transition-all active:scale-95 ${text.trim() || isUploading ? 'bg-orange-brand text-white' : 'bg-slate-100 text-slate-300'}`}
                    >
                        {editingMsgId ? <Check size={20} className="!animate-none" style={{ animation: 'none' }} /> : <Send size={20} className="mr-0.5 !animate-none" style={{ animation: 'none' }} />}
                    </button>
                </div>
              </div>
          )}
      </div>
    </div>
  );
}
