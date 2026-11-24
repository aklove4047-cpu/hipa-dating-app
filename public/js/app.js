/* =========================================================
   Hipa Dating App — Main Application Controller
   Exact Replica of Hipa Mobile UI & Feature Set
   Includes: Mobile OTP Login, 9-Language Selector, Gender/Avatar Wizard,
             Creators Directory, Live Calling (Voice/Video with Coin Meter),
             Wallet Recharge (40 to 33,000 Coins), ₹14 Welcome Offer Popup,
             Recent Calls Log, Friends Deck, User Profile & Settings.
   ========================================================= */

import { hipaApi, HIPA_CREATORS, HIPA_COIN_PACKS, HIPA_LANGUAGES, HIPA_AVATARS } from './api.js';

class HipaApp {
  constructor() {
    this.currentTab = 'home';
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
    (document.getElementById('hipaTopBar') || document.getElementById('himaTopBar')).style.display = 'none';
    (document.getElementById('hipaBottomNav') || document.getElementById('himaBottomNav')).style.display = 'none';
    document.getElementById('btnFloatingRandom').style.display = 'none';

    root.innerHTML = `
      <div class="onboarding-container" style="justify-content: space-between;">
        <div class="onboarding-header-decor">
          <div class="onboarding-logo">💬</div>
          <h1 style="font-size: 1.8rem; font-weight: 900; color: #111827;">Hipa</h1>
          <p style="font-size: 0.85rem; color: var(--text-muted); font-weight: 600;">Where Feelings Connect</p>

          <div class="features-row">
            <div class="feat-item">
              <div class="feat-icon-sq" style="background: #ff007f;">💬</div>
              <span>Chat</span>
            </div>
            <div class="feat-item">
              <div class="feat-icon-sq" style="background: #3b82f6;">📹</div>
              <span>Video</span>
            </div>
            <div class="feat-item">
              <div class="feat-icon-sq" style="background: #10b981;">📞</div>
              <span>Voice</span>
            </div>
            <div class="feat-item">
              <div class="feat-icon-sq" style="background: #8b5cf6;">💜</div>
              <span>Connect</span>
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
    (document.getElementById('hipaTopBar') || document.getElementById('himaTopBar')).style.display = 'flex';
    (document.getElementById('hipaBottomNav') || document.getElementById('himaBottomNav')).style.display = 'flex';
    document.getElementById('btnFloatingRandom').style.display = 'flex';
    document.getElementById('userCoinsCount').textContent = hipaApi.getCoins();

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
  // TAB 1: HOME (Creators List & Category Filters)
  // ==========================================
  renderHomeTab(container) {
    const categories = ['Chats', 'All', 'New', 'Marathi', 'Bengali', 'Odia', 'Hindi', 'Tamil', 'Telugu', 'Punjabi'];

    let creators = HIPA_CREATORS;
    if (this.activeCategory !== 'All' && this.activeCategory !== 'Chats' && this.activeCategory !== 'New') {
      creators = HIPA_CREATORS.filter(c => c.language.toLowerCase() === this.activeCategory.toLowerCase());
    }

    container.innerHTML = `
      <!-- Horizontal Category Pills -->
      <div class="hima-categories" style="margin: -16px -16px 14px -16px;">
        ${categories.map(cat => `
          <button class="cat-pill ${this.activeCategory === cat ? 'active' : ''}" data-cat="${cat}">
            ${cat === 'Chats' ? '💬 ' : (cat === 'All' ? '👥 ' : (cat === 'New' ? '✨ ' : ''))}${cat}
          </button>
        `).join('')}
      </div>

      <!-- Welcome Offer Banner Card -->
      <div class="glass-card" id="bannerWelcomeOffer" style="background: var(--primary-gradient); color: #ffffff; padding: 14px 18px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: space-between; cursor: pointer; margin-bottom: 14px; box-shadow: var(--shadow-pink);">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="font-size: 2rem;">🪙</div>
          <div>
            <div style="font-weight: 900; font-size: 1.05rem;">Get 60 Coins for only ₹14</div>
            <div style="font-size: 0.75rem; opacity: 0.9;">Save 65% • Limited welcome offer</div>
          </div>
        </div>
        <button class="btn-secondary" style="background: #ffffff; color: var(--primary-pink); font-size: 0.8rem; font-weight: 800; border: none; padding: 8px 14px; border-radius: var(--radius-full);">
          Claim 🎁
        </button>
      </div>

      <!-- Creators List -->
      <div class="creators-list">
        ${creators.map(c => `
          <div class="creator-card" data-id="${c.id}">
            <div class="creator-left">
              <div class="creator-avatar-wrap">
                <img src="${c.avatar}" alt="${c.name}" />
                <span class="status-dot ${c.online ? 'online' : 'offline'}"></span>
              </div>
              <div>
                <div class="creator-name">${c.name}</div>
                <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600;">
                  ${c.language} • ⭐ ${c.rating}
                </div>
              </div>
            </div>

            <div class="creator-actions">
              <!-- Voice Call Button -->
              <button class="creator-call-action btn-voice-call" data-id="${c.id}" title="Start Voice Call">
                <div class="call-icon-round voice">📞</div>
                <span class="call-rate-tag">🪙 ${c.voiceRate}/min</span>
              </button>

              <!-- Video Call Button -->
              <button class="creator-call-action btn-video-call" data-id="${c.id}" title="Start Video Call">
                <div class="call-icon-round video ${!c.videoOnline ? 'disabled' : ''}">📹</div>
                <span class="call-rate-tag ${!c.videoOnline ? 'offline-text' : ''}">
                  ${c.videoOnline ? '🪙 ' + c.videoRate + '/min' : 'Offline'}
                </span>
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    // Category click
    container.querySelectorAll('.cat-pill').forEach(btn => {
      btn.onclick = () => {
        this.activeCategory = btn.getAttribute('data-cat');
        this.renderHomeTab(container);
      };
    });

    // Banner click
    const banner = container.querySelector('#bannerWelcomeOffer');
    if (banner) {
      banner.onclick = () => this.showWelcomeOfferModal();
    }

    // Call buttons
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
  // LIVE WEBRTC CALLING SCREEN
  // ==========================================
  startCall(creator, type = 'voice') {
    const costPerMin = type === 'video' ? creator.videoRate : creator.voiceRate;
    const userCoins = hipaApi.getCoins();

    if (userCoins < costPerMin) {
      alert(`⚠️ Low Coin Balance!\nYou have ${userCoins} coins, but this call requires ${costPerMin} coins/min.\nRecharge your wallet to start calling.`);
      this.showWelcomeOfferModal();
      return;
    }

    const overlay = document.createElement('div');
    overlay.className = 'offer-modal-overlay';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';

    let secondsElapsed = 0;

    overlay.innerHTML = `
      <div style="width: 100%; height: 100%; background: #0f0a1c; display: flex; flex-direction: column; align-items: center; justify-content: space-between; padding: 40px 20px; position: relative;">
        <!-- Top Call Header -->
        <div style="text-align: center; color: #ffffff;">
          <div class="glass-pill" style="background: rgba(255,255,255,0.15); color: #2ee6a6; margin-bottom: 12px; font-weight: 700;">
            ● LIVE ${type.toUpperCase()} CALL
          </div>
          <h2 style="font-size: 1.8rem; font-weight: 800; margin-bottom: 4px;">${creator.name}</h2>
          <div style="font-size: 0.88rem; color: var(--text-muted); font-weight: 600;">${creator.language} • Rate: 🪙 ${costPerMin}/min</div>
          <div id="liveCallTimer" style="font-size: 1.4rem; font-weight: 900; color: #ffffff; margin-top: 10px;">00:00</div>
        </div>

        <!-- Central Avatar / Simulated Video -->
        <div style="width: 180px; height: 180px; border-radius: 50%; padding: 4px; border: 3px solid var(--primary-pink); box-shadow: 0 0 40px rgba(255, 0, 127, 0.4); overflow: hidden;">
          <img src="${creator.avatar}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;" />
        </div>

        <!-- Coin Balance live meter -->
        <div class="glass-pill" style="background: rgba(255, 215, 0, 0.2); color: #ffd700; border: 1px solid rgba(255, 215, 0, 0.4); font-size: 0.85rem; font-weight: 800;">
          Wallet Balance: <span id="callLiveCoins">${hipaApi.getCoins()}</span> coins
        </div>

        <!-- In-Call Control Buttons -->
        <div style="display: flex; gap: 24px; align-items: center;">
          <button class="call-icon-round" id="btnToggleMute" style="width: 54px; height: 54px; background: rgba(255,255,255,0.15); color: #ffffff; border: none;">
            🎤
          </button>
          <button class="call-icon-round" id="btnEndCall" style="width: 68px; height: 68px; background: #ef4444; color: #ffffff; border: none; font-size: 1.8rem; box-shadow: 0 6px 20px rgba(239,68,68,0.4);">
            📞
          </button>
          <button class="call-icon-round" id="btnToggleCam" style="width: 54px; height: 54px; background: rgba(255,255,255,0.15); color: #ffffff; border: none;">
            📷
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Live timer & coin deduction every 60s
    this.callTimer = setInterval(() => {
      secondsElapsed++;
      const mins = Math.floor(secondsElapsed / 60);
      const secs = secondsElapsed % 60;
      const timerEl = overlay.querySelector('#liveCallTimer');
      if (timerEl) timerEl.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

      // Deduct coins every full minute
      if (secondsElapsed > 0 && secondsElapsed % 60 === 0) {
        const deducted = hipaApi.deductCoins(costPerMin, `Call with ${creator.name}`);
        if (!deducted) {
          alert('Coins exhausted! Call ended.');
          endCall();
        } else {
          const liveCoinEl = overlay.querySelector('#callLiveCoins');
          if (liveCoinEl) liveCoinEl.textContent = hipaApi.getCoins();
          document.getElementById('userCoinsCount').textContent = hipaApi.getCoins();
        }
      }
    }, 1000);

    const endCall = () => {
      if (this.callTimer) clearInterval(this.callTimer);
      const coinsCharged = Math.max(costPerMin, Math.ceil(secondsElapsed / 60) * costPerMin);
      hipaApi.deductCoins(costPerMin, `Call with ${creator.name}`);
      hipaApi.recordCall(creator, type, secondsElapsed, coinsCharged);
      hipaApi.addFriend(creator);
      document.getElementById('userCoinsCount').textContent = hipaApi.getCoins();
      overlay.remove();
    };

    overlay.querySelector('#btnEndCall').onclick = endCall;
    overlay.querySelector('#btnToggleMute').onclick = () => alert('Microphone toggled');
    overlay.querySelector('#btnToggleCam').onclick = () => alert('Camera switched');
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
