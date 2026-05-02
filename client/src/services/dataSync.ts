import { doc, getDoc, setDoc, updateDoc, getDocs, collection, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';
import { handleFirestoreError, OperationType } from '../lib/errorHandler';

export const dataSync = {
  async updateUserPresence(uid: string, isOnline: boolean) {
    try {
      const userRef = doc(db, 'users', uid);
      await setDoc(userRef, { 
        isOnline, 
        lastActive: new Date().toISOString() 
      }, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'users/' + uid);
    }
  },

  async fetchUserData(uid: string) {
    try {
      const userRef = doc(db, 'users', uid);
      const snap = await getDoc(userRef);
      return snap.exists() ? snap.data() : null;
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, 'users/' + uid);
      return null;
    }
  },

  async getDeletedChatArchives() {
    try {
      const snap = await getDocs(collection(db, 'chat_archives'));
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'chat_archives');
      return [];
    }
  },

  async deleteChatArchive(id: string) {
    try {
      await deleteDoc(doc(db, 'chat_archives', id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, 'chat_archives/' + id);
    }
  },

  async getBlockedUsers() {
    try {
      const snap = await getDocs(collection(db, 'users'));
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'users');
      return [];
    }
  },

  async getNameAlerts() {
    try {
      const snap = await getDocs(collection(db, 'name_alerts'));
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'name_alerts');
      return [];
    }
  },

  async updateUserModeration(uid: string, moderation: any) {
    try {
      await updateDoc(doc(db, 'users', uid), { moderation });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, 'users/' + uid);
    }
  },

  async saveUserData(uid: string, data: any) {
    try {
      const userRef = doc(db, 'users', uid);
      await setDoc(userRef, { data }, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'users/' + uid);
    }
  }
};
