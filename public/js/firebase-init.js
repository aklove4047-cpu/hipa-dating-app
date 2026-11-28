/* =========================================================
   Peelin's Dating App — Firebase & Firestore Cloud Engine
   Real-Time User Discovery, Profile Sync & WebRTC Signaling
   ========================================================= */

export const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "",
  authDomain: "peelins-app.firebaseapp.com",
  databaseURL: "https://peelins-app-default-rtdb.firebaseio.com",
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
                if (this.isReady && this.pendingUsersListener) {
                  this.subscribeToRealUsers(
                    this.pendingUsersListener.userId,
                    this.pendingUsersListener.targetGender,
                    this.pendingUsersListener.cb
                  );
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

  // Real-time Firestore listener for all registered users
  subscribeToRealUsers(currentUserId, targetGender, onUsersUpdate) {
    if (!this.ensureReady()) {
      this.pendingUsersListener = { userId: currentUserId, targetGender, cb: onUsersUpdate };
      return () => {};
    }
    try {
      if (this.usersUnsubscribe) {
        this.usersUnsubscribe();
      }
      this.usersUnsubscribe = this.db.collection('users')
        .limit(100)
        .onSnapshot(snapshot => {
          const users = [];
          snapshot.forEach(doc => {
            const data = doc.data();
            if (String(data.id) !== String(currentUserId) && data.status !== 'banned') {
              if (!targetGender || data.gender === targetGender) {
                users.push(data);
              }
            }
          });
          onUsersUpdate(users);
        }, err => console.warn('[Firebase] Users listener error:', err));

      return this.usersUnsubscribe;
    } catch (e) {
      return () => {};
    }
  }

  // --- Real WebRTC Call Signaling (Firestore + Cloudflare KV Dual Engine) ---
  getCallsApiUrl() {
    if (window.location && window.location.origin && window.location.origin.startsWith('http') && !window.location.origin.includes('localhost')) {
      return window.location.origin + '/api/v1/calls';
    }
    return 'https://www.peelins.in/api/v1/calls';
  }

  // User A initiates call: creates document in Cloudflare KV + Firestore
  async createCall(callData) {
    const callId = 'call_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
    const payload = {
      ...callData,
      id: callId,
      status: 'ringing'
    };

    // 1. Always post to Cloudflare KV /api/v1/calls (Works immediately without Firestore setup!)
    try {
      await fetch(this.getCallsApiUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (e) {}

    // 2. Also sync to Firestore if enabled
    if (this.ensureReady()) {
      try {
        await this.db.collection('calls').doc(callId).set({
          ...payload,
          createdAt: window.firebase.firestore.FieldValue.serverTimestamp()
        });
      } catch (err) {}
    }

    return payload;
  }

  // User B listens for incoming calls (Cloudflare KV polling + Firestore onSnapshot)
  listenForIncomingCalls(myUserId, onIncomingCall) {
    if (!myUserId) return () => {};
    const seenCalls = new Set();

    const triggerOnce = (call) => {
      if (!call || !call.id || seenCalls.has(call.id)) return;
      seenCalls.add(call.id);
      onIncomingCall(call);
    };

    // 1. Cloudflare KV Polling (every 1.5s)
    if (this.kvCallPollInterval) clearInterval(this.kvCallPollInterval);
    this.kvCallPollInterval = setInterval(async () => {
      try {
        const res = await fetch(`${this.getCallsApiUrl()}?receiverId=${encodeURIComponent(String(myUserId))}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.calls)) {
            data.calls.forEach(triggerOnce);
          }
        }
      } catch (e) {}
    }, 1500);

    // 2. Firestore real-time listener (if enabled)
    if (!this.ensureReady()) {
      this.pendingCallListener = { userId: myUserId, cb: onIncomingCall };
    } else {
      try {
        if (this.callUnsubscribe) this.callUnsubscribe();
        this.callUnsubscribe = this.db.collection('calls')
          .where('receiverId', '==', String(myUserId))
          .where('status', '==', 'ringing')
          .onSnapshot(snapshot => {
            snapshot.docChanges().forEach(change => {
              if (change.type === 'added') {
                triggerOnce({ id: change.doc.id, ...change.doc.data() });
              }
            });
          }, () => {});
      } catch (e) {}
    }

    return () => {
      if (this.kvCallPollInterval) clearInterval(this.kvCallPollInterval);
      if (this.callUnsubscribe) this.callUnsubscribe();
    };
  }

  // Listen for Call Document status changes (e.g. accepted, declined, ended)
  listenToCall(callId, onUpdate) {
    if (!callId || String(callId).startsWith('local_')) return () => {};
    let lastStatus = '';
    let hasAnswer = false;

    const pollTimer = setInterval(async () => {
      try {
        const res = await fetch(`${this.getCallsApiUrl()}?callId=${encodeURIComponent(callId)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.call) {
            const changed = data.call.status !== lastStatus || (!!data.call.answer && !hasAnswer);
            if (changed) {
              lastStatus = data.call.status;
              hasAnswer = !!data.call.answer;
              onUpdate(data.call);
            }
          }
        }
      } catch (e) {}
    }, 1000);

    let fsUnsub = () => {};
    if (this.ensureReady()) {
      try {
        fsUnsub = this.db.collection('calls').doc(callId).onSnapshot(doc => {
          if (doc.exists) {
            const d = doc.data();
            onUpdate(d);
          }
        }, () => {});
      } catch (e) {}
    }

    return () => {
      clearInterval(pollTimer);
      fsUnsub();
    };
  }

  // Update Call Document (offer, answer, status)
  async updateCall(callId, data) {
    if (!callId || String(callId).startsWith('local_')) return;
    try {
      await fetch(this.getCallsApiUrl(), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: callId, ...data })
      });
    } catch (e) {}

    if (this.ensureReady()) {
      try {
        await this.db.collection('calls').doc(callId).update(data);
      } catch (err) {}
    }
  }

  // Add ICE Candidate
  async addIceCandidate(callId, role, candidate) {
    if (!callId || String(callId).startsWith('local_') || !candidate) return;
    const candJson = candidate.toJSON ? candidate.toJSON() : candidate;
    try {
      await fetch(this.getCallsApiUrl(), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: callId, role, addCandidate: candJson })
      });
    } catch (e) {}

    if (this.ensureReady()) {
      try {
        const sub = role === 'caller' ? 'callerCandidates' : 'receiverCandidates';
        await this.db.collection('calls').doc(callId).collection(sub).add(candJson);
      } catch (e) {}
    }
  }

  // Listen for Remote ICE Candidates
  listenIceCandidates(callId, roleToListen, onCandidate) {
    if (!callId || String(callId).startsWith('local_')) return () => {};
    let seenCount = 0;

    const pollTimer = setInterval(async () => {
      try {
        const res = await fetch(`${this.getCallsApiUrl()}?callId=${encodeURIComponent(callId)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.call) {
            const field = roleToListen === 'caller' ? 'callerCandidates' : 'receiverCandidates';
            const list = data.call[field] || [];
            while (seenCount < list.length) {
              onCandidate(list[seenCount]);
              seenCount++;
            }
          }
        }
      } catch (e) {}
    }, 1000);

    let fsUnsub = () => {};
    if (this.ensureReady()) {
      try {
        const sub = roleToListen === 'caller' ? 'callerCandidates' : 'receiverCandidates';
        fsUnsub = this.db.collection('calls').doc(callId).collection(sub).onSnapshot(snapshot => {
          snapshot.docChanges().forEach(change => {
            if (change.type === 'added') {
              onCandidate(change.doc.data());
            }
          });
        }, () => {});
      } catch (e) {}
    }

    return () => {
      clearInterval(pollTimer);
      fsUnsub();
    };
  }
}

export const firebaseService = new FirebaseService();
window.peelinsFirebase = firebaseService;
