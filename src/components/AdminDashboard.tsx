import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, onSnapshot, query, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { cn } from '../lib/utils';
import { Trash2, AlertCircle, Shield, Bell, Pencil, Ban, Trash2 as TrashIcon } from 'lucide-react';
import { dataSync } from '../services/dataSync';

export default function AdminDashboard() {
  const [items, setItems] = useState<any[]>([]);
  const [nameAlerts, setNameAlerts] = useState<any[]>([]);
  const [archives, setArchives] = useState<any[]>([]);
  const [view, setView] = useState<'alerted' | 'blocked' | 'names' | 'archives'>('alerted');

  useEffect(() => {
    loadData();
    loadArchives();
  }, []);

  const loadArchives = async () => {
      const data = await dataSync.getDeletedChatArchives();
      setArchives(data);
  };

  const deleteArchive = async (archiveId: string) => {
      await dataSync.deleteChatArchive(archiveId);
      loadArchives();
  };

  const loadData = async () => {
      const allModerated = await dataSync.getBlockedUsers();
      const nAlerts = await dataSync.getNameAlerts();
      setItems(allModerated);
      setNameAlerts(nAlerts);
  };

  const filteredItems = items.filter(u => view === 'alerted' ? (u.moderation?.alerts || 0) > 0 : u.moderation?.isBlocked);

  const blockUser = async (userId: string, currentModeration: any) => {
      await dataSync.updateUserModeration(userId, { ...currentModeration, isBlocked: !currentModeration?.isBlocked });
      loadData();
  };

  const sendAlert = async (userId: string, currentModeration: any) => {
      await dataSync.updateUserModeration(userId, { ...currentModeration, alerts: (currentModeration?.alerts || 0) + 1 });
      loadData();
  };

  // State for sidebar expansion
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Close sidebar on content area click
  const handleContentClick = () => {
    if (!isSidebarOpen) setIsSidebarOpen(true);
  };

  const menuItems = [
    { id: 'alerted', label: 'User Alerts', icon: Bell },
    { id: 'names', label: 'Name Changes', icon: Pencil },
    { id: 'blocked', label: 'Blocked', icon: Ban },
    { id: 'archives', label: 'Deleted Messages', icon: TrashIcon },
  ] as const;

  return (
    <div className="flex min-h-screen bg-slate-50" onClick={handleContentClick}>
      {/* Sidebar Navigation */}
      <div 
        className={cn(
          "bg-white border-r border-slate-100 p-6 flex flex-col gap-6 transition-[width] duration-500 ease-out z-20 will-change-transform",
          isSidebarOpen ? "w-64" : "w-20"
        )}
      >
        <div className="flex items-center gap-2 text-slate-800">
          <Shield className="text-orange-500 shrink-0" />
          {isSidebarOpen && <h1 className="text-xl font-black">Admin</h1>}
        </div>
        
        <nav className="flex flex-col gap-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = view === item.id;
            return (
              <button 
                key={item.id} 
                onClick={(e) => { e.stopPropagation(); setView(item.id); setIsSidebarOpen(false); }}
                className={cn(
                  "p-4 rounded-xl font-bold text-sm flex items-center gap-3 transition-colors duration-200",
                  isActive ? 'bg-orange-50 text-orange-700' : 'text-slate-500 hover:bg-slate-50'
                )}
              >
                <Icon size={20} className={cn("shrink-0", isActive ? "text-orange-600" : "text-slate-400")} />
                {isSidebarOpen && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main Content Area */}
      <div 
          className={cn(
            "flex-1 p-8 transition-colors duration-500 bg-blue-500",
            !isSidebarOpen ? "opacity-100" : "opacity-60"
          )}
          onClick={(e) => { e.stopPropagation(); setIsSidebarOpen(true); }}
      >
        <h2 className="text-2xl font-black text-white mb-6 capitalize">{menuItems.find(m => m.id === view)?.label}</h2>
        
        <div className="space-y-4">
          {view === 'alerted' && (
              filteredItems.length === 0 ? (
                <div className="p-8 text-center text-slate-400 font-bold bg-white rounded-2xl border border-slate-100">No users found.</div>
              ) : filteredItems.map((user: any) => (
                <div key={user.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm text-slate-800">{user.displayName || user.name || 'Unknown User'}</p>
                    <p className="text-[10px] text-slate-400">Alerts: {user.moderation?.alerts || 0}</p>
                  </div>
                  <button onClick={() => sendAlert(user.id, user.moderation)} className="p-2 bg-yellow-50 text-yellow-600 rounded-xl hover:bg-yellow-100 text-xs font-bold">Add Alert</button>
                </div>
              ))
          )}

          {view === 'names' && (
              nameAlerts.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 font-bold bg-white rounded-2xl border border-slate-100">No name changes recorded.</div>
              ) : nameAlerts.map(alert => (
                  <div key={alert.id} className="bg-white p-4 rounded-2xl shadow-sm border border-orange-100">
                      <div className="flex justify-between items-start mb-2">
                          <span className="text-[10px] bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-bold">Name Change</span>
                          <span className="text-[10px] text-slate-400">{new Date(alert.timestamp).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                          <span className="text-slate-400 line-through text-sm">{alert.oldName}</span>
                          <span className="text-slate-800 font-bold">→</span>
                          <span className="text-green-600 font-bold">{alert.newName}</span>
                      </div>
                      <p className="text-[9px] text-slate-400 mt-1">ID: {alert.userId}</p>
                  </div>
              ))
          )}

          {view === 'blocked' && (
              filteredItems.length === 0 ? (
                <div className="p-8 text-center text-slate-400 font-bold bg-white rounded-2xl border border-slate-100">No blocked users.</div>
              ) : filteredItems.map((user: any) => (
                <div key={user.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm text-slate-800">{user.displayName || user.name || 'Unknown User'}</p>
                    <p className="text-[10px] text-slate-400 font-bold text-red-500">BLOCKED</p>
                  </div>
                  <button onClick={() => blockUser(user.id, user.moderation)} className="p-2 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 text-xs font-bold">Unblock</button>
                </div>
              ))
          )}

          {view === 'archives' && (
              archives.length === 0 ? (
                <div className="p-8 text-center text-slate-400 font-bold bg-white rounded-2xl border border-slate-100">No deleted archives.</div>
              ) : archives.map((arch: any) => (
                <div key={arch.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm text-slate-800">{arch.text}</p>
                    <p className="text-[10px] text-slate-400">Deleted: {new Date(arch.deletedAt).toLocaleString()}</p>
                  </div>
                  <button onClick={() => deleteArchive(arch.id)} className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 text-xs font-bold">Delete Forever</button>
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  );
}
