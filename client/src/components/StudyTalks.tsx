import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Users, Sparkles, User, Zap, MessageCircle, Search, ChevronLeft, Lock, UserPlus, Check, X, ShieldAlert, ShieldCheck, Loader2 } from 'lucide-react';
import { UnifiedInput } from './UnifiedInput';
import { useAppStore } from '../store/useAppStore';
import { db } from '../services/firebase';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  serverTimestamp,
  Timestamp,
  where,
  getDocs,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { cn } from '../lib/utils';

interface ChatMessage {
  id: string;
  text: string;
  userId: string;
  userEmail: string;
  username?: string;
  timestamp: any;
  recipientId?: string;
  isEdited?: boolean;
  isDeleted?: boolean;
  status: 'sent' | 'delivered' | 'seen';
}

interface UserProfile {
  id: string;
  email: string;
  username?: string;
  isOnline: boolean;
  lastActive: any;
  connections?: string[];
}

interface FriendRequest {
  id: string;
  from: string;
  fromEmail: string;
  to: string;
  status: 'pending' | 'accepted' | 'rejected';
}

const StudyTalks: React.FC = () => {
  const { user } = useAppStore();
  const [activeChannel, setActiveChannel] = useState<'community' | 'private' | 'requests'>('community');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockerId, setBlockerId] = useState<string | null>(null);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
  const [profileModalUser, setProfileModalUser] = useState<UserProfile | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
  const [friendStatusAlert, setFriendStatusAlert] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const openUserProfile = async (userId: string) => {
    if (userId === user?.uid) return;
    try {
      const userRef = doc(db, 'users', userId);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const data = snap.data();
        setProfileModalUser({
          id: userId,
          email: data.email,
          username: data.username,
          isOnline: data.isOnline,
          lastActive: data.lastActive,
          connections: data.connections || []
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleReport = async (targetUser: UserProfile) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'admin_alerts'), {
        type: 'MESSAGE_REPORT',
        reportedUser: targetUser.id,
        reportedUsername: targetUser.username,
        reporter: user.uid,
        userEmail: user.email,
        timestamp: serverTimestamp()
      });
      alert(`Report submitted for ${targetUser.username}. Tactical scan initiated.`);
    } catch (e) {
      console.error(e);
    }
  };

  const initiateChatFromProfile = async (targetUser: UserProfile) => {
    if (!user) return;
    
    // Check if in connections
    const isFriend = currentUserProfile?.connections?.includes(targetUser.id);
    
    if (!isFriend) {
      setFriendStatusAlert("SEND_REQUEST");
      setTimeout(() => setFriendStatusAlert(null), 2000);
      return;
    }

    setSelectedUser(targetUser);
    setActiveChannel('private');
    setProfileModalUser(null);
  };

  // Online Status Tracker
  useEffect(() => {
    if (!user) return;
    
    const userRef = doc(db, 'users', user.uid);
    const updateOnlineStatus = (online: boolean) => {
      updateDoc(userRef, {
        isOnline: online,
        lastActive: serverTimestamp()
      });
    };

    updateOnlineStatus(true);
    
    // Mark pending messages to me as delivered
    const markAsDelivered = async () => {
        const q = query(
            collection(db, 'private_chats'),
            where('participants', 'array-contains', user.uid)
        );
        const chatSnaps = await getDocs(q);
        chatSnaps.forEach(async (chatDoc) => {
            const msgQ = query(
                collection(db, 'private_chats', chatDoc.id, 'messages'),
                where('recipientId', '==', user.uid),
                where('status', '==', 'sent')
            );
            const msgSnaps = await getDocs(msgQ);
            msgSnaps.forEach(m => updateDoc(m.ref, { status: 'delivered' }));
        });
    };
    markAsDelivered();

    const handleVisibilityChange = () => updateOnlineStatus(document.visibilityState === 'visible');
    const handleUnload = () => updateOnlineStatus(false);

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      updateOnlineStatus(false);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [user]);

  // Check for Username
  useEffect(() => {
    if (!user) return;
    const checkUsername = async () => {
      const userRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userRef);
      if (snap.exists() && !snap.data().username) {
        setShowUsernameModal(true);
      } else if (!snap.exists()) {
        await setDoc(userRef, {
          email: user.email,
          isOnline: true,
          lastActive: serverTimestamp()
        });
        setShowUsernameModal(true);
      }
    };
    checkUsername();
  }, [user]);

  // Sync Current User Profile
  useEffect(() => {
    if (!user) return;
    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (doc) => {
        if (doc.exists()) {
            setCurrentUserProfile({ id: doc.id, ...doc.data() } as UserProfile);
        }
    });
    return unsubscribe;
  }, [user]);

  // Private Chat 'Seen' Logic
  useEffect(() => {
    if (activeChannel !== 'private' || !selectedUser || !user) return;
    const chatId = [user.uid, selectedUser.id].sort().join('_');
    const chatRef = doc(db, 'private_chats', chatId);
    
    updateDoc(chatRef, {
      [`lastSeen.${user.uid}`]: serverTimestamp()
    });

    // Mark current messages as seen
    const markAsSeen = async () => {
        const q = query(
            collection(db, 'private_chats', chatId, 'messages'),
            where('userId', '==', selectedUser.id),
            where('status', '!=', 'seen'),
            limit(20)
        );
        const snap = await getDocs(q);
        snap.forEach(d => {
            updateDoc(d.ref, { status: 'seen' });
        });
    };
    markAsSeen();
  }, [activeChannel, selectedUser, user, messages.length]);

  // Fetch Community Messages
  useEffect(() => {
    if (activeChannel !== 'community') return;

    setIsLoading(true);
    const q = query(
      collection(db, 'community_chat'),
      orderBy('timestamp', 'asc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ChatMessage[];
      setMessages(msgs);
      setIsLoading(false);
      scrollToBottom();
    });

    return () => unsubscribe();
  }, [activeChannel]);

  // Fetch Private Messages & Block Status
  useEffect(() => {
    if (activeChannel !== 'private' || !selectedUser || !user) return;

    setIsLoading(true);
    const chatId = [user.uid, selectedUser.id].sort().join('_');
    
    // Check block status
    const chatRef = doc(db, 'private_chats', chatId);
    const unsubBlock = onSnapshot(chatRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setIsBlocked(!!data.blockedBy);
        setBlockerId(data.blockedBy || null);
      } else {
        setIsBlocked(false);
        setBlockerId(null);
      }
    });

    const q = query(
      collection(db, 'private_chats', chatId, 'messages'),
      orderBy('timestamp', 'asc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ChatMessage[];
      setMessages(msgs);
      setIsLoading(false);
      scrollToBottom();
    });

    return () => {
        unsubscribe();
        unsubBlock();
    };
  }, [activeChannel, selectedUser, user]);

  // Fetch Users
  useEffect(() => {
    const q = query(collection(db, 'users'), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedUsers = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as UserProfile))
        .filter(u => u.id !== user?.uid);
      setUsers(fetchedUsers);
    });

    return () => unsubscribe();
  }, [user]);

  // Fetch Friend Requests
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'friend_requests'),
      where('to', '==', user.uid),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reqs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FriendRequest[];
      setFriendRequests(reqs);
    });

    return () => unsubscribe();
  }, [user]);

  const scrollToBottom = () => {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 100);
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || !user || isBlocked) return;

    // Get current user profile for username
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    const username = userSnap.data()?.username || user.email?.split('@')[0] || 'Anonymous';

    try {
      if (activeChannel === 'community') {
        await addDoc(collection(db, 'community_chat'), {
          text,
          userId: user.uid,
          userEmail: user.email || 'Anonymous',
          username,
          timestamp: serverTimestamp(),
          status: 'sent'
        });
      } else if (selectedUser) {
        const chatId = [user.uid, selectedUser.id].sort().join('_');
        const chatRef = doc(db, 'private_chats', chatId);
        const chatSnap = await getDoc(chatRef);
        
        if (!chatSnap.exists()) {
          await setDoc(chatRef, {
            participants: [user.uid, selectedUser.id],
            lastMessage: text,
            lastTimestamp: serverTimestamp(),
            lastSeen: {
                [user.uid]: serverTimestamp(),
                [selectedUser.id]: null
            }
          });
        } else {
            await updateDoc(chatRef, {
                lastMessage: text,
                lastTimestamp: serverTimestamp()
            });
        }

        await addDoc(collection(db, 'private_chats', chatId, 'messages'), {
          text,
          userId: user.uid,
          userEmail: user.email || 'Anonymous',
          username,
          timestamp: serverTimestamp(),
          recipientId: selectedUser.id,
          status: selectedUser.isOnline ? 'delivered' : 'sent'
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const [isUpdatingUsername, setIsUpdatingUsername] = useState(false);

  const setUsername = async () => {
    if (!newUsername.trim() || !user) return;
    setIsUpdatingUsername(true);
    try {
      await setDoc(doc(db, 'users', user.uid), {
        username: newUsername.trim()
      }, { merge: true });
      setShowUsernameModal(false);
    } catch (e) {
      console.error(e);
      alert("Failed to sync identity. Neural network link unstable.");
    } finally {
      setIsUpdatingUsername(false);
    }
  };

  const handleEditMessage = async (msgId: string, newText: string) => {
    if (activeChannel === 'community') {
      await updateDoc(doc(db, 'community_chat', msgId), {
        text: newText,
        isEdited: true
      });
    } else if (selectedUser) {
      const chatId = [user?.uid, selectedUser.id].sort().join('_');
      await updateDoc(doc(db, 'private_chats', chatId, 'messages', msgId), {
        text: newText,
        isEdited: true
      });
    }
    setEditingMessage(null);
  };

  const handleDeleteMessage = async (msg: ChatMessage) => {
    if (!user) return;
    const confirmDelete = window.confirm("Delete for everyone?");
    if (!confirmDelete) return;

    try {
      if (activeChannel === 'community') {
        await updateDoc(doc(db, 'community_chat', msg.id), {
          text: "Message deleted",
          isDeleted: true
        });
      } else if (selectedUser) {
        const chatId = [user.uid, selectedUser.id].sort().join('_');
        await updateDoc(doc(db, 'private_chats', chatId, 'messages', msg.id), {
          text: "Message deleted",
          isDeleted: true
        });
      }

      // Admin Alert
      await addDoc(collection(db, 'admin_alerts'), {
        type: 'MESSAGE_DELETED',
        messageId: msg.id,
        deletedBy: user.uid,
        userEmail: user.email,
        timestamp: serverTimestamp()
      });
    } catch (e) {
      console.error(e);
    }
  };

  const sendFriendRequest = async (targetUser: UserProfile) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'friend_requests'), {
        from: user.uid,
        fromEmail: user.email,
        to: targetUser.id,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      alert(`Request sent to ${targetUser.username || targetUser.email.split('@')[0]}`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleRequest = async (requestId: string, status: 'accepted' | 'rejected') => {
    try {
      const requestRef = doc(db, 'friend_requests', requestId);
      const reqSnap = await getDoc(requestRef);
      if (!reqSnap.exists()) return;
      const reqData = reqSnap.data();

      if (status === 'accepted') {
        // Update both users connections
        const fromRef = doc(db, 'users', reqData.from);
        const toRef = doc(db, 'users', reqData.to);
        
        const fromSnap = await getDoc(fromRef);
        const toSnap = await getDoc(toRef);
        
        await updateDoc(fromRef, {
          connections: [...(fromSnap.data()?.connections || []), reqData.to]
        });
        await updateDoc(toRef, {
          connections: [...(toSnap.data()?.connections || []), reqData.from]
        });
      }
      
      await deleteDoc(requestRef);
    } catch (e) {
      console.error(e);
    }
  };

  const toggleBlock = async () => {
    if (!user || !selectedUser) return;
    const chatId = [user.uid, selectedUser.id].sort().join('_');
    const chatRef = doc(db, 'private_chats', chatId);
    
    try {
      if (isBlocked) {
        if (blockerId !== user.uid) {
            alert("You cannot unblock a channel you didn't block.");
            return;
        }
        await updateDoc(chatRef, { blockedBy: null });
      } else {
        await updateDoc(chatRef, { blockedBy: user.uid });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const formatTime = (ts: any) => {
    if (!ts) return '';
    const date = ts instanceof Timestamp ? ts.toDate() : new Date(ts);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const filteredUsers = users.filter(u => 
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentUserData = users.find(u => u.id === user?.uid) || { connections: [] };
  const isFriend = (uid: string) => currentUserData.connections?.includes(uid);

  return (
    <div className="h-full flex flex-col bg-background dark:bg-black overflow-hidden relative">
      {/* Header */}
      <header className="px-6 py-5 bg-white dark:bg-zinc-900 border-b border-line dark:border-white/10 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => {
                if (selectedUser) setSelectedUser(null);
                else setActiveChannel('community');
            }}
            className={cn(
                "w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform active:scale-95",
                activeChannel === 'community' ? "bg-orange-accent shadow-orange-500/20" : "bg-blue-700 shadow-blue-500/20"
            )}
          >
            {selectedUser ? <ChevronLeft size={22} /> : <Users size={22} />}
          </button>
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
                {selectedUser ? selectedUser.email.split('@')[0] : (activeChannel === 'community' ? 'COMMUNITY HUB' : activeChannel === 'requests' ? 'NEURAL REQUESTS' : 'DIRECT STREAM')}
            </h2>
            <div className="flex items-center gap-1.5 mt-0.5">
                <div className={cn("w-1.5 h-1.5 rounded-full", activeChannel === 'community' ? "bg-emerald-400 animate-pulse" : "bg-blue-400")} />
                <p className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    {selectedUser ? (selectedUser.isOnline ? 'ACTIVE NODE' : 'NODE OFFLINE') : 'NEURAL SYNC ACTIVE'}
                </p>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
            {selectedUser && (
                <button 
                    onClick={toggleBlock}
                    title={isBlocked ? "Unblock User" : "Block User"}
                    className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90 border",
                        isBlocked ? "bg-red-600 text-white border-red-700" : "bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white border-slate-200 dark:border-white/20"
                    )}
                >
                    {isBlocked ? <ShieldAlert size={18} /> : <ShieldCheck size={18} />}
                </button>
            )}
            {!selectedUser && (
                <div className="flex bg-slate-100 dark:bg-zinc-800 p-1 rounded-xl border border-slate-200 dark:border-white/5">
                    <button 
                        onClick={() => setActiveChannel('community')}
                        className={cn(
                            "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                            activeChannel === 'community' ? "bg-orange-accent text-white shadow-sm" : "text-slate-500 dark:text-slate-400"
                        )}
                    >PUBLIC</button>
                    <button 
                        onClick={() => setActiveChannel('private')}
                        className={cn(
                            "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                            activeChannel === 'private' ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 dark:text-slate-400"
                        )}
                    >PRIVATE</button>
                    <button 
                        onClick={() => setActiveChannel('requests')}
                        className={cn(
                            "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all relative",
                            activeChannel === 'requests' ? "bg-slate-900 dark:bg-white text-white dark:text-black shadow-sm" : "text-slate-500 dark:text-slate-400"
                        )}
                    >
                        REQUESTS
                        {friendRequests.length > 0 && (
                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-600 rounded-full flex items-center justify-center text-[7px] text-white font-bold p-1">
                                {friendRequests.length}
                            </span>
                        )}
                    </button>
                </div>
            )}
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
            {activeChannel === 'requests' ? (
                <motion.div 
                    key="requests"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="h-full flex flex-col p-6 space-y-4 overflow-y-auto"
                >
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-2">Pending Sync Requests</h3>
                    {friendRequests.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center opacity-30 text-center space-y-4">
                            <Zap size={48} />
                            <p className="text-[10px] font-black uppercase tracking-widest">No active sync signals detected.</p>
                        </div>
                    ) : (
                        friendRequests.map(req => (
                            <div key={req.id} className="bg-white dark:bg-zinc-900 p-5 rounded-[24px] border border-line dark:border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500">
                                        <User size={20} />
                                    </div>
                                    <p className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-tight">{req.fromEmail.split('@')[0]}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => handleRequest(req.id, 'accepted')}
                                        className="w-9 h-9 bg-emerald-500 text-white rounded-xl flex items-center justify-center shadow-lg active:scale-90"
                                    >
                                        <Check size={18} />
                                    </button>
                                    <button 
                                        onClick={() => handleRequest(req.id, 'rejected')}
                                        className="w-9 h-9 bg-slate-100 dark:bg-zinc-800 text-slate-400 rounded-xl flex items-center justify-center active:scale-90"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </motion.div>
            ) : activeChannel === 'private' && !selectedUser ? (
                <motion.div 
                    key="user-list"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="h-full flex flex-col p-4 space-y-4"
                >
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                            type="text" 
                            placeholder="Search tactical nodes..."
                            className="w-full bg-slate-50 dark:bg-zinc-900/50 p-4 pl-12 rounded-2xl outline-none text-xs font-bold border border-line dark:border-white/10 focus:border-blue-500 transition-all dark:text-white"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    
                    <div className="flex-1 overflow-y-auto space-y-3 pb-24">
                        {filteredUsers.map((u) => {
                            const connected = isFriend(u.id);
                            return (
                                <div 
                                    key={u.id}
                                    className="w-full bg-white dark:bg-zinc-900/50 p-4 rounded-[28px] flex items-center justify-between border border-line dark:border-white/5 group hover:bg-slate-50 dark:hover:bg-zinc-900 transition-all"
                                >
                                    <button 
                                        onClick={() => connected && setSelectedUser(u)}
                                        className="flex-1 flex items-center gap-3 overflow-hidden"
                                    >
                                        <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                                            {connected ? <User size={22} /> : <Lock size={18} className="opacity-40" />}
                                        </div>
                                        <div className="text-left overflow-hidden">
                                            <p className={cn(
                                                "text-sm font-black uppercase tracking-tight truncate",
                                                connected ? "text-slate-800 dark:text-white" : "text-slate-400"
                                            )}>{u.email.split('@')[0]}</p>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                {connected ? (u.isOnline ? 'Online Link' : 'Dormant') : 'Manual Auth Required'}
                                            </p>
                                        </div>
                                    </button>
                                    
                                    {!connected ? (
                                        <button 
                                            onClick={() => sendFriendRequest(u)}
                                            className="w-10 h-10 bg-slate-900 dark:bg-white text-white dark:text-black rounded-xl flex items-center justify-center shadow-lg active:scale-90 transition-transform"
                                        >
                                            <UserPlus size={18} />
                                        </button>
                                    ) : (
                                        <div className={cn(
                                            "w-2.5 h-2.5 rounded-full border-2 border-white dark:border-zinc-950",
                                            u.isOnline ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" : "bg-slate-300 dark:bg-zinc-700"
                                        )} />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </motion.div>
            ) : (
                <motion.div 
                    key="chat-area"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="h-full flex flex-col pt-2"
                >
                    <div 
                        ref={scrollRef}
                        className="flex-1 overflow-y-auto p-4 space-y-5"
                    >
                        {isLoading ? (
                            <div className="h-full flex items-center justify-center">
                                <Zap size={32} className="text-orange-accent animate-pulse" />
                            </div>
                         ) : messages.length > 0 ? (
                            messages.map((msg) => {
                                const isMe = msg.userId === user?.uid;
                                return (
                                    <div 
                                        key={msg.id}
                                        className={cn(
                                            "flex flex-col max-w-[82%] relative group",
                                            isMe ? "ml-auto items-end" : "mr-auto items-start"
                                        )}
                                    >
                                        {!isMe && activeChannel === 'community' && (
                                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1.5 ml-1">
                                                {msg.username || msg.userEmail.split('@')[0]}
                                            </span>
                                        )}
                                        <div 
                                            onContextMenu={(e) => {
                                                e.preventDefault();
                                                if (isMe && !msg.isDeleted) handleDeleteMessage(msg);
                                                else if (!isMe) openUserProfile(msg.userId);
                                            }}
                                            onClick={() => {
                                                if (isMe && !msg.isDeleted) setEditingMessage(msg);
                                                else if (!isMe) openUserProfile(msg.userId);
                                            }}
                                            className={cn(
                                                "p-4 rounded-[26px] shadow-sm relative overflow-hidden",
                                                msg.isDeleted ? "opacity-40 italic bg-slate-200 dark:bg-zinc-900 border-dashed border-2" :
                                                isMe 
                                                    ? (activeChannel === 'community' ? "bg-orange-accent text-white rounded-tr-none shadow-orange-500/10" : "bg-black dark:bg-white text-white dark:text-black rounded-tr-none")
                                                    : "bg-[#f1f5f9] dark:bg-zinc-800 text-black dark:text-white rounded-tl-none border border-line dark:border-white/20"
                                            )}
                                        >
                                            <p className="text-sm font-bold leading-relaxed">
                                                {msg.isDeleted ? 'Message was deleted' : msg.text}
                                            </p>
                                            
                                            {msg.isEdited && !msg.isDeleted && (
                                                <span className="text-[7px] uppercase font-black opacity-50 mt-1 block">Edited</span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-1.5 mt-1.5">
                                            <span className="text-[8px] font-black text-slate-300 dark:text-zinc-600 uppercase tracking-tighter">
                                                {formatTime(msg.timestamp)}
                                            </span>
                                            {isMe && activeChannel === 'private' && (
                                                <div className="flex -space-x-1">
                                                    <Check size={8} className={cn(
                                                        msg.status === 'sent' ? "text-slate-400" :
                                                        msg.status === 'delivered' ? "text-slate-600" :
                                                        "text-blue-500"
                                                    )} />
                                                    {(msg.status === 'delivered' || msg.status === 'seen') && (
                                                        <Check size={8} className={cn(
                                                            msg.status === 'delivered' ? "text-slate-600" : "text-blue-500"
                                                        )} />
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center opacity-30 space-y-5 px-12">
                                {activeChannel === 'private' ? <Lock size={56} className="text-blue-500" /> : <MessageCircle size={56} className="text-slate-400" />}
                                <div className="space-y-1">
                                    <p className="text-[11px] font-black uppercase tracking-[0.25em]">
                                        {activeChannel === 'private' ? 'Tactical Pulse Locked' : 'Network Silence'}<br/>Awaiting Neural Signal
                                    </p>
                                    {isBlocked && <p className="text-[9px] font-bold text-red-500 uppercase tracking-widest">Communication Link Severed</p>}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-white dark:bg-black border-t border-line dark:border-white/10 pb-10">
                        {editingMessage && (
                            <div className="mb-2 p-2 bg-slate-100 dark:bg-zinc-800 rounded-xl flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase opacity-50 px-2 italic">Editing Broadcast...</span>
                                <button onClick={() => setEditingMessage(null)}><X size={14} /></button>
                            </div>
                        )}
                        <UnifiedInput 
                            onSend={(text) => {
                                if (editingMessage) {
                                    handleEditMessage(editingMessage.id, text);
                                } else {
                                    handleSendMessage(text);
                                }
                            }} 
                            disabled={isBlocked}
                            placeholder={isBlocked ? "COMMUNICATION BLOCKED" : (activeChannel === 'community' ? "Broadcast to Hub..." : "Direct Link...")}
                        />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
      </div>

      {/* Username Modal */}
      <AnimatePresence>
        {showUsernameModal && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-slate-950/90 z-[100] flex items-center justify-center p-6 backdrop-blur-xl"
            >
                <motion.div 
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    className="w-full max-w-sm bg-slate-900 border border-white/10 p-8 rounded-[40px] shadow-2xl text-center space-y-6"
                >
                    <div className="w-20 h-20 bg-orange-accent/20 rounded-[32px] flex items-center justify-center text-orange-accent mx-auto">
                        <Zap size={40} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-white uppercase tracking-tight">Identity Required</h2>
                        <p className="text-xs text-white/50 mt-2 font-medium">Establish your tactical handle before entering the public community hub.</p>
                    </div>
                    <input 
                        type="text"
                        placeholder="ENTER USERNAME"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        className="w-full bg-black/50 border border-white/10 p-5 rounded-3xl text-center font-black uppercase text-sm tracking-widest outline-none focus:border-orange-accent transition-all text-white"
                    />
                    <button 
                        onClick={setUsername}
                        disabled={!newUsername.trim() || isUpdatingUsername}
                        className="w-full bg-orange-accent p-5 rounded-3xl font-black uppercase text-xs tracking-[0.2em] shadow-[0_10px_20px_rgba(255,99,33,0.3)] active:scale-95 transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isUpdatingUsername && <Loader2 size={16} className="animate-spin" />}
                        {isUpdatingUsername ? 'SYNCING...' : 'INITIALIZE SYNC'}
                    </button>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* User Profile Modal */}
      <AnimatePresence>
        {profileModalUser && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-slate-950/90 z-[110] flex items-center justify-center p-6 backdrop-blur-xl"
            >
                <div className="absolute inset-0" onClick={() => setProfileModalUser(null)} />
                <motion.div 
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    className="w-full max-w-sm bg-slate-900 border border-white/10 p-8 rounded-[40px] shadow-2xl relative z-10 overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-6">
                        <button onClick={() => setProfileModalUser(null)} className="text-white/40 hover:text-white"><X size={20} /></button>
                    </div>

                    <div className="text-center space-y-6">
                        <div className="relative inline-block">
                            <div className="w-24 h-24 bg-white/5 rounded-[32px] flex items-center justify-center border border-white/10 mx-auto overflow-hidden">
                                <User size={48} className="text-white/20" />
                            </div>
                            {profileModalUser.isOnline && (
                                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-4 border-slate-900 flex items-center justify-center">
                                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                                </div>
                            )}
                        </div>

                        <div>
                            <h3 className="text-xl font-black text-white uppercase tracking-tight">{profileModalUser.username}</h3>
                            <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mt-1">Tactical Operative</p>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            <button 
                                onClick={() => initiateChatFromProfile(profileModalUser)}
                                className="w-full bg-orange-accent p-4 rounded-2xl flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest text-white shadow-lg active:scale-95 transition-transform"
                            >
                                <MessageCircle size={16} /> Establish Link
                            </button>
                            
                            <div className="grid grid-cols-2 gap-3">
                                <button 
                                    onClick={() => sendFriendRequest(profileModalUser)}
                                    className="bg-white/5 p-4 rounded-2xl flex items-center justify-center gap-2 font-black text-[9px] uppercase tracking-widest text-white/80 hover:bg-white/10 transition-colors"
                                >
                                    <UserPlus size={14} /> Add Target
                                </button>
                                <button 
                                    onClick={() => {
                                        if (confirm(`Block ${profileModalUser.username}? Communication will be severed.`)) {
                                            const chatId = [user?.uid, profileModalUser.id].sort().join('_');
                                            updateDoc(doc(db, 'private_chats', chatId), { blockedBy: user?.uid });
                                            setProfileModalUser(null);
                                        }
                                    }}
                                    className="bg-red-500/10 p-4 rounded-2xl flex items-center justify-center gap-2 font-black text-[9px] uppercase tracking-widest text-red-500 hover:bg-red-500/20 transition-colors"
                                >
                                    <Lock size={14} /> Block
                                </button>
                            </div>

                            <button 
                                onClick={() => handleReport(profileModalUser)}
                                className="w-full bg-white/2 p-4 rounded-2xl flex items-center justify-center gap-3 font-black text-[9px] uppercase tracking-widest text-white/40 hover:text-red-400 transition-colors"
                            >
                                <ShieldAlert size={14} /> Report Conduct
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* Friend Notification Popup */}
      <AnimatePresence>
        {friendStatusAlert && (
            <motion.div 
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[200] bg-zinc-900 border border-white/10 px-8 py-5 rounded-[24px] shadow-2xl flex items-center gap-4 min-w-[280px]"
            >
                <div className="w-10 h-10 rounded-full bg-orange-accent/20 flex items-center justify-center text-orange-accent">
                    <UserPlus size={20} />
                </div>
                <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-white">Action Required</h4>
                    <p className="text-xs font-bold text-white/60">Send friend request to enable 1v1 link.</p>
                </div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>

  );
};

export default StudyTalks;
