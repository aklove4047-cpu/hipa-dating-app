/* =========================================================
   Hipa Dating App — API Client & Data Layer
   Specification: PRD Files 01, 02, 03
   Includes: Auth (Signup, OTP, Login, Logout), Profile Wizard, Photo Upload, Matches, Calling
   ========================================================= */

const INITIAL_PROFILES = [
  {
    id: 101,
    name: "Ananya Sharma",
    age: 23,
    city: "Mumbai, Bandra",
    distanceKm: 3,
    verified: true,
    bio: "Coffee enthusiast, indie music lover, and UI designer. Let's find the best sunset spot in Bandra! ☕🌅",
    job: "Product Designer @ FinTech",
    education: "NIFT Mumbai",
    height: "5'6\" (168 cm)",
    relationshipGoal: "long_term",
    interests: ["Design", "Indie Music", "Coffee", "Yoga", "Travel"],
    photos: [
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80"
    ]
  },
  {
    id: 102,
    name: "Rohan Verma",
    age: 26,
    city: "Bengaluru, Indiranagar",
    distanceKm: 5,
    verified: true,
    bio: "Startup engineer by day, guitarist by night. Looking for someone to explore craft breweries and live gigs with. 🎸🍻",
    job: "Fullstack Dev @ HealthTech",
    education: "IIT Bombay",
    height: "5'11\" (180 cm)",
    relationshipGoal: "long_term",
    interests: ["Guitar", "Startups", "Craft Beer", "Hiking", "Books"],
    photos: [
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80"
    ]
  },
  {
    id: 103,
    name: "Pooja Malhotra",
    age: 24,
    city: "Delhi, Hauz Khas",
    distanceKm: 2,
    verified: false,
    bio: "Foodie who will take you to the best street food stalls in Old Delhi. Dog mom to an adorable Golden Retriever. 🐾🍜",
    job: "Marketing Strategist",
    education: "Delhi University",
    height: "5'4\" (163 cm)",
    relationshipGoal: "short_term",
    interests: ["Foodie", "Dogs", "Photography", "Cafes", "Bollywood"],
    photos: [
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80"
    ]
  },
  {
    id: 104,
    name: "Karan Singhania",
    age: 27,
    city: "Pune, Koregaon Park",
    distanceKm: 7,
    verified: true,
    bio: "Fitness fanatic & culinary explorer. If you love weekend road trips and pasta from scratch, we'll get along. 🏋️‍♂️🍝",
    job: "Architect",
    education: "CEPT University",
    height: "6'1\" (185 cm)",
    relationshipGoal: "marriage",
    interests: ["Fitness", "Cooking", "Road Trips", "Architecture", "Art"],
    photos: [
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=800&q=80"
    ]
  },
  {
    id: 105,
    name: "Sneha Patel",
    age: 25,
    city: "Jaipur, C-Scheme",
    distanceKm: 4,
    verified: true,
    bio: "Architecture lover, chai connoisseur & pottery enthusiast. Looking for deep conversations and goofy laughs. ☕✨",
    job: "Interior Designer",
    education: "Raffles College",
    height: "5'5\" (165 cm)",
    relationshipGoal: "long_term",
    interests: ["Pottery", "Chai", "Travel", "Museums", "Cinema"],
    photos: [
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80"
    ]
  }
];

class ApiService {
  constructor() {
    this.session = JSON.parse(localStorage.getItem('hipa_session') || 'null');
    this.user = JSON.parse(localStorage.getItem('hipa_user') || 'null');
    this.registeredUsers = JSON.parse(localStorage.getItem('hipa_registered_users') || 'null') || [
      {
        email: "demo@hipa.com",
        password: "password123",
        dob: "1999-05-15",
        name: "Aman Kapoor",
        age: 25,
        city: "Mumbai, Bandra",
        gender: "male",
        interestedIn: "female",
        isPremium: false,
        photoVerified: true,
        bio: "Tech entrepreneur, badminton player, and sunset lover. Let's grab some chai! ☕",
        job: "Tech Founder",
        relationshipGoal: "long_term",
        interests: ["Tech", "Coffee", "Fitness", "Travel", "Music"],
        photos: [
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80"
        ],
        swipesLeft: 25,
        superLikesLeft: 3
      }
    ];

    if (!localStorage.getItem('hipa_registered_users')) {
      localStorage.setItem('hipa_registered_users', JSON.stringify(this.registeredUsers));
    }
    if (!localStorage.getItem('hipa_profiles')) {
      localStorage.setItem('hipa_profiles', JSON.stringify(INITIAL_PROFILES));
    }
    if (!localStorage.getItem('hipa_matches')) {
      const initialMatches = [
        {
          id: 501,
          userId: 101,
          name: "Ananya Sharma",
          photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80",
          city: "Mumbai",
          online: true,
          unread: 1,
          lastMessage: "Hey! Loved your bio, do you really play badminton? 🏸",
          lastMessageTime: "2m ago",
          messages: [
            { id: 1, sender: "them", text: "Hey! Loved your bio, do you really play badminton? 🏸", time: "12:40 PM" }
          ]
        }
      ];
      localStorage.setItem('hipa_matches', JSON.stringify(initialMatches));
    }
  }

  isLoggedIn() {
    return !!this.session && !!this.user;
  }

  getCurrentSession() {
    return this.session;
  }

  getUser() {
    return this.user;
  }

  saveUser(user) {
    this.user = user;
    localStorage.setItem('hipa_user', JSON.stringify(user));
    const idx = this.registeredUsers.findIndex((u) => u.email === user.email);
    if (idx !== -1) {
      this.registeredUsers[idx] = user;
      localStorage.setItem('hipa_registered_users', JSON.stringify(this.registeredUsers));
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
        cashfree: { appId: "TEST_CF_982341", env: "sandbox" },
        phonepe: { merchantId: "PGTESTPAYUAT", env: "UAT" },
        upiDirect: { vpa: "hipabiz@icici", payeeName: "Hipa Dating App", goldPrice: 299, platinumPrice: 699 }
      },
      otp: {
        activeProvider: "mock",
        allowUniversalOtp: true,
        universalOtpCode: "123456"
      }
    };
  }

  calculateAge(dobString) {
    const dob = new Date(dobString);
    const diffMs = Date.now() - dob.getTime();
    const ageDt = new Date(diffMs);
    return Math.abs(ageDt.getUTCFullYear() - 1970);
  }

  async signup(email, password, dob) {
    const age = this.calculateAge(dob);
    if (age < 18) {
      return { ok: false, error: "Under 18 not allowed. Hipa is strictly an 18+ dating community." };
    }

    const existing = this.registeredUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return { ok: false, error: "An account with this email already exists. Please log in." };
    }

    const cfg = this.getGatewayConfigs();
    const otpProvider = cfg.otp?.activeProvider || "mock";
    const universalAllowed = cfg.otp?.allowUniversalOtp !== false;
    const universalCode = cfg.otp?.universalOtpCode || "123456";

    // Generate random 6-digit OTP
    const generatedOtp = String(Math.floor(100000 + Math.random() * 900000));
    const activeOtp = universalAllowed ? universalCode : generatedOtp;

    sessionStorage.setItem('hipa_pending_signup', JSON.stringify({
      email,
      password,
      dob,
      age,
      otp: activeOtp,
      universalCode,
      provider: otpProvider
    }));

    let providerNotice = "";
    if (otpProvider === "fast2sms") {
      providerNotice = " [Dispatched via Fast2SMS Gateway]";
    } else if (otpProvider === "twilio") {
      providerNotice = " [Dispatched via Twilio SMS]";
    } else if (otpProvider === "msg91") {
      providerNotice = " [Dispatched via MSG91 Gateway]";
    }

    return {
      ok: true,
      message: `OTP sent successfully to ${email}${providerNotice}`,
      otpHint: universalAllowed ? universalCode : "Check your SMS"
    };
  }

  async verifyOtp(code) {
    const pending = JSON.parse(sessionStorage.getItem('hipa_pending_signup') || 'null');
    if (!pending) {
      return { ok: false, error: "No pending registration found. Please sign up again." };
    }
    
    const cfg = this.getGatewayConfigs();
    const universalAllowed = cfg.otp?.allowUniversalOtp !== false;
    const universalCode = cfg.otp?.universalOtpCode || "123456";

    if (code !== pending.otp && (!universalAllowed || code !== universalCode)) {
      return { ok: false, error: `Invalid OTP code. Please enter ${universalAllowed ? universalCode : 'the code sent to you'}.` };
    }
    return { ok: true, pending };
  }

  async completeOnboarding(profileData) {
    const pending = JSON.parse(sessionStorage.getItem('hipa_pending_signup') || 'null') || {};
    
    const newUser = {
      id: Date.now(),
      email: pending.email || "user@hipa.com",
      password: pending.password || "password123",
      dob: pending.dob || "2000-01-01",
      age: pending.age || this.calculateAge(pending.dob || "2000-01-01"),
      name: profileData.name || "New Explorer",
      gender: profileData.gender || "male",
      interestedIn: profileData.interestedIn || "female",
      city: profileData.city || "Mumbai",
      job: profileData.job || "",
      bio: profileData.bio || "Excited to meet genuine people nearby!",
      relationshipGoal: profileData.relationshipGoal || "long_term",
      interests: profileData.interests || ["Coffee", "Travel"],
      photos: profileData.photos && profileData.photos.length > 0 ? profileData.photos : [
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80"
      ],
      isPremium: false,
      photoVerified: false,
      swipesLeft: 25,
      superLikesLeft: 3,
      createdAt: new Date().toISOString()
    };

    this.registeredUsers.push(newUser);
    localStorage.setItem('hipa_registered_users', JSON.stringify(this.registeredUsers));

    const sessionToken = "hipa_jwt_" + Date.now();
    this.session = { token: sessionToken, email: newUser.email };
    this.user = newUser;
    localStorage.setItem('hipa_session', JSON.stringify(this.session));
    localStorage.setItem('hipa_user', JSON.stringify(this.user));
    sessionStorage.removeItem('hipa_pending_signup');

    return { ok: true, user: newUser, token: sessionToken };
  }

  async login(email, password) {
    const found = this.registeredUsers.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );

    if (!found) {
      return { ok: false, error: "Invalid email or password. Please try again or create an account." };
    }

    const sessionToken = "hipa_jwt_" + Date.now();
    this.session = { token: sessionToken, email: found.email };
    this.user = found;
    localStorage.setItem('hipa_session', JSON.stringify(this.session));
    localStorage.setItem('hipa_user', JSON.stringify(this.user));
    return { ok: true, user: found, token: sessionToken };
  }

  logout() {
    this.session = null;
    this.user = null;
    localStorage.removeItem('hipa_session');
    localStorage.removeItem('hipa_user');
  }

  getProfiles() {
    return JSON.parse(localStorage.getItem('hipa_profiles') || '[]');
  }

  saveProfiles(profiles) {
    localStorage.setItem('hipa_profiles', JSON.stringify(profiles));
  }

  getMatches() {
    return JSON.parse(localStorage.getItem('hipa_matches') || '[]');
  }

  saveMatches(matches) {
    localStorage.setItem('hipa_matches', JSON.stringify(matches));
  }

  async recordSwipe(profileId, action) {
    if (!this.user) return { ok: false, error: "Not logged in" };
    const profiles = this.getProfiles();
    const target = profiles.find((p) => p.id === profileId);

    if (!this.user.isPremium && this.user.swipesLeft > 0) {
      this.user.swipesLeft -= 1;
      this.saveUser(this.user);
    }

    let isMatch = false;
    let matchObj = null;

    if (action === 'like' || action === 'superlike') {
      isMatch = Math.random() < 0.75;
      if (isMatch && target) {
        const matches = this.getMatches();
        matchObj = {
          id: Date.now(),
          userId: target.id,
          name: target.name,
          photo: target.photos[0],
          city: target.city,
          online: true,
          unread: 1,
          lastMessage: "It's a Match! Say hi! ✨",
          lastMessageTime: "Just now",
          messages: [
            { id: Date.now(), sender: "them", text: `Hey ${this.user.name.split(' ')[0]}! Glad we matched! 👋`, time: "Just now" }
          ]
        };
        matches.unshift(matchObj);
        this.saveMatches(matches);
      }
    }

    return { ok: true, matched: isMatch, match: matchObj };
  }

  async sendMessage(matchId, text) {
    const matches = this.getMatches();
    const match = matches.find((m) => m.id === matchId);
    if (!match) return { ok: false, error: "Match not found" };

    const newMsg = {
      id: Date.now(),
      sender: "me",
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    match.messages.push(newMsg);
    match.lastMessage = text;
    match.lastMessageTime = "Just now";
    this.saveMatches(matches);

    setTimeout(() => {
      const replies = [
        "That's awesome! Tell me more :)",
        "Haha totally agree! ☕",
        "Are you free for an audio or video call later?",
        "Sounds like a plan! Let's do it.",
        "You have such a good vibe ✨"
      ];
      const replyText = replies[Math.floor(Math.random() * replies.length)];
      const replyMsg = {
        id: Date.now() + 1,
        sender: "them",
        text: replyText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      match.messages.push(replyMsg);
      match.lastMessage = replyText;
      match.lastMessageTime = "Just now";
      this.saveMatches(matches);
      window.dispatchEvent(new CustomEvent('hipa_new_message', { detail: { matchId, message: replyMsg } }));
    }, 1500);

    return { ok: true, message: newMsg };
  }

  async upgradeToGold(planType = "gold", utr = "") {
    if (!this.user) return { ok: false };
    this.user.isPremium = true;
    this.user.premiumType = planType;
    this.user.swipesLeft = 9999;
    this.user.superLikesLeft = 20;
    this.saveUser(this.user);
    return { ok: true, plan: planType, utr };
  }
}

export const api = new ApiService();
