/* =========================================================
   Hipa Dating App — Main Application Controller
   Exact Replica of Hipa Mobile UI & Feature Set
   Includes: Mobile OTP Login, 9-Language Selector, Gender/Avatar Wizard,
             Creators Directory, Live Calling (Voice/Video with Coin Meter),
             Wallet Recharge (40 to 33,000 Coins), ₹14 Welcome Offer Popup,
             Recent Calls Log, Friends Deck, User Profile & Settings.
   ========================================================= */

import { hipaApi, HIPA_CREATORS, HIPA_COIN_PACKS, HIPA_LANGUAGES, HIPA_AVATARS, HIPA_GIFTS, HIPA_STORIES, hipaAudio } from './api.js?v=10.0';

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
    this.callTimer = null;
    this.offerTimer = null;
    this.offerSeconds = 297; // 04:57
  }

  init() {
    if (!hipaApi.isLoggedIn()) {
      this.renderOnboardingStep1();
    } else {
      this.renderMainApp();
    }
  }

  // ==========================================
  // ONBOARDING SCREENS (Exact UI as Screenshots)
  // ==========================================

  // Step 1: Get Started / Mobile Number
  renderOnboardingStep1() {
    const root = document.getElementById('mainViewport');
    const topBar = document.getElementById('hipaTopBar') || document.getElementById('himaTopBar');
    if (topBar) topBar.style.display = 'none';
    const bNav = document.getElementById('hipaBottomNav') || document.getElementById('himaBottomNav');
    if (bNav) bNav.style.display = 'none';
    const btnR = document.getElementById('btnFloatingRandom');
    if (btnR) btnR.style.display = 'none';

    root.innerHTML = `
      <div class="onboarding-container" style="justify-content: space-between;">
        <div class="onboarding-header-decor">
          <div style="width: 84px; height: 84px; border-radius: 22px; overflow: hidden; margin: 0 auto 12px auto; box-shadow: 0 8px 30px rgba(255, 0, 127, 0.5); border: 2px solid rgba(255, 255, 255, 0.4);">
            <img src="/images/hipa_brand_logo.jpg" style="width: 100%; height: 100%; object-fit: cover;" />
          </div>
          <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
            <h1 style="font-size: 2.1rem; font-weight: 900; background: linear-gradient(135deg, #ff007f 0%, #ff2a85 50%, #7928ca 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Hipa</h1>
            <span class="badge-18-plus">18+</span>
          </div>
          <p style="font-size: 0.95rem; color: #6b7280; font-weight: 700; margin-top: 2px;">Meet Live • Feel Real</p>

          <div class="features-row" style="margin-top: 14px;">
            <div class="feat-item">
              <div class="feat-icon-sq" style="background: #ff007f;">📹</div>
              <span>Video Call</span>
            </div>
            <div class="feat-item">
              <div class="feat-icon-sq" style="background: #3b82f6;">📞</div>
              <span>Audio Call</span>
            </div>
            <div class="feat-item">
              <div class="feat-icon-sq" style="background: #8b5cf6;">💬</div>
              <span>Chat</span>
            </div>
            <div class="feat-item">
              <div class="feat-icon-sq" style="background: #10b981;">👥</div>
              <span>Meet People</span>
            </div>
          </div>
        </div>

        <div style="background: #ffffff; border-radius: 24px 24px 0 0; margin-top: auto; padding-top: 10px;">
          <h2 style="font-size: 1.5rem; font-weight: 800; color: #111827; margin-bottom: 4px;">Get Started</h2>
          <label style="font-size: 0.82rem; font-weight: 700; color: #4b5563;">Mobile number</label>

          <div class="phone-input-wrap">
            <div class="country-flag">
              <span>🇮🇳</span> +91
            </div>
            <input type="tel" id="inputPhone" class="phone-text-input" placeholder="Enter mobile number" maxlength="10" value="9511088531" />
          </div>
          <p style="font-size: 0.75rem; color: var(--text-faint); margin-top: -10px; margin-bottom: 14px;">
            You will receive an OTP on this number.
          </p>

          <!-- Referral Code Toggle -->
          <label class="checkbox-row">
            <input type="checkbox" id="chkReferral" checked />
            <span style="font-weight: 700; color: #1f2937;">Have a referral code?</span>
          </label>
          <div id="referralCodeBox" style="margin-bottom: 14px; display: flex; gap: 8px;">
            <input type="text" id="inputRefCode" class="glass-input" value="HIPA2026" placeholder="Enter referral code" style="background: #f9fafb; border-color: #e5e7eb; color: #111827; font-weight: 700;" />
            <button class="btn-secondary" id="btnApplyRef" style="padding: 0 18px; font-weight: 800; background: #4b5563; color: #ffffff;">Apply</button>
          </div>
          <div id="refSuccessMsg" style="font-size: 0.75rem; color: #10b981; font-weight: 700; margin-top: -10px; margin-bottom: 14px;">
            ✓ Referral code applied! +20 bonus coins on signup.
          </div>

          <!-- Age & Policy Checkboxes -->
          <label class="checkbox-row">
            <input type="checkbox" id="chkAge" checked />
            <span style="font-weight: 600;">I am 18 years or older</span>
          </label>
          <label class="checkbox-row">
            <input type="checkbox" id="chkTerms" checked />
            <span>I accept <strong style="color: var(--primary-pink);">terms & conditions</strong>, and <strong style="color: var(--primary-pink);">community guidelines & moderation policy</strong> of Hipa.</span>
          </label>

          <button class="btn-pink-block" id="btnSendOtp" style="margin-top: 10px;">
            Send OTP
          </button>
        </div>
      </div>
    `;

    root.querySelector('#btnApplyRef').onclick = () => {
      alert('🎉 Referral code applied! You will get 20 free coins.');
    };

    root.querySelector('#btnSendOtp').onclick = async () => {
      const phone = root.querySelector('#inputPhone').value.trim();
      const ageChk = root.querySelector('#chkAge').checked;
      const termsChk = root.querySelector('#chkTerms').checked;

      if (!ageChk) {
        alert('You must be 18 years or older to use Hipa.');
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

    root.innerHTML = `
      <div class="onboarding-container" style="justify-content: space-between;">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <button class="btn-secondary" id="btnBackToPhone" style="width: 40px; height: 40px; border-radius: 50%; padding: 0;">←</button>
        </div>

        <div class="onboarding-header-decor">
          <div class="onboarding-logo">💬</div>
          <h1 style="font-size: 1.8rem; font-weight: 900; color: #111827;">Hipa</h1>
          <p style="font-size: 0.85rem; color: var(--text-muted); font-weight: 600;">Where Feelings Connect</p>
        </div>

        <div style="background: #ffffff; border-radius: 24px 24px 0 0; padding-top: 10px;">
          <h2 style="font-size: 1.6rem; font-weight: 800; color: #111827; margin-bottom: 4px;">Verify OTP</h2>
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px;">
            <span style="font-size: 0.88rem; color: var(--text-muted);">
              OTP sent to <strong style="color: #111827;">+91${phone}</strong>
            </span>
            <button id="btnChangeNumber" style="background: none; border: none; color: var(--primary-pink); font-weight: 800; cursor: pointer;">Change</button>
          </div>

          <label style="display: block; font-size: 0.82rem; font-weight: 700; color: #4b5563; text-align: center; margin-bottom: 12px;">
            Enter 6-digit OTP
          </label>

          <!-- 6 OTP Boxes -->
          <div style="display: flex; justify-content: center; gap: 8px; margin-bottom: 24px;">
            ${[0, 1, 2, 3, 4, 5].map((i) => `
              <input type="text" maxlength="1" class="otp-box-digit" data-idx="${i}" 
                     value="${['1', '2', '3', '4', '5', '6'][i]}"
                     style="width: 46px; height: 52px; text-align: center; font-size: 1.4rem; font-weight: 900; border: 2px solid var(--primary-pink); border-radius: 12px; outline: none; background: #ffffff; color: #111827;" />
            `).join('')}
          </div>

          <button class="btn-pink-block" id="btnVerifyOtp">
            Verify OTP
          </button>

          <p style="text-align: center; font-size: 0.82rem; color: var(--text-muted); margin-top: 18px;">
            Didn't receive the OTP? <span style="color: var(--primary-pink); font-weight: 800;">Retry in 23s</span>
          </p>
        </div>
      </div>
    `;

    root.querySelector('#btnBackToPhone').onclick = () => this.renderOnboardingStep1();
    root.querySelector('#btnChangeNumber').onclick = () => this.renderOnboardingStep1();

    // OTP box auto-advance
    const digits = root.querySelectorAll('.otp-box-digit');
    digits.forEach((el, idx) => {
      el.oninput = (e) => {
        if (e.target.value && idx < 5) digits[idx + 1].focus();
      };
      el.onkeydown = (e) => {
        if (e.key === 'Backspace' && !e.target.value && idx > 0) digits[idx - 1].focus();
      };
    });

    root.querySelector('#btnVerifyOtp').onclick = async () => {
      const code = Array.from(digits).map(d => d.value).join('');
      const res = await hipaApi.verifyPhoneOtp(code);
      if (res.ok) {
        this.renderOnboardingStep3();
      } else {
        alert(res.error);
      }
    };
  }

  // Step 3: Choose Your Language
  renderOnboardingStep3() {
    const root = document.getElementById('mainViewport');

    root.innerHTML = `
      <div class="onboarding-container" style="justify-content: flex-start; overflow-y: auto;">
        <!-- Top Progress Bar -->
        <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 20px;">
          <button class="btn-secondary" id="btnBackToOtp" style="width: 40px; height: 40px; border-radius: 50%; padding: 0;">←</button>
          <div style="flex: 1; height: 6px; background: #e5e7eb; border-radius: 10px; overflow: hidden;">
            <div style="width: 50%; height: 100%; background: var(--primary-pink);"></div>
          </div>
        </div>

        <h1 style="font-size: 1.8rem; font-weight: 900; color: #111827; margin-bottom: 6px;">Choose your language</h1>
        <p style="font-size: 0.88rem; color: var(--text-muted); font-weight: 600; margin-bottom: 20px;">
          Pick the language you're most comfortable in 🌐
        </p>

        <!-- Languages List -->
        <div style="flex: 1; padding-bottom: 80px;">
          ${HIPA_LANGUAGES.map((lang) => `
            <div class="lang-card-item ${this.selectedLanguage === lang.name ? 'selected' : ''}" data-lang="${lang.name}">
              <div class="lang-letter-circle">${lang.char}</div>
              <div>
                <div style="font-size: 1.05rem; font-weight: 800; color: #111827;">${lang.name}</div>
                <div style="font-size: 0.82rem; color: var(--text-muted);">${lang.native}</div>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Sticky Continue Button -->
        <div style="position: absolute; bottom: 16px; left: 20px; right: 20px; background: #ffffff; padding-top: 10px;">
          <button class="btn-pink-block" id="btnContinueLanguage">
            Continue
          </button>
        </div>
      </div>
    `;

    root.querySelector('#btnBackToOtp').onclick = () => this.renderOnboardingStep2('9511088531');

    root.querySelectorAll('.lang-card-item').forEach((card) => {
      card.onclick = () => {
        root.querySelectorAll('.lang-card-item').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        this.selectedLanguage = card.getAttribute('data-lang');
      };
    });

    root.querySelector('#btnContinueLanguage').onclick = () => {
      this.renderOnboardingStep4();
    };
  }

  // Step 4: Who are you? (Gender & Avatar Wizard)
  renderOnboardingStep4() {
    const root = document.getElementById('mainViewport');

    root.innerHTML = `
      <div class="onboarding-container" style="justify-content: flex-start; overflow-y: auto;">
        <!-- Top Progress Bar -->
        <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 20px;">
          <button class="btn-secondary" id="btnBackToLang" style="width: 40px; height: 40px; border-radius: 50%; padding: 0;">←</button>
          <div style="flex: 1; height: 6px; background: #e5e7eb; border-radius: 10px; overflow: hidden;">
            <div style="width: 100%; height: 100%; background: var(--primary-pink);"></div>
          </div>
        </div>

        <h1 style="font-size: 1.8rem; font-weight: 900; color: #111827; margin-bottom: 6px;">Who are you?</h1>
        <p style="font-size: 0.88rem; color: var(--text-muted); font-weight: 600; margin-bottom: 20px;">
          Choose your gender to personalize your experience
        </p>

        <!-- Gender Cards -->
        <div class="gender-cards-row">
          <div class="gender-box ${this.selectedGender === 'male' ? 'selected' : ''}" data-gender="male">
            <div class="gender-circle-icon">♂</div>
            <div style="font-size: 1.1rem; font-weight: 800; color: var(--primary-pink); margin-bottom: 4px;">Male</div>
            <div style="font-size: 0.74rem; color: var(--text-muted); font-weight: 600;">Connect with creators</div>
          </div>

          <div class="gender-box ${this.selectedGender === 'female' ? 'selected' : ''}" data-gender="female">
            <div class="gender-circle-icon">♀</div>
            <div style="font-size: 1.1rem; font-weight: 800; color: #111827; margin-bottom: 4px;">Female</div>
            <div style="font-size: 0.74rem; color: var(--text-muted); font-weight: 600;">Become a creator</div>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span style="font-size: 0.95rem; font-weight: 800; color: #111827;">Pick your avatar</span>
          <span style="font-size: 0.76rem; color: var(--text-muted); font-weight: 600;">Swipe to explore →</span>
        </div>

        <!-- 3D Avatars Carousel -->
        <div class="avatar-carousel">
          ${HIPA_AVATARS.map((av, idx) => `
            <div class="avatar-item-wrap ${this.selectedAvatar === av ? 'selected' : ''}" data-avatar="${av}">
              <img src="${av}" alt="Avatar ${idx + 1}" />
              ${this.selectedAvatar === av ? '<div class="avatar-check-badge">✓</div>' : ''}
            </div>
          `).join('')}
        </div>

        <div style="display: flex; align-items: center; gap: 8px; color: var(--primary-pink); font-size: 0.82rem; font-weight: 700; margin-top: auto; margin-bottom: 20px;">
          <span>ℹ️</span> Gender can't be changed later
        </div>

        <button class="btn-pink-block" id="btnFinishOnboarding">
          Continue
        </button>
      </div>
    `;

    root.querySelector('#btnBackToLang').onclick = () => this.renderOnboardingStep3();

    root.querySelectorAll('.gender-box').forEach((box) => {
      box.onclick = () => {
        root.querySelectorAll('.gender-box').forEach(b => b.classList.remove('selected'));
        box.classList.add('selected');
        this.selectedGender = box.getAttribute('data-gender');
      };
    });

    root.querySelectorAll('.avatar-item-wrap').forEach((wrap) => {
      wrap.onclick = () => {
        root.querySelectorAll('.avatar-item-wrap').forEach(w => {
          w.classList.remove('selected');
          const badge = w.querySelector('.avatar-check-badge');
          if (badge) badge.remove();
        });
        wrap.classList.add('selected');
        const badge = document.createElement('div');
        badge.className = 'avatar-check-badge';
        badge.textContent = '✓';
        wrap.appendChild(badge);
        this.selectedAvatar = wrap.getAttribute('data-avatar');
      };
    });

    root.querySelector('#btnFinishOnboarding').onclick = () => {
      this.user = hipaApi.finishOnboarding(this.selectedLanguage, this.selectedGender, this.selectedAvatar);
      this.renderMainApp();
      // Show Welcome Offer automatically on first entry!
      setTimeout(() => this.showWelcomeOfferModal(), 800);
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
  }

  bindGlobalEvents() {
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

    // Floating Random Match
    const randomBtn = document.getElementById('btnFloatingRandom');
    if (randomBtn) {
      randomBtn.onclick = () => {
        const onlineCreators = HIPA_CREATORS.filter(c => c.online);
        const randomCreator = onlineCreators[Math.floor(Math.random() * onlineCreators.length)] || HIPA_CREATORS[0];
        this.startCall(randomCreator, 'video');
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
  // TAB 1: HOME (Dual Mode: Live Directory & 3D Swipe Deck)
  // ==========================================
  renderHomeTab(container) {
    const categories = ['All', 'Trending 🔥', 'Video 📹', 'Audio 📞', 'Hindi', 'Punjabi', 'Marathi', 'Bengali', 'Tamil', 'Telugu'];

    let creators = HIPA_CREATORS;
    if (this.activeCategory === 'Video 📹') {
      creators = HIPA_CREATORS.filter(c => c.videoOnline);
    } else if (this.activeCategory === 'Audio 📞') {
      creators = HIPA_CREATORS.filter(c => c.voiceRate > 0);
    } else if (this.activeCategory === 'Trending 🔥') {
      creators = [...HIPA_CREATORS].sort((a, b) => b.callsCount - a.callsCount);
    } else if (this.activeCategory !== 'All') {
      creators = HIPA_CREATORS.filter(c => c.language.toLowerCase().includes(this.activeCategory.toLowerCase()));
    }

    container.innerHTML = `
      <!-- 1. Live Stories / Reels Carousel -->
      <div class="stories-bar" style="margin: -14px -14px 10px -14px;">
        ${HIPA_STORIES.map(st => `
          <div class="story-item" data-id="${st.id}">
            <div class="story-avatar-wrap ${st.isLive ? 'live' : ''}">
              <img src="${st.avatar}" alt="${st.name}" />
              ${st.isLive ? '<span class="story-badge-live">LIVE</span>' : ''}
            </div>
            <span class="story-name">${st.name}</span>
          </div>
        `).join('')}
      </div>

      <!-- 2. Discovery Mode Toggle Bar -->
      <div class="discovery-toggle-bar">
        <button class="discovery-tab-btn ${this.discoveryMode === 'creators' ? 'active' : ''}" data-mode="creators">
          📹 Live Creators
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
            <div style="font-weight: 900; font-size: 0.82rem; color: #ff85c0;">Hipa VIP Pass</div>
            <div style="font-size: 0.68rem; color: #d1c7e6;">Free calls & perks</div>
          </div>
        </div>
      </div>

      ${this.discoveryMode === 'creators' ? `
        <!-- FEATURED HERO CARD (Ashley - Exact Image 2 Representation) -->
        <div class="featured-hero-card">
          <img src="/images/avatar_female_ashley.jpg" class="featured-hero-img" alt="Ashley" />
          <div class="featured-hero-overlay">
            <div class="hero-creator-header">
              <div class="hero-creator-name">
                Ashley <span class="hero-verified-pill" title="18+ Verified">✓</span>
              </div>
              <button class="btn-send-gift-hero" data-id="1" style="background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.25); border-radius: 9999px; padding: 6px 14px; color: #fff; font-weight: 800; font-size: 0.78rem; cursor: pointer; display: flex; align-items: center; gap: 5px;">
                🎁 Send Gift
              </button>
            </div>
            <div class="hero-creator-bio">
              Free spirited traveler exploring hidden gems, new cuisines, and unforgettable global experiences daily.
            </div>
            <div class="hero-tags-grid">
              <span class="hero-tag-pill">photography 📷</span>
              <span class="hero-tag-pill">politics 🏛️</span>
              <span class="hero-tag-pill">travel ✈️</span>
              <span class="hero-tag-pill">sports ⚽</span>
            </div>
            <!-- Dual Call Rate Buttons from Screenshot -->
            <div class="hero-call-actions-row">
              <button class="hero-call-btn-card btn-hero-voice" data-id="1" title="Start Audio Call with Ashley">
                <div class="hero-call-btn-top audio">
                  <span style="font-size: 1.6rem; color: #ffffff;">📞</span>
                </div>
                <div class="hero-call-btn-bottom">
                  <span>🪙 10/min</span>
                  <span>⏱️ 8 mins</span>
                </div>
              </button>
              <button class="hero-call-btn-card btn-hero-video" data-id="1" title="Start Video Call with Ashley">
                <div class="hero-call-btn-top video">
                  <span style="font-size: 1.6rem; color: #ffffff;">📹</span>
                </div>
                <div class="hero-call-btn-bottom">
                  <span>🪙 10/min</span>
                  <span>⏱️ 8 mins</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        <!-- Welcome Offer Banner Card -->
        <div class="glass-card" id="bannerWelcomeOffer" style="background: linear-gradient(135deg, rgba(255, 0, 127, 0.85) 0%, rgba(121, 40, 202, 0.85) 100%); color: #ffffff; padding: 14px 18px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: space-between; cursor: pointer; margin-bottom: 14px; box-shadow: var(--shadow-pink); border: 1px solid rgba(255, 255, 255, 0.2);">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="font-size: 2rem;">🪙</div>
            <div>
              <div style="font-weight: 900; font-size: 1.05rem;">Get 60 Coins for only ₹14</div>
              <div style="font-size: 0.75rem; opacity: 0.9;">Save 65% • Limited welcome offer</div>
            </div>
          </div>
          <button class="btn-secondary" style="background: #ffffff; color: var(--primary-pink); font-size: 0.8rem; font-weight: 800; border: none; padding: 8px 14px; border-radius: var(--radius-full); box-shadow: 0 4px 12px rgba(0,0,0,0.2);">
            Claim 🎁
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

        <!-- Creators Grid -->
        <div class="creators-list">
          ${creators.map(c => `
            <div class="creator-card" data-id="${c.id}">
              <div class="creator-left">
                <div class="creator-avatar-wrap">
                  <img src="${c.avatar}" alt="${c.name}" />
                  <span class="status-dot ${c.online ? 'online' : 'offline'}"></span>
                </div>
                <div>
                  <div class="creator-name" style="display: flex; align-items: center; gap: 6px;">
                    ${c.name}
                    ${c.verified ? '<span style="color: #0284c7; font-size: 0.85rem;" title="Verified">✓</span>' : ''}
                  </div>
                  <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600; margin-top: 2px;">
                    ${c.language} • ⭐ ${c.rating} • ${c.callsCount}+ calls
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
        <!-- 3D VIBE SWIPE DECK MODE -->
        ${(() => {
          const profile = HIPA_CREATORS[this.currentSwipeIndex % HIPA_CREATORS.length];
          return `
            <div class="swipe-deck-wrap">
              <div class="swipe-card-3d">
                <img src="${profile.avatar}" class="swipe-card-img" alt="${profile.name}" />
                <div class="featured-hero-overlay">
                  <div style="display: flex; align-items: center; justify-content: space-between;">
                    <div style="font-size: 1.8rem; font-weight: 900; color: #fff;">
                      ${profile.name}, ${profile.age} <span class="hero-verified-pill">✓</span>
                    </div>
                    <span class="glass-pill" style="font-size: 0.75rem; background: rgba(255,0,127,0.3); color: #fff;">${profile.language}</span>
                  </div>
                  <p style="font-size: 0.88rem; color: #e2d9f3; line-height: 1.4;">${profile.bio || "Looking to connect live on audio & video call! ✨"}</p>
                  <div class="hero-tags-grid">
                    ${(profile.tags || ['music 🎵', 'travel ✈️', 'chat 💬']).map(t => `<span class="hero-tag-pill">${t}</span>`).join('')}
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

    // 1. Stories Click
    container.querySelectorAll('.story-item').forEach(el => {
      el.onclick = () => {
        const sid = Number(el.getAttribute('data-id'));
        const story = HIPA_STORIES.find(s => s.id === sid);
        if (story) this.showStoryModal(story);
      };
    });

    // 2. Discovery Mode Switch
    container.querySelectorAll('.discovery-tab-btn').forEach(btn => {
      btn.onclick = () => {
        this.discoveryMode = btn.getAttribute('data-mode');
        hipaAudio.playPop();
        this.renderHomeTab(container);
      };
    });

    // 3. Quick Hub Modals
    const btnWheel = container.querySelector('#btnOpenLuckyWheel');
    if (btnWheel) btnWheel.onclick = () => this.showLuckyWheelModal();

    const btnVIP = container.querySelector('#btnOpenVIPClub');
    if (btnVIP) btnVIP.onclick = () => this.showVIPMembershipModal();

    // 4. Hero Ashley Call Buttons
    const heroVoice = container.querySelector('.btn-hero-voice');
    if (heroVoice) {
      heroVoice.onclick = () => {
        const ashley = HIPA_CREATORS[0];
        this.startCall(ashley, 'voice');
      };
    }
    const heroVideo = container.querySelector('.btn-hero-video');
    if (heroVideo) {
      heroVideo.onclick = () => {
        const ashley = HIPA_CREATORS[0];
        this.startCall(ashley, 'video');
      };
    }
    const heroGift = container.querySelector('.btn-send-gift-hero');
    if (heroGift) {
      heroGift.onclick = () => {
        const ashley = HIPA_CREATORS[0];
        this.showGiftModal(ashley);
      };
    }

    // 5. Category filter clicks
    container.querySelectorAll('.cat-pill').forEach(btn => {
      btn.onclick = () => {
        this.activeCategory = btn.getAttribute('data-cat');
        hipaAudio.playPop();
        this.renderHomeTab(container);
      };
    });

    // 6. Welcome Offer banner
    const banner = container.querySelector('#bannerWelcomeOffer');
    if (banner) banner.onclick = () => this.showWelcomeOfferModal();

    // 7. Grid Call & Gift buttons
    container.querySelectorAll('.btn-quick-gift').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const cid = Number(btn.getAttribute('data-id'));
        const creator = HIPA_CREATORS.find(c => c.id === cid);
        if (creator) this.showGiftModal(creator);
      };
    });

    container.querySelectorAll('.btn-voice-call').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const cid = Number(btn.getAttribute('data-id'));
        const creator = HIPA_CREATORS.find(c => c.id === cid);
        this.startCall(creator, 'voice');
      };
    });

    container.querySelectorAll('.btn-video-call').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const cid = Number(btn.getAttribute('data-id'));
        const creator = HIPA_CREATORS.find(c => c.id === cid);
        if (!creator.videoOnline) {
          alert(`${creator.name} is currently offline for video calls. You can connect via voice call!`);
          return;
        }
        this.startCall(creator, 'video');
      };
    });

    // 8. Swipe Controls
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
        hipaAudio.playHeart();
        alert(`⭐ Superliked! You stand out to ${HIPA_CREATORS[this.currentSwipeIndex % HIPA_CREATORS.length].name}!`);
        this.currentSwipeIndex++;
        this.renderHomeTab(container);
      };
    }

    const btnLike = container.querySelector('#btnSwipeLike');
    if (btnLike) {
      btnLike.onclick = () => {
        const creator = HIPA_CREATORS[this.currentSwipeIndex % HIPA_CREATORS.length];
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
        const cid = Number(btnCallSwipe.getAttribute('data-id'));
        const creator = HIPA_CREATORS.find(c => c.id === cid);
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
          <div style="width: 72px; height: 72px; border-radius: 50%; border: 2.5px solid var(--primary-pink); padding: 2px; position: relative;">
            <img src="${user.avatar || HIPA_AVATARS[0]}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;" />
            <div style="position: absolute; bottom: 0; right: 0; width: 22px; height: 22px; background: var(--primary-pink); border: 2px solid #ffffff; border-radius: 50%; color: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 0.7rem;">
              ✏️
            </div>
          </div>
          <div>
            <h2 style="font-size: 1.35rem; font-weight: 800; color: #111827;">${user.username}</h2>
            <div style="font-size: 0.8rem; color: var(--text-muted);">${user.phone || '+91 95110 88531'}</div>
          </div>
        </div>

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
    container.querySelector('#btnMenuHelp').onclick = () => alert('❓ Help: Email us at support@hipa-app.com or message 24/7 in app.');

    container.querySelector('#chkDndToggle').onchange = (e) => {
      user.isDnd = e.target.checked;
      hipaApi.saveUser(user);
      alert(user.isDnd ? '🔕 Do Not Disturb mode activated.' : '🔔 Notifications enabled.');
    };

    container.querySelector('#btnMenuLogout').onclick = () => {
      if (confirm('Are you sure you want to log out from Hipa?')) {
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
      this.showPaymentCheckoutModal(selectedPack.price, selectedPack.coins, `${selectedPack.coins} Hipa Coins Pack`);
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
          <div style="font-size: 1.05rem; font-weight: 800; letter-spacing: 0.5px;">Hipa coins</div>
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
            <span style="font-weight: 800; font-size: 1.15rem;">Hipa</span>
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
      alert(`🎉 Payment of ₹${amount} Successful!\n${coins} Hipa coins have been credited to your wallet.`);
      modal.remove();
      document.getElementById('userCoinsCount').textContent = hipaApi.getCoins();
    };
  }

  // ==========================================
  // LIVE WEBRTC CALLING SCREEN (Ultra-Realistic HUD & Safety)
  // ==========================================
  startCall(creator, type = 'voice') {
    // 18+ Mandatory Verification & Admin Approval Gate
    const vStatus = hipaApi.getVerificationStatus();
    if (vStatus !== 'approved') {
      this.showVerificationGateModal(vStatus);
      return;
    }

    const costPerMin = type === 'video' ? creator.videoRate : creator.voiceRate;
    const userCoins = hipaApi.getCoins();

    if (userCoins < costPerMin) {
      alert(`⚠️ Low Coin Balance!\nYou have ${userCoins} coins, but this call requires ${costPerMin} coins/min.\nRecharge your wallet to start calling.`);
      this.showWelcomeOfferModal();
      return;
    }

    hipaAudio.playRing();

    const overlay = document.createElement('div');
    overlay.className = 'call-fullscreen-hud';

    let secondsElapsed = 0;
    let isFilterActive = false;
    let isMuted = false;

    overlay.innerHTML = `
      <!-- Background Video Stream Simulation -->
      <img id="callRemoteVideo" src="${creator.avatar}" class="call-remote-bg" style="filter: brightness(0.85);" />

      <!-- Watermark & Top Safety Bar -->
      <div class="call-top-hud">
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="width: 10px; height: 10px; border-radius: 50%; background: #10b981; box-shadow: 0 0 10px #10b981;"></div>
          <span style="font-size: 0.82rem; font-weight: 800; color: #fff; letter-spacing: 0.5px;">LIVE ${type.toUpperCase()}</span>
          <span style="font-size: 0.72rem; color: #ffd700; background: rgba(0,0,0,0.5); padding: 2px 8px; border-radius: 6px;">🪙 ${costPerMin}/min</span>
        </div>

        <button id="btnInCallReport" style="background: rgba(239, 68, 68, 0.35); border: 1px solid rgba(239, 68, 68, 0.7); color: #fff; padding: 6px 14px; border-radius: 9999px; font-weight: 800; font-size: 0.75rem; display: flex; align-items: center; gap: 5px; cursor: pointer; backdrop-filter: blur(8px);">
          🚨 Report & Block
        </button>
      </div>

      <!-- Watermark -->
      <div class="watermark-overlay" style="top: 80px; left: 20px;">
        🛡️ Hipa 18+ Encrypted Call • Verified Creator #${creator.id}
      </div>

      <!-- Local PIP Camera (Picture-in-Picture) -->
      ${type === 'video' ? `
        <div class="call-local-pip" id="pipCamera">
          <img src="${this.selectedAvatar || '/images/avatar_male_aryan.jpg'}" alt="You" />
          <div style="position: absolute; bottom: 4px; left: 6px; font-size: 0.62rem; color: #fff; font-weight: 800; background: rgba(0,0,0,0.6); padding: 1px 4px; border-radius: 4px;">You</div>
        </div>
      ` : ''}

      <!-- Center Creator Call Info -->
      <div style="position: relative; z-index: 10; text-align: center; color: #ffffff; margin-top: auto; margin-bottom: 20px;">
        <h2 style="font-size: 2rem; font-weight: 900; margin-bottom: 4px; text-shadow: 0 4px 15px rgba(0,0,0,0.8);">${creator.name}</h2>
        <div style="font-size: 0.88rem; color: #ffd1e3; font-weight: 700;">${creator.language} • ${creator.bio || 'Connected live'}</div>
        <div id="liveCallTimer" style="font-size: 1.6rem; font-weight: 900; color: #ffffff; margin-top: 8px; font-family: monospace; text-shadow: 0 2px 10px rgba(0,0,0,0.9);">00:00</div>
      </div>

      <!-- Bottom In-Call Controls Dock -->
      <div class="call-bottom-hud">
        <!-- Live Coin Balance Tracker -->
        <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.6); backdrop-filter: blur(12px); border: 1px solid rgba(255,215,0,0.3); border-radius: var(--radius-full); padding: 8px 16px;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="font-size: 1.1rem;">🪙</span>
            <span style="font-size: 0.82rem; font-weight: 800; color: #ffd700;">Balance: <strong id="callLiveCoins">${hipaApi.getCoins()}</strong> coins</span>
          </div>
          <button id="btnInCallQuickGift" style="background: var(--primary-gradient); border: none; color: #fff; padding: 4px 12px; border-radius: 9999px; font-weight: 800; font-size: 0.75rem; cursor: pointer;">
            🎁 Send Gift
          </button>
        </div>

        <!-- Controls Row -->
        <div style="display: flex; gap: 18px; align-items: center; justify-content: center;">
          <button class="call-icon-round" id="btnToggleMute" style="width: 52px; height: 52px; background: rgba(255,255,255,0.18); backdrop-filter: blur(10px); color: #ffffff; border: 1px solid rgba(255,255,255,0.3); font-size: 1.3rem;">
            🎤
          </button>
          
          <button class="call-icon-round" id="btnToggleFilter" style="width: 52px; height: 52px; background: rgba(255,255,255,0.18); backdrop-filter: blur(10px); color: #ffd700; border: 1px solid rgba(255,215,0,0.4); font-size: 1.3rem;" title="Toggle Beauty Filter">
            ✨
          </button>

          <button class="call-icon-round" id="btnEndCall" style="width: 68px; height: 68px; background: #ef4444; color: #ffffff; border: none; font-size: 1.9rem; box-shadow: 0 0 30px rgba(239, 68, 68, 0.7); cursor: pointer;">
            📞
          </button>

          <button class="call-icon-round" id="btnToggleCam" style="width: 52px; height: 52px; background: rgba(255,255,255,0.18); backdrop-filter: blur(10px); color: #ffffff; border: 1px solid rgba(255,255,255,0.3); font-size: 1.3rem;" title="Switch Camera">
            🔄
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const endCall = () => {
      if (this.callTimer) clearInterval(this.callTimer);
      const coinsCharged = Math.max(costPerMin, Math.ceil(secondsElapsed / 60) * costPerMin);
      hipaApi.deductCoins(costPerMin, `Call with ${creator.name}`);
      hipaApi.recordCall(creator, type, secondsElapsed, coinsCharged);
      hipaApi.addFriend(creator);
      const coinEl = document.getElementById('userCoinsCount');
      if (coinEl) coinEl.textContent = hipaApi.getCoins();
      overlay.remove();
    };

    // Live timer & coin deduction every 60s
    this.callTimer = setInterval(() => {
      secondsElapsed++;
      const mins = Math.floor(secondsElapsed / 60);
      const secs = secondsElapsed % 60;
      const timerEl = overlay.querySelector('#liveCallTimer');
      if (timerEl) timerEl.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

      if (secondsElapsed > 0 && secondsElapsed % 60 === 0) {
        const deducted = hipaApi.deductCoins(costPerMin, `Call with ${creator.name}`);
        if (!deducted) {
          alert('Coins exhausted! Call ended.');
          endCall();
        } else {
          hipaAudio.playCoin();
          const liveCoinEl = overlay.querySelector('#callLiveCoins');
          if (liveCoinEl) liveCoinEl.textContent = hipaApi.getCoins();
          const coinEl = document.getElementById('userCoinsCount');
          if (coinEl) coinEl.textContent = hipaApi.getCoins();
        }
      }
    }, 1000);

    overlay.querySelector('#btnEndCall').onclick = endCall;

    overlay.querySelector('#btnToggleMute').onclick = () => {
      isMuted = !isMuted;
      overlay.querySelector('#btnToggleMute').style.background = isMuted ? '#ef4444' : 'rgba(255,255,255,0.18)';
      overlay.querySelector('#btnToggleMute').textContent = isMuted ? '🔇' : '🎤';
    };

    overlay.querySelector('#btnToggleFilter').onclick = () => {
      isFilterActive = !isFilterActive;
      const remoteImg = overlay.querySelector('#callRemoteVideo');
      if (remoteImg) {
        remoteImg.style.filter = isFilterActive ? 'brightness(1.08) contrast(1.1) saturate(1.2)' : 'brightness(0.85)';
      }
      overlay.querySelector('#btnToggleFilter').style.boxShadow = isFilterActive ? '0 0 20px #ffd700' : 'none';
    };

    overlay.querySelector('#btnToggleCam').onclick = () => {
      alert('Camera view switched.');
    };

    overlay.querySelector('#btnInCallQuickGift').onclick = () => {
      this.showGiftModal(creator);
    };

    // Report & Block button
    overlay.querySelector('#btnInCallReport').onclick = async () => {
      const reason = prompt("Safety Report & Emergency Block:\nPlease enter reason (e.g. Inappropriate behavior, fake user, harassment):", "Inappropriate behavior");
      if (reason) {
        await hipaApi.reportAndBlockUser(creator.id, creator.name, reason);
        alert(`🚨 ${creator.name} has been reported and blocked immediately. Our Safety Team has been notified.`);
        endCall();
      }
    };
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
            alert(`🎉 Congratulations! You won ${res.prizeWon} Free Hipa Coins!\nNew Balance: ${res.newBalance} coins`);
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
            <h3 style="font-size: 1.35rem; font-weight: 900; color: #ffd700; margin: 0;">Hipa VIP Club</h3>
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
      alert('👑 Welcome to Hipa VIP Gold Club! 200 bonus coins added.');
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
        <div class="verification-modal-wrap" style="text-align: center;">
          <div style="width: 70px; height: 70px; margin: 0 auto 16px auto; border-radius: 50%; background: linear-gradient(135deg, #ffd700, #f59e0b); display: flex; align-items: center; justify-content: center; font-size: 2.2rem; box-shadow: 0 8px 30px rgba(245, 158, 11, 0.4);">
            ⏳
          </div>
          <div class="badge-18-plus" style="margin-bottom: 8px;">18+ SAFETY PROTECTED</div>
          <h2 style="font-size: 1.4rem; font-weight: 900; color: #111827; margin-bottom: 8px;">
            Verification Under Admin Review
          </h2>
          <p style="font-size: 0.88rem; color: #4b5563; line-height: 1.5; margin-bottom: 20px;">
            Your live selfie and voice verification have been securely submitted to our <strong>Safety & Moderation Team</strong>.
            <br><br>
            Audio and video calling are strictly protected and will unlock automatically as soon as the Admin approves your profile.
          </p>

          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 18px; padding: 16px; margin-bottom: 24px; text-align: left; font-size: 0.84rem;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px;">
              <span style="color: #10b981; font-weight: 800;">✓</span>
              <span>18+ Age & DOB Declaration Submitted</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px;">
              <span style="color: #10b981; font-weight: 800;">✓</span>
              <span>Live Selfie Pose Photo Captured</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px;">
              <span style="color: #10b981; font-weight: 800;">✓</span>
              <span>Audio Greeting Sample Recorded</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="color: #f59e0b; font-weight: 800;">⏳</span>
              <span style="color: #b45309; font-weight: 700;">Admin Review: Pending (Approx 5–10 mins)</span>
            </div>
          </div>

          <div style="display: flex; flex-direction: column; gap: 10px;">
            <button class="btn-pink-block" id="btnCheckApprovalNow" style="padding: 14px; font-weight: 800;">
              🔄 Check Approval Status
            </button>
            <button id="btnClosePendingGate" style="background: none; border: none; color: #6b7280; font-weight: 700; padding: 8px; cursor: pointer;">
              Close
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(overlay);

      overlay.querySelector('#btnClosePendingGate').onclick = () => overlay.remove();
      overlay.querySelector('#btnCheckApprovalNow').onclick = async () => {
        const btn = overlay.querySelector('#btnCheckApprovalNow');
        btn.textContent = 'Checking with Admin server...';
        try {
          const res = await fetch('/api/v1/users');
          if (res.ok) {
            const data = await res.json();
            const currUser = (data.users || []).find(u => u.phone === this.user?.phone || u.id === this.user?.id);
            if (currUser && currUser.verified) {
              this.user.verified = true;
              this.user.verificationStatus = 'approved';
              hipaApi.saveUser(this.user);
              alert('🎉 Congratulations! Your 18+ Verification has been APPROVED by the Admin. Audio & Video Calling are now unlocked!');
              overlay.remove();
              return;
            }
          }
        } catch (e) {}
        alert('⏳ Your profile is still in the verification queue. Admin will review and approve it shortly.');
        btn.textContent = '🔄 Check Approval Status';
      };
      return;
    }

    // Unverified: Full 3-Step Verification Submission Modal
    let recordedAudioBlob = null;
    let isRecording = false;
    let mediaRecorder = null;
    let audioChunks = [];
    let audioTimer = null;
    let audioSeconds = 0;

    overlay.innerHTML = `
      <div class="verification-modal-wrap">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <div class="badge-18-plus">18+ ONLY</div>
            <h3 style="font-size: 1.25rem; font-weight: 900; color: #111827; margin: 0;">Safety Verification</h3>
          </div>
          <button id="btnCloseVerifGate" style="background: none; border: none; font-size: 1.2rem; cursor: pointer; color: #6b7280;">✕</button>
        </div>

        <p style="font-size: 0.85rem; color: #4b5563; line-height: 1.4; margin-bottom: 20px;">
          To prevent catfishing, fraud, and underage abuse, all users (female & male) must complete <strong>18+ Age, Live Selfie & Voice Verification</strong> before accessing calling features.
        </p>

        <form id="formSubmit18Verification" style="display: flex; flex-direction: column; gap: 16px;">
          <!-- Step 1: Age & DOB -->
          <div style="background: #fdf2f8; border: 1px solid rgba(255, 0, 127, 0.2); border-radius: 16px; padding: 14px;">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
              <div class="step-circle">1</div>
              <label style="font-weight: 800; font-size: 0.9rem; color: #111827;">18+ Age & Date of Birth</label>
            </div>
            <input type="date" id="inputVerifDob" required max="2008-11-25" class="glass-input" style="padding: 10px 14px; font-size: 0.9rem;" value="2003-05-15" />
            <div style="font-size: 0.72rem; color: var(--primary-pink); font-weight: 700; margin-top: 6px;">
              🔒 Strictly 18+ required under platform safety guidelines.
            </div>
          </div>

          <!-- Step 2: Live Selfie / Face Verification -->
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 14px;">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
              <div class="step-circle">2</div>
              <label style="font-weight: 800; font-size: 0.9rem; color: #111827;">Live Face / Selfie Verification</label>
            </div>
            <div style="font-size: 0.78rem; color: #6b7280; margin-bottom: 10px;">
              Please upload or capture a clear photo showing: <strong>Peace Sign ✌️</strong>
            </div>
            
            <div style="display: flex; gap: 12px; align-items: center;">
              <div id="selfiePreviewBox" style="width: 80px; height: 80px; border-radius: 14px; background: #e2e8f0; display: flex; align-items: center; justify-content: center; overflow: hidden; border: 2px dashed #94a3b8; flex-shrink: 0;">
                <span id="selfiePlaceholder" style="font-size: 1.8rem;">🤳</span>
                <img id="selfiePreviewImg" src="" style="width: 100%; height: 100%; object-fit: cover; display: none;" />
              </div>
              <div style="flex: 1;">
                <label for="inputSelfieFile" class="btn-pink-block" style="padding: 10px; font-size: 0.85rem; text-align: center; cursor: pointer; display: block;">
                  📸 Capture / Upload
                </label>
                <input type="file" id="inputSelfieFile" accept="image/*" capture="user" style="display: none;" />
              </div>
            </div>
          </div>

          <!-- Step 3: Short Audio Verification -->
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 14px;">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
              <div class="step-circle">3</div>
              <label style="font-weight: 800; font-size: 0.9rem; color: #111827;">Short Audio Voice Verification</label>
            </div>
            <div style="font-size: 0.78rem; color: #6b7280; margin-bottom: 10px;">
              Record a 5-second voice greeting: <em>"Hi, this is my real voice on Hipa platform."</em>
            </div>

            <button type="button" class="voice-record-btn" id="btnToggleVoiceRecord">
              <span id="voiceRecordIcon">🎙️</span>
              <span id="voiceRecordText">Tap to Record Voice Greeting</span>
            </button>

            <div id="audioPreviewContainer" style="display: none; margin-top: 12px;">
              <div style="font-size: 0.75rem; font-weight: 700; color: #10b981; margin-bottom: 4px;">✓ Voice Recording Captured:</div>
              <audio id="audioPreviewPlayback" controls style="width: 100%; height: 36px; border-radius: 8px;"></audio>
            </div>
          </div>

          <!-- Terms & Submit -->
          <div style="font-size: 0.75rem; color: #6b7280; display: flex; align-items: flex-start; gap: 8px;">
            <input type="checkbox" id="checkConsent18" required checked style="margin-top: 2px;" />
            <label for="checkConsent18">I declare that I am 18+ years of age. I agree that my selfie and voice sample will be reviewed by Hipa administrators for safety compliance.</label>
          </div>

          <button type="submit" class="btn-pink-block" id="btnSubmitDossier" style="padding: 15px; font-size: 1rem; font-weight: 900; margin-top: 4px;">
            Submit for Admin Approval ➔
          </button>
        </form>
      </div>
    `;

    document.body.appendChild(overlay);

    overlay.querySelector('#btnCloseVerifGate').onclick = () => overlay.remove();

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

    recordBtn.onclick = async () => {
      if (!isRecording) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true }).catch(() => null);
          isRecording = true;
          recordBtn.classList.add('recording');
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
              recordedAudioBlob = new Blob(audioChunks, { type: 'audio/webm' });
              voiceAudioUrl = URL.createObjectURL(recordedAudioBlob);
              audioPlayback.src = voiceAudioUrl;
              audioContainer.style.display = 'block';
              stream.getTracks().forEach(t => t.stop());
            };
            mediaRecorder.start();
          }
        } catch (err) {
          isRecording = true;
          recordBtn.classList.add('recording');
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
      recordBtn.classList.remove('recording');
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
        alert('⚠️ You must be at least 18 years old to access calling features on Hipa.');
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

  // ==========================================
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
    const myCode = "HIPA-" + user.username;
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
