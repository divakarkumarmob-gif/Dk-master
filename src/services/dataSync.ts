import { db } from './firebase';
import { doc, getDoc, setDoc, deleteDoc, collection, getDocs, addDoc, query, orderBy, where, onSnapshot, limit, updateDoc, serverTimestamp } from 'firebase/firestore';
import { TestResult, Note, Question, ChatMessage, AuthUser } from '../store/useAppStore';

export const dataSync = {
  async saveResult(userId: string, result: TestResult) {
    try {
        const docRef = doc(db, 'users', userId, 'results', result.id);
        await setDoc(docRef, result);
    } catch (e) {
        console.error("Failed to sync result:", e);
    }
  },

  async saveNote(userId: string, note: Note) {
    try {
        const docRef = doc(db, 'users', userId, 'notes', note.id);
        await setDoc(docRef, note);
    } catch (e) {
        console.error("Failed to sync note:", e);
    }
  },

  async deleteNote(userId: string, noteId: string) {
    try {
        const docRef = doc(db, 'users', userId, 'notes', noteId);
        await deleteDoc(docRef);
    } catch (e) {
        console.error("Failed to delete note from sync:", e);
    }
  },

  async saveStarredQuestion(userId: string, question: Question) {
    try {
        const docRef = doc(db, 'users', userId, 'starred', question.id);
        await setDoc(docRef, question);
    } catch (e) {
        console.error("Failed to sync starred question:", e);
    }
  },

  async removeStarredQuestion(userId: string, questionId: string) {
    try {
        const docRef = doc(db, 'users', userId, 'starred', questionId);
        await deleteDoc(docRef);
    } catch (e) {
        console.error("Failed to remove starred question from sync:", e);
    }
  },

  async saveProfile(userId: string, streak: number, lastLoginDate: string | null) {
    try {
        const docRef = doc(db, 'users', userId);
        await setDoc(docRef, { streak, lastLoginDate }, { merge: true });
    } catch (e) {
        console.error("Failed to sync profile:", e);
    }
  },

  async saveChatMessage(userId: string, msg: ChatMessage) {
    try {
        const docRef = doc(db, 'users', userId, 'chat', msg.id);
        await setDoc(docRef, msg);
        // Increment message count
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        const data = userSnap.exists() ? userSnap.data() : { dailyMessageCount: 0, lastMessageDate: new Date().toDateString() };
        
        const today = new Date().toDateString();
        let newCount = data.lastMessageDate === today ? (data.dailyMessageCount || 0) + 1 : 1;
        
        await setDoc(userRef, { dailyMessageCount: newCount, lastMessageDate: today }, { merge: true });
    } catch (e) {
        console.error("Failed to sync chat:", e);
    }
  },

  async getUserMessageStats(userId: string) {
    try {
      const userSnap = await getDoc(doc(db, 'users', userId));
      if (!userSnap.exists()) return { count: 0, extra: 0 };
      const data = userSnap.data();
      const today = new Date().toDateString();
      return {
        count: data.lastMessageDate === today ? (data.dailyMessageCount || 0) : 0,
        extra: data.extraMessageLimit || 0
      };
    } catch {
      return { count: 0, extra: 0 };
    }
  },

  async requestExtraMessages(userId: string) {
    try {
      const reqRef = doc(collection(db, 'message_requests'));
      await setDoc(reqRef, {
        userId,
        requestedAt: new Date().toISOString(),
        status: 'pending'
      });
      return true;
    } catch {
      return false;
    }
  },

  async startPrivateChat(userId: string, otherUserId: string) {
      const chatId = [userId, otherUserId].sort().join('_');
      const chatRef = doc(db, 'private_chats', chatId);
      await setDoc(chatRef, { participants: [userId, otherUserId] }, { merge: true });
      return chatId;
  },

  async blockUser(chatId: string, userId: string) {
      const chatRef = doc(db, 'private_chats', chatId);
      await setDoc(chatRef, { blockedBy: userId }, { merge: true });
  },

  async updateUserModeration(targetUserId: string, moderation: { isBlocked: boolean, cooldownMs: number, maxDailyMessages: number, alerts?: number }) {
      try {
          const userRef = doc(db, 'users', targetUserId);
          await setDoc(userRef, { moderation }, { merge: true });
      } catch (e) {
          console.error("Failed to update user moderation:", e);
      }
  },

  async getUserModeration(targetUserId: string) {
      try {
        const userSnap = await getDoc(doc(db, 'users', targetUserId));
        if (!userSnap.exists()) return null;
        return userSnap.data().moderation || { isBlocked: false, cooldownMs: 0, maxDailyMessages: 50, alerts: 0 };
      } catch {
        return null;
      }
  },

  async getBlockedUsers() {
      const snap = await getDocs(collection(db, 'users'));
      const chatSnap = await getDocs(collection(db, 'community_chat'));
      const nameMap: Record<string, string> = {};
      chatSnap.docs.forEach(d => nameMap[d.data().senderId] = d.data().senderName);
      
      return snap.docs
          .map(d => ({ id: d.id, displayName: nameMap[d.id], ...d.data() }))
          .filter((u: any) => u.moderation?.isBlocked || (u.moderation?.alerts || 0) > 0);
  },

  async getFriends(userId: string) {
      try {
          const sentQuery = query(collection(db, 'friend_requests'), where('fromId', '==', userId), where('status', '==', 'accepted'));
          const receivedQuery = query(collection(db, 'friend_requests'), where('toId', '==', userId), where('status', '==', 'accepted'));
          
          const [sentSnap, receivedSnap] = await Promise.all([getDocs(sentQuery), getDocs(receivedQuery)]);
          
          const friends: any[] = [];
          
          for (const d of sentSnap.docs) {
              const data = d.data();
              friends.push({ id: data.toId, name: data.toName || 'User' });
          }
          
          for (const d of receivedSnap.docs) {
              const data = d.data();
              friends.push({ id: data.fromId, name: data.fromName || 'User' });
          }
          
          return friends;
      } catch (e) {
          console.error("Failed to fetch friends:", e);
          return [];
      }
  },

  async sendFriendRequest(fromId: string, fromName: string, toId: string, toName: string) {
      try {
          const reqRef = doc(collection(db, 'friend_requests'));
          await setDoc(reqRef, {
              fromId,
              fromName,
              toId,
              toName,
              status: 'pending',
              senderSeen: false,
              timestamp: new Date().toISOString()
          });
          return true;
      } catch (e) {
          console.error("Failed to send friend request:", e);
          return false;
      }
  },

  async respondToFriendRequest(requestId: string, status: 'accepted' | 'rejected') {
      try {
          const reqRef = doc(db, 'friend_requests', requestId);
          await setDoc(reqRef, { status }, { merge: true });
          return true;
      } catch (e) {
          console.error("Failed to respond to friend request:", e);
          return false;
      }
  },

  async removeFriend(userId: string, otherUserId: string) {
      try {
          // Find the request between these two users
          const q1 = query(collection(db, 'friend_requests'), where('fromId', '==', userId), where('toId', '==', otherUserId));
          const q2 = query(collection(db, 'friend_requests'), where('fromId', '==', otherUserId), where('toId', '==', userId));
          
          const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
          const deletePromises = [...snap1.docs, ...snap2.docs].map(d => deleteDoc(d.ref));
          await Promise.all(deletePromises);
          return true;
      } catch (e) {
          console.error("Failed to remove friend:", e);
          return false;
      }
  },

  async markRequestAsSeen(requestId: string) {
      try {
          const reqRef = doc(db, 'friend_requests', requestId);
          await setDoc(reqRef, { senderSeen: true }, { merge: true });
          return true;
      } catch (e) {
          console.error("Failed to mark request as seen:", e);
          return false;
      }
  },

  async logNameChange(userId: string, oldName: string, newName: string) {
      try {
          const userRef = doc(db, 'users', userId);
          const userSnap = await getDoc(userRef);
          const history = userSnap.exists() ? (userSnap.data().nameChangeHistory || []) : [];
          
          const newHistory = [...history, {
              oldName,
              newName,
              timestamp: new Date().toISOString()
          }];
          
          await setDoc(userRef, { 
              nameChangeHistory: newHistory,
              moderation: {
                  ...(userSnap.exists() ? userSnap.data().moderation : {}),
                  alerts: ((userSnap.exists() ? userSnap.data().moderation?.alerts : 0) || 0) + 1
              }
          }, { merge: true });

          // Also log to a separate collection for easier admin view if needed
          await addDoc(collection(db, 'name_alerts'), {
              userId,
              oldName,
              newName,
              timestamp: new Date().toISOString()
          });
          
          return true;
      } catch (e) {
          console.error("Failed to log name change:", e);
          return false;
      }
  },

  async getNameChangeCountThisWeek(userId: string) {
      try {
          const userSnap = await getDoc(doc(db, 'users', userId));
          if (!userSnap.exists()) return 0;
          const history = userSnap.data().nameChangeHistory || [];
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          
          return history.filter((h: any) => new Date(h.timestamp) > weekAgo).length;
      } catch {
          return 0;
      }
  },

  async getNameAlerts() {
      const snap = await getDocs(query(collection(db, 'name_alerts'), orderBy('timestamp', 'desc')));
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
  },

  async updateCommunityMessage(msgId: string, newText: string) {
      try {
          const msgRef = doc(db, 'community_chat', msgId);
          await setDoc(msgRef, { text: newText, edited: true }, { merge: true });
          return true;
      } catch (e) {
          console.error("Failed to update community message:", e);
          return false;
      }
  },

  async deleteCommunityMessage(msgId: string) {
      try {
          const msgRef = doc(db, 'community_chat', msgId);
          await deleteDoc(msgRef);
          return true;
      } catch (e) {
          console.error("Failed to delete community message:", e);
          return false;
      }
  },

  async deleteChatMessage(userId: string, msgId: string) {
    try {
        const docRef = doc(db, 'users', userId, 'chat', msgId);
        await deleteDoc(docRef);
    } catch (e) {
        console.error("Failed to delete chat message from cloud:", e);
    }
  },

  async cleanupOldChatHistory(userId: string, beforeTimestamp: string) {
    try {
        const chatSnap = await getDocs(collection(db, 'users', userId, 'chat'));
        const deletePromises = chatSnap.docs
            .filter(d => new Date((d.data() as ChatMessage).timestamp).getTime() < new Date(beforeTimestamp).getTime())
            .map(d => deleteDoc(d.ref));
        await Promise.all(deletePromises);
    } catch (e) {
        console.error("Failed to cleanup old logs:", e);
    }
  },

  async clearChatHistory(userId: string) {
    try {
        const chatSnap = await getDocs(collection(db, 'users', userId, 'chat'));
        const deletePromises = chatSnap.docs.map(d => deleteDoc(d.ref));
        await Promise.all(deletePromises);
    } catch (e) {
        console.error("Failed to clear chat history:", e);
    }
  },

  async fetchUserData(userId: string) {
    if (!navigator.onLine) return null;

    try {
        const fetchCollection = async (name: string) => {
          try {
            const snap = await getDocs(collection(db, 'users', userId, name));
            return snap.docs.map(d => ({ ...d.data(), id: d.id }));
          } catch (e) {
            console.warn(`Failed to fetch ${name}:`, e);
            return [];
          }
        };

        const results = await fetchCollection('results');
        const notes = await fetchCollection('notes');
        const starredQuestions = await fetchCollection('starred');
        const mistakeVault = await fetchCollection('mistakes');
        const chatHistorySnap = await fetchCollection('chat');
        
        let profile = null;
        try {
          const profileSnap = await getDoc(doc(db, 'users', userId));
          if (profileSnap.exists()) {
            profile = profileSnap.data() as { streak: number, lastLoginDate: string | null };
          }
        } catch (e) {
          console.warn("Failed to fetch profile:", e);
        }

        return {
          results: results as TestResult[],
          notes: notes as Note[],
          starredQuestions: starredQuestions as Question[],
          mistakeVault: mistakeVault as Question[],
          chatHistory: (chatHistorySnap as ChatMessage[]).sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()),
          profile
        };
    } catch (e: any) {
        console.error("Fatal error in sync sync:", e);
        return null;
    }
  },

  async updateUserPresence(userId: string, isOnline: boolean, activeChatId: string | null = null) {
      try {
          const userRef = doc(db, 'users', userId);
          await setDoc(userRef, { 
              isOnline, 
              activeChatId,
              lastSeen: new Date().toISOString() 
          }, { merge: true });
      } catch (e) {
          console.error("Failed to update presence:", e);
      }
  },

  async markFriendMessagesAsSeen(chatId: string, myUserId: string) {
      try {
          const messagesRef = collection(db, 'private_chats', chatId, 'messages');
          const q = query(messagesRef, where('senderId', '!=', myUserId), where('status', '==', 'sent'));
          const snap = await getDocs(q);
          
          const batch = snap.docs.map(d => setDoc(d.ref, { status: 'seen' }, { merge: true }));
          await Promise.all(batch);
      } catch (e) {
          console.error("Failed to mark messages as seen:", e);
      }
  },

  async updateLeaderboard(userId: string, displayName: string, points: number) {
    try {
        const lbRef = doc(db, 'leaderboard', userId);
        await setDoc(lbRef, {
            userId,
            displayName,
            points,
            lastUpdate: new Date().toISOString()
        }, { merge: true });
    } catch (e) {
        console.error("Failed to update leaderboard:", e);
    }
  },

  async getTopUsers(limitCount: number = 10) {
    try {
        // Simplified query to avoid index requirement for multiple orderBys
        const q = query(collection(db, 'leaderboard'), orderBy('points', 'desc'), where('points', '>', 0));
        const snap = await getDocs(q);
        return snap.docs.slice(0, limitCount).map(d => d.data() as { userId: string, displayName: string, points: number, lastUpdate: string });
    } catch (e: any) {
        if (!e?.message?.includes('permissions')) {
            console.warn("Leaderboard fetch deferred:", e);
        }
        return [];
    }
  },

  async saveMistake(userId: string, question: Question) {
    try {
        const docRef = doc(db, 'users', userId, 'mistakes', question.id);
        await setDoc(docRef, { ...question, addedAt: new Date().toISOString() });
    } catch (e) {
        console.error("Failed to sync mistake:", e);
    }
  },

  async removeMistake(userId: string, questionId: string) {
    try {
        const docRef = doc(db, 'users', userId, 'mistakes', questionId);
        await deleteDoc(docRef);
    } catch (e) {
        console.error("Failed to remove mistake from sync:", e);
    }
  },

  // --- Battle Mode (Duel) Logic ---

  async findAvailableDuel() {
      try {
          const q = query(
              collection(db, 'duels'), 
              where('status', '==', 'waiting'), 
              orderBy('createdAt', 'desc'),
              limit(1)
          );
          const snap = await getDocs(q);
          if (snap.empty) return null;
          return { id: snap.docs[0].id, ...snap.docs[0].data() };
      } catch (e) {
          console.error("Matchmaking collision:", e);
          return null;
      }
  },

  async createDuel(user: { uid: string, displayName: string | null }, questions: any[]) {
      try {
          const docRef = await addDoc(collection(db, 'duels'), {
              status: 'waiting',
              createdAt: serverTimestamp(),
              questions,
              players: {
                  [user.uid]: {
                      name: user.displayName || 'Anonymous Aspirant',
                      score: 0,
                      currentIdx: 0,
                      finished: false
                  }
              }
          });
          return docRef.id;
      } catch (e) {
          console.error("Duel initialization failed:", e);
          return null;
      }
  },

  async joinDuel(duelId: string, user: { uid: string, displayName: string | null }) {
      try {
          const docRef = doc(db, 'duels', duelId);
          await updateDoc(docRef, {
              status: 'active',
              [`players.${user.uid}`]: {
                  name: user.displayName || 'Anonymous Ninja',
                  score: 0,
                  currentIdx: 0,
                  finished: false
              }
          });
      } catch (e) {
          console.error("Failed to join battle:", e);
      }
  },

  async updateDuelProgress(duelId: string, userId: string, score: number, currentIdx: number, finished: boolean = false) {
      try {
          const docRef = doc(db, 'duels', duelId);
          await updateDoc(docRef, {
              [`players.${userId}.score`]: score,
              [`players.${userId}.currentIdx`]: currentIdx,
              [`players.${userId}.finished`]: finished
          });
      } catch (e) {
          console.error("Syncing progress failed:", e);
      }
  },

  subscribeToDuel(duelId: string, callback: (data: any) => void) {
      const docRef = doc(db, 'duels', duelId);
      return onSnapshot(docRef, (doc) => {
          if (doc.exists()) {
              callback({ id: doc.id, ...doc.data() });
          }
      });
  }
};
