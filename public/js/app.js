/* =========================================================
   Hipa Dating App — Main Application Controller
   Exact Replica of Hipa Mobile UI & Feature Set
   Includes: Mobile OTP Login, 9-Language Selector, Gender/Avatar Wizard,
             Creators Directory, Live Calling (Voice/Video with Coin Meter),
             Wallet Recharge (40 to 33,000 Coins), ₹14 Welcome Offer Popup,
             Recent Calls Log, Friends Deck, User Profile & Settings.
   ========================================================= */

import { hipaApi, HIPA_CREATORS, HIPA_COIN_PACKS, HIPA_LANGUAGES, HIPA_AVATARS, HIPA_GIFTS, HIPA_STORIES, hipaAudio } from './api.js?v=12.0';
import { callManager } from './call-manager.js';
import { firebaseService } from './firebase-init.js';
import { i18n } from './i18n.js';

class HipaApp {
  constructor() {
    this.currentTab = 'home';
    this.discoveryMode = 'creators'; // 'creators' | 'swipe'
    this.currentSwipeIndex = 0;
    this.selectedLanguage = 'Hindi';
    this.selectedGender = 'male';
    this.selectedAvatar = HIPA_AVATARS[0];
    this.selectedCoinPack = HIPA_COIN_PACKS[0];
    this.activeCategory = 'All';
    this.user = hipaApi.getUser();
    this.discoverProfiles = [];
    this.callTimer = null;
    this.offerTimer = null;
    this.offerSeconds = 297; // 04:57
  }

  init() {
    window.hipaApp = this;
    window.peelinsApp = this;
    this.setupBroadcastSync();

    // Initialize Firebase & Listen for incoming WebRTC calls
    try {
      if (typeof firebaseService !== 'undefined') {
        firebaseService.ensureReady();
      }
      if (callManager && typeof callManager.initIncomingCallListener === 'function') {
        callManager.initIncomingCallListener();
      }
    } catch (e) {
      console.warn('Call listener init note:', e);
    }

    if (!hipaApi.isLoggedIn()) {
      this.renderOnboardingStep1();
    } else {
      this.renderMainApp();
      // Sync active user profile & status to Firebase
      const u = hipaApi.getUser();
      if (u) {
        try {
          firebaseService.syncUserProfile(u);
          firebaseService.updateOnlineStatus(u.id, true);
        } catch (e) {}
      }
    }
  }

  applyGlobalSettings(customSettings) {
    const s = customSettings || hipaApi.getSettings();
    
    // 1. Announcement Banner
    const banner = document.getElementById('hipaGlobalAnnouncement');
    const bannerText = document.getElementById('hipaGlobalAnnouncementText');
    if (banner && bannerText) {
      if (s.announcementEnabled && s.announcementText) {
        banner.style.display = 'block';
        bannerText.textContent = s.announcementText;
      } else {
        banner.style.display = 'none';
      }
    }

    // 2. Feature Visibility in Home Tab
    const luckyWheel = document.getElementById('btnOpenLuckyWheel');
    if (luckyWheel) {
      luckyWheel.style.display = s.enableLuckyWheel !== false ? 'flex' : 'none';
    }
    const vipClub = document.getElementById('btnOpenVIPClub');
    if (vipClub) {
      vipClub.style.display = s.enableVipPass !== false ? 'flex' : 'none';
    }
    const randBtn = document.getElementById('btnFloatingRandom');
    if (randBtn && s.enableRandomMatching === false) {
      randBtn.style.display = 'none';
    }

    // 3. Maintenance Mode Screen
    if (s.maintenanceMode) {
      const root = document.getElementById('mainViewport');
      if (root) {
        root.innerHTML = `
          <div style="min-height: 80vh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 32px 20px;">
            <div style="width: 80px; height: 80px; border-radius: 24px; background: rgba(255,0,127,0.15); border: 2px solid #ff007f; display: flex; align-items: center; justify-content: center; font-size: 2.5rem; margin-bottom: 20px;">
              🛠️
            </div>
            <h1 style="font-size: 1.6rem; font-weight: 900; color: #ffffff; margin-bottom: 8px;">Under Maintenance</h1>
            <p style="font-size: 0.92rem; color: #c9bfdc; max-width: 380px; line-height: 1.5; margin-bottom: 20px;">
              ${s.maintenanceMessage || "Peelin's is currently under scheduled maintenance. We will be back online shortly!"}
            </p>
            <button onclick="location.reload()" class="btn-primary" style="padding: 12px 24px; font-weight: 800; border-radius: 12px;">
              🔄 Check Again
            </button>
          </div>
        `;
      }
    }
  }

  setupBroadcastSync() {
    this.applyGlobalSettings();
    try {
      this.syncChannel = new BroadcastChannel('hipa_users_sync');
      this.syncChannel.onmessage = (ev) => {
        if (!ev.data) return;
        if (ev.data.type === 'SYSTEM_SETTINGS_UPDATED') {
          this.applyGlobalSettings(ev.data.settings);
        } else if (ev.data.type === 'AVATARS_UPDATED') {
          // If on onboarding step 4, refresh avatars
          const avatarGrid = document.querySelector('.avatars-grid-3x2');
          if (avatarGrid) {
            this.renderOnboardingStep4();
          }
        } else if (ev.data.type === 'VERIFICATION_APPROVED') {
          const curUser = hipaApi.getUser();
          if (curUser && (String(curUser.id) === String(ev.data.userId) || curUser.phone === ev.data.phone)) {
            curUser.verified = true;
            curUser.verificationStatus = 'approved';
            hipaApi.saveUser(curUser);
            this.user = curUser;
            this.showVerificationApprovedCelebration();
            if (this.currentTab === 'profile') {
              const root = document.getElementById('mainViewport');
              if (root) this.renderProfileTab(root);
            }
          }
        } else if (ev.data.type === 'USER_STATUS_CHANGED') {
          if (this.currentTab === 'profile') {
            const root = document.getElementById('mainViewport');
            if (root) this.renderProfileTab(root);
          }
        }
      };
    } catch (e) {}
  }

  showVerificationApprovedCelebration() {
    const modal = document.createElement('div');
    modal.className = 'offer-modal-overlay';
    modal.style.zIndex = '999999';
    modal.innerHTML = `
      <div class="offer-card-sheet" style="padding: 26px 20px; text-align: center; max-width: 420px; margin: auto;">
        <div style="font-size: 3.5rem; margin-bottom: 8px;">🎉</div>
        <div style="background: rgba(16, 185, 129, 0.15); border: 1.5px solid #10b981; border-radius: 999px; display: inline-block; padding: 4px 14px; color: #10b981; font-weight: 800; font-size: 0.78rem; margin-bottom: 12px;">Female Identity Verification Completed</div>
        <h2 style="font-size: 1.45rem; font-weight: 900; color: #ffffff; margin-bottom: 8px;">Account Verified & Activated!</h2>
        <p style="font-size: 0.88rem; color: #d1d5db; line-height: 1.5; margin-bottom: 20px;">
          Admin has approved your voice note and video verification. Your female profile is now 100% active. You can now receive voice & video calls, earn rewards, and connect freely!
        </p>
        <button id="btnDismissVerifCelebration" class="btn-primary" style="width: 100%; padding: 14px; font-size: 1rem; font-weight: 800; background: linear-gradient(135deg, #10b981, #059669); border: none; border-radius: 14px; box-shadow: 0 4px 20px rgba(16, 185, 129, 0.4); cursor: pointer;">
          Start Connecting Now 🚀
        </button>
      </div>
    `;
    document.body.appendChild(modal);
    modal.querySelector('#btnDismissVerifCelebration').onclick = () => modal.remove();
  }

  // ==========================================
  // ONBOARDING SCREENS (Exact UI as Screenshots)
  // ==========================================

  // Step 1: Get Started / Mobile Number & Instant Demo Login
  renderOnboardingStep1() {
    const root = document.getElementById('mainViewport');
    // Ensure smooth full-page scrolling without layout locks
    root.style.padding = '0';
    root.style.overflowY = 'auto';
    root.style.webkitOverflowScrolling = 'touch';

    const topBar = document.getElementById('hipaTopBar') || document.getElementById('himaTopBar');
    if (topBar) topBar.style.display = 'none';
    const bNav = document.getElementById('hipaBottomNav') || document.getElementById('himaBottomNav');
    if (bNav) bNav.style.display = 'none';
    const btnR = document.getElementById('btnFloatingRandom');
    if (btnR) btnR.style.display = 'none';

    root.innerHTML = `
      <div class="onboarding-container">
        <div class="onboarding-header-decor">
          <div style="width: 88px; height: 88px; border-radius: 24px; overflow: hidden; margin: 0 auto 12px auto; box-shadow: 0 0 35px rgba(255, 0, 127, 0.65); border: 2px solid rgba(255, 0, 127, 0.5);">
            <img src="/images/peelins_logo.jpg" style="width: 100%; height: 100%; object-fit: cover;" alt="Peelin's Logo" />
          </div>
          <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
            <h1 style="font-size: 2.2rem; font-weight: 900; background: linear-gradient(135deg, #ff007f 0%, #ff2a85 50%, #7928ca 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; letter-spacing: -0.5px;">Peelin's</h1>
            <span class="badge-18-plus">18+</span>
          </div>
          <p style="font-size: 0.95rem; color: #ff85c0; font-weight: 700; margin-top: 2px; text-shadow: 0 0 12px rgba(255,0,127,0.4);">Meet Live • Feel Real</p>

          <div class="features-row" style="margin-top: 16px; margin-bottom: 12px;">
            <div class="feat-item">
              <div class="feat-icon-sq" style="background: linear-gradient(135deg, #ff007f, #ec4899); box-shadow: 0 0 16px rgba(255,0,127,0.45);">📹</div>
              <span style="color: #ffffff;">Video Call</span>
            </div>
            <div class="feat-item">
              <div class="feat-icon-sq" style="background: linear-gradient(135deg, #3b82f6, #06b6d4); box-shadow: 0 0 16px rgba(59,130,246,0.45);">📞</div>
              <span style="color: #ffffff;">Audio Call</span>
            </div>
            <div class="feat-item">
              <div class="feat-icon-sq" style="background: linear-gradient(135deg, #8b5cf6, #d946ef); box-shadow: 0 0 16px rgba(139,92,246,0.45);">💬</div>
              <span style="color: #ffffff;">Live Chat</span>
            </div>
            <div class="feat-item">
              <div class="feat-icon-sq" style="background: linear-gradient(135deg, #10b981, #059669); box-shadow: 0 0 16px rgba(16,185,129,0.45);">👥</div>
              <span style="color: #ffffff;">Meet Real</span>
            </div>
          </div>
        </div>

        <div style="background: rgba(22, 14, 38, 0.88); border: 1.5px solid rgba(255, 0, 127, 0.35); border-radius: 24px; padding: 22px 18px; margin-top: 14px; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.7); backdrop-filter: blur(20px);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <h2 style="font-size: 1.45rem; font-weight: 900; color: #ffffff; margin: 0;">Get Started</h2>
            <span style="font-size: 0.72rem; color: #10b981; background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.35); padding: 2px 8px; border-radius: 9999px; font-weight: 800;">🔒 Secure Login</span>
          </div>

          <label style="font-size: 0.76rem; font-weight: 800; color: #ff85c0; text-transform: uppercase; letter-spacing: 0.8px;">Mobile number</label>

          <div class="phone-input-wrap" style="background: rgba(255, 255, 255, 0.08) !important; border: 1.5px solid #ff007f !important; border-radius: 14px !important; margin: 8px 0 6px 0 !important; box-shadow: 0 0 20px rgba(255, 0, 127, 0.25) !important;">
            <div class="country-flag" style="color: #ffffff !important; font-size: 1.05rem; font-weight: 800; display: flex; align-items: center; gap: 6px;">
              <span>🇮🇳</span> +91
            </div>
            <input type="tel" id="inputPhone" class="phone-text-input" placeholder="Enter 10-digit number" maxlength="10" inputmode="numeric" autocomplete="tel" value="" style="color: #ffffff !important; font-size: 1.25rem !important; font-weight: 800 !important; letter-spacing: 1.5px !important; caret-color: #ff007f !important; width: 100% !important; background: transparent !important;" />
          </div>
          <p style="font-size: 0.72rem; color: #958ba8; margin-bottom: 14px;">
            You will receive a 6-digit OTP verification code.
          </p>

          <!-- Referral Code Toggle -->
          <label class="checkbox-row" style="margin-bottom: 8px; color: #d5cee3 !important;">
            <input type="checkbox" id="chkReferral" checked />
            <span style="font-weight: 700; color: #ffffff;">Have a referral code? (+20 Coins)</span>
          </label>
          <div id="referralCodeBox" style="margin-bottom: 12px; display: flex; gap: 8px;">
            <input type="text" id="inputRefCode" class="glass-input" value="PEELINS2026" placeholder="Enter referral code" style="padding: 10px 14px; font-size: 0.95rem; font-weight: 800; color: #ffd700 !important; background: rgba(255,255,255,0.06); border-color: rgba(255,215,0,0.4);" />
            <button class="btn-secondary" id="btnApplyRef" style="padding: 0 16px; font-weight: 800; background: linear-gradient(135deg, #ff007f, #7928ca); color: #ffffff; border: none; border-radius: 12px; cursor: pointer;">Apply</button>
          </div>

          <!-- Age & Policy Checkboxes -->
          <label class="checkbox-row" style="color: #d5cee3 !important;">
            <input type="checkbox" id="chkAge" checked />
            <span style="font-weight: 700; color: #ffffff;">I confirm I am 18 years or older <strong style="color: #ff007f;">(Strictly 18+)</strong></span>
          </label>
          <label class="checkbox-row" style="color: #d5cee3 !important;">
            <input type="checkbox" id="chkTerms" checked />
            <span>I accept <strong style="color: #ff85c0;">Terms of Service</strong> & <strong style="color: #ff85c0;">Safety Guidelines</strong> of Peelin\'s.</span>
          </label>

          <button class="btn-pink-block" id="btnSendOtp" style="margin-top: 6px; font-size: 1.05rem; font-weight: 900; letter-spacing: 0.5px; box-shadow: 0 0 25px rgba(255,0,127,0.5);">
            Send OTP ➔
          </button>
        </div>
      </div>
    `;

    const phoneInput = root.querySelector('#inputPhone');
    phoneInput.oninput = (e) => {
      e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);
    };

    root.querySelector('#btnApplyRef').onclick = () => {
      alert('🎉 Referral code applied! You will get 20 bonus coins on signup.');
    };

    root.querySelector('#btnSendOtp').onclick = async () => {
      const phone = phoneInput.value.trim();
      const ageChk = root.querySelector('#chkAge').checked;
      const termsChk = root.querySelector('#chkTerms').checked;

      if (!phone || phone.length < 10) {
        alert('⚠️ Please enter a valid 10-digit mobile number.');
        phoneInput.focus();
        return;
      }

      if (!ageChk) {
        alert('You must be 18 years or older to use Peelin\'s.');
        return;
      }
      if (!termsChk) {
        alert('Please accept terms and community guidelines.');
        return;
      }

      const res = await hipaApi.sendPhoneOtp(phone);
      if (res.ok) {
        this.renderOnboardingStep2(phone);
      } else {
        alert(res.error);
      }
    };
  }

  // Step 2: Verify OTP
  renderOnboardingStep2(phone) {
    const root = document.getElementById('mainViewport');
    root.style.padding = '0';
    root.style.overflowY = 'auto';

    root.innerHTML = `
      <div class="onboarding-container">
        <div style="display: flex; align-items: center; justify-content: space-between; padding-top: 6px;">
          <button class="btn-secondary" id="btnBackToPhone" style="width: 42px; height: 42px; border-radius: 50%; padding: 0; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.2); color: #ffffff; font-size: 1.2rem; cursor: pointer;">←</button>
          <span style="font-size: 0.8rem; font-weight: 800; color: #ff85c0;">Step 2 of 4</span>
        </div>

        <div class="onboarding-header-decor" style="padding: 14px 0;">
          <div style="width: 72px; height: 72px; border-radius: 20px; overflow: hidden; margin: 0 auto 10px auto; box-shadow: 0 0 30px rgba(255, 0, 127, 0.6); border: 2px solid rgba(255, 0, 127, 0.4);">
            <img src="/images/peelins_logo.jpg" style="width: 100%; height: 100%; object-fit: cover;" alt="Peelin's Logo" />
          </div>
          <h1 style="font-size: 1.9rem; font-weight: 900; background: linear-gradient(135deg, #ff007f 0%, #ff2a85 50%, #7928ca 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Peelin's</h1>
          <p style="font-size: 0.85rem; color: #c9bfdc; font-weight: 700;">Meet Live • Feel Real</p>
        </div>

        <div style="background: rgba(22, 14, 38, 0.88); border: 1.5px solid rgba(255, 0, 127, 0.35); border-radius: 24px; padding: 22px 18px; margin-top: 10px; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.7); backdrop-filter: blur(20px);">
          <h2 style="font-size: 1.45rem; font-weight: 900; color: #ffffff; margin-bottom: 4px;">Verify OTP</h2>
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px;">
            <span style="font-size: 0.86rem; color: #c9bfdc;">
              Code sent to <strong style="color: #ffffff; font-weight: 900;">+91${phone}</strong>
            </span>
            <button id="btnChangeNumber" style="background: none; border: none; color: #ff007f; font-weight: 800; cursor: pointer; font-size: 0.82rem; text-decoration: underline;">Change</button>
          </div>

          <label style="display: block; font-size: 0.76rem; font-weight: 800; color: #ff85c0; text-transform: uppercase; letter-spacing: 0.8px; text-align: center; margin-bottom: 12px;">
            Enter 6-digit OTP code
          </label>

          <!-- 6 OTP Boxes -->
          <div style="display: flex; justify-content: center; gap: 8px; margin-bottom: 18px;">
            ${[0, 1, 2, 3, 4, 5].map((i) => `
              <input type="text" maxlength="1" inputmode="numeric" class="otp-box-digit" data-idx="${i}" 
                     value=""
                     style="width: 46px; height: 54px; text-align: center; font-size: 1.6rem; font-weight: 900; border: 2px solid #ff007f; border-radius: 14px; outline: none; background: rgba(255, 255, 255, 0.08); color: #ffffff; box-shadow: 0 0 16px rgba(255, 0, 127, 0.25); caret-color: #ff007f;" />
            `).join('')}
          </div>

          <!-- Quick Test OTP badge -->
          <div style="background: rgba(255, 215, 0, 0.1); border: 1px dashed rgba(255, 215, 0, 0.4); border-radius: 12px; padding: 8px 12px; margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between;">
            <div style="font-size: 0.76rem; color: #ffd700; font-weight: 700;">
              ✨ Demo OTP: <strong>123456</strong>
            </div>
            <button type="button" id="btnAutoFillOtp" style="background: #ffd700; border: none; color: #000; font-weight: 900; font-size: 0.72rem; padding: 4px 10px; border-radius: 9999px; cursor: pointer;">
              ⚡ Fill 123456
            </button>
          </div>

          <button class="btn-pink-block" id="btnVerifyOtp" style="font-size: 1.05rem; font-weight: 900; box-shadow: 0 0 25px rgba(255,0,127,0.5);">
            Verify OTP ➔
          </button>

          <p style="text-align: center; font-size: 0.78rem; color: #958ba8; margin-top: 14px;">
            Didn't receive the OTP? <span id="btnResendOtp" style="color: #ff007f; font-weight: 800; cursor: pointer;">Resend in <span id="otpCountdown">25</span>s</span>
          </p>
        </div>
      </div>
    `;

    root.querySelector('#btnBackToPhone').onclick = () => this.renderOnboardingStep1();
    root.querySelector('#btnChangeNumber').onclick = () => this.renderOnboardingStep1();

    const digits = root.querySelectorAll('.otp-box-digit');
    if (digits[0]) digits[0].focus();

    digits.forEach((el, idx) => {
      el.oninput = (e) => {
        e.target.value = e.target.value.replace(/\D/g, '').slice(-1);
        if (e.target.value && idx < 5) digits[idx + 1].focus();
      };
      el.onkeydown = (e) => {
        if (e.key === 'Backspace' && !e.target.value && idx > 0) {
          digits[idx - 1].focus();
        }
      };
      el.onpaste = (e) => {
        e.preventDefault();
        const pasted = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '').slice(0, 6);
        pasted.split('').forEach((ch, i) => {
          if (digits[i]) digits[i].value = ch;
        });
        if (digits[Math.min(5, pasted.length)]) digits[Math.min(5, pasted.length)].focus();
      };
    });

    root.querySelector('#btnAutoFillOtp').onclick = () => {
      ['1', '2', '3', '4', '5', '6'].forEach((d, i) => {
        if (digits[i]) digits[i].value = d;
      });
      if (digits[5]) digits[5].focus();
    };

    root.querySelector('#btnVerifyOtp').onclick = async () => {
      const code = Array.from(digits).map(d => d.value).join('');
      if (code.length < 6) {
        alert('⚠️ Please enter the complete 6-digit OTP code (or click "Fill 123456").');
        return;
      }
      const res = await hipaApi.verifyPhoneOtp(code);
      if (res.ok) {
        if (res.existingUser) {
          this.user = res.existingUser;
          this.renderMainApp();
        } else {
          this.renderOnboardingStep3();
        }
      } else {
        alert(res.error);
      }
    };
  }

  // Step 3: Choose Your Language (Fully Scrollable Grid)
  renderOnboardingStep3() {
    const root = document.getElementById('mainViewport');
    // Ensure smooth full-page scrolling without layout locks
    root.style.padding = '0';
    root.style.overflowY = 'auto';
    root.style.webkitOverflowScrolling = 'touch';

    // 10 Key Languages including English and Hindi
    const languages = [
      { code: "hi", name: "Hindi", native: "हिंदी", char: "ह" },
      { code: "en", name: "English", native: "English", char: "E" },
      { code: "pa", name: "Punjabi", native: "ਪੰਜਾਬੀ", char: "ਪ" },
      { code: "mr", name: "Marathi", native: "मराठी", char: "म" },
      { code: "bn", name: "Bengali", native: "বাংলা", char: "ব" },
      { code: "te", name: "Telugu", native: "తెలుగు", char: "తె" },
      { code: "ta", name: "Tamil", native: "தமிழ்", char: "த" },
      { code: "gu", name: "Gujarati", native: "ગુજરાતી", char: "ગ" },
      { code: "kn", name: "Kannada", native: "ಕನ್ನಡ", char: "ಕ" },
      { code: "ml", name: "Malayalam", native: "മലയാളം", char: "മ" }
    ];

    root.innerHTML = `
      <div class="onboarding-container">
        <!-- Top Bar -->
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px;">
          <button class="btn-secondary" id="btnBackToOtp" style="width: 42px; height: 42px; border-radius: 50%; padding: 0; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.2); color: #ffffff; font-size: 1.2rem; cursor: pointer;">←</button>
          <span style="font-size: 0.82rem; font-weight: 800; color: #ff85c0;">Step 3 of 4</span>
        </div>

        <h1 id="step3Title" style="font-size: 1.75rem; font-weight: 900; color: #ffffff; margin-bottom: 4px;">${i18n.t('choose_lang')}</h1>
        <p id="step3Subtitle" style="font-size: 0.88rem; color: #c9bfdc; font-weight: 600; margin-bottom: 20px;">
          ${i18n.t('choose_lang_sub')}
        </p>

        <!-- Languages Grid (All 10 Visible & Fully Scrollable) -->
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 24px;">
          ${languages.map((lang) => `
            <div class="lang-card-item ${this.selectedLanguage === lang.name ? 'selected' : ''}" data-lang="${lang.name}" data-code="${lang.code}" style="background: rgba(255,255,255,0.06); border: 2px solid ${this.selectedLanguage === lang.name ? 'var(--primary-pink)' : 'rgba(255,255,255,0.12)'}; border-radius: 18px; padding: 14px 12px; display: flex; align-items: center; gap: 12px; cursor: pointer; transition: all 0.2s ease; box-shadow: ${this.selectedLanguage === lang.name ? '0 0 20px rgba(255,0,127,0.45)' : 'none'};">
              <div style="width: 40px; height: 40px; border-radius: 12px; background: ${this.selectedLanguage === lang.name ? 'var(--primary-gradient)' : 'rgba(255,255,255,0.1)'}; color: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 1.15rem; font-weight: 900; flex-shrink: 0;">
                ${lang.char}
              </div>
              <div>
                <div style="font-size: 1.05rem; font-weight: 900; color: #ffffff;">${lang.native}</div>
                <div style="font-size: 0.78rem; color: #ff85c0; font-weight: 700;">${lang.name}</div>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Continue Button (In-Flow, Never Overlaps Content) -->
        <div style="margin-top: 10px; padding-bottom: 20px;">
          <button class="btn-pink-block" id="btnContinueLanguage" style="font-size: 1.05rem; font-weight: 900; box-shadow: 0 0 25px rgba(255,0,127,0.5);">
            ${i18n.t('continue')}
          </button>
        </div>
      </div>
    `;

    root.querySelector('#btnBackToOtp').onclick = () => this.renderOnboardingStep2('9511088531');

    root.querySelectorAll('.lang-card-item').forEach((card) => {
      card.onclick = () => {
        root.querySelectorAll('.lang-card-item').forEach(c => {
          c.classList.remove('selected');
          c.style.borderColor = 'rgba(255,255,255,0.12)';
          c.style.boxShadow = 'none';
          const icon = c.querySelector('div');
          if (icon) icon.style.background = 'rgba(255,255,255,0.1)';
        });
        card.classList.add('selected');
        card.style.borderColor = 'var(--primary-pink)';
        card.style.boxShadow = '0 0 20px rgba(255,0,127,0.45)';
        const icon = card.querySelector('div');
        if (icon) icon.style.background = 'var(--primary-gradient)';
        this.selectedLanguage = card.getAttribute('data-lang');
        const langCode = card.getAttribute('data-code') || 'en';
        i18n.setLang(langCode);

        // Live-translate heading, subtitle, and button immediately!
        const tEl = root.querySelector('#step3Title');
        const sEl = root.querySelector('#step3Subtitle');
        const cBtn = root.querySelector('#btnContinueLanguage');
        if (tEl) tEl.textContent = i18n.t('choose_lang');
        if (sEl) sEl.textContent = i18n.t('choose_lang_sub');
        if (cBtn) cBtn.textContent = i18n.t('continue');
      };
    });

    root.querySelector('#btnContinueLanguage').onclick = () => {
      this.renderOnboardingStep4();
    };
  }

  // Step 4: Who are you? (Name Input, Gender & Dynamic Avatars Grid)
  renderOnboardingStep4() {
    const root = document.getElementById('mainViewport');
    root.style.padding = '0';
    root.style.overflowY = 'auto';
    root.style.webkitOverflowScrolling = 'touch';

    const avatarCatalog = hipaApi.getAvatars();

    root.innerHTML = `
      <div class="onboarding-container">
        <!-- Top Progress Bar -->
        <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 16px;">
          <button class="btn-secondary" id="btnBackToLang" style="width: 42px; height: 42px; border-radius: 50%; padding: 0; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.2); color: #ffffff; font-size: 1.2rem; cursor: pointer;">←</button>
          <div style="flex: 1; height: 6px; background: rgba(255,255,255,0.12); border-radius: 10px; overflow: hidden;">
            <div style="width: 100%; height: 100%; background: var(--primary-gradient); box-shadow: 0 0 10px #ff007f;"></div>
          </div>
          <span style="font-size: 0.82rem; font-weight: 800; color: #ff85c0;">Profile Setup</span>
        </div>

        <h1 style="font-size: 1.75rem; font-weight: 900; color: #ffffff; margin-bottom: 4px;">Choose Your Gender</h1>
        <p style="font-size: 0.88rem; color: #c9bfdc; font-weight: 600; margin-bottom: 18px;">
          Select your registration type to personalize your experience
        </p>

        <!-- 1. Gender Selection (Prominent Male vs Female) -->
        <div class="gender-cards-row" style="margin-bottom: 18px;">
          <div class="gender-box ${this.selectedGender === 'male' ? 'selected' : ''}" data-gender="male" style="background: rgba(255,255,255,0.06); border: 2px solid ${this.selectedGender === 'male' ? 'var(--primary-pink)' : 'rgba(255,255,255,0.12)'}; border-radius: 20px; padding: 14px; text-align: center; cursor: pointer; transition: all 0.2s ease;">
            <div class="gender-circle-icon" style="font-size: 2rem; margin-bottom: 4px;">♂</div>
            <div style="font-size: 1.15rem; font-weight: 900; color: #ffffff; margin-bottom: 2px;">Male Account</div>
            <div style="font-size: 0.72rem; color: #38bdf8; font-weight: 700;">Connect with verified creators</div>
          </div>

          <div class="gender-box ${this.selectedGender === 'female' ? 'selected' : ''}" data-gender="female" style="background: rgba(255,255,255,0.06); border: 2px solid ${this.selectedGender === 'female' ? 'var(--primary-pink)' : 'rgba(255,255,255,0.12)'}; border-radius: 20px; padding: 14px; text-align: center; cursor: pointer; transition: all 0.2s ease;">
            <div class="gender-circle-icon" style="font-size: 2rem; margin-bottom: 4px;">♀</div>
            <div style="font-size: 1.15rem; font-weight: 900; color: #ffffff; margin-bottom: 2px;">Female Account</div>
            <div style="font-size: 0.72rem; color: #ff85c0; font-weight: 700;">Voice & Video Verified Creator</div>
          </div>
        </div>

        <!-- 2. Custom Name Input -->
        <div style="margin-bottom: 18px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,0,127,0.3); border-radius: 18px; padding: 14px 16px;">
          <label style="display: block; font-size: 0.74rem; font-weight: 800; color: #ff85c0; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px;">
            Your Name / Nickname
          </label>
          <input type="text" id="inputUserName" class="glass-input" placeholder="Enter your name (e.g. Rahul, Priya)" maxlength="24" autocomplete="name" value="" style="padding: 12px 16px; font-size: 1.1rem; font-weight: 700; color: #ffffff !important; background: rgba(255,255,255,0.08); border: 1.5px solid rgba(255,0,127,0.4); border-radius: 14px; width: 100%; outline: none;" />
        </div>

        <!-- 3. Avatar Picker (Photos Only, NO Names on Avatars) -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <span style="font-size: 0.95rem; font-weight: 900; color: #ffffff;">Pick your avatar</span>
          <span style="font-size: 0.76rem; color: #ff85c0; font-weight: 700;">Select character</span>
        </div>

        <div class="avatar-grid-8" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(75px, 1fr)); gap: 12px; margin-bottom: 20px;">
          ${avatarCatalog.map((av) => {
            const avUrl = typeof av === 'string' ? av : av.url;
            return `
            <div class="avatar-card-tile ${this.selectedAvatar === avUrl ? 'selected' : ''}" data-avatar="${avUrl}" style="padding: 6px; border-radius: 20px; background: rgba(255,255,255,0.06); border: 2.5px solid ${this.selectedAvatar === avUrl ? 'var(--primary-pink)' : 'rgba(255,255,255,0.12)'}; display: flex; align-items: center; justify-content: center; cursor: pointer; position: relative; transition: all 0.2s ease; box-shadow: ${this.selectedAvatar === avUrl ? '0 0 20px rgba(255,0,127,0.5)' : 'none'};">
              <img src="${avUrl}" alt="Avatar" style="width: 100%; aspect-ratio: 1/1; border-radius: 16px; object-fit: cover; display: block;" />
              ${this.selectedAvatar === avUrl ? '<div class="avatar-check-badge" style="position: absolute; top: -5px; right: -5px; width: 22px; height: 22px; border-radius: 50%; background: #ff007f; color: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 900; border: 2px solid #0c0814; box-shadow: 0 0 10px rgba(255,0,127,0.7);">✓</div>' : ''}
            </div>
            `;
          }).join('')}
        </div>

        <!-- Female Verification Notice -->
        <div id="femaleVerifNotice" style="display: ${this.selectedGender === 'female' ? 'flex' : 'none'}; align-items: flex-start; gap: 10px; background: rgba(245, 158, 11, 0.12); border: 1.5px solid #f59e0b; border-radius: 16px; padding: 12px 14px; margin-bottom: 18px;">
          <span style="font-size: 1.3rem;">🛡️</span>
          <div>
            <div style="font-size: 0.84rem; font-weight: 900; color: #fbbf24;">Female Security Verification Required</div>
            <div style="font-size: 0.75rem; color: #d1c7e6; margin-top: 2px;">
              Female profiles require submitting a short <strong>Voice Note</strong> and <strong>Video Recording</strong> for safety and admin approval.
            </div>
          </div>
        </div>

        <button class="btn-pink-block" id="btnFinishOnboarding" style="font-size: 1.1rem; font-weight: 900; box-shadow: 0 0 30px rgba(255,0,127,0.55); margin-bottom: 24px;">
          ${this.selectedGender === 'female' ? 'Continue to Female Verification ➔' : "Complete Setup & Enter Peelin's ➔"}
        </button>
      </div>
    `;

    root.querySelector('#btnBackToLang').onclick = () => this.renderOnboardingStep3();

    // Gender toggle
    root.querySelectorAll('.gender-box').forEach((box) => {
      box.onclick = () => {
        root.querySelectorAll('.gender-box').forEach(b => {
          b.classList.remove('selected');
          b.style.borderColor = 'rgba(255,255,255,0.12)';
        });
        box.classList.add('selected');
        box.style.borderColor = 'var(--primary-pink)';
        this.selectedGender = box.getAttribute('data-gender');

        const notice = root.querySelector('#femaleVerifNotice');
        const finishBtn = root.querySelector('#btnFinishOnboarding');
        if (this.selectedGender === 'female') {
          if (notice) notice.style.display = 'flex';
          if (finishBtn) finishBtn.textContent = 'Continue to Female Verification ➔';
        } else {
          if (notice) notice.style.display = 'none';
          if (finishBtn) finishBtn.textContent = "Complete Setup & Enter Peelin's ➔";
        }

        // Pre-select matching default avatar
        const defaultMatch = this.selectedGender === 'female' ? '/images/avatar_female_ashley.jpg' : '/images/avatar_male_aryan.jpg';
        this.selectedAvatar = defaultMatch;
        root.querySelectorAll('.avatar-card-tile').forEach(tile => {
          const isSel = tile.getAttribute('data-avatar') === defaultMatch;
          tile.classList.toggle('selected', isSel);
          tile.style.borderColor = isSel ? 'var(--primary-pink)' : 'rgba(255,255,255,0.12)';
          tile.style.boxShadow = isSel ? '0 0 20px rgba(255,0,127,0.5)' : 'none';
          const oldBadge = tile.querySelector('.avatar-check-badge');
          if (oldBadge) oldBadge.remove();
          if (isSel) {
            const b = document.createElement('div');
            b.className = 'avatar-check-badge';
            b.style.cssText = 'position: absolute; top: -5px; right: -5px; width: 22px; height: 22px; border-radius: 50%; background: #ff007f; color: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 900; border: 2px solid #0c0814; box-shadow: 0 0 10px rgba(255,0,127,0.7);';
            b.textContent = '✓';
            tile.appendChild(b);
          }
        });
      };
    });

    // Avatar selection
    root.querySelectorAll('.avatar-card-tile').forEach((tile) => {
      tile.onclick = () => {
        root.querySelectorAll('.avatar-card-tile').forEach(t => {
          t.classList.remove('selected');
          t.style.borderColor = 'rgba(255,255,255,0.12)';
          t.style.boxShadow = 'none';
          const badge = t.querySelector('.avatar-check-badge');
          if (badge) badge.remove();
        });

        tile.classList.add('selected');
        tile.style.borderColor = 'var(--primary-pink)';
        tile.style.boxShadow = '0 0 20px rgba(255,0,127,0.5)';
        const badge = document.createElement('div');
        badge.className = 'avatar-check-badge';
        badge.style.cssText = 'position: absolute; top: -5px; right: -5px; width: 22px; height: 22px; border-radius: 50%; background: #ff007f; color: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 900; border: 2px solid #0c0814; box-shadow: 0 0 10px rgba(255,0,127,0.7);';
        badge.textContent = '✓';
        tile.appendChild(badge);
        this.selectedAvatar = tile.getAttribute('data-avatar');
      };
    });

    root.querySelector('#btnFinishOnboarding').onclick = () => {
      const nameInput = root.querySelector('#inputUserName');
      const enteredName = (nameInput?.value || '').trim();
      if (!enteredName) {
        alert('⚠️ Please enter your name to complete your profile.');
        nameInput?.focus();
        return;
      }

      if (this.selectedGender === 'female') {
        // Direct female to mandatory voice & video verification step
        this.renderFemaleVerificationStep(enteredName);
      } else {
        // Male finishes onboarding directly (No WhatsApp Group for Male accounts)
        this.user = hipaApi.finishOnboarding(this.selectedLanguage, this.selectedGender, this.selectedAvatar, enteredName);
        root.style.padding = '';
        this.renderMainApp();
      }
    };
  }

  // Step 5: Female Identity Verification (Voice Note & Video Recording)
  renderFemaleVerificationStep(userName) {
    const root = document.getElementById('mainViewport');
    root.style.padding = '0';
    root.style.overflowY = 'auto';

    root.innerHTML = `
      <div class="onboarding-container" style="padding-bottom: 40px;">
        <!-- Top Bar -->
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px;">
          <button class="btn-secondary" id="btnBackToStep4" style="width: 42px; height: 42px; border-radius: 50%; padding: 0; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.2); color: #ffffff; font-size: 1.2rem; cursor: pointer;">←</button>
          <span style="font-size: 0.82rem; font-weight: 800; color: #ff85c0;">Female Security Verification</span>
        </div>

        <div style="text-align: center; margin-bottom: 16px;">
          <div style="width: 68px; height: 68px; margin: 0 auto 10px auto; border-radius: 20px; background: linear-gradient(135deg, #ff007f, #7928ca); display: flex; align-items: center; justify-content: center; font-size: 2rem; box-shadow: 0 0 25px rgba(255,0,127,0.5);">
            🛡️
          </div>
          <h1 style="font-size: 1.6rem; font-weight: 900; color: #ffffff; margin-bottom: 4px;">Female Verification</h1>
          <p style="font-size: 0.84rem; color: #c9bfdc; max-width: 380px; margin: 0 auto;">
            Submit your <strong>Voice Note</strong> and <strong>Video Recording</strong> to verify identity and unlock creator calling features.
          </p>
        </div>

        <form id="formFemaleOnboardingVerif" style="display: flex; flex-direction: column; gap: 14px;">
          <!-- 1. Voice Note Recording -->
          <div style="background: rgba(255,255,255,0.05); border: 1.5px solid rgba(255,0,127,0.3); border-radius: 18px; padding: 16px;">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
              <div class="step-circle">1</div>
              <label style="font-weight: 800; font-size: 0.92rem; color: #ffffff;">5-Second Voice Note</label>
            </div>
            <div style="font-size: 0.78rem; color: #c9bfdc; margin-bottom: 10px;">
              Say: <em style="color: #ffd700;">"Hi, this is ${userName}, my real voice on Peelin\'s."</em>
            </div>

            <button type="button" class="voice-record-btn" id="btnRecordVoiceNote">
              <span id="voiceRecordIcon">🎙️</span>
              <span id="voiceRecordText">Tap to Record Voice Note</span>
            </button>

            <div id="voiceNotePreviewBox" style="display: none; margin-top: 12px;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
                <span style="font-size: 0.75rem; font-weight: 700; color: #10b981;">✓ Voice Note Captured:</span>
                <button type="button" id="btnRemoveVoiceNote" style="background: rgba(239, 68, 68, 0.2); border: 1px solid rgba(239, 68, 68, 0.5); color: #fca5a5; font-size: 0.7rem; font-weight: 800; padding: 4px 10px; border-radius: 999px; cursor: pointer;">
                  🗑️ Remove &amp; Record Again
                </button>
              </div>
              <audio id="voiceNotePlayback" controls controlsList="nodownload" style="width: 100%; height: 36px; border-radius: 8px;"></audio>
            </div>
          </div>

          <!-- 2. Video Recording / Selfie Video -->
          <div style="background: rgba(255,255,255,0.05); border: 1.5px solid rgba(255,0,127,0.3); border-radius: 18px; padding: 16px;">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
              <div class="step-circle">2</div>
              <label style="font-weight: 800; font-size: 0.92rem; color: #ffffff;">Video Recording / Selfie Video</label>
            </div>
            <div style="font-size: 0.78rem; color: #c9bfdc; margin-bottom: 10px;">
              Capture a short 3-5 second live video selfie waving or saying hello.
            </div>

            <div style="display: flex; gap: 10px; align-items: center;">
              <label for="inputVideoFile" class="btn-secondary" style="flex: 1; padding: 12px; font-size: 0.82rem; font-weight: 800; text-align: center; cursor: pointer; background: rgba(255,255,255,0.08); border: 1.5px solid rgba(255,255,255,0.25); border-radius: 14px; color: #ffffff;">
                📹 Record / Upload Video
              </label>
              <input type="file" id="inputVideoFile" accept="video/*" capture="user" style="display: none;" />
            </div>

            <div id="videoPreviewWrap" style="display: none; margin-top: 12px;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
                <span style="font-size: 0.75rem; font-weight: 700; color: #10b981;">✓ Video Recording Captured:</span>
                <button type="button" id="btnRemoveVideoNote" style="background: rgba(239, 68, 68, 0.2); border: 1px solid rgba(239, 68, 68, 0.5); color: #fca5a5; font-size: 0.7rem; font-weight: 800; padding: 4px 10px; border-radius: 999px; cursor: pointer;">
                  🗑️ Remove &amp; Record Again
                </button>
              </div>
              <video id="videoPlaybackPreview" controls controlsList="nodownload" style="width: 100%; max-height: 140px; border-radius: 12px; background: #000; border: 1px solid #10b981;"></video>
            </div>
          </div>

          <!-- 3. Live Selfie Photo -->
          <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.12); border-radius: 18px; padding: 16px;">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
              <div class="step-circle">3</div>
              <label style="font-weight: 800; font-size: 0.92rem; color: #ffffff;">Live Selfie Photo</label>
            </div>
            <div style="display: flex; gap: 12px; align-items: center;">
              <div id="selfieBox" style="width: 70px; height: 70px; border-radius: 14px; background: rgba(255,255,255,0.08); border: 2px dashed rgba(255,0,127,0.5); display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0;">
                <span id="selfieIcon" style="font-size: 1.6rem;">🤳</span>
                <img id="selfieImg" src="" style="width: 100%; height: 100%; object-fit: cover; display: none;" />
              </div>
              <div style="flex: 1; display: flex; flex-direction: column; gap: 6px;">
                <label for="inputSelfieFileStep5" class="btn-secondary" style="padding: 10px; font-size: 0.8rem; font-weight: 800; text-align: center; cursor: pointer; display: block; border-radius: 12px; color: #fff;">
                  📸 Capture Selfie
                </label>
                <button type="button" id="btnRemoveSelfiePhoto" style="display: none; background: rgba(239, 68, 68, 0.2); border: 1px solid rgba(239, 68, 68, 0.5); color: #fca5a5; font-size: 0.72rem; font-weight: 800; padding: 5px 10px; border-radius: 999px; cursor: pointer;">
                  🗑️ Remove &amp; Retake
                </button>
                <input type="file" id="inputSelfieFileStep5" accept="image/*" capture="user" style="display: none;" />
              </div>
            </div>
          </div>

          <!-- 4. Date of Birth -->
          <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.12); border-radius: 18px; padding: 14px 16px;">
            <label style="display: block; font-size: 0.76rem; font-weight: 800; color: #ff85c0; text-transform: uppercase; margin-bottom: 6px;">Date of Birth (18+ Required)</label>
            <input type="date" id="inputDobStep5" class="glass-input" required max="2008-11-26" value="2003-05-15" style="padding: 10px 14px; font-size: 0.9rem;" />
          </div>

          <button type="submit" class="btn-pink-block" id="btnSubmitFemaleVerif" style="font-size: 1.05rem; font-weight: 900; box-shadow: 0 0 25px rgba(255,0,127,0.5); margin-top: 6px;">
            Submit Verification to Admin ➔
          </button>
        </form>
      </div>
    `;

    root.querySelector('#btnBackToStep4').onclick = () => this.renderOnboardingStep4();

    // Voice note handler
    let voiceUrl = "https://actions.google.com/sounds/v1/speech/hello_greeting.ogg";
    let isRecording = false;
    let recTimer = null;
    let recSecs = 0;
    let mediaRec = null;
    let chunks = [];
    const btnRecord = root.querySelector('#btnRecordVoiceNote');
    const txtRecord = root.querySelector('#voiceRecordText');
    const iconRecord = root.querySelector('#voiceRecordIcon');
    const audioBox = root.querySelector('#voiceNotePreviewBox');
    const audioPlay = root.querySelector('#voiceNotePlayback');

    const stopAudioRec = () => {
      if (recTimer) clearInterval(recTimer);
      isRecording = false;
      btnRecord.classList.remove('recording');
      iconRecord.textContent = '✓';
      txtRecord.textContent = 'Voice Note Captured!';
      if (mediaRec && mediaRec.state !== 'inactive') {
        mediaRec.stop();
      } else {
        audioPlay.src = voiceUrl;
        audioBox.style.display = 'block';
      }
    };

    btnRecord.onclick = async () => {
      if (!isRecording) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true }).catch(() => null);
          isRecording = true;
          btnRecord.classList.add('recording');
          iconRecord.textContent = '⏹️';
          recSecs = 0;
          txtRecord.textContent = 'Recording Voice Note... (05s)';

          recTimer = setInterval(() => {
            recSecs++;
            txtRecord.textContent = `Recording Voice Note... (0${Math.max(0, 5 - recSecs)}s)`;
            if (recSecs >= 5) stopAudioRec();
          }, 1000);

          if (stream) {
            mediaRec = new MediaRecorder(stream);
            chunks = [];
            mediaRec.ondataavailable = e => chunks.push(e.data);
            mediaRec.onstop = () => {
              const blob = new Blob(chunks, { type: 'audio/webm' });
              voiceUrl = URL.createObjectURL(blob);
              audioPlay.src = voiceUrl;
              audioBox.style.display = 'block';
              stream.getTracks().forEach(t => t.stop());
            };
            mediaRec.start();
          }
        } catch (err) {
          isRecording = true;
          btnRecord.classList.add('recording');
          setTimeout(() => stopAudioRec(), 3000);
        }
      } else {
        stopAudioRec();
      }
    };

    const btnRemoveVoice = root.querySelector('#btnRemoveVoiceNote');
    if (btnRemoveVoice) {
      btnRemoveVoice.onclick = () => {
        voiceUrl = "https://actions.google.com/sounds/v1/speech/hello_greeting.ogg";
        audioPlay.pause();
        audioPlay.src = '';
        audioBox.style.display = 'none';
        iconRecord.textContent = '🎙️';
        txtRecord.textContent = 'Tap to Record Voice Note';
      };
    }

    // Video recording handler
    let videoUrl = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";
    const videoInput = root.querySelector('#inputVideoFile');
    const videoBox = root.querySelector('#videoPreviewWrap');
    const videoPlay = root.querySelector('#videoPlaybackPreview');

    videoInput.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        videoUrl = URL.createObjectURL(file);
        videoPlay.src = videoUrl;
        videoBox.style.display = 'block';
      }
    };

    const btnRemoveVideo = root.querySelector('#btnRemoveVideoNote');
    if (btnRemoveVideo) {
      btnRemoveVideo.onclick = () => {
        videoUrl = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";
        videoInput.value = '';
        videoPlay.pause();
        videoPlay.src = '';
        videoBox.style.display = 'none';
      };
    }

    // Selfie photo handler
    let selfieUrl = "/images/avatar_female_ashley.jpg";
    const selfieInput = root.querySelector('#inputSelfieFileStep5');
    const selfieImg = root.querySelector('#selfieImg');
    const selfieIcon = root.querySelector('#selfieIcon');
    const btnRemoveSelfie = root.querySelector('#btnRemoveSelfiePhoto');

    selfieInput.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = ev => {
          selfieUrl = ev.target.result;
          selfieImg.src = selfieUrl;
          selfieImg.style.display = 'block';
          selfieIcon.style.display = 'none';
          if (btnRemoveSelfie) btnRemoveSelfie.style.display = 'block';
        };
        reader.readAsDataURL(file);
      }
    };

    if (btnRemoveSelfie) {
      btnRemoveSelfie.onclick = () => {
        selfieUrl = "/images/avatar_female_ashley.jpg";
        selfieInput.value = '';
        selfieImg.src = '';
        selfieImg.style.display = 'none';
        selfieIcon.style.display = 'block';
        btnRemoveSelfie.style.display = 'none';
      };
    }

    // Submit handler
    const form = root.querySelector('#formFemaleOnboardingVerif');
    form.onsubmit = async (e) => {
      e.preventDefault();
      const dobVal = root.querySelector('#inputDobStep5').value;
      const birthYear = new Date(dobVal).getFullYear();
      const age = new Date().getFullYear() - birthYear;

      // 1. Create female account (starts with verificationStatus = 'pending_approval')
      this.user = hipaApi.finishOnboarding(this.selectedLanguage, 'female', this.selectedAvatar, userName);

      // 2. Submit dossier with Voice Note and Video Recording to Admin
      await hipaApi.submitVerification({
        name: userName,
        gender: 'female',
        dob: dobVal,
        age: age,
        profilePhoto: this.selectedAvatar,
        selfiePhoto: selfieUrl,
        audioUrl: voiceUrl,
        videoUrl: videoUrl,
        poseReq: "Peace Sign ✌️ & Video Selfie"
      });

      root.style.padding = '';
      this.renderMainApp();
      this.showPostRegistrationWhatsAppModal(true); // female pending flag
    };
  }

  // ==========================================
  // POST-REGISTRATION WHATSAPP MODAL
  // ==========================================
  showPostRegistrationWhatsAppModal(isFemalePending = false) {
    const waCfg = hipaApi.getWhatsAppConfig();
    const modal = document.createElement('div');
    modal.className = 'offer-modal-overlay';
    modal.style.zIndex = '999999';

    modal.innerHTML = `
      <div class="offer-card-sheet" style="padding: 24px; text-align: center;">
        <div style="font-size: 3rem; margin-bottom: 8px;">🎉</div>
        <h2 style="font-size: 1.45rem; font-weight: 900; color: #ffffff; margin-bottom: 6px;">Registration Successful!</h2>
        
        ${isFemalePending ? `
          <div class="female-verif-badge pending" style="text-align: left; margin: 14px 0 18px 0;">
            <span class="female-verif-icon">⏳</span>
            <div>
              <div class="female-verif-title">Verification Under Admin Review</div>
              <div class="female-verif-desc">Your voice note & video recording have been submitted to Admin. Your profile will show "Pending Verification" until approval.</div>
            </div>
          </div>
        ` : `
          <p style="font-size: 0.88rem; color: #c9bfdc; margin-bottom: 18px;">
            Welcome to Peelin's! You've received <strong>+60 Welcome Coins</strong>. Join our official WhatsApp community!
          </p>
        `}

        <div style="background: rgba(37, 211, 102, 0.12); border: 1.5px solid #25D366; border-radius: 20px; padding: 18px; margin-bottom: 20px;">
          <div style="font-size: 2.2rem; margin-bottom: 6px;">💬</div>
          <div style="font-size: 1.05rem; font-weight: 900; color: #25D366; margin-bottom: 4px;">Join Official WhatsApp Group</div>
          <div style="font-size: 0.78rem; color: #d1c7e6; margin-bottom: 14px;">Connect with verified creators, platform guidelines & VIP support.</div>
          <a href="${waCfg.inviteLink}" target="_blank" class="btn-whatsapp" id="btnJoinWaPostReg">
            <span>🟢</span> Join WhatsApp Group
          </a>
        </div>

        <button class="btn-secondary" id="btnCloseWaPostReg" style="width: 100%; padding: 12px; border-radius: 9999px; font-weight: 800; background: rgba(255,255,255,0.08); color: #ffffff; border: 1px solid rgba(255,255,255,0.2);">
          Enter Peelin's App ➔
        </button>
      </div>
    `;

    document.body.appendChild(modal);
    modal.querySelector('#btnCloseWaPostReg').onclick = () => modal.remove();
    modal.querySelector('#btnJoinWaPostReg').onclick = () => {
      setTimeout(() => modal.remove(), 1000);
    };
  }

  // ==========================================
  // MAIN APP VIEWPORT & NAVIGATION
  // ==========================================

  renderMainApp() {
    this.user = hipaApi.getUser();
    const topBar = document.getElementById('hipaTopBar') || document.getElementById('himaTopBar');
    if (topBar) topBar.style.display = 'flex';
    const bNav = document.getElementById('hipaBottomNav') || document.getElementById('himaBottomNav');
    if (bNav) bNav.style.display = 'flex';
    const btnR = document.getElementById('btnFloatingRandom');
    if (btnR) btnR.style.display = 'flex';
    const coinsEl = document.getElementById('userCoinsCount');
    if (coinsEl) coinsEl.textContent = hipaApi.getCoins();

    this.bindGlobalEvents();
    this.renderCurrentTab();
    this.loadAndSubscribeRealUsers();
    try {
      callManager.initIncomingCallListener();
    } catch (e) {}
  }

  async loadAndSubscribeRealUsers() {
    const currentUser = hipaApi.getUser();
    const myId = currentUser ? currentUser.id : null;
    const myGender = currentUser ? currentUser.gender : 'male';
    const targetGender = myGender === 'female' ? 'male' : 'female';

    // 1. Initial load + periodic refresh from Cloudflare KV & Firestore
    const fetchAndRender = async () => {
      try {
        const syncRes = await hipaApi.syncCurrentUserFromServer();
        if (syncRes.changed) {
          this.user = syncRes.user;
          if (syncRes.justApproved) {
            hipaAudio.playCoin();
            alert('🎉 Female Identity Verification Completed!\nAapka account Admin ne approve kar diya hai. Ab aap Video aur Audio Calls kar sakti hain!');
          }
          if (this.currentTab === 'profile') {
            const root = document.getElementById('mainViewport');
            if (root) this.renderProfileTab(root);
          }
        }

        const profiles = await hipaApi.getRealDiscoverProfiles();
        if (Array.isArray(profiles)) {
          const prevJson = JSON.stringify(this.discoverProfiles.map(p => p.id + '_' + p.online));
          const nextJson = JSON.stringify(profiles.map(p => p.id + '_' + p.online));
          this.discoverProfiles = profiles;
          if (prevJson !== nextJson && this.currentTab === 'home') {
            const root = document.getElementById('mainViewport');
            if (root) this.renderHomeTab(root);
          }
        }
      } catch (e) {}
    };

    await fetchAndRender();
    if (this.realUsersPollTimer) clearInterval(this.realUsersPollTimer);
    this.realUsersPollTimer = setInterval(fetchAndRender, 5000);

    // 2. Real-time Firestore live subscription
    try {
      if (firebaseService && typeof firebaseService.subscribeToRealUsers === 'function') {
        firebaseService.subscribeToRealUsers(myId, targetGender, (liveUsers) => {
          const mapped = liveUsers.map(u => ({
            id: u.id,
            name: u.name || u.username || 'Real Member',
            avatar: u.avatar || (u.gender === 'female' ? '/images/avatar_female_riya.jpg' : '/images/avatar_male_aryan.jpg'),
            photo: u.avatar || (u.gender === 'female' ? '/images/avatar_female_riya.jpg' : '/images/avatar_male_aryan.jpg'),
            city: u.city || 'India',
            language: u.language || 'Hindi',
            bio: u.bio || 'Looking for real connections on Peelin\'s',
            verified: u.verified !== false,
            online: u.isOnline !== false,
            videoOnline: u.isOnline !== false,
            voiceRate: u.voiceRate || 10,
            videoRate: u.videoRate || 20,
            rating: 4.9,
            callsCount: u.callsCount || 1,
            isRealUser: true,
            gender: u.gender || targetGender,
            phone: u.phone || ''
          }));

          // Merge with any API/local profiles already discovered
          const map = new Map();
          mapped.forEach(u => map.set(String(u.id), u));
          (this.discoverProfiles || []).forEach(u => {
            if (!map.has(String(u.id))) map.set(String(u.id), u);
          });
          this.discoverProfiles = Array.from(map.values());

          if (this.currentTab === 'home') {
            const root = document.getElementById('mainViewport');
            if (root) this.renderHomeTab(root);
          }
        });
      }
    } catch (e) {}
  }

  bindGlobalEvents() {
    // Top Bar Online Status Toggle
    const topBarOnline = document.getElementById('topBarOnlineStatus');
    const updateTopBarOnlineUI = () => {
      const isOnline = hipaApi.getUserOnlineStatus();
      const dot = document.getElementById('topBarOnlineDot');
      const text = document.getElementById('topBarOnlineText');
      if (dot) {
        dot.style.background = isOnline ? '#10b981' : '#9ca3af';
        dot.style.boxShadow = isOnline ? '0 0 8px #10b981' : 'none';
      }
      if (text) {
        text.textContent = isOnline ? 'Online' : 'Offline';
      }
      if (topBarOnline) {
        topBarOnline.style.background = isOnline ? 'rgba(16, 185, 129, 0.12)' : 'rgba(156, 163, 175, 0.15)';
        topBarOnline.style.borderColor = isOnline ? 'rgba(16, 185, 129, 0.35)' : 'rgba(156, 163, 175, 0.4)';
        topBarOnline.style.color = isOnline ? '#10b981' : '#9ca3af';
      }
    };
    updateTopBarOnlineUI();
    if (topBarOnline) {
      topBarOnline.onclick = () => {
        const cur = hipaApi.getUserOnlineStatus();
        const next = !cur;
        hipaApi.setUserOnlineStatus(next);
        updateTopBarOnlineUI();
        if (this.currentTab === 'profile') {
          const root = document.getElementById('mainViewport');
          if (root) this.renderProfileTab(root);
        }
      };
    }

    // Open Wallet on Coin pill tap
    const coinBtn = document.getElementById('btnOpenWalletTop');
    if (coinBtn) {
      coinBtn.onclick = () => this.showWalletModal();
    }

    // Bottom Navigation click
    document.querySelectorAll('.hipa-nav-item, .hima-nav-item').forEach((item) => {
      item.onclick = () => {
        document.querySelectorAll('.hipa-nav-item, .hima-nav-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        this.currentTab = item.getAttribute('data-tab');

        // Toggle random button visibility
        const randBtn = document.getElementById('btnFloatingRandom');
        if (randBtn) {
          randBtn.style.display = this.currentTab === 'home' ? 'flex' : 'none';
        }

        this.renderCurrentTab();
      };
    });

    // Floating Random Match (Real Users Only)
    const randomBtn = document.getElementById('btnFloatingRandom');
    if (randomBtn) {
      randomBtn.onclick = () => {
        const onlineUsers = (this.discoverProfiles || []).filter(c => c.online);
        if (!onlineUsers.length) {
          alert('Abhi koi real member online nahi hai. Jab koi dusra real user join karega, aap direct Video Call kar sakenge!');
          return;
        }
        const randomUser = onlineUsers[Math.floor(Math.random() * onlineUsers.length)];
        this.startCall(randomUser, 'video');
      };
    }
  }

  renderCurrentTab() {
    const root = document.getElementById('mainViewport');
    if (this.currentTab === 'home') {
      this.renderHomeTab(root);
    } else if (this.currentTab === 'recent') {
      this.renderRecentCallsTab(root);
    } else if (this.currentTab === 'friends') {
      this.renderFriendsTab(root);
    } else if (this.currentTab === 'profile') {
      this.renderProfileTab(root);
    }
  }

  // ==========================================
  // TAB 1: HOME (100% Real Users Directory & 3D Swipe Deck)
  // ==========================================
  renderHomeTab(container) {
    const categories = ['All', 'Video 📹', 'Audio 📞', 'Hindi', 'Punjabi', 'Marathi', 'Bengali', 'Tamil', 'Telugu'];

    const realRegistered = hipaApi.getAllRegisteredUsers();
    const currentUser = hipaApi.getUser();
    const myId = currentUser ? currentUser.id : null;
    const myGender = currentUser ? currentUser.gender : 'male';
    const targetGender = myGender === 'female' ? 'male' : 'female';

    // Merge real users from live cloud state + localStorage (Zero Demo/Fake Profiles!)
    const profileMap = new Map();
    (this.discoverProfiles || []).forEach(u => {
      if (String(u.id) !== String(myId) && (!targetGender || u.gender === targetGender)) {
        profileMap.set(String(u.id), u);
      }
    });

    realRegistered.forEach(u => {
      if (String(u.id) !== String(myId) && (!targetGender || u.gender === targetGender)) {
        const key = String(u.id);
        if (!profileMap.has(key)) {
          profileMap.set(key, {
            id: u.id,
            name: u.name || u.username || 'Real Member',
            avatar: u.avatar || (u.gender === 'female' ? '/images/avatar_female_riya.jpg' : '/images/avatar_male_aryan.jpg'),
            photo: u.avatar || (u.gender === 'female' ? '/images/avatar_female_riya.jpg' : '/images/avatar_male_aryan.jpg'),
            city: u.city || 'India',
            language: u.language || 'Hindi',
            bio: u.bio || 'Real dating profile on Peelin\'s',
            verified: u.verified !== false,
            online: u.isOnline !== false,
            videoOnline: u.isOnline !== false,
            voiceRate: u.voiceRate || 10,
            videoRate: u.videoRate || 20,
            rating: 4.9,
            callsCount: u.callsCount || 1,
            isRealUser: true,
            gender: u.gender || targetGender,
            phone: u.phone || ''
          });
        }
      }
    });

    const allProfiles = Array.from(profileMap.values());
    this.discoverProfiles = allProfiles;

    let creators = allProfiles;
    if (this.activeCategory === 'Video 📹') {
      creators = allProfiles.filter(c => c.videoOnline);
    } else if (this.activeCategory === 'Audio 📞') {
      creators = allProfiles.filter(c => c.voiceRate > 0);
    } else if (this.activeCategory !== 'All') {
      creators = allProfiles.filter(c => (c.language || '').toLowerCase().includes(this.activeCategory.toLowerCase()));
    }

    container.innerHTML = `
      <!-- 1. Discovery Mode Toggle Bar -->
      <div class="discovery-toggle-bar" style="margin-top: 2px;">
        <button class="discovery-tab-btn ${this.discoveryMode === 'creators' ? 'active' : ''}" data-mode="creators">
          📹 Live Real Users (${allProfiles.length})
        </button>
        <button class="discovery-tab-btn ${this.discoveryMode === 'swipe' ? 'active' : ''}" data-mode="swipe">
          🔥 Vibe Swipe
        </button>
      </div>

      <!-- Quick Feature Access Strip -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 12px 0 14px 0;">
        <div id="btnOpenLuckyWheel" style="background: linear-gradient(135deg, rgba(255, 215, 0, 0.18), rgba(255, 0, 127, 0.18)); border: 1.5px solid rgba(255, 215, 0, 0.4); border-radius: 16px; padding: 10px 14px; display: flex; align-items: center; gap: 10px; cursor: pointer; box-shadow: 0 4px 15px rgba(0,0,0,0.3);">
          <span style="font-size: 1.5rem;">🎁</span>
          <div>
            <div style="font-weight: 900; font-size: 0.82rem; color: #ffd700;">Daily Lucky Spin</div>
            <div style="font-size: 0.68rem; color: #d1c7e6;">Win free coins daily</div>
          </div>
        </div>

        <div id="btnOpenVIPClub" style="background: linear-gradient(135deg, rgba(168, 85, 247, 0.18), rgba(255, 0, 127, 0.18)); border: 1.5px solid rgba(168, 85, 247, 0.4); border-radius: 16px; padding: 10px 14px; display: flex; align-items: center; gap: 10px; cursor: pointer; box-shadow: 0 4px 15px rgba(0,0,0,0.3);">
          <span style="font-size: 1.5rem;">👑</span>
          <div>
            <div style="font-weight: 900; font-size: 0.82rem; color: #ff85c0;">Peelin's VIP Pass</div>
            <div style="font-size: 0.68rem; color: #d1c7e6;">Free calls & perks</div>
          </div>
        </div>
      </div>

      ${this.discoveryMode === 'creators' ? `
        <!-- Live Real Users Header & Refresh -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <div style="font-size: 0.85rem; font-weight: 800; color: #10b981; display: flex; align-items: center; gap: 6px;">
            <span style="width: 8px; height: 8px; border-radius: 50%; background: #10b981; display: inline-block; box-shadow: 0 0 8px #10b981;"></span>
            Real ${targetGender === 'female' ? 'Girls' : 'Boys'} Online
          </div>
          <button id="btnRefreshRealUsers" style="background: rgba(255,0,127,0.12); border: 1px solid rgba(255,0,127,0.35); color: #ff85c0; font-size: 0.74rem; font-weight: 800; padding: 5px 12px; border-radius: 999px; cursor: pointer;">
            🔄 Refresh Live
          </button>
        </div>

        <!-- Horizontal Category Pills -->
        <div class="hima-categories" style="margin: 0 -14px 14px -14px;">
          ${categories.map(cat => `
            <button class="cat-pill ${this.activeCategory === cat ? 'active' : ''}" data-cat="${cat}">
              ${cat}
            </button>
          `).join('')}
        </div>

        <!-- Real Users List -->
        <div class="creators-list">
          ${creators.length === 0 ? `
            <div class="glass-card" style="padding: 28px 18px; text-align: center; border-radius: 18px; border: 1px dashed rgba(255,0,127,0.4);">
              <div style="font-size: 2.6rem; margin-bottom: 10px;">💑</div>
              <h3 style="font-size: 1.05rem; font-weight: 900; color: #ffffff; margin-bottom: 6px;">Abhi koi real ${targetGender === 'female' ? 'Female' : 'Male'} member registered nahi hai</h3>
              <p style="font-size: 0.8rem; color: #d1c7e6; line-height: 1.5; margin-bottom: 16px;">
                Demo mode hata diya gaya hai. Dusre phone ya browser se ek <strong>${targetGender === 'female' ? 'Female (Ladki)' : 'Male (Ladka)'}</strong> account register karein — woh turant yahan live dikhega aur aap real Video / Audio Call kar sakenge!
              </p>
              <button id="btnRefreshEmptyUsers" style="background: linear-gradient(135deg, #ff007f, #7928ca); border: none; color: #fff; padding: 10px 20px; border-radius: 999px; font-weight: 800; font-size: 0.85rem; cursor: pointer;">
                🔄 Check Again
              </button>
            </div>
          ` : creators.map(c => `
            <div class="creator-card" data-id="${c.id}">
              <div class="creator-left">
                <div class="creator-avatar-wrap">
                  <img src="${c.avatar}" alt="${c.name}" />
                  <span class="status-dot ${c.online ? 'online' : 'offline'}"></span>
                </div>
                <div>
                  <div class="creator-name" style="display: flex; align-items: center; gap: 6px;">
                    ${c.name}
                    <span style="background: linear-gradient(135deg, #10b981, #059669); color: #fff; font-size: 0.65rem; font-weight: 800; padding: 1px 6px; border-radius: 999px;">REAL</span>
                    ${c.verified ? '<span style="color: #0284c7; font-size: 0.85rem;" title="Verified">✓</span>' : ''}
                  </div>
                  <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600; margin-top: 2px;">
                    ${c.language} • ${c.online ? '🟢 Online' : '⚫ Offline'} • ${c.city || 'India'}
                  </div>
                </div>
              </div>

              <div class="creator-actions">
                <!-- Gift Button -->
                <button class="btn-quick-gift" data-id="${c.id}" style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,0,127,0.25); border-radius: 50%; width: 38px; height: 38px; color: #ffd700; font-size: 1.1rem; cursor: pointer; display: flex; align-items: center; justify-content: center;" title="Send Gift">
                  🎁
                </button>

                <!-- Voice Call Button -->
                <button class="creator-call-action btn-voice-call" data-id="${c.id}" title="Start Voice Call">
                  <div class="call-icon-round voice" style="width: 40px; height: 40px; font-size: 1.15rem;">📞</div>
                  <span class="call-rate-tag" style="color: #d1c7e6; font-size: 0.68rem;">🪙 ${c.voiceRate}/m</span>
                </button>

                <!-- Video Call Button -->
                <button class="creator-call-action btn-video-call" data-id="${c.id}" title="Start Video Call">
                  <div class="call-icon-round video ${!c.videoOnline ? 'disabled' : ''}" style="width: 40px; height: 40px; font-size: 1.15rem;">📹</div>
                  <span class="call-rate-tag ${!c.videoOnline ? 'offline-text' : ''}" style="color: #ff85c0; font-size: 0.68rem;">
                    ${c.videoOnline ? '🪙 ' + c.videoRate + '/m' : 'Off'}
                  </span>
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      ` : `
        <!-- 3D VIBE SWIPE DECK MODE (Real Users) -->
        ${(() => {
          if (!allProfiles.length) {
            return `
              <div class="glass-card" style="padding: 36px 20px; text-align: center; border-radius: 18px; margin-top: 20px;">
                <div style="font-size: 3rem; margin-bottom: 10px;">💫</div>
                <h3 style="font-size: 1.1rem; font-weight: 900; color: #fff; margin-bottom: 6px;">Koi real member abhi available nahi hai</h3>
                <p style="font-size: 0.82rem; color: #d1c7e6;">Dusre device se ${targetGender === 'female' ? 'Female' : 'Male'} profile register karein aur live swipe + call karein.</p>
              </div>
            `;
          }
          const profile = allProfiles[this.currentSwipeIndex % allProfiles.length];
          return `
            <div class="swipe-deck-wrap">
              <div class="swipe-card-3d">
                <img src="${profile.avatar}" class="swipe-card-img" alt="${profile.name}" />
                <div class="featured-hero-overlay">
                  <div style="display: flex; align-items: center; justify-content: space-between;">
                    <div style="font-size: 1.8rem; font-weight: 900; color: #fff;">
                      ${profile.name} <span class="hero-verified-pill">✓</span>
                    </div>
                    <span class="glass-pill" style="font-size: 0.75rem; background: rgba(255,0,127,0.3); color: #fff;">${profile.language}</span>
                  </div>
                  <p style="font-size: 0.88rem; color: #e2d9f3; line-height: 1.4;">${profile.bio || "Looking to connect live on audio & video call! ✨"}</p>
                  <div class="hero-tags-grid">
                    <span class="hero-tag-pill">${profile.online ? '🟢 Online' : '⚫ Offline'}</span>
                    <span class="hero-tag-pill">📍 ${profile.city || 'India'}</span>
                    <span class="hero-tag-pill">✨ Real User</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Swipe Action Buttons Dock -->
            <div class="swipe-controls-dock">
              <button class="swipe-action-btn pass" id="btnSwipePass" title="Pass">✕</button>
              <button class="swipe-action-btn superlike" id="btnSwipeSuperlike" title="Superlike">⭐</button>
              <button class="swipe-action-btn like" id="btnSwipeLike" title="Like">💖</button>
              <button class="swipe-action-btn call" id="btnSwipeCall" data-id="${profile.id}" title="Direct Live Call">📞</button>
            </div>
            <div style="text-align: center; color: var(--text-muted); font-size: 0.78rem; margin-top: 6px;">
              Swipe or tap 💖 to match • 📞 to call live
            </div>
          `;
        })()}
      `}
    `;

    // 1. Discovery Mode Switch
    container.querySelectorAll('.discovery-tab-btn').forEach(btn => {
      btn.onclick = () => {
        this.discoveryMode = btn.getAttribute('data-mode');
        hipaAudio.playPop();
        this.renderHomeTab(container);
      };
    });

    // 2. Refresh Real Users Buttons
    const refreshHandler = () => {
      hipaAudio.playPop();
      this.loadAndSubscribeRealUsers();
    };
    const btnRefresh = container.querySelector('#btnRefreshRealUsers');
    if (btnRefresh) btnRefresh.onclick = refreshHandler;
    const btnRefreshEmpty = container.querySelector('#btnRefreshEmptyUsers');
    if (btnRefreshEmpty) btnRefreshEmpty.onclick = refreshHandler;

    // 3. Quick Hub Modals
    const btnWheel = container.querySelector('#btnOpenLuckyWheel');
    if (btnWheel) btnWheel.onclick = () => this.showLuckyWheelModal();

    const btnVIP = container.querySelector('#btnOpenVIPClub');
    if (btnVIP) btnVIP.onclick = () => this.showVIPMembershipModal();

    // 4. Category filter clicks
    container.querySelectorAll('.cat-pill').forEach(btn => {
      btn.onclick = () => {
        this.activeCategory = btn.getAttribute('data-cat');
        hipaAudio.playPop();
        this.renderHomeTab(container);
      };
    });

    // 5. Grid Call & Gift buttons (Real Users Lookup)
    container.querySelectorAll('.btn-quick-gift').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const cid = btn.getAttribute('data-id');
        const creator = allProfiles.find(c => String(c.id) === String(cid));
        if (creator) this.showGiftModal(creator);
      };
    });

    container.querySelectorAll('.btn-voice-call').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const cid = btn.getAttribute('data-id');
        const creator = allProfiles.find(c => String(c.id) === String(cid));
        if (creator) this.startCall(creator, 'voice');
      };
    });

    container.querySelectorAll('.btn-video-call').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const cid = btn.getAttribute('data-id');
        const creator = allProfiles.find(c => String(c.id) === String(cid));
        if (!creator) return;
        if (!creator.videoOnline) {
          alert(`${creator.name} is currently offline for video calls. You can connect via voice call!`);
          return;
        }
        this.startCall(creator, 'video');
      };
    });

    // 6. Swipe Controls
    const btnPass = container.querySelector('#btnSwipePass');
    if (btnPass) {
      btnPass.onclick = () => {
        hipaAudio.playPop();
        this.currentSwipeIndex++;
        this.renderHomeTab(container);
      };
    }

    const btnSuperlike = container.querySelector('#btnSwipeSuperlike');
    if (btnSuperlike) {
      btnSuperlike.onclick = () => {
        if (!allProfiles.length) return;
        const target = allProfiles[this.currentSwipeIndex % allProfiles.length];
        hipaAudio.playHeart();
        alert(`⭐ Superliked! You stand out to ${target.name}!`);
        this.currentSwipeIndex++;
        this.renderHomeTab(container);
      };
    }

    const btnLike = container.querySelector('#btnSwipeLike');
    if (btnLike) {
      btnLike.onclick = () => {
        if (!allProfiles.length) return;
        const creator = allProfiles[this.currentSwipeIndex % allProfiles.length];
        hipaAudio.playHeart();
        this.triggerFlyingGiftAnimation('💖');
        alert(`🎉 It's a Vibe Match with ${creator.name}!\nConnect on video or audio call now.`);
        this.currentSwipeIndex++;
        this.renderHomeTab(container);
      };
    }

    const btnCallSwipe = container.querySelector('#btnSwipeCall');
    if (btnCallSwipe) {
      btnCallSwipe.onclick = () => {
        const cid = btnCallSwipe.getAttribute('data-id');
        const creator = allProfiles.find(c => String(c.id) === String(cid));
        if (creator) this.startCall(creator, 'video');
      };
    }
  }

  // ==========================================
  // TAB 2: RECENT CALLS (Exact as 3f248a15)
  // ==========================================
  renderRecentCallsTab(container) {
    const logs = hipaApi.getCallLogs();

    container.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="width: 44px; height: 44px; border-radius: 12px; background: var(--primary-pink); display: flex; align-items: center; justify-content: center; color: #ffffff; font-size: 1.3rem;">
            🕒
          </div>
          <div>
            <h1 style="font-size: 1.3rem; font-weight: 800; color: #111827; margin: 0;">Recent Calls</h1>
            <p style="font-size: 0.78rem; color: var(--text-muted); margin: 0;">Your call history</p>
          </div>
        </div>
      </div>

      <!-- Filter Pills -->
      <div style="display: flex; gap: 8px; margin-bottom: 14px; overflow-x: auto; padding-bottom: 4px;">
        <button class="cat-pill active">👥 All</button>
        <button class="cat-pill">📞 Missed</button>
        <button class="cat-pill">⏱️ Talk Time</button>
        <button class="cat-pill">🔤 A → Z</button>
      </div>

      <!-- Search Input -->
      <div style="position: relative; margin-bottom: 20px;">
        <input type="text" class="glass-input" placeholder="Search by name" style="background: #ffffff; border: 1.5px solid #ff007f; border-radius: var(--radius-full); padding: 12px 42px 12px 18px; color: #111827;" />
        <span style="position: absolute; right: 16px; top: 12px; font-size: 1.1rem; color: #ff007f;">🔍</span>
      </div>

      <!-- Logs List or Empty State -->
      ${logs.length > 0 ? `
        <div style="display: flex; flex-direction: column; gap: 12px;">
          ${logs.map(log => `
            <div class="creator-card">
              <div class="creator-left">
                <div class="creator-avatar-wrap">
                  <img src="${log.avatar}" />
                </div>
                <div>
                  <div class="creator-name">${log.creatorName}</div>
                  <div style="font-size: 0.75rem; color: var(--text-muted);">
                    ${log.type === 'video' ? '📹 Video' : '📞 Voice'} • ${log.duration} • ${log.time}
                  </div>
                </div>
              </div>
              <div style="text-align: right;">
                <div style="font-size: 0.85rem; font-weight: 800; color: #ef4444;">-${log.coinsSpent} coins</div>
                <button class="cat-pill" style="margin-top: 6px; padding: 4px 10px; font-size: 0.72rem;">Call Back</button>
              </div>
            </div>
          `).join('')}
        </div>
      ` : `
        <div style="text-align: center; padding: 80px 20px;">
          <div style="font-size: 3.5rem; color: #9ca3af; margin-bottom: 12px;">📞</div>
          <h3 style="font-size: 1.25rem; font-weight: 800; color: #111827; margin-bottom: 6px;">No Data Found</h3>
          <p style="font-size: 0.85rem; color: var(--text-muted);">Your call history will appear here</p>
        </div>
      `}
    `;
  }

  // ==========================================
  // TAB 3: FRIENDS (Exact as 3c5acad2)
  // ==========================================
  renderFriendsTab(container) {
    const friends = hipaApi.getFriends();

    container.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="width: 44px; height: 44px; border-radius: 12px; background: var(--primary-pink); display: flex; align-items: center; justify-content: center; color: #ffffff; font-size: 1.3rem;">
            👥
          </div>
          <div>
            <h1 style="font-size: 1.3rem; font-weight: 800; color: #111827; margin: 0;">Friends</h1>
            <p style="font-size: 0.78rem; color: var(--text-muted); margin: 0;">Your friends and requests</p>
          </div>
        </div>
      </div>

      <!-- Sub-tabs -->
      <div style="display: flex; gap: 8px; margin-bottom: 14px; overflow-x: auto; padding-bottom: 4px;">
        <button class="cat-pill active">Friends</button>
        <button class="cat-pill">Favourite</button>
        <button class="cat-pill">Requests</button>
        <button class="cat-pill">Sent</button>
      </div>

      <!-- Search Input -->
      <div style="position: relative; margin-bottom: 20px;">
        <input type="text" class="glass-input" placeholder="Search by name" style="background: #ffffff; border: 1.5px solid #ff007f; border-radius: var(--radius-full); padding: 12px 42px 12px 18px; color: #111827;" />
        <span style="position: absolute; right: 16px; top: 12px; font-size: 1.1rem; color: #ff007f;">🔍</span>
      </div>

      <!-- Friends List or Empty State -->
      ${friends.length > 0 ? `
        <div style="display: flex; flex-direction: column; gap: 12px;">
          ${friends.map(f => `
            <div class="creator-card">
              <div class="creator-left">
                <div class="creator-avatar-wrap">
                  <img src="${f.avatar}" />
                </div>
                <div>
                  <div class="creator-name">${f.name}</div>
                  <div style="font-size: 0.75rem; color: var(--text-muted);">${f.language} • Connected</div>
                </div>
              </div>
              <div style="display: flex; gap: 8px;">
                <button class="cat-pill active" style="padding: 6px 12px;">Chat</button>
              </div>
            </div>
          `).join('')}
        </div>
      ` : `
        <div style="text-align: center; padding: 80px 20px;">
          <div style="font-size: 3.5rem; color: #9ca3af; margin-bottom: 12px;">👤➕</div>
          <h3 style="font-size: 1.25rem; font-weight: 800; color: #111827; margin-bottom: 6px;">No friends yet</h3>
          <p style="font-size: 0.85rem; color: var(--text-muted);">Accept friend requests to chat with them here</p>
        </div>
      `}
    `;
  }

  // ==========================================
  // TAB 4: PROFILE (Exact as 53be8fee & ade99c7e)
  // ==========================================
  renderProfileTab(container) {
    const user = this.user || { username: 'JgckA625', avatar: HIPA_AVATARS[0] };
    const warnings = hipaApi.getWarnings();
    const isFemale = user.gender === 'female';
    const isApproved = user.verified || user.verificationStatus === 'approved';
    const isPending = isFemale && !isApproved;
    const isOnline = user.isOnline !== false;
    const waCfg = hipaApi.getWhatsAppConfig();

    container.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="width: 44px; height: 44px; border-radius: 12px; background: var(--primary-pink); display: flex; align-items: center; justify-content: center; color: #ffffff; font-size: 1.3rem;">
            👤
          </div>
          <div>
            <h1 style="font-size: 1.3rem; font-weight: 800; color: #111827; margin: 0;">My Profile</h1>
            <p style="font-size: 0.78rem; color: var(--text-muted); margin: 0;">Manage your account & preferences</p>
          </div>
        </div>
      </div>

      <!-- Profile Summary Card -->
      <div class="glass-card" style="background: #ffffff; border: 1.5px solid var(--primary-pink); border-radius: var(--radius-lg); padding: 22px 18px; box-shadow: 0 4px 18px rgba(255, 0, 127, 0.12);">
        <div style="display: flex; align-items: center; gap: 16px;">
          <div style="width: 72px; height: 72px; border-radius: 50%; border: 2.5px solid var(--primary-pink); padding: 2px; position: relative; flex-shrink: 0;">
            <img src="${user.avatar || HIPA_AVATARS[0]}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;" />
            <div style="position: absolute; bottom: 0; right: 0; width: 22px; height: 22px; background: var(--primary-pink); border: 2px solid #ffffff; border-radius: 50%; color: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 0.7rem;">
              ✏️
            </div>
          </div>
          <div style="flex: 1; min-width: 0;">
            <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
              <h2 style="font-size: 1.35rem; font-weight: 800; color: #111827; margin: 0; word-break: break-word;">${user.username}</h2>
              <span style="font-size: 0.72rem; padding: 2px 8px; border-radius: 999px; font-weight: 800; background: ${user.gender === 'female' ? '#fdf2f8' : '#eff6ff'}; color: ${user.gender === 'female' ? '#db2777' : '#2563eb'}; border: 1px solid ${user.gender === 'female' ? '#fbcfe8' : '#bfdbfe'};">
                ${user.gender === 'female' ? '♀ Female' : '♂ Male'}
              </span>
            </div>
            <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">${user.phone || '+91 95110 88531'}</div>
          </div>
        </div>

        <!-- Female Identity Verification Status Banner -->
        ${isFemale ? (isApproved ? `
          <div class="female-verif-badge approved" style="margin-top: 14px; padding: 12px 14px; background: rgba(16, 185, 129, 0.12); border: 1.5px solid #10b981; border-radius: 14px;">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 1.4rem;">🛡️</span>
                <div>
                  <div style="font-weight: 800; font-size: 0.92rem; color: #065f46;">Female Identity Verification Completed</div>
                  <div style="font-size: 0.74rem; color: #047857;">Account approved & 100% active for calls & rewards!</div>
                </div>
              </div>
              <span style="background: #10b981; color: #ffffff; padding: 3px 9px; border-radius: 999px; font-size: 0.7rem; font-weight: 800;">Verified ✓</span>
            </div>
          </div>
        ` : `
          <div class="female-verif-badge pending" style="margin-top: 14px; padding: 12px 14px; background: rgba(245, 158, 11, 0.12); border: 1.5px solid #f59e0b; border-radius: 14px;">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 1.4rem;">⏳</span>
                <div>
                  <div style="font-weight: 800; font-size: 0.92rem; color: #b45309;">Pending Verification</div>
                  <div style="font-size: 0.74rem; color: #92400e;">Admin is reviewing your voice note & video selfie.</div>
                </div>
              </div>
              <span style="background: #fef3c7; color: #b45309; padding: 3px 9px; border-radius: 999px; font-size: 0.7rem; font-weight: 800;">Under Review</span>
            </div>
          </div>
        `) : ''}

        <!-- Online / Offline Status Toggle Card -->
        <div style="margin-top: 14px; background: #f9fafb; border: 1.5px solid #e5e7eb; border-radius: 14px; padding: 12px 14px; display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div class="status-dot-indicator ${isOnline ? 'online' : 'offline'}" id="profileStatusDot"></div>
            <div>
              <div style="font-size: 0.88rem; font-weight: 800; color: #111827;">Availability Status</div>
              <div style="font-size: 0.74rem; color: var(--text-muted);" id="profileStatusText">
                ${isOnline ? '🟢 Online — Visible to calls & match' : '⚪ Offline — Hidden from live discovery'}
              </div>
            </div>
          </div>
          <button id="btnToggleOnlineStatus" class="btn" style="padding: 7px 16px; font-size: 0.8rem; font-weight: 800; border-radius: 20px; background: ${isOnline ? '#10b981' : '#6b7280'}; color: #ffffff; border: none; cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">
            ${isOnline ? 'Online 🟢' : 'Offline ⚪'}
          </button>
        </div>

        <!-- Official WhatsApp Group Card (Female Accounts Only) -->
        ${isFemale ? `
          <div class="whatsapp-banner-card" style="margin-top: 14px; background: linear-gradient(135deg, rgba(37, 211, 102, 0.12), rgba(18, 140, 126, 0.12)); border: 1.5px solid #25D366; border-radius: 14px; padding: 12px 14px; display: flex; align-items: center; justify-content: space-between; gap: 10px;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="width: 40px; height: 40px; border-radius: 10px; background: #25D366; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; color: white; flex-shrink: 0;">
                💬
              </div>
              <div>
                <div style="font-weight: 800; font-size: 0.88rem; color: #065f46;">Official WhatsApp Group</div>
                <div style="font-size: 0.72rem; color: #047857;">Exclusive live events &amp; verified creator perks</div>
              </div>
            </div>
            <button id="btnProfileWhatsApp" class="btn-whatsapp" style="padding: 8px 14px; font-size: 0.78rem; font-weight: 800; border-radius: 20px; background: #25D366; color: #ffffff; border: none; cursor: pointer; white-space: nowrap;">
              Join Group
            </button>
          </div>
        ` : ''}

        <div style="height: 1px; background: #f3f4f6; margin: 18px 0 14px 0;"></div>

        <!-- 4 Quick Actions Row -->
        <div class="profile-quick-actions">
          <div class="quick-act-card" id="btnProfileWallet">
            <div class="quick-act-icon" style="background: rgba(255, 0, 127, 0.1); color: var(--primary-pink);">👛</div>
            <span class="quick-act-label">Wallet</span>
          </div>
          <div class="quick-act-card" id="btnProfileTransactions">
            <div class="quick-act-icon" style="background: rgba(16, 185, 129, 0.1); color: #10b981;">🛒</div>
            <span class="quick-act-label">Transactions</span>
          </div>
          <div class="quick-act-card" id="btnProfileRefer">
            <div class="quick-act-icon" style="background: rgba(139, 92, 246, 0.1); color: #8b5cf6;">👥</div>
            <span class="quick-act-label">Refer & Earn</span>
          </div>
          <div class="quick-act-card" id="btnProfilePrivacy">
            <div class="quick-act-icon" style="background: rgba(59, 130, 246, 0.1); color: #3b82f6;">🛡️</div>
            <span class="quick-act-label">Privacy</span>
          </div>
        </div>
      </div>

      <!-- Settings & Support Section -->
      <h3 style="font-size: 1rem; font-weight: 800; color: #374151; margin: 24px 0 10px 4px;">Settings & Support</h3>

      <div class="settings-list-card">
        <div class="setting-item-row" id="btnMenuTerms">
          <div class="setting-item-left">
            <div class="setting-item-icon" style="background: rgba(245, 158, 11, 0.1); color: #f59e0b;">📄</div>
            <div>
              <div class="setting-title">Terms & Conditions</div>
              <div class="setting-desc">Read our terms and conditions</div>
            </div>
          </div>
          <span style="color: #9ca3af;">›</span>
        </div>

        <div class="setting-item-row" id="btnMenuRefund">
          <div class="setting-item-left">
            <div class="setting-item-icon" style="background: rgba(16, 185, 129, 0.1); color: #10b981;">💲</div>
            <div>
              <div class="setting-title">Refund & Cancellation</div>
              <div class="setting-desc">Request refunds and cancellations</div>
            </div>
          </div>
          <span style="color: #9ca3af;">›</span>
        </div>

        <div class="setting-item-row" id="btnMenuGuidelines">
          <div class="setting-item-left">
            <div class="setting-item-icon" style="background: rgba(59, 130, 246, 0.1); color: #3b82f6;">📋</div>
            <div>
              <div class="setting-title">Community Guidelines</div>
              <div class="setting-desc">Policies and community standards</div>
            </div>
          </div>
          <span style="color: #9ca3af;">›</span>
        </div>

        <div class="setting-item-row" id="btnMenuWarnings">
          <div class="setting-item-left">
            <div class="setting-item-icon" style="background: rgba(249, 115, 22, 0.1); color: #f97316;">ℹ️</div>
            <div>
              <div class="setting-title">My Warnings</div>
              <div class="setting-desc">
                ${warnings.length > 0 ? `<strong style="color: #ef4444;">${warnings.length} Active Warnings from Admin</strong>` : 'View warnings from admins'}
              </div>
            </div>
          </div>
          <span style="color: #9ca3af;">›</span>
        </div>

        <div class="setting-item-row" id="btnMenuBlocklist">
          <div class="setting-item-left">
            <div class="setting-item-icon" style="background: rgba(239, 68, 68, 0.1); color: #ef4444;">🚫</div>
            <div>
              <div class="setting-title">My Blocklist</div>
              <div class="setting-desc">See and unblock people</div>
            </div>
          </div>
          <span style="color: #9ca3af;">›</span>
        </div>

        <div class="setting-item-row">
          <div class="setting-item-left">
            <div class="setting-item-icon" style="background: rgba(236, 72, 153, 0.1); color: #ec4899;">🔕</div>
            <div>
              <div class="setting-title">Do Not Disturb</div>
              <div class="setting-desc">Mute incoming notifications</div>
            </div>
          </div>
          <input type="checkbox" id="chkDndToggle" ${user.isDnd ? 'checked' : ''} style="width: 22px; height: 22px; accent-color: var(--primary-pink); cursor: pointer;" />
        </div>

        <div class="setting-item-row" id="btnMenuHelp">
          <div class="setting-item-left">
            <div class="setting-item-icon" style="background: rgba(139, 92, 246, 0.1); color: #8b5cf6;">❓</div>
            <div>
              <div class="setting-title">Help & Support</div>
              <div class="setting-desc">Get help and contact support</div>
            </div>
          </div>
          <span style="color: #9ca3af;">›</span>
        </div>

        <div class="setting-item-row" id="btnMenuLogout">
          <div class="setting-item-left">
            <div class="setting-item-icon" style="background: rgba(239, 68, 68, 0.1); color: #ef4444;">🚪</div>
            <div>
              <div class="setting-title" style="color: #ef4444;">Logout</div>
              <div class="setting-desc">Sign out from your account</div>
            </div>
          </div>
          <span style="color: #9ca3af;">›</span>
        </div>
      </div>
    `;

    // Bind Online/Offline toggle
    const btnToggleOnline = container.querySelector('#btnToggleOnlineStatus');
    if (btnToggleOnline) {
      btnToggleOnline.onclick = () => {
        const nextStatus = user.isOnline === false ? true : false;
        user.isOnline = nextStatus;
        hipaApi.setUserOnlineStatus(nextStatus);
        const dot = container.querySelector('#profileStatusDot');
        const text = container.querySelector('#profileStatusText');
        if (dot) dot.className = `status-dot-indicator ${nextStatus ? 'online' : 'offline'}`;
        if (text) text.textContent = nextStatus ? '🟢 Online — Visible to calls & match' : '⚪ Offline — Hidden from live discovery';
        btnToggleOnline.textContent = nextStatus ? 'Online 🟢' : 'Offline ⚪';
        btnToggleOnline.style.background = nextStatus ? '#10b981' : '#6b7280';
        
        // Also update top bar
        const topDot = document.getElementById('topBarOnlineDot');
        const topText = document.getElementById('topBarOnlineText');
        if (topDot) {
          topDot.style.background = nextStatus ? '#10b981' : '#9ca3af';
          topDot.style.boxShadow = nextStatus ? '0 0 8px #10b981' : 'none';
        }
        if (topText) topText.textContent = nextStatus ? 'Online' : 'Offline';
      };
    }

    // Bind WhatsApp Group button
    const btnProfileWhatsApp = container.querySelector('#btnProfileWhatsApp');
    if (btnProfileWhatsApp) {
      btnProfileWhatsApp.onclick = () => {
        const cfg = hipaApi.getWhatsAppConfig();
        window.open(cfg.inviteLink || 'https://chat.whatsapp.com/invite/peelins-official-18', '_blank');
      };
    }

    // Bind Quick Actions
    container.querySelector('#btnProfileWallet').onclick = () => this.showWalletModal();
    container.querySelector('#btnProfileTransactions').onclick = () => this.showTransactionsModal();
    container.querySelector('#btnProfileRefer').onclick = () => this.showReferModal();
    container.querySelector('#btnProfilePrivacy').onclick = () => alert('🛡️ Privacy Policy: Your mobile number & live location are 100% encrypted.');

    // Bind Menu items
    container.querySelector('#btnMenuTerms').onclick = () => alert('📄 Terms & Conditions: Users must be 18+ and follow respectful communication.');
    container.querySelector('#btnMenuRefund').onclick = () => alert('💲 Refund Policy: Unused coin packages can be refunded within 48 hours via support.');
    container.querySelector('#btnMenuGuidelines').onclick = () => alert('📋 Community Guidelines: Harassment, hate speech & nudity are strictly banned.');
    container.querySelector('#btnMenuWarnings').onclick = () => this.showWarningsModal();
    container.querySelector('#btnMenuBlocklist').onclick = () => alert('🚫 Blocklist: You have 0 blocked users.');
    container.querySelector('#btnMenuHelp').onclick = () => alert('❓ Help: Email us at support@peelins-app.com or message 24/7 in app.');

    container.querySelector('#chkDndToggle').onchange = (e) => {
      user.isDnd = e.target.checked;
      hipaApi.saveUser(user);
      alert(user.isDnd ? '🔕 Do Not Disturb mode activated.' : '🔔 Notifications enabled.');
    };

    container.querySelector('#btnMenuLogout').onclick = () => {
      if (confirm('Are you sure you want to log out from Peelin\'s?')) {
        hipaApi.logout();
        this.renderOnboardingStep1();
      }
    };
  }

  // ==========================================
  // WALLET & COIN STORE (Exact as 4b86b2e8)
  // ==========================================
  showWalletModal() {
    const modal = document.createElement('div');
    modal.className = 'offer-modal-overlay';
    const packs = HIPA_COIN_PACKS;
    let selectedPack = packs[0];

    modal.innerHTML = `
      <div class="offer-card-sheet" style="height: 90vh; display: flex; flex-direction: column;">
        <!-- Top Bar -->
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 18px 20px; border-bottom: 1px solid #f1f2f6;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <button class="btn-secondary" id="btnCloseWallet" style="width: 36px; height: 36px; border-radius: 50%; padding: 0;">←</button>
            <h2 style="font-size: 1.35rem; font-weight: 900; color: #111827; margin: 0;">Wallet</h2>
          </div>
          <div class="hima-coin-pill">
            <span class="coin-icon-circle">H</span>
            <span>${hipaApi.getCoins()}</span>
          </div>
        </div>

        <!-- 3x3 Packs Grid -->
        <div style="flex: 1; overflow-y: auto; padding: 16px 20px 80px 20px;">
          <div class="wallet-grid">
            ${packs.map((p, idx) => `
              <div class="wallet-pack-card ${idx === 0 ? 'selected' : ''}" data-id="${p.id}">
                ${p.popular ? '<span class="pack-popular-tag">★ Popular</span>' : ''}
                <div style="font-size: 1.8rem; margin-top: 4px;">🪙</div>
                <div class="pack-coins-num">${p.coins}</div>
                <div class="pack-coins-label">Coins</div>
                ${p.discount ? `<div class="pack-discount-tag">${p.discount}</div>` : '<div style="height: 14px;"></div>'}
                <div class="pack-price-btn">₹${p.price}</div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Sticky Bottom Add Coins Button -->
        <div style="padding: 16px 20px; background: #ffffff; border-top: 1px solid #f1f2f6;">
          <button class="btn-pink-block" id="btnAddCoinsAction">
            Add 40 Coins
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('#btnCloseWallet').onclick = () => modal.remove();

    const addBtn = modal.querySelector('#btnAddCoinsAction');

    modal.querySelectorAll('.wallet-pack-card').forEach(card => {
      card.onclick = () => {
        modal.querySelectorAll('.wallet-pack-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        const pid = Number(card.getAttribute('data-id'));
        selectedPack = packs.find(p => p.id === pid);
        addBtn.textContent = `Add ${selectedPack.coins} Coins (₹${selectedPack.price})`;
      };
    });

    addBtn.onclick = () => {
      modal.remove();
      this.showPaymentCheckoutModal(selectedPack.price, selectedPack.coins, `${selectedPack.coins} Peelin's Coins Pack`);
    };
  }

  // ==========================================
  // WELCOME OFFER POPUP (Exact as 80caa87c)
  // ==========================================
  showWelcomeOfferModal() {
    const modal = document.createElement('div');
    modal.className = 'offer-modal-overlay';

    modal.innerHTML = `
      <div class="offer-card-sheet">
        <button id="btnCloseOffer" style="position: absolute; top: 14px; right: 16px; background: rgba(0,0,0,0.2); border: none; width: 30px; height: 30px; border-radius: 50%; color: #ffffff; font-weight: 900; z-index: 10; cursor: pointer;">✕</button>

        <div class="offer-banner-pink">
          <div class="offer-tag-badge">65% off</div>
          <div style="display: flex; align-items: center; justify-content: center; gap: 6px; font-size: 0.88rem; font-weight: 700; opacity: 0.95;">
            <span>🎁</span> Your welcome offer
          </div>

          <div style="display: flex; justify-content: center; margin: 12px 0;">
            <div style="font-size: 3.5rem;">🪙🪙🪙</div>
          </div>

          <div class="offer-coins-large">60</div>
          <div style="font-size: 1.05rem; font-weight: 800; letter-spacing: 0.5px;">Peelin's coins</div>
        </div>

        <div class="offer-body-white">
          <div class="offer-pricing-row">
            <div>
              <span class="price-main">₹14</span>
              <span class="price-cut">₹40</span>
              <div class="price-save">You save ₹26</div>
            </div>
            <div class="offer-timer-box">
              <span>⏱️ Offer ends in</span>
              <span class="timer-digits" id="offerTimerDigits">04:57</span>
            </div>
          </div>

          <button class="btn-pink-block" id="btnClaimOffer">
            <span>🪙</span> Get 60 coins &bull; ₹14 &rarr;
          </button>

          <p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 14px; font-weight: 600;">
            ⭐ Used by 23,412 people in the last 30 mins
          </p>
          <button id="btnViewAllPlans" style="background: none; border: none; color: #111827; font-size: 0.8rem; font-weight: 800; margin-top: 6px; cursor: pointer;">
            View all plans &rsaquo;
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('#btnCloseOffer').onclick = () => modal.remove();

    // Start countdown timer
    const timerEl = modal.querySelector('#offerTimerDigits');
    if (this.offerTimer) clearInterval(this.offerTimer);
    this.offerTimer = setInterval(() => {
      if (this.offerSeconds <= 0) {
        clearInterval(this.offerTimer);
        return;
      }
      this.offerSeconds--;
      const mins = Math.floor(this.offerSeconds / 60);
      const secs = this.offerSeconds % 60;
      if (timerEl) timerEl.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }, 1000);

    modal.querySelector('#btnClaimOffer').onclick = () => {
      modal.remove();
      this.showPaymentCheckoutModal(14, 60, "Welcome Offer (60 Coins)");
    };

    modal.querySelector('#btnViewAllPlans').onclick = () => {
      modal.remove();
      this.showWalletModal();
    };
  }

  // ==========================================
  // PAYMENT OPTIONS MODAL (Exact as 21d11a43)
  // ==========================================
  showPaymentCheckoutModal(amount, coins, title = "Coin Pack") {
    const modal = document.createElement('div');
    modal.className = 'offer-modal-overlay';
    const cfg = hipaApi.getGatewayConfigs();
    const upiVpa = cfg.payments?.upiDirect?.vpa || "hipabiz@icici";

    modal.innerHTML = `
      <div class="offer-card-sheet" style="height: 92vh; display: flex; flex-direction: column;">
        <!-- Top App Bar in Blue as in Screenshot 21d11a43 -->
        <div style="background: #2563eb; color: #ffffff; padding: 14px 18px; display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 14px;">
            <button id="btnClosePay" style="background: none; border: none; color: #ffffff; font-size: 1.3rem; cursor: pointer;">←</button>
            <div style="width: 32px; height: 32px; border-radius: 8px; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; font-weight: 900;">H</div>
            <span style="font-weight: 800; font-size: 1.15rem;">Peelin's</span>
          </div>
          <div style="width: 32px; height: 32px; border-radius: 50%; background: rgba(255,255,255,0.25); display: flex; align-items: center; justify-content: center;">👤</div>
        </div>

        <div style="flex: 1; overflow-y: auto; padding: 18px 20px 80px 20px; background: #ffffff;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
            <h2 style="font-size: 1.2rem; font-weight: 900; color: #111827; margin: 0;">Payment Options</h2>
            <span class="glass-pill" style="font-size: 0.72rem; color: #2563eb;">${title}</span>
          </div>

          <!-- Dynamic UPI QR Card -->
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: var(--radius-md); padding: 16px; margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
              <span style="font-size: 0.82rem; font-weight: 800; color: #475569;">UPI QR</span>
              <span style="font-size: 0.76rem; color: #64748b;">⏱️ 09:50</span>
            </div>

            <div style="display: flex; align-items: center; gap: 16px;">
              <div style="width: 100px; height: 100px; background: #ffffff; border: 1.5px solid #cbd5e1; border-radius: 12px; display: flex; align-items: center; justify-content: center; padding: 6px;">
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`upi://pay?pa=${upiVpa}&pn=HipaApp&am=${amount}&cu=INR`)}" style="width: 100%; height: 100%;" />
              </div>
              <div style="flex: 1;">
                <div style="font-size: 0.82rem; font-weight: 700; color: #334155; margin-bottom: 6px;">Scan the QR using any UPI App</div>
                <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                  <span class="glass-pill" style="font-size: 0.65rem;">Navi</span>
                  <span class="glass-pill" style="font-size: 0.65rem;">PhonePe</span>
                  <span class="glass-pill" style="font-size: 0.65rem;">GPay</span>
                  <span class="glass-pill" style="font-size: 0.65rem;">Paytm</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Recommended UPI Apps -->
          <div style="font-size: 0.82rem; font-weight: 700; color: #64748b; margin-bottom: 8px;">Recommended</div>
          <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px;">
            <div class="creator-card" style="padding: 12px 14px; cursor: pointer;">
              <div style="display: flex; align-items: center; gap: 10px; font-size: 0.9rem; font-weight: 700;">
                <span style="font-size: 1.2rem;">📱</span> UPI - Navi
              </div>
              <span>›</span>
            </div>
            <div class="creator-card" style="padding: 12px 14px; cursor: pointer;">
              <div style="display: flex; align-items: center; gap: 10px; font-size: 0.9rem; font-weight: 700;">
                <span style="font-size: 1.2rem;">🟣</span> UPI - PhonePe
              </div>
              <span>›</span>
            </div>
          </div>

          <!-- All Payment Options -->
          <div style="font-size: 0.82rem; font-weight: 700; color: #64748b; margin-bottom: 8px;">All Payment Options</div>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <div class="creator-card" style="padding: 12px 14px;">
              <span style="font-weight: 700; font-size: 0.88rem;">💳 Cards (Visa, MasterCard, Rupay)</span>
              <span>›</span>
            </div>
            <div class="creator-card" style="padding: 12px 14px;">
              <span style="font-weight: 700; font-size: 0.88rem;">🏦 Netbanking (SBI, HDFC, ICICI)</span>
              <span>›</span>
            </div>
            <div class="creator-card" style="padding: 12px 14px;">
              <span style="font-weight: 700; font-size: 0.88rem;">👛 Wallets</span>
              <span>›</span>
            </div>
          </div>
        </div>

        <!-- Sticky Bottom Bar as in 21d11a43 -->
        <div style="padding: 12px 20px; background: #ffffff; border-top: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: space-between; gap: 16px;">
          <div>
            <div style="font-size: 1.35rem; font-weight: 900; color: #0f172a;">₹${amount}</div>
            <div style="font-size: 0.72rem; color: var(--text-muted);">View Details ^</div>
          </div>
          <button id="btnConfirmPay" style="flex: 1; background: #0f172a; color: #ffffff; padding: 14px; border-radius: 12px; font-size: 1rem; font-weight: 800; border: none; cursor: pointer;">
            Continue
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('#btnClosePay').onclick = () => modal.remove();

    modal.querySelector('#btnConfirmPay').onclick = () => {
      hipaApi.addCoins(coins, `${coins} Coins Pack`, "UTR-" + Date.now().toString().slice(-8));
      alert(`🎉 Payment of ₹${amount} Successful!\n${coins} Peelin's coins have been credited to your wallet.`);
      modal.remove();
      document.getElementById('userCoinsCount').textContent = hipaApi.getCoins();
    };
  }

  // ==========================================
  // LIVE WEBRTC CALLING SCREEN (Real Camera/Mic & Firestore Signaling)
  // ==========================================
  startCall(creator, type = 'voice') {
    callManager.startCall(creator, type === 'video' ? 'video' : 'voice');
  }

  // ==========================================
  // MEGA FEATURE MODALS: Stories, Gifts, Wheel, VIP
  // ==========================================

  showStoryModal(story) {
    const modal = document.createElement('div');
    modal.className = 'offer-modal-overlay';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';

    modal.innerHTML = `
      <div style="width: 100%; max-width: 440px; height: 85vh; border-radius: 26px; overflow: hidden; position: relative; background: #0c0814; box-shadow: 0 0 50px rgba(0,0,0,0.9); border: 1.5px solid rgba(255,0,127,0.4);">
        <!-- Story Progress Bar -->
        <div style="position: absolute; top: 14px; left: 16px; right: 16px; height: 3px; background: rgba(255,255,255,0.3); border-radius: 4px; z-index: 20; overflow: hidden;">
          <div style="height: 100%; width: 100%; background: #ff007f; animation: storyProgress 5s linear forwards;"></div>
        </div>
        <style>@keyframes storyProgress { from { width: 0%; } to { width: 100%; } }</style>

        <!-- Story Header -->
        <div style="position: absolute; top: 26px; left: 16px; right: 16px; display: flex; align-items: center; justify-content: space-between; z-index: 20;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <img src="${story.avatar}" style="width: 38px; height: 38px; border-radius: 50%; object-fit: cover; border: 2px solid #ff007f;" />
            <div>
              <div style="font-weight: 800; font-size: 0.95rem; color: #fff;">${story.name}</div>
              <div style="font-size: 0.72rem; color: #ffd1e3;">${story.time}</div>
            </div>
          </div>
          <button id="btnCloseStory" style="background: rgba(0,0,0,0.5); border: none; color: #fff; width: 32px; height: 32px; border-radius: 50%; font-size: 1rem; cursor: pointer;">✕</button>
        </div>

        <!-- Story Media -->
        <img src="${story.preview}" style="width: 100%; height: 100%; object-fit: cover;" />

        <!-- Bottom Actions -->
        <div style="position: absolute; bottom: 0; left: 0; right: 0; padding: 24px 18px; background: linear-gradient(0deg, rgba(0,0,0,0.95) 0%, transparent 100%); z-index: 20; display: flex; flex-direction: column; gap: 12px;">
          <div style="font-size: 1rem; font-weight: 700; color: #fff;">${story.caption}</div>
          <div style="display: flex; gap: 10px;">
            <button id="btnStoryQuickCall" style="flex: 2; padding: 14px; border-radius: 9999px; background: var(--primary-gradient); color: #fff; border: none; font-weight: 800; font-size: 0.92rem; cursor: pointer; box-shadow: 0 4px 20px rgba(255,0,127,0.5);">
              📹 Call ${story.name} Now
            </button>
            <button id="btnStoryQuickGift" style="flex: 1; padding: 14px; border-radius: 9999px; background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.3); color: #ffd700; font-weight: 800; font-size: 0.88rem; cursor: pointer;">
              🎁 Gift
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const closeStory = () => modal.remove();
    modal.querySelector('#btnCloseStory').onclick = closeStory;

    const timer = setTimeout(closeStory, 5500);

    modal.querySelector('#btnStoryQuickCall').onclick = () => {
      clearTimeout(timer);
      closeStory();
      const creator = HIPA_CREATORS.find(c => c.id === story.creatorId) || HIPA_CREATORS[0];
      this.startCall(creator, 'video');
    };

    modal.querySelector('#btnStoryQuickGift').onclick = () => {
      clearTimeout(timer);
      closeStory();
      const creator = HIPA_CREATORS.find(c => c.id === story.creatorId) || HIPA_CREATORS[0];
      this.showGiftModal(creator);
    };
  }

  showGiftModal(creator) {
    const modal = document.createElement('div');
    modal.className = 'offer-modal-overlay';

    modal.innerHTML = `
      <div class="offer-card-sheet" style="background: #130a21; border-top: 2px solid #ff007f; padding: 22px 18px 30px 18px; color: #fff;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
          <div>
            <h3 style="font-size: 1.25rem; font-weight: 900; color: #fff; margin: 0;">Send a Gift to ${creator.name}</h3>
            <span style="font-size: 0.78rem; color: #c9bfdc;">Coins Left: <strong style="color: #ffd700;">${hipaApi.getCoins()} 🪙</strong></span>
          </div>
          <button id="btnCloseGiftModal" style="background: rgba(255,255,255,0.1); border: none; width: 32px; height: 32px; border-radius: 50%; color: #fff; cursor: pointer;">✕</button>
        </div>

        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px;">
          ${HIPA_GIFTS.map(g => `
            <div class="gift-select-card" data-id="${g.id}" style="background: rgba(255,255,255,0.06); border: 1.5px solid rgba(255,0,127,0.25); border-radius: 18px; padding: 14px 8px; text-align: center; cursor: pointer; transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);">
              <div style="font-size: 2.3rem; margin-bottom: 4px;">${g.icon}</div>
              <div style="font-weight: 800; font-size: 0.82rem; color: #fff;">${g.name}</div>
              <div style="font-size: 0.75rem; color: #ffd700; font-weight: 800; margin-top: 2px;">🪙 ${g.coins}</div>
            </div>
          `).join('')}
        </div>

        <button id="btnRechargeFromGifts" class="btn-pink-block" style="padding: 12px; font-size: 0.9rem;">
          🪙 Get More Coins
        </button>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('#btnCloseGiftModal').onclick = () => modal.remove();
    modal.querySelector('#btnRechargeFromGifts').onclick = () => {
      modal.remove();
      this.showWalletModal();
    };

    modal.querySelectorAll('.gift-select-card').forEach(btn => {
      btn.onclick = () => {
        const gid = btn.getAttribute('data-id');
        const res = hipaApi.sendGift(creator.id, gid);
        if (res.ok) {
          modal.remove();
          this.triggerFlyingGiftAnimation(res.gift.icon);
          const coinEl = document.getElementById('userCoinsCount');
          if (coinEl) coinEl.textContent = hipaApi.getCoins();
          alert(`💖 You sent a ${res.gift.name} (${res.gift.icon}) to ${creator.name}!`);
        } else {
          if (res.balanceNeeded) {
            modal.remove();
            this.showWelcomeOfferModal();
          } else {
            alert(res.error);
          }
        }
      };
    });
  }

  triggerFlyingGiftAnimation(giftIcon) {
    const fx = document.createElement('div');
    fx.className = 'flying-gift-fx';
    fx.textContent = giftIcon;
    fx.style.left = '50%';
    fx.style.top = '50%';
    document.body.appendChild(fx);
    setTimeout(() => fx.remove(), 1500);
  }

  showLuckyWheelModal() {
    const modal = document.createElement('div');
    modal.className = 'offer-modal-overlay';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';

    const canSpin = hipaApi.canSpinDaily();

    modal.innerHTML = `
      <div style="width: 100%; max-width: 360px; background: #130a21; border: 2px solid #ffd700; border-radius: 28px; padding: 26px 20px; text-align: center; color: #fff; box-shadow: 0 0 50px rgba(255,215,0,0.4); position: relative;">
        <button id="btnCloseWheel" style="position: absolute; top: 14px; right: 16px; background: rgba(255,255,255,0.1); border: none; width: 30px; height: 30px; border-radius: 50%; color: #fff; cursor: pointer;">✕</button>

        <h2 style="font-size: 1.5rem; font-weight: 900; color: #ffd700; margin-bottom: 4px;">Daily Lucky Spin 🎡</h2>
        <p style="font-size: 0.8rem; color: #d1c7e6; margin-bottom: 16px;">Spin the lucky wheel once every 24 hours to win up to 200 free coins!</p>

        <!-- Wheel Visual -->
        <div style="position: relative; width: 220px; height: 220px; margin: 0 auto 20px auto;">
          <div class="wheel-pointer"></div>
          <div id="wheelSpinner" class="lucky-wheel-container" style="width: 220px; height: 220px; background: conic-gradient(#ff007f 0deg 45deg, #7928ca 45deg 90deg, #ffd700 90deg 135deg, #10b981 135deg 180deg, #ff007f 180deg 225deg, #3b82f6 225deg 270deg, #f59e0b 270deg 315deg, #ec4899 315deg 360deg);">
            <div style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 1.8rem; font-weight: 900; color: #fff; text-shadow: 0 2px 10px rgba(0,0,0,0.8);">
              🪙
            </div>
          </div>
        </div>

        <button id="btnSpinWheelAction" class="btn-pink-block" style="padding: 14px; font-size: 1rem; ${!canSpin ? 'opacity: 0.6; pointer-events: none;' : ''}">
          ${canSpin ? '🎰 Spin Now (Free)' : '⏳ Claimed Today (Come back tomorrow)'}
        </button>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('#btnCloseWheel').onclick = () => modal.remove();

    const spinBtn = modal.querySelector('#btnSpinWheelAction');
    if (spinBtn && canSpin) {
      spinBtn.onclick = () => {
        spinBtn.disabled = true;
        spinBtn.textContent = 'Spinning...';
        const spinner = modal.querySelector('#wheelSpinner');
        const randomDeg = 1440 + Math.floor(Math.random() * 360);
        spinner.style.transform = `rotate(${randomDeg}deg)`;

        setTimeout(() => {
          const res = hipaApi.spinLuckyWheel();
          if (res.ok) {
            this.triggerFlyingGiftAnimation('🪙');
            const coinEl = document.getElementById('userCoinsCount');
            if (coinEl) coinEl.textContent = hipaApi.getCoins();
            alert(`🎉 Congratulations! You won ${res.prizeWon} Free Peelin's Coins!\nNew Balance: ${res.newBalance} coins`);
            modal.remove();
          } else {
            alert(res.error);
          }
        }, 4200);
      };
    }
  }

  showVIPMembershipModal() {
    const modal = document.createElement('div');
    modal.className = 'offer-modal-overlay';

    modal.innerHTML = `
      <div class="offer-card-sheet" style="background: #11091d; border-top: 2px solid #ffd700; padding: 24px 20px 34px 20px; color: #fff;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 1.8rem;">👑</span>
            <h3 style="font-size: 1.35rem; font-weight: 900; color: #ffd700; margin: 0;">Peelin's VIP Club</h3>
          </div>
          <button id="btnCloseVIPModal" style="background: rgba(255,255,255,0.1); border: none; width: 32px; height: 32px; border-radius: 50%; color: #fff; cursor: pointer;">✕</button>
        </div>

        <div class="vip-pass-card">
          <div style="font-size: 1.3rem; font-weight: 900; color: #ffd700; margin-bottom: 4px;">Gold Pass Exclusive</div>
          <div style="font-size: 0.82rem; color: #e2d9f3; line-height: 1.4;">Enjoy unlimited priority matching, 200 free coins bonus, and verified gold border.</div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 22px; font-size: 0.88rem; color: #d1c7e6;">
          <div>✓ 200 Free Coins credited immediately</div>
          <div>✓ 5x higher calling priority with verified creators</div>
          <div>✓ Shimmering Gold Crown badge on profile</div>
          <div>✓ Unlimited rewinds in Swipe Vibe</div>
        </div>

        <button id="btnUpgradeVIPGold" class="btn-pink-block" style="background: linear-gradient(135deg, #ffd700 0%, #f59e0b 50%, #ff007f 100%); color: #000; font-weight: 900; padding: 14px; font-size: 1.05rem;">
          Upgrade to VIP Gold for ₹199
        </button>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('#btnCloseVIPModal').onclick = () => modal.remove();
    modal.querySelector('#btnUpgradeVIPGold').onclick = () => {
      hipaApi.upgradeVIP('gold');
      const coinEl = document.getElementById('userCoinsCount');
      if (coinEl) coinEl.textContent = hipaApi.getCoins();
      this.triggerFlyingGiftAnimation('👑');
      alert('👑 Welcome to Peelin\'s VIP Gold Club! 200 bonus coins added.');
      modal.remove();
    };
  }

  // ==========================================
  // 18+ MANDATORY SECURITY VERIFICATION MODAL
  // ==========================================
  showVerificationGateModal(vStatus) {
    const existing = document.getElementById('modal18VerificationGate');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'modal18VerificationGate';
    overlay.className = 'offer-modal-overlay';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.zIndex = '999999';

    if (vStatus === 'pending_approval') {
      overlay.innerHTML = `
        <div class="verification-modal-wrap" style="text-align: center; background: #140d22; border: 1.5px solid rgba(255, 0, 127, 0.4); border-radius: 28px; padding: 24px 20px; color: #ffffff; box-shadow: 0 0 40px rgba(0,0,0,0.9);">
          <div style="width: 72px; height: 72px; margin: 0 auto 16px auto; border-radius: 50%; background: linear-gradient(135deg, #ffd700, #f59e0b); display: flex; align-items: center; justify-content: center; font-size: 2.2rem; box-shadow: 0 0 25px rgba(245, 158, 11, 0.5);">
            ⏳
          </div>
          <div class="badge-18-plus" style="margin-bottom: 8px;">18+ STRICT COMPLIANCE</div>
          <h2 style="font-size: 1.45rem; font-weight: 900; color: #ffffff; margin-bottom: 8px;">
            Verification Under Review
          </h2>
          <p style="font-size: 0.88rem; color: #c9bfdc; line-height: 1.5; margin-bottom: 20px;">
            Your live selfie & voice verification have been securely submitted to our <strong>Safety & Moderation Team</strong>.
            <br><br>
            Audio & video calling will unlock automatically as soon as the admin approves your dossier.
          </p>

          <div style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); border-radius: 18px; padding: 16px; margin-bottom: 20px; text-align: left; font-size: 0.84rem;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px; color: #10b981; font-weight: 800;">
              <span>✓</span>
              <span style="color: #ffffff;">18+ Age & DOB Declaration Submitted</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px; color: #10b981; font-weight: 800;">
              <span>✓</span>
              <span style="color: #ffffff;">Live Selfie Pose Photo Captured</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px; color: #10b981; font-weight: 800;">
              <span>✓</span>
              <span style="color: #ffffff;">Audio Voice Greeting Recorded</span>
            </div>
          </div>

          <!-- Instant Demo Bypass Button -->
          <button id="btnInstantDemoApprove" style="background: linear-gradient(135deg, #10b981, #059669); border: none; color: #fff; font-weight: 900; font-size: 0.92rem; padding: 12px 18px; border-radius: 9999px; width: 100%; margin-bottom: 10px; cursor: pointer; box-shadow: 0 0 20px rgba(16,185,129,0.4);">
            ⚡ Instant Demo Approve (Test Calls Directly)
          </button>

          <button class="btn-secondary" id="btnCloseGatePending" style="width: 100%; padding: 12px; font-weight: 800; background: rgba(255,255,255,0.08); color: #fff; border: 1px solid rgba(255,255,255,0.2);">
            Close Window
          </button>
        </div>
      `;

      document.body.appendChild(overlay);
      overlay.querySelector('#btnCloseGatePending').onclick = () => overlay.remove();
      overlay.querySelector('#btnInstantDemoApprove').onclick = () => {
        hipaApi.approveVerification();
        overlay.remove();
        alert('🎉 18+ Verification Approved! You can now start live video and audio calls.');
      };
      return;
    }

    // Step-by-Step Dossier Form (Dark Cyber-Neon Luxury Glass)
    overlay.innerHTML = `
      <div class="verification-modal-wrap" style="background: #140d22; border: 1.5px solid rgba(255, 0, 127, 0.4); border-radius: 28px; padding: 24px 20px; color: #ffffff; box-shadow: 0 0 50px rgba(0,0,0,0.9);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="badge-18-plus">18+</span>
            <h2 style="font-size: 1.35rem; font-weight: 900; color: #ffffff; margin: 0;">Safety Verification</h2>
          </div>
          <button id="btnCloseVerifGate" style="background: rgba(255,255,255,0.1); border: none; width: 32px; height: 32px; border-radius: 50%; color: #ffffff; font-weight: 900; cursor: pointer;">✕</button>
        </div>

        <p style="font-size: 0.84rem; color: #c9bfdc; line-height: 1.4; margin-bottom: 18px;">
          To prevent catfishing, fraud, and underage abuse, all users must complete <strong>18+ Age, Live Selfie & Voice Verification</strong> before accessing calling features.
        </p>

        <form id="formSubmit18Verification" style="display: flex; flex-direction: column; gap: 14px;">
          <!-- Step 1: Age & DOB -->
          <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255, 0, 127, 0.3); border-radius: 16px; padding: 14px;">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
              <div class="step-circle" style="background: var(--primary-pink); color: #fff; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 900;">1</div>
              <label style="font-weight: 800; font-size: 0.88rem; color: #ffffff;">18+ Age & Date of Birth</label>
            </div>
            <input type="date" id="inputVerifDob" required max="2008-11-25" class="glass-input" style="padding: 10px 14px; font-size: 0.95rem; font-weight: 800; color: #fff; background: rgba(255,255,255,0.08); border-color: rgba(255,0,127,0.4);" value="2003-05-15" />
            <div style="font-size: 0.72rem; color: #ff85c0; font-weight: 700; margin-top: 6px;">
              🔒 Strictly 18+ required under platform safety guidelines.
            </div>
          </div>

          <!-- Step 2: Live Selfie / Face Verification -->
          <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.12); border-radius: 16px; padding: 14px;">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
              <div class="step-circle" style="background: var(--primary-pink); color: #fff; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 900;">2</div>
              <label style="font-weight: 800; font-size: 0.88rem; color: #ffffff;">Live Face / Selfie Verification</label>
            </div>
            <div style="font-size: 0.78rem; color: #c9bfdc; margin-bottom: 10px;">
              Please upload or capture a clear photo showing: <strong>Peace Sign ✌️</strong>
            </div>
            
            <div style="display: flex; gap: 12px; align-items: center;">
              <div id="selfiePreviewBox" style="width: 76px; height: 76px; border-radius: 16px; background: rgba(255,255,255,0.08); display: flex; align-items: center; justify-content: center; overflow: hidden; border: 2px dashed rgba(255,0,127,0.4); flex-shrink: 0;">
                <span id="selfiePlaceholder" style="font-size: 1.8rem;">🤳</span>
                <img id="selfiePreviewImg" src="" style="width: 100%; height: 100%; object-fit: cover; display: none;" />
              </div>
              <div style="flex: 1;">
                <label for="inputSelfieFile" class="btn-pink-block" style="padding: 10px 14px; font-size: 0.82rem; font-weight: 800; text-align: center; cursor: pointer; display: block; box-shadow: 0 0 15px rgba(255,0,127,0.4);">
                  📸 Capture / Upload
                </label>
                <input type="file" id="inputSelfieFile" accept="image/*" capture="user" style="display: none;" />
              </div>
            </div>
          </div>

          <!-- Step 3: Short Audio Verification -->
          <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.12); border-radius: 16px; padding: 14px;">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
              <div class="step-circle" style="background: var(--primary-pink); color: #fff; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 900;">3</div>
              <label style="font-weight: 800; font-size: 0.88rem; color: #ffffff;">Short Audio Voice Verification</label>
            </div>
            <div style="font-size: 0.78rem; color: #c9bfdc; margin-bottom: 10px;">
              Record a 5-second voice greeting: <em>"Hi, this is my real voice on Peelin\'s platform."</em>
            </div>

            <button type="button" class="voice-record-btn" id="btnToggleVoiceRecord" style="background: rgba(255,255,255,0.08); border: 1.5px solid rgba(255,0,127,0.4); border-radius: 12px; padding: 10px 14px; width: 100%; color: #fff; font-weight: 800; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;">
              <span id="voiceRecordIcon">🎙️</span>
              <span id="voiceRecordText">Tap to Record Voice Sample</span>
            </button>

            <div id="audioPreviewContainer" style="display: none; margin-top: 10px;">
              <div style="font-size: 0.75rem; font-weight: 700; color: #10b981; margin-bottom: 4px;">✓ Voice Recording Captured:</div>
              <audio id="audioPreviewPlayback" controls style="width: 100%; height: 36px; border-radius: 8px;"></audio>
            </div>
          </div>

          <!-- Terms & Submit -->
          <div style="font-size: 0.75rem; color: #c9bfdc; display: flex; align-items: flex-start; gap: 8px;">
            <input type="checkbox" id="checkConsent18" required checked style="margin-top: 2px;" />
            <label for="checkConsent18">I declare that I am 18+ years of age. I agree that my selfie and voice sample will be reviewed by Peelin\'s administrators for safety compliance.</label>
          </div>

          <button type="submit" class="btn-pink-block" id="btnSubmitDossier" style="padding: 14px; font-size: 1rem; font-weight: 900; box-shadow: 0 0 25px rgba(255,0,127,0.5);">
            Submit for Admin Approval ➔
          </button>

          <!-- Instant Demo Bypass Button -->
          <button type="button" id="btnFastDemoBypass" style="background: rgba(16,185,129,0.15); border: 1.5px dashed #10b981; color: #34d399; font-weight: 900; font-size: 0.85rem; padding: 10px 14px; border-radius: 9999px; cursor: pointer; width: 100%;">
            ⚡ Instant Demo Approve (Test Calling HUD)
          </button>
        </form>
      </div>
    `;

    document.body.appendChild(overlay);

    overlay.querySelector('#btnCloseVerifGate').onclick = () => overlay.remove();

    overlay.querySelector('#btnFastDemoBypass').onclick = () => {
      hipaApi.approveVerification();
      overlay.remove();
      alert('🎉 18+ Verification Approved! You can now start live audio & video calls.');
    };

    // Image file handler
    const fileInput = overlay.querySelector('#inputSelfieFile');
    const previewImg = overlay.querySelector('#selfiePreviewImg');
    const placeholder = overlay.querySelector('#selfiePlaceholder');
    let selfieDataUrl = "/images/avatar_female_ashley.jpg";

    fileInput.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          selfieDataUrl = event.target.result;
          previewImg.src = selfieDataUrl;
          previewImg.style.display = 'block';
          placeholder.style.display = 'none';
        };
        reader.readAsDataURL(file);
      }
    };

    // Voice Recorder handler
    const recordBtn = overlay.querySelector('#btnToggleVoiceRecord');
    const recordIcon = overlay.querySelector('#voiceRecordIcon');
    const recordText = overlay.querySelector('#voiceRecordText');
    const audioContainer = overlay.querySelector('#audioPreviewContainer');
    const audioPlayback = overlay.querySelector('#audioPreviewPlayback');
    let voiceAudioUrl = "https://actions.google.com/sounds/v1/speech/hello_greeting.ogg";
    let isRecording = false;
    let audioTimer = null;
    let audioSeconds = 0;
    let mediaRecorder = null;
    let audioChunks = [];

    recordBtn.onclick = async () => {
      if (!isRecording) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true }).catch(() => null);
          isRecording = true;
          recordBtn.style.borderColor = '#10b981';
          recordIcon.textContent = '⏹️';
          audioSeconds = 0;
          recordText.textContent = `Recording... (05s)`;

          audioTimer = setInterval(() => {
            audioSeconds++;
            recordText.textContent = `Recording... (0${Math.max(0, 5 - audioSeconds)}s)`;
            if (audioSeconds >= 5) {
              stopRecording();
            }
          }, 1000);

          if (stream) {
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];
            mediaRecorder.ondataavailable = (event) => audioChunks.push(event.data);
            mediaRecorder.onstop = () => {
              const recordedAudioBlob = new Blob(audioChunks, { type: 'audio/webm' });
              voiceAudioUrl = URL.createObjectURL(recordedAudioBlob);
              audioPlayback.src = voiceAudioUrl;
              audioContainer.style.display = 'block';
              stream.getTracks().forEach(t => t.stop());
            };
            mediaRecorder.start();
          }
        } catch (err) {
          isRecording = true;
          recordText.textContent = 'Recording sample...';
          setTimeout(() => stopRecording(), 4000);
        }
      } else {
        stopRecording();
      }
    };

    const stopRecording = () => {
      if (audioTimer) clearInterval(audioTimer);
      isRecording = false;
      recordBtn.style.borderColor = 'rgba(255,0,127,0.4)';
      recordIcon.textContent = '✓';
      recordText.textContent = 'Voice Recorded Successfully!';
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
      } else {
        audioPlayback.src = voiceAudioUrl;
        audioContainer.style.display = 'block';
      }
    };

    // Form Submit
    const form = overlay.querySelector('#formSubmit18Verification');
    form.onsubmit = async (e) => {
      e.preventDefault();
      const dobVal = overlay.querySelector('#inputVerifDob').value;
      const birthYear = new Date(dobVal).getFullYear();
      const age = new Date().getFullYear() - birthYear;

      if (age < 18) {
        alert('⚠️ You must be at least 18 years old to access calling features on Peelin\'s.');
        return;
      }

      const submitBtn = overlay.querySelector('#btnSubmitDossier');
      submitBtn.textContent = 'Submitting to Admin...';
      submitBtn.disabled = true;

      await hipaApi.submitVerification({
        dob: dobVal,
        age: age,
        selfiePhoto: selfieDataUrl,
        audioUrl: voiceAudioUrl,
        poseReq: "Peace Sign ✌️"
      });

      overlay.remove();
      this.showVerificationGateModal('pending_approval');
    };
  }

  // PROFILE SUB-MODALS (Transactions, Warnings, Refer)
  // ==========================================
  showTransactionsModal() {
    const txs = hipaApi.getTransactions();
    const modal = document.createElement('div');
    modal.className = 'offer-modal-overlay';
    modal.innerHTML = `
      <div class="offer-card-sheet" style="height: 75vh; padding: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h2 style="font-size: 1.3rem; font-weight: 800; color: #111827; margin: 0;">Coin Transactions</h2>
          <button id="btnCloseTxs" style="background: none; border: none; font-size: 1.2rem; cursor: pointer;">✕</button>
        </div>

        <div style="flex: 1; overflow-y: auto;">
          ${txs.length > 0 ? txs.map(t => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #f1f2f6;">
              <div>
                <div style="font-weight: 700; color: #111827;">${t.title}</div>
                <div style="font-size: 0.72rem; color: var(--text-muted);">${t.date} ${t.utr ? '• ' + t.utr : ''}</div>
              </div>
              <div style="font-weight: 900; color: ${t.type === 'credit' ? '#10b981' : '#ef4444'};">
                ${t.amount}
              </div>
            </div>
          `).join('') : '<p style="text-align: center; color: var(--text-muted); padding: 40px 0;">No transactions yet.</p>'}
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    modal.querySelector('#btnCloseTxs').onclick = () => modal.remove();
  }

  showWarningsModal() {
    const warnings = hipaApi.getWarnings();
    const modal = document.createElement('div');
    modal.className = 'offer-modal-overlay';
    modal.innerHTML = `
      <div class="offer-card-sheet" style="height: 60vh; padding: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h2 style="font-size: 1.3rem; font-weight: 800; color: #111827; margin: 0;">My Warnings</h2>
          <button id="btnCloseWarn" style="background: none; border: none; font-size: 1.2rem; cursor: pointer;">✕</button>
        </div>

        <div style="flex: 1; overflow-y: auto;">
          ${warnings.length > 0 ? warnings.map(w => `
            <div class="glass-card" style="padding: 14px; margin-bottom: 10px; border-left: 4px solid #ef4444;">
              <div style="font-weight: 800; color: #ef4444; font-size: 0.95rem;">⚠️ Admin Warning: ${w.reason}</div>
              <div style="font-size: 0.8rem; color: var(--text-dark); margin-top: 4px;">${w.message}</div>
              <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 6px;">Issued on: ${w.date}</div>
            </div>
          `).join('') : `
            <div style="text-align: center; padding: 40px 0;">
              <div style="font-size: 3rem; margin-bottom: 10px;">🛡️</div>
              <h3 style="font-size: 1.15rem; font-weight: 800; color: #10b981;">Clean Account Status</h3>
              <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 4px;">You have 0 warnings. Keep adhering to community guidelines!</p>
            </div>
          `}
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    modal.querySelector('#btnCloseWarn').onclick = () => modal.remove();
  }

  showReferModal() {
    const user = this.user || { username: 'JgckA625' };
    const myCode = "PEELINS-" + user.username;
    const modal = document.createElement('div');
    modal.className = 'offer-modal-overlay';
    modal.innerHTML = `
      <div class="offer-card-sheet" style="padding: 24px; text-align: center;">
        <div style="font-size: 3rem; margin-bottom: 8px;">🎁</div>
        <h2 style="font-size: 1.4rem; font-weight: 900; color: #111827; margin-bottom: 6px;">Refer & Earn 20 Coins</h2>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 20px;">
          Share your referral code with friends. When they register, both of you get 20 bonus coins!
        </p>

        <div style="background: #f8fafc; border: 1.5px dashed var(--primary-pink); padding: 14px; border-radius: 14px; font-size: 1.3rem; font-weight: 900; color: var(--primary-pink); margin-bottom: 20px;">
          ${myCode}
        </div>

        <button class="btn-pink-block" id="btnCopyRefCode" style="margin-bottom: 10px;">
          📋 Copy Referral Code
        </button>
        <button class="btn-secondary" id="btnCloseRefer" style="width: 100%;">
          Close
        </button>
      </div>
    `;
    document.body.appendChild(modal);
    modal.querySelector('#btnCloseRefer').onclick = () => modal.remove();
    modal.querySelector('#btnCopyRefCode').onclick = () => {
      navigator.clipboard?.writeText(myCode);
      alert('Referral code copied to clipboard: ' + myCode);
    };
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new HipaApp();
  app.init();
});
