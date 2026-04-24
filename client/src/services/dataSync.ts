import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
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
  }
};
