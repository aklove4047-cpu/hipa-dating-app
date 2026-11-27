/* =========================================================
   Peelin's Dating App — Firebase & Firestore Cloud Engine
   Real-Time User Discovery, Profile Sync & WebRTC Signaling
   ========================================================= */

export const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "",
  authDomain: "peelins-app.firebaseapp.com",
  projectId: "peelins-app",
  storageBucket: "peelins-app.firebasestorage.app",
  messagingSenderId: "844854977384",
  appId: "1:844854977384:android:29b2c6b13721ccc1f12cdd"
};

class FirebaseService {
  constructor() {
    this.app = null;
    this.db = null;
    this.auth = null;
    this.isReady = false;
    this.callUnsubscribe = null;
    this.pendingCallListener = null;
    this.init();
    this.loadRemoteConfig();
  }

  async loadRemoteConfig() {
    try {
      const endpoints = ['/api/v1/firebase-config', 'https://www.peelins.in/api/v1/firebase-config'];
      for (const ep of endpoints) {
        try {
          const res = await fetch(ep);
          if (res.ok) {
            const data = await res.json();
            if (data?.config?.apiKey) {
              localStorage.setItem('peelins_firebase_config', JSON.stringify(data.config));
              if (!this.isReady) {
                this.init();
                if (this.isReady && this.pendingCallListener) {
                  this.listenForIncomingCalls(this.pendingCallListener.userId, this.pendingCallListener.cb);
                }
              }
              return;
            }
          }
        } catch (e) {}
      }
    } catch (e) {}
  }

  getConfig() {
    try {
      const saved = localStorage.getItem('peelins_firebase_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.apiKey) return parsed;
      }
    } catch (e) {}
    return DEFAULT_FIREBASE_CONFIG;
  }

  init() {
    try {
      if (typeof window.firebase === 'undefined') {
        console.warn('[Firebase] SDK scripts not loaded yet.');
        return;
      }
      const config = this.getConfig();
      if (!config.apiKey) {
        return;
      }
      if (!window.firebase.apps.length) {
        this.app = window.firebase.initializeApp(config);
      } else {
        this.app = window.firebase.app();
      }
      this.db = window.firebase.firestore();
      this.auth = window.firebase.auth();
      this.isReady = true;
      console.log('[Firebase] Initialized successfully for project:', config.projectId);
    } catch (err) {
      console.warn('[Firebase] Init note/fallback:', err);
    }
  }

  ensureReady() {
    if (!this.isReady && typeof window.firebase !== 'undefined') {
      this.init();
    }
    return this.isReady;
  }

  // --- Real-Time User Profile Sync ---
  async syncUserProfile(user) {
    if (!this.ensureReady() || !user || !user.id) return false;
    try {
      const docRef = this.db.collection('users').doc(String(user.id));
      await docRef.set({
        id: user.id,
        name: user.name || user.username || 'User',
        phone: user.phone || '',
        gender: user.gender || 'male',
        avatar: user.avatar || '',
        language: user.language || 'Hindi',
        city: user.city || 'India',
        bio: user.bio || 'Looking for real connections',
        isOnline: user.isOnline !== false,
        verified: !!user.verified,
        verificationStatus: user.verificationStatus || 'approved',
        voiceRate: user.voiceRate || 10,
        videoRate: user.videoRate || 20,
        lastSeen: window.firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: Date.now()
      }, { merge: true });
      return true;
    } catch (err) {
      console.warn('[Firebase] User sync warning:', err);
      return false;
    }
  }

  // Update Online / Offline Status in Real-Time
  async updateOnlineStatus(userId, isOnline) {
    if (!this.ensureReady() || !userId) return;
    try {
      await this.db.collection('users').doc(String(userId)).update({
        isOnline: !!isOnline,
        lastSeen: window.firebase.firestore.FieldValue.serverTimestamp()
      });
    } catch (e) {}
  }

  // Fetch all real registered users from Firestore
  async fetchRealUsers(currentUserId, targetGender = null) {
    if (!this.ensureReady()) return [];
    try {
      let query = this.db.collection('users').limit(60);
      if (targetGender) {
        query = query.where('gender', '==', targetGender);
      }
      const snapshot = await query.get();
      const users = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        if (String(data.id) !== String(currentUserId)) {
          users.push(data);
        }
      });
      return users;
    } catch (err) {
      console.warn('[Firebase] Fetch users warning:', err);
      return [];
    }
  }

  // --- Real WebRTC Call Signaling (Firestore) ---

  // User A initiates call: creates document in calls/
  async createCall(callData) {
    if (!this.ensureReady()) {
      return { id: 'local_' + Date.now(), ...callData };
    }
    try {
      const callRef = this.db.collection('calls').doc();
      const payload = {
        ...callData,
        id: callRef.id,
        status: 'ringing',
        createdAt: window.firebase.firestore.FieldValue.serverTimestamp()
      };
      await callRef.set(payload);
      return { id: callRef.id, ...payload };
    } catch (err) {
      console.error('[Firebase] Create call error:', err);
      return { id: 'local_' + Date.now(), ...callData };
    }
  }

  // User B listens for incoming calls
  listenForIncomingCalls(myUserId, onIncomingCall) {
    if (!myUserId) return () => {};
    if (!this.ensureReady()) {
      this.pendingCallListener = { userId: myUserId, cb: onIncomingCall };
      return () => {};
    }
    try {
      if (this.callUnsubscribe) {
        this.callUnsubscribe();
      }
      this.callUnsubscribe = this.db.collection('calls')
        .where('receiverId', '==', myUserId)
        .where('status', '==', 'ringing')
        .onSnapshot(snapshot => {
          snapshot.docChanges().forEach(change => {
            if (change.type === 'added') {
              const call = { id: change.doc.id, ...change.doc.data() };
              onIncomingCall(call);
            }
          });
        }, err => console.warn('[Firebase] Incoming calls listener error:', err));
      
      return this.callUnsubscribe;
    } catch (e) {
      return () => {};
    }
  }

  // Listen for Call Document status changes (e.g. accepted, declined, ended)
  listenToCall(callId, onUpdate) {
    if (!this.ensureReady() || !callId || String(callId).startsWith('local_')) {
      return () => {};
    }
    try {
      return this.db.collection('calls').doc(callId).onSnapshot(doc => {
        if (doc.exists) {
          onUpdate(doc.data());
        }
      }, err => console.warn('[Firebase] Call doc listener error:', err));
    } catch (e) {
      return () => {};
    }
  }

  // Update Call Document (offer, answer, status)
  async updateCall(callId, data) {
    if (!this.ensureReady() || !callId || String(callId).startsWith('local_')) return;
    try {
      await this.db.collection('calls').doc(callId).update(data);
    } catch (err) {
      console.warn('[Firebase] Update call error:', err);
    }
  }

  // Add ICE Candidate
  async addIceCandidate(callId, role, candidate) {
    if (!this.ensureReady() || !callId || String(callId).startsWith('local_') || !candidate) return;
    try {
      const sub = role === 'caller' ? 'callerCandidates' : 'receiverCandidates';
      await this.db.collection('calls').doc(callId).collection(sub).add(candidate.toJSON ? candidate.toJSON() : candidate);
    } catch (e) {}
  }

  // Listen for Remote ICE Candidates
  listenIceCandidates(callId, roleToListen, onCandidate) {
    if (!this.ensureReady() || !callId || String(callId).startsWith('local_')) return () => {};
    try {
      const sub = roleToListen === 'caller' ? 'callerCandidates' : 'receiverCandidates';
      return this.db.collection('calls').doc(callId).collection(sub).onSnapshot(snapshot => {
        snapshot.docChanges().forEach(change => {
          if (change.type === 'added') {
            onCandidate(change.doc.data());
          }
        });
      }, () => {});
    } catch (e) {
      return () => {};
    }
  }
}

export const firebaseService = new FirebaseService();
window.peelinsFirebase = firebaseService;
