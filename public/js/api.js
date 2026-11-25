/* =========================================================
   Hipa Dating App — API & Data Layer
   Exact specifications from reference app screenshots
   Brand: Hipa — Where Feelings Connect
   ========================================================= */

export const HIPA_CREATORS = [
  {
    id: 1,
    name: "Ashley",
    gender: "female",
    age: 21,
    language: "Hindi & English",
    online: true,
    voiceRate: 10,
    videoRate: 10,
    videoOnline: true,
    avatar: "/images/avatar_female_ashley.jpg",
    rating: 5.0,
    callsCount: 3120,
    verified: true,
    tags: ["photography 📷", "politics 🏛️", "travel ✈️", "sports ⚽"],
    bio: "Free spirited traveler exploring hidden gems, new cuisines, and unforgettable global experiences daily."
  },
  {
    id: 2,
    name: "Aryan",
    gender: "male",
    age: 23,
    language: "Hindi",
    online: true,
    voiceRate: 10,
    videoRate: 10,
    videoOnline: true,
    avatar: "/images/avatar_male_aryan.jpg",
    rating: 4.9,
    callsCount: 1840,
    verified: true,
    tags: ["fitness 🏋️", "travel ✈️", "music 🎸"],
    bio: "Passionate storyteller, wanderer, and music enthusiast. Let's vibe! ✨"
  },
  {
    id: 3,
    name: "jannatkhan",
    gender: "female",
    age: 22,
    language: "Hindi",
    online: true,
    voiceRate: 10,
    videoRate: 0,
    videoOnline: false,
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
    rating: 4.9,
    callsCount: 1420,
    verified: true,
    tags: ["dating 💖", "night chats 🌙"],
    bio: "Hey there! Sweet chats & late-night vibes. Let's talk! 💕"
  },
  {
    id: 4,
    name: "khushi",
    gender: "female",
    age: 21,
    language: "Bengali",
    online: true,
    voiceRate: 10,
    videoRate: 0,
    videoOnline: false,
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80",
    rating: 4.8,
    callsCount: 980,
    verified: true,
    tags: ["bengali 🌸", "music 🎵"],
    bio: "Bengali beauty, love music and soothing conversations. 🌸"
  },
  {
    id: 5,
    name: "Simran",
    gender: "female",
    age: 23,
    language: "Punjabi",
    online: true,
    voiceRate: 10,
    videoRate: 60,
    videoOnline: true,
    avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80",
    rating: 5.0,
    callsCount: 2340,
    verified: true,
    tags: ["punjabi ✨", "video call 📹"],
    bio: "Live video call verified creator! Positive energy only."
  }
];
    bio: "Full of energy! Available for both voice and video call. ✨"
  },
  {
    id: 4,
    name: "Heena",
    gender: "female",
    age: 24,
    language: "Marathi",
    online: true,
    voiceRate: 10,
    videoRate: 60,
    videoOnline: true,
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80",
    rating: 4.7,
    callsCount: 890,
    bio: "Marathi mulgi! Chill vibes and great listener. ☕"
  },
  {
    id: 5,
    name: "Susmita",
    gender: "female",
    age: 22,
    language: "Odia",
    online: true,
    voiceRate: 10,
    videoRate: 60,
    videoOnline: true,
    avatar: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=400&q=80",
    rating: 4.8,
    callsCount: 1150,
    bio: "Friendly Odia creator. Let's share feelings! 💖"
  },
  {
    id: 6,
    name: "Damini",
    gender: "female",
    age: 23,
    language: "Telugu",
    online: true,
    voiceRate: 10,
    videoRate: 60,
    videoOnline: true,
    avatar: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=400&q=80",
    rating: 4.9,
    callsCount: 1780,
    bio: "Telugu girl, warm heart and exciting stories. 🌟"
  },
  {
    id: 7,
    name: "Pallavi",
    gender: "female",
    age: 25,
    language: "Tamil",
    online: false,
    voiceRate: 0,
    videoRate: 60,
    videoOnline: true,
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80",
    rating: 4.6,
    callsCount: 640,
    bio: "Tamil creator. Connect on high quality video call. 💃"
  },
  {
    id: 8,
    name: "mahiqueen",
    gender: "female",
    age: 21,
    language: "Marathi",
    online: true,
    voiceRate: 10,
    videoRate: 0,
    videoOnline: false,
    avatar: "https://images.unsplash.com/photo-1502685104226-ee32379fefbe?auto=format&fit=crop&w=400&q=80",
    rating: 4.7,
    callsCount: 750,
    bio: "Queen of good mood! Voice calls anytime. 👑"
  },
  {
    id: 9,
    name: "Priya",
    gender: "female",
    age: 23,
    language: "Hindi",
    online: true,
    voiceRate: 10,
    videoRate: 60,
    videoOnline: true,
    avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=400&q=80",
    rating: 4.9,
    callsCount: 3120,
    bio: "College student, love sharing day-to-day moments. 🌈"
  },
  {
    id: 10,
    name: "xvsea",
    gender: "female",
    age: 22,
    language: "Bengali",
    online: true,
    voiceRate: 10,
    videoRate: 60,
    videoOnline: true,
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80",
    rating: 4.8,
    callsCount: 1890,
    bio: "Charming conversations and fun banter. 💫"
  }
];

export const HIPA_COIN_PACKS = [
  { id: 1, coins: 40, price: 25, discount: "Save 30%", popular: false },
  { id: 2, coins: 90, price: 49, discount: "", popular: false },
  { id: 3, coins: 200, price: 64, discount: "Save 30%", popular: false },
  { id: 4, coins: 440, price: 129, discount: "Save 20%", popular: false },
  { id: 5, coins: 1200, price: 299, discount: "Save 30%", popular: false },
  { id: 6, coins: 2500, price: 699, discount: "Save 30%", popular: true },
  { id: 7, coins: 5500, price: 1199, discount: "Save 33%", popular: false },
  { id: 8, coins: 15000, price: 2999, discount: "Save 40%", popular: false },
  { id: 9, coins: 33000, price: 6999, discount: "Save 45%", popular: false }
];

export const HIPA_LANGUAGES = [
  { code: "ta", name: "Tamil", native: "தமிழ்", char: "த" },
  { code: "te", name: "Telugu", native: "తెలుగు", char: "తె" },
  { code: "ml", name: "Malayalam", native: "മലയാളം", char: "മ" },
  { code: "kn", name: "Kannada", native: "ಕನ್ನಡ", char: "ಕ" },
  { code: "hi", name: "Hindi", native: "हिंदी", char: "ह" },
  { code: "pa", name: "Punjabi", native: "ਪੰਜਾਬੀ", char: "ਪ" },
  { code: "mr", name: "Marathi", native: "मराठी", char: "म" },
  { code: "bn", name: "Bengali", native: "বাংলা", char: "ব" },
  { code: "as", name: "Assamese", native: "অসমীয়া", char: "অ" }
];

export const HIPA_AVATARS = [
  "/images/avatar_female_ashley.jpg",
  "/images/avatar_male_aryan.jpg",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80",
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=300&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80"
];

class HipaApiService {
  constructor() {
    // Migration: read from hipa_* first, fallback to hima_*
    this.session = JSON.parse(localStorage.getItem('hipa_user_session') || localStorage.getItem('hima_user_session') || 'null');
    this.user = JSON.parse(localStorage.getItem('hipa_user_profile') || localStorage.getItem('hima_user_profile') || 'null');
    
    // Initialize coin balance
    if (this.user && typeof this.user.coins === 'undefined') {
      this.user.coins = 60;
      this.saveUser(this.user);
    }
  }

  getGatewayConfigs() {
    const saved = localStorage.getItem('hipa_system_api_configs');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      payments: {
        activeGateway: "razorpay",
        razorpay: { keyId: "rzp_test_1DP5mmOlF5G5ag", mode: "test" },
        upiDirect: { vpa: "hipabiz@icici", payeeName: "Hipa App" }
      },
      otp: {
        activeProvider: "mock",
        allowUniversalOtp: true,
        universalOtpCode: "123456"
      }
    };
  }

  isLoggedIn() {
    return !!this.user && !!this.session;
  }

  getUser() {
    return this.user;
  }

  saveUser(user) {
    this.user = user;
    localStorage.setItem('hipa_user_profile', JSON.stringify(user));
  }

  logout() {
    localStorage.removeItem('hipa_user_session');
    localStorage.removeItem('hipa_user_profile');
    localStorage.removeItem('hima_user_session');
    localStorage.removeItem('hima_user_profile');
    this.user = null;
    this.session = null;
  }

  getCoins() {
    return this.user ? (this.user.coins || 0) : 0;
  }

  addCoins(amount, planTitle = "Recharge", utr = "") {
    if (!this.user) return false;
    this.user.coins = (this.user.coins || 0) + Number(amount);
    this.saveUser(this.user);

    // Save transaction
    const txs = this.getTransactions();
    txs.unshift({
      id: "TX-" + Date.now().toString().slice(-6),
      type: "credit",
      title: planTitle,
      amount: "+" + amount + " coins",
      utr: utr || ("UTR-" + Date.now().toString().slice(-8)),
      date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })
    });
    localStorage.setItem('hipa_user_transactions', JSON.stringify(txs));
    return this.user.coins;
  }

  deductCoins(amount, reason = "Call") {
    if (!this.user || (this.user.coins || 0) < amount) return false;
    this.user.coins -= amount;
    this.saveUser(this.user);

    const txs = this.getTransactions();
    txs.unshift({
      id: "TX-" + Date.now().toString().slice(-6),
      type: "debit",
      title: reason,
      amount: "-" + amount + " coins",
      date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    localStorage.setItem('hipa_user_transactions', JSON.stringify(txs));
    return true;
  }

  getTransactions() {
    return JSON.parse(localStorage.getItem('hipa_user_transactions') || localStorage.getItem('hima_user_transactions') || '[]');
  }

  getCallLogs() {
    return JSON.parse(localStorage.getItem('hipa_call_logs') || localStorage.getItem('hima_call_logs') || '[]');
  }

  recordCall(creator, type, durationSec, coinsSpent) {
    const logs = this.getCallLogs();
    const mins = Math.floor(durationSec / 60);
    const secs = durationSec % 60;
    const durStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    logs.unshift({
      id: "CL-" + Date.now().toString().slice(-6),
      creatorName: creator.name,
      avatar: creator.avatar,
      type: type, // 'voice' | 'video'
      duration: durStr,
      coinsSpent: coinsSpent,
      time: "Today " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: "Completed"
    });
    localStorage.setItem('hipa_call_logs', JSON.stringify(logs));
  }

  getFriends() {
    return JSON.parse(localStorage.getItem('hipa_friends_list') || localStorage.getItem('hima_friends_list') || '[]');
  }

  addFriend(creator) {
    const friends = this.getFriends();
    if (!friends.find(f => f.name === creator.name)) {
      friends.unshift({
        id: creator.id || Date.now(),
        name: creator.name,
        avatar: creator.avatar,
        language: creator.language,
        addedAt: "Just now"
      });
      localStorage.setItem('hipa_friends_list', JSON.stringify(friends));
    }
  }

  getWarnings() {
    return JSON.parse(localStorage.getItem('hipa_user_warnings') || localStorage.getItem('hima_user_warnings') || '[]');
  }

  getBlocklist() {
    return JSON.parse(localStorage.getItem('hipa_user_blocklist') || localStorage.getItem('hima_user_blocklist') || '[]');
  }

  // OTP & Auth
  async sendPhoneOtp(phone, referralCode = "") {
    if (!phone || phone.length < 10) {
      return { ok: false, error: "Please enter a valid 10-digit mobile number." };
    }

    const cleanPhone = phone.replace(/^\+91/, '').replace(/\D/g, '').slice(-10);
    const cfg = this.getGatewayConfigs();
    const universalAllowed = cfg.otp?.allowUniversalOtp !== false;
    const universalCode = cfg.otp?.universalOtpCode || "123456";

    // Generate real 6-digit OTP
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const activeProvider = cfg.otp?.activeProvider || 'mockOtp';

    try {
      if (activeProvider === 'fast2sms' && cfg.otp?.fast2sms?.apiKey) {
        const f2sKey = cfg.otp.fast2sms.apiKey;
        const url = `https://www.fast2sms.com/dev/bulkV2?authorization=${encodeURIComponent(f2sKey)}&route=otp&variables_values=${generatedOtp}&flash=0&numbers=${cleanPhone}`;
        await fetch(url, { method: 'GET', mode: 'no-cors' }).catch(() => {});
      } else if (activeProvider === 'twofactor' && cfg.otp?.twofactor?.apiKey) {
        const tfKey = cfg.otp.twofactor.apiKey;
        const sender = cfg.otp.twofactor.senderId || 'HIPAOT';
        const url = `https://2factor.in/API/V1/${encodeURIComponent(tfKey)}/SMS/${cleanPhone}/${generatedOtp}/${encodeURIComponent(sender)}`;
        await fetch(url, { method: 'GET' }).catch(() => {});
      } else if (activeProvider === 'msg91' && cfg.otp?.msg91?.authKey) {
        const mKey = cfg.otp.msg91.authKey;
        const tpl = cfg.otp.msg91.templateId || '';
        const url = `https://control.msg91.com/api/v5/otp?template_id=${encodeURIComponent(tpl)}&mobile=91${cleanPhone}&authkey=${encodeURIComponent(mKey)}&otp=${generatedOtp}`;
        await fetch(url, { method: 'GET', mode: 'no-cors' }).catch(() => {});
      } else if (activeProvider === 'custom_sms' && cfg.otp?.customSms?.url) {
        const cs = cfg.otp.customSms;
        const targetUrl = cs.url.replace(/\{phone\}/g, cleanPhone).replace(/\{otp\}/g, generatedOtp);
        const options = { method: cs.method || 'POST', headers: {} };
        if (cs.headers) {
          try {
            options.headers = JSON.parse(cs.headers.replace(/\{phone\}/g, cleanPhone).replace(/\{otp\}/g, generatedOtp));
          } catch (e) {
            options.headers = { 'Content-Type': 'application/json' };
          }
        }
        if (cs.bodyTemplate && cs.method !== 'GET') {
          options.body = cs.bodyTemplate.replace(/\{phone\}/g, cleanPhone).replace(/\{otp\}/g, generatedOtp);
        }
        await fetch(targetUrl, options).catch(() => {});
      }
    } catch (err) {
      console.warn("SMS dispatch notice:", err);
    }

    sessionStorage.setItem('hipa_pending_phone', JSON.stringify({
      phone: "+91" + cleanPhone,
      referralCode,
      otp: generatedOtp,
      universalCode: universalAllowed ? universalCode : null
    }));

    return { ok: true, otp: generatedOtp, universalOtp: universalAllowed ? universalCode : null };
  }

  async verifyPhoneOtp(code) {
    const pending = JSON.parse(sessionStorage.getItem('hipa_pending_phone') || sessionStorage.getItem('hima_pending_phone') || 'null');
    if (!pending) {
      return { ok: false, error: "No pending registration found. Please enter your mobile number again." };
    }

    const cfg = this.getGatewayConfigs();
    const universalAllowed = cfg.otp?.allowUniversalOtp !== false;
    const universalCode = cfg.otp?.universalOtpCode || "123456";

    const entered = (code || '').trim();
    const isValid = (entered === pending.otp) ||
                    (universalAllowed && (entered === universalCode || entered === '123456' || entered === pending.universalCode));

    if (!isValid) {
      return { ok: false, error: "Invalid OTP code. Please enter the OTP code or test code " + (universalAllowed ? universalCode : "") };
    }

    return { ok: true, pending };
  }

  finishOnboarding(language, gender, avatar) {
    const pending = JSON.parse(sessionStorage.getItem('hipa_pending_phone') || sessionStorage.getItem('hima_pending_phone') || 'null') || {};
    const randomId = "Jgck" + Math.random().toString(36).substring(2, 5).toUpperCase() + Math.floor(100 + Math.random() * 900);

    const newUser = {
      id: Date.now(),
      phone: pending.phone || "+919876543210",
      username: randomId,
      name: randomId,
      language: language || "Hindi",
      gender: gender || "male",
      avatar: avatar || HIPA_AVATARS[0],
      coins: 60, // Welcome bonus!
      referralCode: pending.referralCode || "",
      isDnd: false,
      notifications: true,
      verified: false,
      isPremium: false,
      status: "active",
      city: "Mumbai",
      registeredAt: new Date().toISOString()
    };

    this.saveUser(newUser);
    this.session = { token: "hipa_tok_" + Date.now(), userId: newUser.id };
    localStorage.setItem('hipa_user_session', JSON.stringify(this.session));

    // Save to shared localStorage for same-browser Admin sync
    try {
      let allUsers = JSON.parse(localStorage.getItem('hipa_all_users') || '[]');
      allUsers = allUsers.filter(u => u.phone !== newUser.phone);
      allUsers.unshift(newUser);
      localStorage.setItem('hipa_all_users', JSON.stringify(allUsers));
    } catch (e) {}

    // Real-time cross-tab broadcast to Admin Panel
    try {
      const bc = new BroadcastChannel('hipa_users_sync');
      bc.postMessage({ type: 'USER_REGISTERED', user: newUser });
      setTimeout(() => bc.close(), 1000);
    } catch (e) {}

    // Dispatch to Cloudflare backend endpoints
    const endpoints = [
      '/api/v1/users',
      'https://hipa-admin.pages.dev/api/v1/users',
      'https://hipa-superadmin.pages.dev/api/v1/users'
    ];
    endpoints.forEach((ep) => {
      fetch(ep, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      }).catch(() => {});
    });

    return newUser;
  }

  getVerificationStatus() {
    const u = this.getUser();
    if (!u) return 'unverified';
    return u.verificationStatus || (u.verified ? 'approved' : 'unverified');
  }

  async submitVerification(dossier) {
    const user = this.getUser() || {};
    const payload = {
      id: Date.now(),
      userId: user.id || Date.now(),
      name: user.username || user.name || "User",
      phone: user.phone || "+919876543210",
      gender: user.gender || dossier.gender || "female",
      age: dossier.age || 21,
      dob: dossier.dob || "2003-05-15",
      profilePhoto: user.avatar || "/images/avatar_female_ashley.jpg",
      selfiePhoto: dossier.selfiePhoto || "/images/avatar_female_ashley.jpg",
      audioUrl: dossier.audioUrl || "https://actions.google.com/sounds/v1/speech/hello_greeting.ogg",
      poseReq: dossier.poseReq || "Peace Sign ✌️",
      status: "pending",
      submittedAt: new Date().toISOString()
    };

    user.verificationStatus = 'pending_approval';
    user.dob = payload.dob;
    user.age = payload.age;
    this.saveUser(user);

    // Save locally for instant tab sync
    try {
      let queue = JSON.parse(localStorage.getItem('hipa_verifications_queue') || '[]');
      queue.unshift(payload);
      localStorage.setItem('hipa_verifications_queue', JSON.stringify(queue));
    } catch (e) {}

    // Dispatch to Cloudflare backend
    const endpoints = [
      '/api/v1/verifications',
      'https://hipa-admin.pages.dev/api/v1/verifications',
      'https://hipa-superadmin.pages.dev/api/v1/verifications'
    ];
    endpoints.forEach((ep) => {
      fetch(ep, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(() => {});
    });

    // Broadcast to Admin Panel
    try {
      const bc = new BroadcastChannel('hipa_users_sync');
      bc.postMessage({ type: 'VERIFICATION_SUBMITTED', item: payload });
      setTimeout(() => bc.close(), 1000);
    } catch (e) {}

    return payload;
  }

  async reportAndBlockUser(reportedId, reportedName, reason) {
    let blocklist = this.getBlocklist();
    if (!blocklist.find(b => String(b.id) === String(reportedId))) {
      blocklist.push({ id: reportedId, name: reportedName, date: new Date().toLocaleDateString() });
      localStorage.setItem('hipa_user_blocklist', JSON.stringify(blocklist));
    }

    const report = {
      id: Date.now(),
      reporterId: this.user?.id || 1,
      reporterName: this.user?.username || "Verified User",
      reportedUser: reportedName,
      reportedId: reportedId,
      reason: reason || "Inappropriate behavior during live call",
      severity: "High",
      time: new Date().toLocaleTimeString(),
      status: "open"
    };

    try {
      let reports = JSON.parse(localStorage.getItem('hipa_reports_list') || '[]');
      reports.unshift(report);
      localStorage.setItem('hipa_reports_list', JSON.stringify(reports));
    } catch (e) {}

    try {
      const bc = new BroadcastChannel('hipa_users_sync');
      bc.postMessage({ type: 'SAFETY_REPORT', report });
      setTimeout(() => bc.close(), 1000);
    } catch (e) {}

    return report;
  }
}

export const hipaApi = new HipaApiService();
export const api = hipaApi;

// Backwards compatibility alias
export const himaApi = hipaApi;
export const HIMA_CREATORS = HIPA_CREATORS;
export const HIMA_COIN_PACKS = HIPA_COIN_PACKS;
export const HIMA_LANGUAGES = HIPA_LANGUAGES;
export const HIMA_AVATARS = HIPA_AVATARS;
