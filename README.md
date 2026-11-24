# Hipa — Modern Glassmorphic Dating App

A complete, production-grade dating application designed according to PRD v1.0 specifications.
Features real-time discovery swiping, match celebrations, in-app chat with icebreakers, **1-to-1 WebRTC Audio & Video Calling**, blue tick selfie verification, manual UPI payment workflow, full-featured Admin Moderation Control Center, and bilingual English & Hindi UI.

---

## 🌟 Key Highlights

- **UI & UX:** Mobile-first Glassmorphic design (`#1b1033` → `#ffaf7b` gradient with animated glowing ambient orbs and frosted glass cards).
- **Core User App (PWA):**
  - **Discover:** Interactive card deck with drag/swipe physics, photo carousels, verified badges, and quick actions (Undo, Pass, Super Like, Like, Boost).
  - **Likes:** "Who Liked Me" grid with Hipa Gold blur locks.
  - **Chats:** Matches horizontal reel, conversation list, active chat screen with message history, typing indicators, and icebreaker suggestions.
  - **WebRTC Calls:** Peer-to-peer 1-to-1 Audio & Video calling with synthesized dual-tone ringtones, live timer, camera toggle, flip, and mute.
  - **Profile & Safety:** Profile completion meter, photo management, selfie verification badge requester, and India safety helpline center (112 / 1091).
  - **Monetization:** Hipa Gold / Platinum tiers with instant manual UPI payment (QR code & UTR verification) and Razorpay integration.
  - **Bilingual (i18n):** 1-click toggle between English and Hindi (`en` / `hi`).
- **Admin Moderation Panel (`/admin/`):**
  - Real-time KPIs (Total users, Active calls, Matches, Revenue).
  - User management (Verify, Suspend, Ban, Grant VIP).
  - Side-by-side selfie pose verification queue.
  - Safety reports resolution center (IT Rules 2021 & DPDP Act 2023 compliance).
  - Audio/Video call metadata logs.
  - Manual UPI transaction verification & push notification broadcast.
- **Deployment:**
  - **Cloudflare Pages:** Deployed at edge with Cloudflare Pages Functions (`functions/api/`).
  - **Node.js Server:** Self-hostable Express + SQLite (WAL mode) + Socket.IO server.
  - **Android APK:** Capacitor configuration ready for building native Android APK.

---

## 🚀 Running Locally

```bash
# Clone the repository
git clone https://github.com/aklove4047-cpu/hipa-dating-app.git
cd hipa-dating-app

# Run with Cloudflare Wrangler (Pages Dev)
npx wrangler pages dev public

# OR Run with Node.js Express server
cd server
npm install
npm start
# Server starts on http://localhost:3000
```

---

## 📱 Android APK Generation (Capacitor)

```bash
# In the project root
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap add android
npx cap sync
npx cap open android
```

Build signed release APK in Android Studio!

---

## 📄 License
MIT License. Built for Hipa Dating Platform.
