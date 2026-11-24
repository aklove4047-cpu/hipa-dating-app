/* =========================================================
   Hipa Dating App — API & Data Layer
   Exact specifications from reference app screenshots
   Brand: Hipa — Where Feelings Connect
   ========================================================= */

export const HIPA_CREATORS = [
  {
    id: 1,
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
    bio: "Hey there! Sweet chats & late-night vibes. Let's talk! 💕"
  },
  {
    id: 2,
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
    bio: "Bengali beauty, love music and soothing conversations. 🌸"
  },
  {
    id: 3,
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
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80",
  "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=300&q=80",
  "https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=300&q=80",
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80"
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

    const cfg = this.getGatewayConfigs();
    const universalAllowed = cfg.otp?.allowUniversalOtp !== false;
    const universalCode = cfg.otp?.universalOtpCode || "123456";

    sessionStorage.setItem('hipa_pending_phone', JSON.stringify({
      phone: "+91" + phone.replace(/^\+91/, '').trim(),
      referralCode,
      otp: universalCode
    }));

    return { ok: true, otp: universalCode };
  }

  async verifyPhoneOtp(code) {
    const pending = JSON.parse(sessionStorage.getItem('hipa_pending_phone') || sessionStorage.getItem('hima_pending_phone') || 'null');
    if (!pending) {
      return { ok: false, error: "No pending registration found. Please enter your mobile number again." };
    }

    const cfg = this.getGatewayConfigs();
    const universalCode = cfg.otp?.universalOtpCode || "123456";

    if (code !== pending.otp && code !== universalCode && code !== '123456') {
      return { ok: false, error: "Invalid OTP code. Please enter " + universalCode };
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
      language: language || "Hindi",
      gender: gender || "male",
      avatar: avatar || HIPA_AVATARS[0],
      coins: 60, // Welcome bonus!
      referralCode: pending.referralCode || "",
      isDnd: false,
      notifications: true,
      registeredAt: new Date().toISOString()
    };

    this.saveUser(newUser);
    this.session = { token: "hipa_tok_" + Date.now(), userId: newUser.id };
    localStorage.setItem('hipa_user_session', JSON.stringify(this.session));
    return newUser;
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
