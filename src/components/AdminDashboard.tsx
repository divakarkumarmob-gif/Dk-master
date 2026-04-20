import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, onSnapshot, query, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { Trash2, AlertCircle, Shield } from 'lucide-react';
import { dataSync } from '../services/dataSync';

export default function AdminDashboard() {
  const [items, setItems] = useState<any[]>([]);
  const [nameAlerts, setNameAlerts] = useState<any[]>([]);
  const [view, setView] = useState<'alerted' | 'blocked' | 'names'>('alerted');

  useEffect(() => {
    loadData();
  }, []);

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

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="flex items-center gap-2 mb-6 text-slate-800">
        <Shield className="text-orange-500" />
        <h1 className="text-2xl font-black">Admin Dashboard</h1>
      </div>

      <div className="flex bg-white p-1 rounded-2xl mb-6 shadow-sm overflow-x-auto">
        <button onClick={() => setView('alerted')} className={`flex-1 min-w-[100px] p-3 rounded-xl font-bold text-sm transition-colors ${view === 'alerted' ? 'bg-yellow-500 text-white' : 'text-slate-500'}`}>User Alerts</button>
        <button onClick={() => setView('names')} className={`flex-1 min-w-[100px] p-3 rounded-xl font-bold text-sm transition-colors ${view === 'names' ? 'bg-orange-500 text-white' : 'text-slate-500'}`}>Name Changes</button>
        <button onClick={() => setView('blocked')} className={`flex-1 min-w-[100px] p-3 rounded-xl font-bold text-sm transition-colors ${view === 'blocked' ? 'bg-red-500 text-white' : 'text-slate-500'}`}>Blocked Users</button>
      </div>

      <div className="space-y-4">
        {view === 'alerted' && (
            filteredItems.length === 0 ? (
              <div className="p-8 text-center text-slate-400 font-bold bg-white rounded-2xl border border-slate-100">No users found.</div>
            ) : filteredItems.map((user: any) => (
              <div key={user.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm">{user.displayName || user.name || 'Unknown User'}</p>
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
                  <p className="font-bold text-sm">{user.displayName || user.name || 'Unknown User'}</p>
                  <p className="text-[10px] text-slate-400 font-bold text-red-500">BLOCKED</p>
                </div>
                <button onClick={() => blockUser(user.id, user.moderation)} className="p-2 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 text-xs font-bold">Unblock</button>
              </div>
            ))
        )}
      </div>
    </div>
  );
}
