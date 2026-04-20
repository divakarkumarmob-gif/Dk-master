import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Mail, User as UserIcon, UserPlus, MessageCircle, X, Bell, Check, Trash2, Edit2, Edit3 } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { db } from '../services/firebase';
import { collection, onSnapshot, query, orderBy, addDoc, where } from 'firebase/firestore';
import { dataSync } from '../services/dataSync';
import PrivateChat from './PrivateChat';

export default function CommunityChat() {
  const { user } = useAppStore();
  const [messages, setMessages] = useState<any[]>([]);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [text, setText] = useState('');
  const [joined, setJoined] = useState(() => localStorage.getItem('community_joined') === 'true');
  const [displayName, setDisplayName] = useState(() => localStorage.getItem('community_name') || '');
  const [namePrompt, setNamePrompt] = useState(() => !localStorage.getItem('community_name'));
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [moderation, setModeration] = useState<{ isBlocked: boolean, cooldownMs: number, maxDailyMessages: number, alerts?: number }>({ isBlocked: false, cooldownMs: 0, maxDailyMessages: 50, alerts: 0 });
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [friendRequests, setFriendRequests] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showNameEdit, setShowNameEdit] = useState(false);
  const [newName, setNewName] = useState(displayName);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [friends, setFriends] = useState<any[]>([]);
  const [view, setView] = useState<'chat' | 'friends'>('chat');
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) return;
    dataSync.getFriends(user.uid).then(setFriends);
    
    // Listen for accepted requests to update friends list
    const q1 = query(collection(db, 'friend_requests'), where('fromId', '==', user.uid), where('status', '==', 'accepted'));
    const q2 = query(collection(db, 'friend_requests'), where('toId', '==', user.uid), where('status', '==', 'accepted'));
    
    const unsub1 = onSnapshot(q1, () => dataSync.getFriends(user.uid).then(setFriends));
    const unsub2 = onSnapshot(q2, () => dataSync.getFriends(user.uid).then(setFriends));
    
    return () => { unsub1(); unsub2(); };
  }, [user]);

  useEffect(() => {
    if (!user?.uid) return;
    const q = query(
        collection(db, 'friend_requests'),
        where('toId', '==', user.uid),
        where('status', '==', 'pending')
    );
    const unsubPending = onSnapshot(q, (snapshot) => {
        setFriendRequests(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Listen for accepted requests sent BY me that I haven't seen yet
    const qAct = query(
        collection(db, 'friend_requests'),
        where('fromId', '==', user.uid),
        where('status', '==', 'accepted'),
        where('senderSeen', '==', false)
    );
    const unsubAct = onSnapshot(qAct, (snapshot) => {
        setActivities(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubPending(); unsubAct(); };
  }, [user]);

  const sendFriendRequest = async () => {
      if (!user?.uid || !selectedUser) return;
      const success = await dataSync.sendFriendRequest(user.uid, displayName, selectedUser.id, selectedUser.name);
      if (success) {
          setToast("Request Sent!");
          setTimeout(() => setToast(null), 1000);
      }
      setSelectedUser(null);
  };

  useEffect(() => {
    if (selectedUser) {
        dataSync.getUserModeration(selectedUser.id).then(m => m && setModeration(m));
    }
  }, [selectedUser]);

  const saveModeration = async () => {
      await dataSync.updateUserModeration(selectedUser.id, moderation);
      setSelectedUser(null);
  };

  const handleNameChange = async () => {
      if (!user?.uid || !newName.trim() || newName === displayName) return;
      
      const count = await dataSync.getNameChangeCountThisWeek(user.uid);
      if (count >= 2) {
          alert("You can only change your name 2 times per week.");
          return;
      }

      const oldName = displayName;
      await dataSync.logNameChange(user.uid, oldName, newName);
      
      localStorage.setItem('community_name', newName);
      setDisplayName(newName);
      setShowNameEdit(false);
  };

  const handleJoin = () => {
      if (displayName) {
          localStorage.setItem('community_name', displayName);
          localStorage.setItem('community_joined', 'true');
          setNamePrompt(false);
          setJoined(true);
      }
  };

  const startPrivateChat = async (targetUserId: string, targetName: string) => {
      if (!user?.uid) return;
      const chatId = await dataSync.startPrivateChat(user.uid, targetUserId);
      setActiveChatId(chatId);
      setSelectedUser({ id: targetUserId, name: targetName }); // Ensure selectedUser is set
  };

  useEffect(() => {
    const q = query(collection(db, 'community_chat'), orderBy('timestamp', 'asc'));
    return onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setMessages(msgs);
    });
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (view === 'chat' && scrollRef.current) {
        scrollRef.current.scrollTo({
            top: scrollRef.current.scrollHeight,
            behavior: 'smooth'
        });
    }
  }, [messages, view]);

  if (activeChatId && selectedUser) {
    return <PrivateChat chatId={activeChatId} otherUser={selectedUser} onBack={() => { setActiveChatId(null); setSelectedUser(null); }} />;
  }

  const sendMessage = async () => {
    if (!text.trim() || !user?.uid) return;

    const myModeration = await dataSync.getUserModeration(user.uid);
    if (myModeration?.isBlocked) {
        alert("You are blocked from sending messages.");
        return;
    }

    if (editingMsgId) {
        await dataSync.updateCommunityMessage(editingMsgId, text);
        setEditingMsgId(null);
    } else {
        await addDoc(collection(db, 'community_chat'), {
          senderId: user?.uid,
          senderName: displayName,
          text,
          timestamp: new Date().toISOString()
        });
    }
    setText('');
  };

  const handleEditClick = (m: any) => {
      setEditingMsgId(m.id);
      setText(m.text);
      setSelectedMessageId(null);
  };

  const handleDeleteMessage = async (msgId: string) => {
      const result = await dataSync.deleteCommunityMessage(msgId);
      if (result) {
        setSelectedMessageId(null);
      } else {
        alert("Could not delete message. Please check permissions.");
      }
  };

  if (namePrompt) {
      return (
          <div className="p-8 h-full flex flex-col items-center justify-center gap-6 bg-sky-50">
              <h2 className="text-2xl font-black text-sky-900">Welcome to StudyMaster</h2>
              <div className="w-full bg-white p-2 rounded-2xl shadow-inner border border-sky-200">
                  <input placeholder="Enter your display name" className="p-4 w-full bg-transparent font-bold text-lg text-sky-900 placeholder:text-sky-300 outline-none" onChange={e => setDisplayName(e.target.value)} />
              </div>
              <button onClick={handleJoin} className="w-full p-4 bg-sky-500 text-white rounded-2xl font-black text-lg shadow-lg hover:bg-sky-600 transition-colors">Join Community</button>
          </div>
      )
  }

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden relative">
      <AnimatePresence>
        {toast && (
            <motion.div 
                initial={{ opacity: 0, scale: 0.5, y: 20 }} 
                animate={{ opacity: 1, scale: 1, y: 0 }} 
                exit={{ opacity: 0, scale: 0.5, y: 20 }} 
                className="fixed inset-0 flex items-center justify-center z-[100] pointer-events-none"
            >
                <div className="bg-sky-900/90 text-white px-6 py-3 rounded-2xl font-black shadow-2xl backdrop-blur-md border border-white/20">
                    {toast}
                </div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* Header with Tabs, Bell and Edit */}
      <div className="py-2.5 px-4 bg-white border-b flex items-center justify-between">
          <div className="flex flex-col">
            <h2 className="font-black text-sky-900 text-base leading-tight">StudyMaster</h2>
            <div className="flex gap-4 mt-0.5">
                <button onClick={() => setView('chat')} className={`text-[9px] font-black uppercase tracking-widest ${view === 'chat' ? 'text-sky-500 border-b border-sky-500' : 'text-slate-400'}`}>Community</button>
                <button onClick={() => setView('friends')} className={`text-[9px] font-black uppercase tracking-widest ${view === 'friends' ? 'text-sky-500 border-b border-sky-500' : 'text-slate-400'}`}>Friends {friends.length > 0 && `(${friends.length})`}</button>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button 
              onClick={() => { setNewName(displayName); setShowNameEdit(true); }} 
              className="p-1.5 bg-sky-50 rounded-full text-sky-400 hover:text-sky-600 transition-colors"
            >
              <Edit2 size={16}/>
            </button>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-1.5 bg-sky-50 rounded-full relative text-sky-600"
            >
                <Bell size={16} />
                {(friendRequests.length + activities.length) > 0 && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 text-white text-[8px] rounded-full flex items-center justify-center font-bold">
                      {friendRequests.length + activities.length}
                    </span>
                )}
            </button>
          </div>
      </div>

      {/* Name Edit Modal */}
      <AnimatePresence>
        {showNameEdit && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
                <div className="bg-white rounded-3xl p-6 w-full max-w-xs text-center relative border-4 border-sky-400">
                    <button onClick={() => setShowNameEdit(false)} className="absolute top-4 right-4 text-slate-400"><X size={20}/></button>
                    <h3 className="font-black text-xl mb-6 text-sky-900">Change Name</h3>
                    <p className="text-[10px] text-slate-400 mb-4">Max 2 changes per week</p>
                    <div className="bg-sky-50 p-1 rounded-xl mb-4 border border-sky-100">
                        <input value={newName} onChange={e => setNewName(e.target.value)} className="w-full p-3 font-bold text-sky-950 bg-transparent outline-none" placeholder="New Name" />
                    </div>
                    <button onClick={handleNameChange} className="w-full p-4 bg-sky-500 text-white rounded-xl font-black shadow-lg hover:bg-sky-600 transition-colors">Update Name</button>
                </div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* Notifications Panel */}
      <AnimatePresence>
        {showNotifications && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute top-20 right-4 left-4 bg-white rounded-2xl shadow-xl border border-sky-100 z-40 p-4 max-h-[400px] overflow-y-auto">
                <div className="space-y-6">
                    {/* Activity Section */}
                    {activities.length > 0 && (
                        <div>
                            <h3 className="font-black text-xs text-sky-900 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <span className="w-2 h-2 bg-sky-500 rounded-full animate-pulse"></span>
                                Activity
                            </h3>
                            <div className="space-y-2">
                                {activities.map(act => (
                                    <div key={act.id} className="flex items-center justify-between p-3 bg-sky-50 rounded-xl border border-sky-100">
                                        <p className="text-xs font-bold text-sky-900">
                                            <span className="text-sky-500">{act.toName}</span> accepted your request!
                                        </p>
                                        <button 
                                            onClick={() => dataSync.markRequestAsSeen(act.id)}
                                            className="text-[10px] font-black text-slate-400 hover:text-sky-500"
                                        >
                                            Dismiss
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Friend Requests Section */}
                    <div>
                        <h3 className="font-black text-xs text-sky-900 uppercase tracking-widest mb-3">Friend Requests</h3>
                        {friendRequests.length === 0 ? (
                            <p className="text-center text-slate-400 text-[10px] py-4">No pending requests</p>
                        ) : (
                            <div className="space-y-3">
                                {friendRequests.map(req => (
                                    <div key={req.id} className="flex items-center justify-between p-3 bg-white border border-sky-50 rounded-xl shadow-sm">
                                        <span className="font-bold text-xs text-sky-900">{req.fromName}</span>
                                        <div className="flex gap-2">
                                            <button onClick={() => dataSync.respondToFriendRequest(req.id, 'accepted')} className="p-1.5 bg-green-500 text-white rounded-lg shadow-sm"><Check size={14} /></button>
                                            <button onClick={() => dataSync.respondToFriendRequest(req.id, 'rejected')} className="p-1.5 bg-red-500 text-white rounded-lg shadow-sm"><Trash2 size={14} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        )}
      </AnimatePresence>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
        {view === 'chat' ? (
          messages.map(m => (
            <div key={m.id} className="flex flex-col gap-1">
              <div 
                onClick={() => {
                  if (m.senderId === user?.uid) {
                      setSelectedMessageId(selectedMessageId === m.id ? null : m.id);
                  } else {
                      setSelectedUser({ id: m.senderId, name: m.senderName });
                  }
                }} 
                className={`p-3 rounded-2xl max-w-[80%] relative cursor-pointer ${m.senderId === user?.uid ? 'bg-sky-500 text-white ml-auto' : 'bg-white shadow-sm border border-sky-100'}`}
              >
                  <p className="text-[10px] opacity-70 mb-1 font-bold">{m.senderName}</p>
                  <div className="break-words">
                      {m.text}
                      {m.edited && <span className="text-[9px] opacity-50 ml-2 italic">(edited)</span>}
                  </div>
              </div>
              
              {m.senderId === user?.uid && selectedMessageId === m.id && (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex justify-end gap-2 pr-1">
                      <button onClick={() => handleEditClick(m)} className="flex items-center gap-1 bg-white text-sky-500 px-3 py-1 rounded-full text-[10px] font-bold shadow-sm border border-sky-100"><Edit3 size={10}/> Edit</button>
                      <button onClick={() => handleDeleteMessage(m.id)} className="flex items-center gap-1 bg-white text-red-500 px-3 py-1 rounded-full text-[10px] font-bold shadow-sm border border-sky-100"><Trash2 size={10}/> Delete</button>
                  </motion.div>
              )}
            </div>
          ))
        ) : (
          <div className="space-y-2">
            {friends.length === 0 ? (
              <p className="text-center text-slate-400 text-xs py-10 font-bold">No friends added yet. Tap a user in community chat to add them!</p>
            ) : (
                friends.map(friend => (
                  <div key={friend.id} onClick={() => startPrivateChat(friend.id, friend.name)} className="flex items-center p-4 bg-white rounded-2xl shadow-sm border border-sky-100 cursor-pointer hover:bg-sky-50 transition-colors gap-4">
                      <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center text-sky-600"><UserIcon size={20}/></div>
                      <div className="flex-1">
                          <p className="font-bold text-sky-900">{friend.name}</p>
                          <p className="text-[10px] text-slate-400">Tap to chat 1v1</p>
                      </div>
                  </div>
                ))
            )}
          </div>
        )}
      </div>
      
      {view === 'chat' && (
        <div className="py-2.5 px-4 border-t bg-white space-y-1.5">
            {editingMsgId && (
                <div className="flex items-center justify-between px-2 py-1 bg-sky-50 rounded-lg">
                    <span className="text-[10px] font-bold text-sky-600 uppercase tracking-wider">Editing Message</span>
                    <button onClick={() => { setEditingMsgId(null); setText(''); }} className="text-red-500"><X size={14}/></button>
                </div>
            )}
            <div className="flex gap-2">
                <input 
                  value={text} 
                  onChange={e => setText(e.target.value)} 
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                  className="flex-1 py-2 px-3.5 bg-sky-950 text-white rounded-xl placeholder:text-sky-300 outline-none text-sm" 
                  placeholder={editingMsgId ? "Edit your message..." : "Message..."} 
                />
                <button 
                  onClick={sendMessage} 
                  className={`p-2 rounded-xl text-white transition-colors ${editingMsgId ? 'bg-green-500' : 'bg-sky-500'}`}
                >
                    {editingMsgId ? <Check size={18} /> : <Send size={18} />}
                </button>
            </div>
        </div>
      )}
      <AnimatePresence>
        {selectedUser && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
                <div className="bg-white rounded-3xl p-6 w-full max-w-xs text-center relative">
                    <button onClick={() => setSelectedUser(null)} className="absolute top-4 right-4 text-slate-400"><X size={20}/></button>
                    <div className="w-20 h-20 rounded-full bg-sky-100 mx-auto mb-4 flex items-center justify-center text-sky-600"><UserIcon size={40} /></div>
                    <h3 className="font-black text-xl mb-6">{selectedUser.name}</h3>
                    <div className="grid grid-cols-2 gap-2">
                        <button onClick={sendFriendRequest} className="flex flex-col items-center gap-1 p-3 bg-orange-100 text-orange-600 rounded-xl font-bold text-xs"><UserPlus size={20}/> Add Friend</button>
                        <button onClick={() => startPrivateChat(selectedUser.id, selectedUser.name)} className="flex flex-col items-center gap-1 p-3 bg-sky-500 text-white rounded-xl font-bold text-xs"><MessageCircle size={20}/> Chat</button>
                    </div>

                    {user?.email === 'divakarkumarmob@gmail.com' && (
                        <div className="mt-6 border-t pt-4 space-y-3">
                            <label className="flex items-center justify-between text-xs font-bold">
                                Block User
                                <input type="checkbox" checked={moderation.isBlocked} onChange={e => setModeration({...moderation, isBlocked: e.target.checked})} />
                            </label>
                            <button onClick={() => setModeration({...moderation, alerts: (moderation.alerts || 0) + 1})} className="w-full p-2 bg-yellow-500 text-white rounded font-bold text-xs">Send Alert</button>
                            <button onClick={saveModeration} className="w-full p-2 bg-red-500 text-white rounded font-bold text-xs">Save Moderation</button>
                        </div>
                    )}
                </div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
