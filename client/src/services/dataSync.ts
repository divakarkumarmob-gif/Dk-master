import { doc, getDoc, setDoc, updateDoc, getDocs, collection, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';

export const dataSync = {
  async updateUserPresence(uid: string, isOnline: boolean) {
    try {
      const userRef = doc(db, 'users', uid);
      await setDoc(userRef, { 
        isOnline, 
        lastActive: new Date().toISOString() 
      }, { merge: true });
    } catch (e) {
      console.error('Presence update failed:', e);
    }
  },

  async fetchUserData(uid: string) {
    try {
      const userRef = doc(db, 'users', uid);
      const snap = await getDoc(userRef);
      return snap.exists() ? snap.data() : null;
    } catch (e) {
      console.error('Fetch data failed:', e);
      return null;
    }
  },

  async getDeletedChatArchives() {
    try {
      const snap = await getDocs(collection(db, 'chat_archives'));
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      console.error('Fetch archives failed:', e);
      return [];
    }
  },

  async deleteChatArchive(id: string) {
    try {
      await deleteDoc(doc(db, 'chat_archives', id));
    } catch (e) {
      console.error('Delete archive failed:', e);
    }
  },

  async getBlockedUsers() {
    try {
      const snap = await getDocs(collection(db, 'users'));
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      console.error('Fetch blocked failed:', e);
      return [];
    }
  },

  async getNameAlerts() {
    try {
      const snap = await getDocs(collection(db, 'name_alerts'));
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      console.error('Fetch name alerts failed:', e);
      return [];
    }
  },

  async updateUserModeration(uid: string, moderation: any) {
    try {
      await updateDoc(doc(db, 'users', uid), { moderation });
    } catch (e) {
      console.error('Update moderation failed:', e);
    }
  },

  async saveUserData(uid: string, data: any) {
    try {
      const userRef = doc(db, 'users', uid);
      await setDoc(userRef, { data }, { merge: true });
    } catch (e) {
      console.error('Save data failed:', e);
    }
  }
};
