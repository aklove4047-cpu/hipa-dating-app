/* =========================================================
   Hipa Dating App — API Client & Data Layer
   Specification: PRD File 03
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
    this.token = localStorage.getItem('hipa_token') || 'demo_token';
    this.user = JSON.parse(localStorage.getItem('hipa_user') || 'null') || {
      id: 1,
      name: "Aman Kapoor",
      age: 25,
      city: "Mumbai, Bandra",
      email: "aman@example.com",
      gender: "male",
      interestedIn: "female",
      isPremium: false,
      photoVerified: true,
      bio: "Tech entrepreneur, badminton player, and sunset lover. Let's grab some chai!",
      photos: [
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80"
      ],
      swipesLeft: 25,
      superLikesLeft: 3
    };

    // Initialize Local Data Collections
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
          lastMessage: "Hey Aman! Loved your bio, do you really play badminton?",
          lastMessageTime: "2m ago",
          messages: [
            { id: 1, sender: "them", text: "Hey Aman! Loved your bio, do you really play badminton? 🏸", time: "12:40 PM" }
          ]
        },
        {
          id: 502,
          userId: 103,
          name: "Pooja Malhotra",
          photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80",
          city: "Delhi",
          online: false,
          unread: 0,
          lastMessage: "The sunset in Hauz Khas was unreal today!",
          lastMessageTime: "2h ago",
          messages: [
            { id: 1, sender: "me", text: "Hey Pooja! Any cafe recommendations?", time: "10:15 AM" },
            { id: 2, sender: "them", text: "The sunset in Hauz Khas was unreal today!", time: "10:30 AM" }
          ]
        }
      ];
      localStorage.setItem('hipa_matches', JSON.stringify(initialMatches));
    }
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

  getUser() {
    return this.user;
  }

  saveUser(user) {
    this.user = user;
    localStorage.setItem('hipa_user', JSON.stringify(user));
  }

  // Swipe Action
  async recordSwipe(profileId, action) {
    const profiles = this.getProfiles();
    const target = profiles.find((p) => p.id === profileId);
    
    // Decrement swipe counter if not premium
    if (!this.user.isPremium && this.user.swipesLeft > 0) {
      this.user.swipesLeft -= 1;
      this.saveUser(this.user);
    }

    let isMatch = false;
    let matchObj = null;

    if (action === 'like' || action === 'superlike') {
      // 70% chance of instant simulated match for delightful interactive demo
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

  // Send message
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

    // Simulated reply after 1.5 seconds
    setTimeout(() => {
      const replies = [
        "That's so cool! Tell me more :)",
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

  // Upgrade Plan
  async upgradeToGold(planType = "gold", utr = "") {
    this.user.isPremium = true;
    this.user.premiumType = planType;
    this.user.swipesLeft = 9999;
    this.user.superLikesLeft = 20;
    this.saveUser(this.user);
    return { ok: true, plan: planType, utr };
  }
}

export const api = new ApiService();
