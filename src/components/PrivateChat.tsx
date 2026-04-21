import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, ArrowLeft, MoreVertical, Ban, UserMinus, ShieldAlert, ChevronDown, MessageCircle, Check, CheckCheck } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { db } from '../services/firebase';
import { doc, collection, onSnapshot, query, orderBy, addDoc, setDoc } from 'firebase/firestore';
import { dataSync } from '../services/dataSync';

interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
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

  const sendMessage = async () => {
    if (!text.trim() || isBlocked || IBlockedThem || !user?.uid) return;
    
    const newMsg = {
        id: 'temp-' + Date.now(),
        senderId: user.uid,
        text,
        status: 'sent',
        timestamp: new Date().toISOString(),
        isOptimistic: true
    };
    
    // Optimistic Update
    setMessages(prev => [...prev, newMsg]);
    const messageText = text;
    setText('');

    try {
        await addDoc(collection(db, 'private_chats', chatId, 'messages'), {
            senderId: user.uid,
            text: messageText,
            status: 'sent',
            timestamp: new Date().toISOString()
        });
    } catch (e) {
        console.error("Failed to send private message:", e);
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
        {messages.map(m => (
            <div key={m.id} className={`flex flex-col ${m.senderId === user?.uid ? 'items-end' : 'items-start'}`}>
                <div className={`p-4 rounded-2xl max-w-[85%] shadow-sm ${m.senderId === user?.uid ? 'bg-sky-500 text-white rounded-tr-none' : 'bg-zinc-800 text-white rounded-tl-none border border-zinc-700'}`}>
                    <p className="text-sm leading-relaxed">{m.text}</p>
                </div>
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
              <div className="flex items-center gap-2">
                <div className="flex-1 relative group">
                    <input 
                        value={text} 
                        onChange={(e) => setText(e.target.value)} 
                        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                        className="w-full py-2.5 pl-10 pr-4 bg-zinc-800 rounded-xl font-bold text-white placeholder:text-zinc-500 outline-none border-2 border-transparent focus:border-zinc-700 transition-all shadow-inner text-sm" 
                        placeholder="Message..." 
                    />
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500">
                        <MessageCircle size={18} />
                    </div>
                </div>
                <button 
                    onClick={sendMessage} 
                    disabled={!text.trim()}
                    className={`p-3 rounded-full shadow-lg transition-all active:scale-95 ${text.trim() ? 'bg-orange-brand text-white' : 'bg-slate-100 text-slate-300'}`}
                >
                    <Send size={22} className="!animate-none" style={{ animation: 'none' }} />
                </button>
              </div>
          )}
      </div>
    </div>
  );
}
