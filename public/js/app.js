/* =========================================================
   Hipa Dating App — Main Application Logic
   Includes: Auth Gate (Register, 18+ Verification, OTP, Multi-step Profile Wizard,
             Real Photo Upload, Login, Logout, Discover, Chat, WebRTC Calling)
   ========================================================= */

import { api } from './api.js';
import { i18n } from './i18n.js';
import { callManager } from './call-manager.js';

class HipaApp {
  constructor() {
    this.currentTab = 'discover';
    this.profiles = [];
    this.currentCardIndex = 0;
    this.activeChatMatchId = null;
    this.user = api.getUser();
    this.dragState = {
      isDragging: false,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0
    };
  }

  async init() {
    await i18n.init();
    this.setupTopBar();
    this.setupNavigation();

    // Check Login State
    if (!api.isLoggedIn()) {
      this.hideAppChrome();
      this.renderAuthLanding();
    } else {
      this.showAppChrome();
      this.user = api.getUser();
      this.profiles = api.getProfiles();
      this.renderCurrentTab();
    }

    // Listen for incoming simulated messages
    window.addEventListener('hipa_new_message', (e) => {
      this.handleIncomingMessage(e.detail);
    });

    // Register Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.log('SW registration note:', err);
      });
    }
  }

  showAppChrome() {
    const nav = document.querySelector('.bottom-nav');
    if (nav) nav.style.display = 'flex';
    const pill = document.getElementById('userSwipesCount');
    if (pill) pill.style.display = 'inline-flex';
  }

  hideAppChrome() {
    const nav = document.querySelector('.bottom-nav');
    if (nav) nav.style.display = 'none';
    const pill = document.getElementById('userSwipesCount');
    if (pill) pill.style.display = 'none';
  }

  setupTopBar() {
    const langBtn = document.getElementById('btnLangToggle');
    if (langBtn) {
      langBtn.textContent = i18n.currentLang === 'en' ? 'हिन्दी' : 'English';
      langBtn.onclick = () => {
        i18n.toggle();
        langBtn.textContent = i18n.currentLang === 'en' ? 'हिन्दी' : 'English';
      };
    }

    const coinsPill = document.getElementById('userSwipesCount');
    if (coinsPill && this.user) {
      coinsPill.textContent = this.user.isPremium ? '∞ Swipes' : `${this.user.swipesLeft} Swipes`;
    }
  }

  setupNavigation() {
    const navItems = document.querySelectorAll('.bottom-nav .nav-item');
    navItems.forEach((item) => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const tab = item.getAttribute('data-tab');
        if (tab) {
          this.switchTab(tab);
        }
      });
    });
  }

  switchTab(tab) {
    this.currentTab = tab;
    document.querySelectorAll('.bottom-nav .nav-item').forEach((el) => {
      el.classList.toggle('active', el.getAttribute('data-tab') === tab);
    });
    this.renderCurrentTab();
  }

  renderCurrentTab() {
    const viewport = document.getElementById('mainViewport');
    if (!viewport) return;

    if (!api.isLoggedIn()) {
      this.renderAuthLanding();
      return;
    }

    if (this.currentTab === 'discover') {
      this.renderDiscover(viewport);
    } else if (this.currentTab === 'likes') {
      this.renderLikes(viewport);
    } else if (this.currentTab === 'chats') {
      this.renderChats(viewport);
    } else if (this.currentTab === 'profile') {
      this.renderProfile(viewport);
    }
  }

  // ==========================================
  // AUTH LANDING & WELCOME SCREEN
  // ==========================================
  renderAuthLanding() {
    const viewport = document.getElementById('mainViewport');
    if (!viewport) return;

    viewport.innerHTML = `
      <div class="auth-landing">
        <div class="auth-brand-hero">
          <div class="auth-hero-logo">♥</div>
          <h1 class="auth-hero-title">Hipa</h1>
          <p class="auth-hero-tagline">
            Connect, Match & Vibe Nearby.<br/>
            Real people, instant matching, and audio/video calls.
          </p>
        </div>

        <div class="glass-card" style="padding: 18px 20px; margin: 20px 0; border-color: rgba(255, 77, 126, 0.35);">
          <div style="font-size: 0.84rem; color: #ffd166; font-weight: 700; margin-bottom: 4px;">🔞 18+ Safe Dating Community</div>
          <div style="font-size: 0.76rem; color: var(--text-muted); line-height: 1.4;">
            Verified adult profiles only. Photo verification, report moderation, and zero fake accounts.
          </div>
        </div>

        <div class="auth-actions-group">
          <button class="btn-primary" id="btnOpenSignup" style="padding: 15px; font-size: 1.05rem;">
            Create New Account 🚀
          </button>
          <button class="btn-secondary" id="btnOpenLogin" style="padding: 14px; font-size: 1rem;">
            Log In
          </button>
          <button class="btn-gold" id="btnQuickDemoLogin" style="padding: 12px; font-size: 0.88rem; margin-top: 6px;">
            ⚡ Quick Demo Login (Aman, 25)
          </button>
          
          <div style="margin-top: 14px;">
            <a href="/downloads/hipa-dating.apk" download="hipa-dating.apk" class="apk-download-btn" style="padding: 8px 16px;">
              📲 Download Android APK (3.75 MB)
            </a>
          </div>
        </div>
      </div>
    `;

    viewport.querySelector('#btnOpenSignup').onclick = () => this.showSignupModal();
    viewport.querySelector('#btnOpenLogin').onclick = () => this.showLoginModal();
    viewport.querySelector('#btnQuickDemoLogin').onclick = async () => {
      const res = await api.login('demo@hipa.com', 'password123');
      if (res.ok) {
        this.user = res.user;
        this.init();
      }
    };
  }

  // ==========================================
  // SIGNUP STEP 1: Email, Password, 18+ DOB
  // ==========================================
  showSignupModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="bottom-sheet" style="max-height: 90vh;">
        <div class="sheet-handle"></div>
        <h2 style="font-size: 1.55rem; font-weight: 800; margin-bottom: 6px;">Create Your Account</h2>
        <p style="color: var(--text-muted); font-size: 0.88rem; margin-bottom: 20px;">
          Step 1 of 3: Account Credentials & Age Verification
        </p>

        <form id="formSignup" style="display: flex; flex-direction: column; gap: 14px;">
          <div>
            <label style="font-size: 0.82rem; font-weight: 700; color: var(--text-muted);">Email Address</label>
            <input type="email" id="signupEmail" required class="glass-input" placeholder="you@example.com" style="margin-top: 4px;" />
          </div>

          <div>
            <label style="font-size: 0.82rem; font-weight: 700; color: var(--text-muted);">Password (min 8 characters)</label>
            <input type="password" id="signupPass" required minlength="8" class="glass-input" placeholder="••••••••" style="margin-top: 4px;" />
          </div>

          <div>
            <label style="font-size: 0.82rem; font-weight: 700; color: var(--text-muted);">
              Date of Birth <span style="color: #ef4444;">* Mandatory 18+</span>
            </label>
            <input type="date" id="signupDob" required class="glass-input" style="margin-top: 4px; color-scheme: dark;" />
            <div id="dobError" style="font-size: 0.78rem; color: #ef4444; margin-top: 4px; display: none;"></div>
          </div>

          <div style="display: flex; gap: 8px; align-items: flex-start; margin-top: 4px;">
            <input type="checkbox" id="signupConsent" required style="margin-top: 3px;" />
            <label for="signupConsent" style="font-size: 0.78rem; color: var(--text-muted); line-height: 1.35;">
              I certify that I am at least 18 years of age and agree to Hipa's Terms of Service, Privacy Policy, and Community Guidelines.
            </label>
          </div>

          <div id="signupError" style="color: #ef4444; font-size: 0.82rem; display: none;"></div>

          <button type="submit" class="btn-primary" style="padding: 14px; margin-top: 10px;">
            Continue & Send OTP ➔
          </button>
          <button type="button" class="btn-secondary" id="btnCancelSignup">Cancel</button>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('#btnCancelSignup').onclick = () => modal.remove();

    const form = modal.querySelector('#formSignup');
    form.onsubmit = async (e) => {
      e.preventDefault();
      const email = modal.querySelector('#signupEmail').value.trim();
      const pass = modal.querySelector('#signupPass').value;
      const dob = modal.querySelector('#signupDob').value;
      const errorEl = modal.querySelector('#signupError');

      const res = await api.signup(email, pass, dob);
      if (!res.ok) {
        errorEl.textContent = res.error;
        errorEl.style.display = 'block';
        return;
      }

      modal.remove();
      this.showOtpModal(email);
    };
  }

  // ==========================================
  // SIGNUP STEP 2: OTP Verification
  // ==========================================
  showOtpModal(email) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="bottom-sheet">
        <div class="sheet-handle"></div>
        <h2 style="font-size: 1.55rem; font-weight: 800; margin-bottom: 6px;">Verify Email</h2>
        <p style="color: var(--text-muted); font-size: 0.88rem; margin-bottom: 20px;">
          Enter the 6-digit verification code sent to <strong>${email}</strong>
        </p>

        <div class="glass-card" style="padding: 12px; margin-bottom: 16px; text-align: center; border-color: rgba(46, 230, 166, 0.4);">
          <span style="font-size: 0.8rem; color: #2ee6a6;">⚡ Simulated Demo OTP Code: <strong>123456</strong></span>
        </div>

        <div style="margin-bottom: 20px;">
          <input type="text" id="otpInput" maxlength="6" class="glass-input" value="123456" 
                 style="text-align: center; font-size: 1.8rem; letter-spacing: 8px; font-weight: 800;" />
          <div id="otpError" style="font-size: 0.8rem; color: #ef4444; margin-top: 6px; display: none;"></div>
        </div>

        <button class="btn-primary" id="btnVerifyOtp" style="width: 100%; padding: 14px;">
          Verify & Setup Profile ➔
        </button>
        <button class="btn-secondary" id="btnCancelOtp" style="width: 100%; margin-top: 10px;">Cancel</button>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('#btnCancelOtp').onclick = () => modal.remove();
    modal.querySelector('#btnVerifyOtp').onclick = async () => {
      const code = modal.querySelector('#otpInput').value.trim();
      const errEl = modal.querySelector('#otpError');
      const res = await api.verifyOtp(code);
      if (!res.ok) {
        errEl.textContent = res.error;
        errEl.style.display = 'block';
        return;
      }
      modal.remove();
      this.showProfileWizardModal();
    };
  }

  // ==========================================
  // SIGNUP STEP 3: Multi-step Profile Wizard
  // With Real Photo Upload from Device
  // ==========================================
  showProfileWizardModal() {
    let currentStep = 1;
    const wizardData = {
      name: '',
      gender: 'male',
      interestedIn: 'female',
      city: 'Mumbai, Bandra',
      job: '',
      bio: '',
      relationshipGoal: 'long_term',
      interests: ['Coffee', 'Music'],
      photos: []
    };

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';

    const renderStep = () => {
      modal.innerHTML = `
        <div class="bottom-sheet" style="max-height: 92vh;">
          <div class="sheet-handle"></div>
          
          <div class="wizard-progress-bar">
            <div class="wizard-bar-segment ${currentStep >= 1 ? 'active' : ''}"></div>
            <div class="wizard-bar-segment ${currentStep >= 2 ? 'active' : ''}"></div>
            <div class="wizard-bar-segment ${currentStep >= 3 ? 'active' : ''}"></div>
          </div>

          ${currentStep === 1 ? `
            <h2 style="font-size: 1.5rem; font-weight: 800; margin-bottom: 4px;">Tell Us About Yourself</h2>
            <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 18px;">How you'll appear to your matches</p>

            <div style="display: flex; flex-direction: column; gap: 14px;">
              <div>
                <label style="font-size: 0.82rem; font-weight: 700;">Your Display Name</label>
                <input type="text" id="wName" class="glass-input" placeholder="e.g. Rahul, Priya, Alex" value="${wizardData.name}" style="margin-top: 4px;" />
              </div>

              <div>
                <label style="font-size: 0.82rem; font-weight: 700;">I am</label>
                <select id="wGender" class="glass-input" style="margin-top: 4px;">
                  <option value="male" ${wizardData.gender === 'male' ? 'selected' : ''}>Male</option>
                  <option value="female" ${wizardData.gender === 'female' ? 'selected' : ''}>Female</option>
                  <option value="other" ${wizardData.gender === 'other' ? 'selected' : ''}>Non-Binary / Other</option>
                </select>
              </div>

              <div>
                <label style="font-size: 0.82rem; font-weight: 700;">Looking to meet</label>
                <select id="wInterestedIn" class="glass-input" style="margin-top: 4px;">
                  <option value="female" ${wizardData.interestedIn === 'female' ? 'selected' : ''}>Women</option>
                  <option value="male" ${wizardData.interestedIn === 'male' ? 'selected' : ''}>Men</option>
                  <option value="everyone" ${wizardData.interestedIn === 'everyone' ? 'selected' : ''}>Everyone</option>
                </select>
              </div>

              <div>
                <label style="font-size: 0.82rem; font-weight: 700;">Your City / Location</label>
                <input type="text" id="wCity" class="glass-input" placeholder="e.g. Mumbai, Delhi, Bengaluru" value="${wizardData.city}" style="margin-top: 4px;" />
              </div>

              <button class="btn-primary" id="btnStep1Next" style="padding: 14px; margin-top: 10px;">Next: Upload Photos ➔</button>
            </div>
          ` : currentStep === 2 ? `
            <h2 style="font-size: 1.5rem; font-weight: 800; margin-bottom: 4px;">Add Your Best Photos</h2>
            <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 12px;">
              Upload photos from your device or camera. First photo is your main card.
            </p>

            <div class="photo-upload-grid" id="photoGridContainer"></div>

            <input type="file" id="filePhotoInput" accept="image/*" style="display: none;" />

            <div style="display: flex; gap: 8px; margin-bottom: 18px;">
              <button type="button" class="btn-secondary" id="btnTriggerFileInput" style="flex: 1; padding: 11px; font-size: 0.85rem;">
                📷 Choose Image File
              </button>
              <button type="button" class="btn-secondary" id="btnUseSamplePhotos" style="flex: 1; padding: 11px; font-size: 0.85rem; color: #ffd166;">
                ✨ Use Sample Photo
              </button>
            </div>

            <div style="display: flex; gap: 10px;">
              <button class="btn-secondary" id="btnStep2Back" style="flex: 1;">← Back</button>
              <button class="btn-primary" id="btnStep2Next" style="flex: 2;">Next: Bio & Goals ➔</button>
            </div>
          ` : `
            <h2 style="font-size: 1.5rem; font-weight: 800; margin-bottom: 4px;">Bio & Interests</h2>
            <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 14px;">Show what you love and your dating goals</p>

            <div style="display: flex; flex-direction: column; gap: 12px;">
              <div>
                <label style="font-size: 0.82rem; font-weight: 700;">Your Bio</label>
                <textarea id="wBio" rows="3" class="glass-input" placeholder="A little about you, your weekend vibe, and what brings you here...">${wizardData.bio}</textarea>
              </div>

              <div>
                <label style="font-size: 0.82rem; font-weight: 700;">Relationship Goal</label>
                <select id="wGoal" class="glass-input">
                  <option value="long_term" ${wizardData.relationshipGoal === 'long_term' ? 'selected' : ''}>Long-term relationship</option>
                  <option value="short_term" ${wizardData.relationshipGoal === 'short_term' ? 'selected' : ''}>Casual dating / Fun</option>
                  <option value="friendship" ${wizardData.relationshipGoal === 'friendship' ? 'selected' : ''}>New friends</option>
                  <option value="marriage" ${wizardData.relationshipGoal === 'marriage' ? 'selected' : ''}>Marriage / Serious</option>
                </select>
              </div>

              <div>
                <label style="font-size: 0.82rem; font-weight: 700;">Occupation / Job</label>
                <input type="text" id="wJob" class="glass-input" placeholder="e.g. Software Engineer, Designer, Doctor" value="${wizardData.job}" />
              </div>

              <div>
                <label style="font-size: 0.82rem; font-weight: 700;">Select Interests (click to toggle)</label>
                <div class="interests-grid" id="interestsGridContainer"></div>
              </div>

              <div style="display: flex; gap: 10px; margin-top: 10px;">
                <button class="btn-secondary" id="btnStep3Back" style="flex: 1;">← Back</button>
                <button class="btn-primary" id="btnFinishOnboarding" style="flex: 2; padding: 14px;">
                  Complete & Start Swiping 🚀
                </button>
              </div>
            </div>
          `}
        </div>
      `;

      // Bind Step 1
      if (currentStep === 1) {
        modal.querySelector('#btnStep1Next').onclick = () => {
          const name = modal.querySelector('#wName').value.trim();
          if (!name) {
            alert('Please enter your display name.');
            return;
          }
          wizardData.name = name;
          wizardData.gender = modal.querySelector('#wGender').value;
          wizardData.interestedIn = modal.querySelector('#wInterestedIn').value;
          wizardData.city = modal.querySelector('#wCity').value.trim() || 'Mumbai';
          currentStep = 2;
          renderStep();
        };
      }

      // Bind Step 2 (Photo Upload)
      if (currentStep === 2) {
        const grid = modal.querySelector('#photoGridContainer');
        const fileInput = modal.querySelector('#filePhotoInput');

        const renderPhotoGrid = () => {
          grid.innerHTML = '';
          for (let i = 0; i < 6; i++) {
            const photoUrl = wizardData.photos[i];
            const slot = document.createElement('div');
            slot.className = `photo-slot ${photoUrl ? 'has-image' : ''}`;
            
            if (photoUrl) {
              slot.innerHTML = `
                <img src="${photoUrl}" />
                ${i === 0 ? '<span class="badge-main">MAIN</span>' : ''}
                <button class="btn-remove-photo" data-idx="${i}">✕</button>
              `;
            } else {
              slot.innerHTML = `
                <div style="font-size: 1.4rem; color: rgba(255,255,255,0.4);">+</div>
                <span style="font-size: 0.65rem; color: var(--text-faint);">Add Photo</span>
              `;
              slot.onclick = () => fileInput.click();
            }
            grid.appendChild(slot);
          }

          grid.querySelectorAll('.btn-remove-photo').forEach((btn) => {
            btn.onclick = (ev) => {
              ev.stopPropagation();
              const idx = Number(btn.getAttribute('data-idx'));
              wizardData.photos.splice(idx, 1);
              renderPhotoGrid();
            };
          });
        };

        renderPhotoGrid();

        modal.querySelector('#btnTriggerFileInput').onclick = () => fileInput.click();

        fileInput.onchange = (ev) => {
          const file = ev.target.files[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (re) => {
            wizardData.photos.push(re.target.result);
            renderPhotoGrid();
          };
          reader.readAsDataURL(file);
        };

        modal.querySelector('#btnUseSamplePhotos').onclick = () => {
          wizardData.photos = [
            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80"
          ];
          renderPhotoGrid();
        };

        modal.querySelector('#btnStep2Back').onclick = () => {
          currentStep = 1;
          renderStep();
        };

        modal.querySelector('#btnStep2Next').onclick = () => {
          if (wizardData.photos.length === 0) {
            // Auto add default photo if none uploaded
            wizardData.photos.push("https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80");
          }
          currentStep = 3;
          renderStep();
        };
      }

      // Bind Step 3 (Bio & Interests)
      if (currentStep === 3) {
        const ALL_INTERESTS = [
          "Coffee", "Chai", "Music", "Travel", "Tech", "Fitness", "Dogs",
          "Art", "Cooking", "Cinema", "Yoga", "Books", "Startups", "Photography"
        ];
        const grid = modal.querySelector('#interestsGridContainer');
        ALL_INTERESTS.forEach((tag) => {
          const chip = document.createElement('span');
          const isSel = wizardData.interests.includes(tag);
          chip.className = `interest-chip ${isSel ? 'selected' : ''}`;
          chip.textContent = `#${tag}`;
          chip.onclick = () => {
            if (wizardData.interests.includes(tag)) {
              wizardData.interests = wizardData.interests.filter((t) => t !== tag);
              chip.classList.remove('selected');
            } else {
              wizardData.interests.push(tag);
              chip.classList.add('selected');
            }
          };
          grid.appendChild(chip);
        });

        modal.querySelector('#btnStep3Back').onclick = () => {
          currentStep = 2;
          renderStep();
        };

        modal.querySelector('#btnFinishOnboarding').onclick = async () => {
          wizardData.bio = modal.querySelector('#wBio').value.trim() || 'Excited to vibe!';
          wizardData.relationshipGoal = modal.querySelector('#wGoal').value;
          wizardData.job = modal.querySelector('#wJob').value.trim();

          const res = await api.completeOnboarding(wizardData);
          if (res.ok) {
            modal.remove();
            this.user = res.user;
            this.init();
          }
        };
      }
    };

    renderStep();
    document.body.appendChild(modal);
  }

  // ==========================================
  // LOGIN MODAL
  // ==========================================
  showLoginModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="bottom-sheet">
        <div class="sheet-handle"></div>
        <h2 style="font-size: 1.55rem; font-weight: 800; margin-bottom: 6px;">Welcome Back</h2>
        <p style="color: var(--text-muted); font-size: 0.88rem; margin-bottom: 18px;">
          Log in with your Hipa credentials
        </p>

        <form id="formLogin" style="display: flex; flex-direction: column; gap: 14px;">
          <div>
            <label style="font-size: 0.82rem; font-weight: 700; color: var(--text-muted);">Email Address</label>
            <input type="email" id="loginEmail" required class="glass-input" value="demo@hipa.com" style="margin-top: 4px;" />
          </div>

          <div>
            <label style="font-size: 0.82rem; font-weight: 700; color: var(--text-muted);">Password</label>
            <input type="password" id="loginPass" required class="glass-input" value="password123" style="margin-top: 4px;" />
          </div>

          <div id="loginError" style="color: #ef4444; font-size: 0.82rem; display: none;"></div>

          <button type="submit" class="btn-primary" style="padding: 14px; margin-top: 6px;">Log In</button>
          
          <button type="button" class="btn-secondary" id="btnSwitchToSignup">
            Don't have an account? Sign Up
          </button>
          <button type="button" class="btn-secondary" id="btnCancelLogin">Cancel</button>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('#btnCancelLogin').onclick = () => modal.remove();
    modal.querySelector('#btnSwitchToSignup').onclick = () => {
      modal.remove();
      this.showSignupModal();
    };

    const form = modal.querySelector('#formLogin');
    form.onsubmit = async (e) => {
      e.preventDefault();
      const email = modal.querySelector('#loginEmail').value.trim();
      const pass = modal.querySelector('#loginPass').value;
      const errEl = modal.querySelector('#loginError');

      const res = await api.login(email, pass);
      if (!res.ok) {
        errEl.textContent = res.error;
        errEl.style.display = 'block';
        return;
      }

      modal.remove();
      this.user = res.user;
      this.init();
    };
  }

  // ==========================================
  // DISCOVER VIEW
  // ==========================================
  renderDiscover(container) {
    container.innerHTML = `
      <div class="discover-view">
        <div class="apk-promo-banner glass-card">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 1.4rem;">📱</span>
            <div>
              <strong style="font-size: 0.88rem; color: #2ee6a6;">Hipa for Android</strong>
              <div style="font-size: 0.74rem; color: var(--text-muted);">Get native fullscreen video calls</div>
            </div>
          </div>
          <a href="/downloads/hipa-dating.apk" download="hipa-dating.apk" class="apk-download-btn">⬇ Download APK</a>
        </div>
        <div class="card-deck" id="cardDeckContainer"></div>
        <div class="swipe-actions">
          <button class="btn-icon-circle btn-action-sm btn-undo" id="btnUndo" title="Undo Swipe">↺</button>
          <button class="btn-icon-circle btn-action-lg btn-pass" id="btnPass" title="Pass">✕</button>
          <button class="btn-icon-circle btn-action-sm btn-superlike" id="btnSuperlike" title="Super Like">★</button>
          <button class="btn-icon-circle btn-action-lg btn-like" id="btnLike" title="Like">♥</button>
          <button class="btn-icon-circle btn-action-sm btn-boost" id="btnBoost" title="Boost">⚡</button>
        </div>
      </div>
    `;

    this.renderCards();
    this.bindActionButtons();
  }

  renderCards() {
    const deck = document.getElementById('cardDeckContainer');
    if (!deck) return;
    deck.innerHTML = '';

    const remaining = this.profiles.slice(this.currentCardIndex);

    if (remaining.length === 0) {
      deck.innerHTML = `
        <div class="deck-empty glass-card">
          <div class="radar-spinner"></div>
          <h3 style="font-size: 1.35rem; margin-bottom: 8px;">No More Profiles Nearby</h3>
          <p style="color: var(--text-muted); font-size: 0.92rem; margin-bottom: 20px;">
            Expand your filters or check back in a few minutes for new people!
          </p>
          <button class="btn-primary" id="btnResetDeck">Reset Deck 🔄</button>
        </div>
      `;
      const resetBtn = document.getElementById('btnResetDeck');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          this.currentCardIndex = 0;
          this.renderCards();
        });
      }
      return;
    }

    remaining.slice(0, 2).reverse().forEach((profile, idx, arr) => {
      const isTop = idx === arr.length - 1;
      const card = document.createElement('div');
      card.className = `swipe-card ${isTop ? 'active-top-card' : ''}`;
      card.setAttribute('data-id', profile.id);
      if (!isTop) {
        card.style.transform = 'scale(0.95) translateY(14px)';
        card.style.opacity = '0.7';
      }

      card.innerHTML = `
        <div class="card-img-container">
          <img src="${profile.photos[0]}" class="card-img" alt="${profile.name}" />
          <div class="card-gradient-overlay"></div>
          <div class="swipe-stamp stamp-like">LIKE</div>
          <div class="swipe-stamp stamp-pass">NOPE</div>
          <div class="swipe-stamp stamp-superlike">SUPER</div>
          <div class="card-carousel-dots">
            ${profile.photos.map((_, i) => `<div class="dot ${i === 0 ? 'active' : ''}"></div>`).join('')}
          </div>
          <div class="card-content">
            <div class="card-header-row">
              <span class="card-name">${profile.name}</span>
              <span class="card-age">${profile.age}</span>
              ${profile.verified ? '<span class="badge-verified">✓ Verified</span>' : ''}
            </div>
            <div class="card-location">
              📍 <span>${profile.city} • ${profile.distanceKm} km away</span>
            </div>
            <p class="card-bio">${profile.bio}</p>
            <div class="card-tags">
              ${profile.interests.map((tag) => `<span class="card-tag">#${tag}</span>`).join('')}
            </div>
          </div>
        </div>
      `;

      if (isTop) {
        this.attachSwipePhysics(card, profile);
      }
      deck.appendChild(card);
    });
  }

  attachSwipePhysics(card, profile) {
    const onStart = (e) => {
      this.dragState.isDragging = true;
      const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
      const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
      this.dragState.startX = clientX;
      this.dragState.startY = clientY;
      card.classList.add('dragging');
    };

    const onMove = (e) => {
      if (!this.dragState.isDragging) return;
      const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
      const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
      const deltaX = clientX - this.dragState.startX;
      const deltaY = clientY - this.dragState.startY;
      const rotate = deltaX * 0.08;

      card.style.transform = `translate(${deltaX}px, ${deltaY}px) rotate(${rotate}deg)`;

      const likeStamp = card.querySelector('.stamp-like');
      const passStamp = card.querySelector('.stamp-pass');
      const superStamp = card.querySelector('.stamp-superlike');

      if (deltaX > 40 && likeStamp) {
        likeStamp.style.opacity = Math.min(deltaX / 120, 1);
        if (passStamp) passStamp.style.opacity = 0;
      } else if (deltaX < -40 && passStamp) {
        passStamp.style.opacity = Math.min(Math.abs(deltaX) / 120, 1);
        if (likeStamp) likeStamp.style.opacity = 0;
      } else if (deltaY < -60 && superStamp) {
        superStamp.style.opacity = Math.min(Math.abs(deltaY) / 100, 1);
      } else {
        if (likeStamp) likeStamp.style.opacity = 0;
        if (passStamp) passStamp.style.opacity = 0;
        if (superStamp) superStamp.style.opacity = 0;
      }
    };

    const onEnd = (e) => {
      if (!this.dragState.isDragging) return;
      this.dragState.isDragging = false;
      card.classList.remove('dragging');

      const clientX = e.type.includes('touch') ? (e.changedTouches ? e.changedTouches[0].clientX : 0) : e.clientX;
      const deltaX = clientX - this.dragState.startX;

      if (deltaX > 110) {
        this.executeSwipe('like', card, profile);
      } else if (deltaX < -110) {
        this.executeSwipe('pass', card, profile);
      } else {
        card.style.transform = 'translate(0, 0) rotate(0deg)';
        const stamps = card.querySelectorAll('.swipe-stamp');
        stamps.forEach((s) => (s.style.opacity = 0));
      }
    };

    card.addEventListener('mousedown', onStart);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);

    card.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onEnd);
  }

  bindActionButtons() {
    const passBtn = document.getElementById('btnPass');
    const likeBtn = document.getElementById('btnLike');
    const superBtn = document.getElementById('btnSuperlike');
    const undoBtn = document.getElementById('btnUndo');
    const boostBtn = document.getElementById('btnBoost');

    if (passBtn) passBtn.onclick = () => this.triggerAction('pass');
    if (likeBtn) likeBtn.onclick = () => this.triggerAction('like');
    if (superBtn) superBtn.onclick = () => this.triggerAction('superlike');
    if (undoBtn) undoBtn.onclick = () => this.triggerUndo();
    if (boostBtn) boostBtn.onclick = () => this.triggerBoost();
  }

  triggerAction(action) {
    const topCard = document.querySelector('.active-top-card');
    const currentProfile = this.profiles[this.currentCardIndex];
    if (topCard && currentProfile) {
      this.executeSwipe(action, topCard, currentProfile);
    }
  }

  async executeSwipe(action, card, profile) {
    if (action === 'like') {
      card.style.transform = 'translate(140%, 40px) rotate(30deg)';
    } else if (action === 'pass') {
      card.style.transform = 'translate(-140%, 40px) rotate(-30deg)';
    } else if (action === 'superlike') {
      card.style.transform = 'translate(0, -140%) scale(1.1)';
    }
    card.style.opacity = '0';

    const result = await api.recordSwipe(profile.id, action);

    setTimeout(() => {
      this.currentCardIndex++;
      this.renderCards();
      this.setupTopBar();

      if (result.matched) {
        this.showMatchCelebration(profile, result.match);
      }
    }, 280);
  }

  triggerUndo() {
    if (!this.user.isPremium) {
      this.showPremiumModal('Undo Swipe requires Hipa Gold!');
      return;
    }
    if (this.currentCardIndex > 0) {
      this.currentCardIndex--;
      this.renderCards();
    }
  }

  triggerBoost() {
    alert("⚡ Profile Boosted! Your profile is now prioritized in your area for the next 30 minutes!");
  }

  showMatchCelebration(profile, matchObj) {
    const overlay = document.createElement('div');
    overlay.className = 'match-overlay';
    overlay.innerHTML = `
      <div class="match-heart-badge">♥</div>
      <h1 class="match-title">It's a Match!</h1>
      <p class="match-subtext">You and ${profile.name} liked each other.</p>
      <div class="match-avatars-pair">
        <img src="${this.user.photos[0]}" class="match-avatar" />
        <img src="${profile.photos[0]}" class="match-avatar" />
      </div>
      <div class="match-actions">
        <button class="btn-primary" id="btnSayHi">Say Hi 👋</button>
        <button class="btn-secondary" id="btnDismissMatch">Keep Swiping</button>
      </div>
    `;

    document.body.appendChild(overlay);

    overlay.querySelector('#btnDismissMatch').onclick = () => overlay.remove();
    overlay.querySelector('#btnSayHi').onclick = () => {
      overlay.remove();
      this.switchTab('chats');
      if (matchObj) {
        this.openChatRoom(matchObj.id);
      }
    };
  }

  // ==========================================
  // LIKES VIEW
  // ==========================================
  renderLikes(container) {
    const isGold = this.user.isPremium;
    const profiles = this.profiles.slice(0, 4);

    container.innerHTML = `
      <div class="likes-view">
        <div class="likes-header-banner glass-card">
          <div>
            <h3 style="font-size: 1.15rem; font-weight: 800; color: #ffd166;">⭐ Who Liked You (4)</h3>
            <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 2px;">
              ${isGold ? 'You have full Gold access to see everyone!' : 'Upgrade to see who liked you instantly.'}
            </p>
          </div>
          ${!isGold ? '<button class="btn-gold" id="btnUpgradeLikes">Unlock Gold</button>' : ''}
        </div>

        <div class="likes-grid">
          ${profiles.map((p) => `
            <div class="like-card ${!isGold ? 'blurred' : ''}">
              <img src="${p.photos[0]}" class="like-card-img" />
              ${!isGold ? `
                <div class="unlock-overlay-center">
                  <div style="font-size: 1.8rem;">🔒</div>
                  <span style="font-size: 0.82rem; font-weight: 700;">Hipa Gold</span>
                </div>
              ` : `
                <div class="like-card-overlay">
                  <div style="font-weight: 700;">${p.name}, ${p.age}</div>
                  <div style="font-size: 0.75rem; color: var(--text-muted);">${p.city}</div>
                </div>
              `}
            </div>
          `).join('')}
        </div>
      </div>
    `;

    const upgradeBtn = container.querySelector('#btnUpgradeLikes');
    if (upgradeBtn) {
      upgradeBtn.onclick = () => this.showPremiumModal('Unlock Who Liked You with Hipa Gold!');
    }
  }

  // ==========================================
  // CHATS VIEW
  // ==========================================
  renderChats(container) {
    const matches = api.getMatches();

    container.innerHTML = `
      <div class="chats-view">
        <div class="matches-rail">
          <div class="rail-title">Recent Matches (${matches.length})</div>
          <div class="matches-horizontal-list">
            ${matches.map((m) => `
              <div class="match-bubble" data-match-id="${m.id}">
                <div class="match-bubble-img-wrapper">
                  <img src="${m.photo}" class="match-bubble-img" />
                </div>
                <span class="match-bubble-name">${m.name.split(' ')[0]}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="conversations-list">
          <div class="rail-title" style="padding-left: 6px; margin-top: 6px;">Messages</div>
          ${matches.map((m) => `
            <div class="conv-item glass-card" data-match-id="${m.id}">
              <div class="conv-avatar-wrap">
                <img src="${m.photo}" class="conv-avatar" />
                ${m.online ? '<div class="badge-online conv-online-dot"></div>' : ''}
              </div>
              <div class="conv-content">
                <div class="conv-top-row">
                  <span class="conv-name">${m.name}</span>
                  <span class="conv-time">${m.lastMessageTime}</span>
                </div>
                <div class="conv-preview">${m.lastMessage}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    container.querySelectorAll('[data-match-id]').forEach((el) => {
      el.onclick = () => {
        const mId = Number(el.getAttribute('data-match-id'));
        this.openChatRoom(mId);
      };
    });
  }

  openChatRoom(matchId) {
    this.activeChatMatchId = matchId;
    const matches = api.getMatches();
    const match = matches.find((m) => m.id === matchId);
    if (!match) return;

    let chatScreen = document.getElementById('chatRoomScreen');
    if (!chatScreen) {
      chatScreen = document.createElement('div');
      chatScreen.id = 'chatRoomScreen';
      chatScreen.className = 'chat-screen';
      document.body.appendChild(chatScreen);
    }

    chatScreen.innerHTML = `
      <div class="chat-header">
        <div style="display: flex; align-items: center; gap: 10px;">
          <button class="btn-icon-circle" style="width: 36px; height: 36px; font-size: 1rem;" id="btnCloseChat">←</button>
          <div class="chat-partner-info">
            <img src="${match.photo}" class="chat-partner-avatar" />
            <div>
              <div style="font-weight: 700; font-size: 1rem;">${match.name}</div>
              <div style="font-size: 0.72rem; color: #2ee6a6;">Online now</div>
            </div>
          </div>
        </div>
        <div class="chat-call-actions">
          <button class="chat-call-btn audio" id="btnStartAudioCall" title="Audio Call">📞</button>
          <button class="chat-call-btn video" id="btnStartVideoCall" title="Video Call">📹</button>
        </div>
      </div>

      <div class="chat-messages" id="chatMessagesContainer">
        ${match.messages.map((msg) => `
          <div class="msg-bubble ${msg.sender === 'me' ? 'msg-me' : 'msg-them'}">
            <div>${msg.text}</div>
            <div class="msg-time">${msg.time}</div>
          </div>
        `).join('')}
      </div>

      <div class="icebreakers-bar">
        <span class="icebreaker-chip">☕ Chai or Coffee?</span>
        <span class="icebreaker-chip">✈️ Dream travel spot?</span>
        <span class="icebreaker-chip">🍕 Pineapple on pizza: Yes or No?</span>
      </div>

      <div class="chat-input-bar">
        <input type="text" class="glass-input" id="chatInputBox" placeholder="Type a message..." />
        <button class="btn-primary" style="padding: 12px 18px;" id="btnSendMessage">➤</button>
      </div>
    `;

    chatScreen.querySelector('#btnCloseChat').onclick = () => {
      chatScreen.remove();
      this.activeChatMatchId = null;
    };

    chatScreen.querySelector('#btnStartAudioCall').onclick = () => {
      callManager.startCall(match, 'audio');
    };

    chatScreen.querySelector('#btnStartVideoCall').onclick = () => {
      callManager.startCall(match, 'video');
    };

    const input = chatScreen.querySelector('#chatInputBox');
    const sendBtn = chatScreen.querySelector('#btnSendMessage');

    const doSend = async () => {
      const text = input.value.trim();
      if (!text) return;
      input.value = '';
      await api.sendMessage(matchId, text);
      this.refreshMessages(matchId);
    };

    sendBtn.onclick = doSend;
    input.onkeydown = (e) => {
      if (e.key === 'Enter') doSend();
    };

    chatScreen.querySelectorAll('.icebreaker-chip').forEach((chip) => {
      chip.onclick = () => {
        input.value = chip.textContent;
        doSend();
      };
    });

    this.scrollToBottom();
  }

  refreshMessages(matchId) {
    const matches = api.getMatches();
    const match = matches.find((m) => m.id === matchId);
    const container = document.getElementById('chatMessagesContainer');
    if (!match || !container) return;

    container.innerHTML = match.messages.map((msg) => `
      <div class="msg-bubble ${msg.sender === 'me' ? 'msg-me' : 'msg-them'}">
        <div>${msg.text}</div>
        <div class="msg-time">${msg.time}</div>
      </div>
    `).join('');
    this.scrollToBottom();
  }

  handleIncomingMessage(detail) {
    if (this.activeChatMatchId === detail.matchId) {
      this.refreshMessages(detail.matchId);
    }
    if (this.currentTab === 'chats') {
      this.renderChats(document.getElementById('mainViewport'));
    }
  }

  scrollToBottom() {
    const container = document.getElementById('chatMessagesContainer');
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }

  // ==========================================
  // PROFILE & SETTINGS VIEW (With Edit Profile & Logout)
  // ==========================================
  renderProfile(container) {
    const isGold = this.user.isPremium;

    container.innerHTML = `
      <div class="profile-view">
        <div class="profile-card-summary glass-card">
          <div class="profile-avatar-large-wrap">
            <img src="${this.user.photos[0]}" class="profile-avatar-large" />
            ${this.user.photoVerified ? '<span class="badge-verified" style="position: absolute; bottom: 0; right: 4px;">✓ Verified</span>' : ''}
          </div>
          <h2 style="font-size: 1.45rem; font-weight: 800;">${this.user.name}, ${this.user.age}</h2>
          <p style="color: var(--text-muted); font-size: 0.88rem; margin-top: 2px;">📍 ${this.user.city}</p>
          <p style="font-size: 0.85rem; color: rgba(255,255,255,0.85); margin-top: 6px; max-width: 280px;">${this.user.bio || ''}</p>
          
          <div style="margin-top: 10px;">
            ${isGold ? '<span class="badge-gold">👑 HIPA GOLD MEMBER</span>' : '<span class="glass-pill">Free Tier</span>'}
          </div>

          <div style="width: 100%; margin-top: 16px;">
            <div style="display: flex; justify-content: space-between; font-size: 0.8rem; color: var(--text-muted);">
              <span>Profile Strength</span>
              <span>85%</span>
            </div>
            <div class="meter-container">
              <div class="meter-fill" style="width: 85%;"></div>
            </div>
          </div>
        </div>

        <div class="settings-group">
          <div class="settings-item glass-card" id="btnEditMyProfile" style="border-color: rgba(56, 189, 248, 0.4);">
            <div style="display: flex; align-items: center; gap: 12px;">
              <span style="font-size: 1.4rem;">✏️</span>
              <div>
                <div style="font-weight: 700; color: #38bdf8;">Edit Profile & Photos</div>
                <div style="font-size: 0.78rem; color: var(--text-muted);">Upload new pictures, edit bio & details</div>
              </div>
            </div>
            <span>➔</span>
          </div>

          <a href="/downloads/hipa-dating.apk" download="hipa-dating.apk" class="settings-item glass-card" style="text-decoration: none; color: inherit; border-color: rgba(16, 185, 129, 0.4);">
            <div style="display: flex; align-items: center; gap: 12px;">
              <span style="font-size: 1.4rem;">📲</span>
              <div>
                <div style="font-weight: 700; color: #2ee6a6;">Download Android App (APK)</div>
                <div style="font-size: 0.78rem; color: var(--text-muted);">Direct APK install for Android phones</div>
              </div>
            </div>
            <span style="font-size: 1.2rem; color: #2ee6a6;">⬇</span>
          </a>

          <div class="settings-item glass-card" id="btnOpenPremium">
            <div style="display: flex; align-items: center; gap: 12px;">
              <span style="font-size: 1.4rem;">👑</span>
              <div>
                <div style="font-weight: 700;">Hipa Premium Plans</div>
                <div style="font-size: 0.78rem; color: var(--text-muted);">Unlimited Swipes, Who Liked You & More</div>
              </div>
            </div>
            <span>➔</span>
          </div>

          <div class="settings-item glass-card" id="btnOpenSafety">
            <div style="display: flex; align-items: center; gap: 12px;">
              <span style="font-size: 1.4rem;">🛡️</span>
              <div>
                <div style="font-weight: 700;">Safety Center & Helpline</div>
                <div style="font-size: 0.78rem; color: var(--text-muted);">Emergency 112, Women 1091, Safe Dating Tips</div>
              </div>
            </div>
            <span>➔</span>
          </div>

          <div class="settings-item glass-card" id="btnRequestVerify">
            <div style="display: flex; align-items: center; gap: 12px;">
              <span style="font-size: 1.4rem;">🤳</span>
              <div>
                <div style="font-weight: 700;">Photo Verification</div>
                <div style="font-size: 0.78rem; color: #38bdf8;">Blue tick selfie badge</div>
              </div>
            </div>
            <span>➔</span>
          </div>

          <div class="settings-item glass-card" id="btnLogout" style="border-color: rgba(239, 68, 68, 0.4);">
            <div style="display: flex; align-items: center; gap: 12px;">
              <span style="font-size: 1.4rem;">🚪</span>
              <div>
                <div style="font-weight: 700; color: #ef4444;">Log Out</div>
                <div style="font-size: 0.78rem; color: var(--text-muted);">Switch account or sign in later</div>
              </div>
            </div>
            <span style="color: #ef4444;">➔</span>
          </div>
        </div>
      </div>
    `;

    container.querySelector('#btnEditMyProfile').onclick = () => this.showEditProfileModal();
    container.querySelector('#btnOpenPremium').onclick = () => this.showPremiumModal();
    container.querySelector('#btnOpenSafety').onclick = () => this.showSafetyModal();
    container.querySelector('#btnRequestVerify').onclick = () => alert("Blue Tick verification request submitted! A moderator will review your selfie pose shortly.");
    container.querySelector('#btnLogout').onclick = () => {
      if (confirm("Are you sure you want to log out?")) {
        api.logout();
        this.init();
      }
    };
  }

  // Edit Profile & Photo Uploader Modal
  showEditProfileModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    const photos = [...(this.user.photos || [])];

    modal.innerHTML = `
      <div class="bottom-sheet" style="max-height: 92vh;">
        <div class="sheet-handle"></div>
        <h2 style="font-size: 1.55rem; font-weight: 800; margin-bottom: 6px;">Edit Profile</h2>
        <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 16px;">Update your photos, bio, and details</p>

        <div style="display: flex; flex-direction: column; gap: 14px;">
          <div>
            <label style="font-size: 0.82rem; font-weight: 700;">Profile Photos (up to 6)</label>
            <div class="photo-upload-grid" id="editPhotoGrid"></div>
            <input type="file" id="editFileInput" accept="image/*" style="display: none;" />
            <button type="button" class="btn-secondary" id="btnEditUploadPhoto" style="width: 100%; padding: 10px; font-size: 0.85rem;">
              📷 Add Photo from Device
            </button>
          </div>

          <div>
            <label style="font-size: 0.82rem; font-weight: 700;">Display Name</label>
            <input type="text" id="editName" class="glass-input" value="${this.user.name}" />
          </div>

          <div>
            <label style="font-size: 0.82rem; font-weight: 700;">Bio</label>
            <textarea id="editBio" rows="3" class="glass-input">${this.user.bio || ''}</textarea>
          </div>

          <div>
            <label style="font-size: 0.82rem; font-weight: 700;">City</label>
            <input type="text" id="editCity" class="glass-input" value="${this.user.city}" />
          </div>

          <div>
            <label style="font-size: 0.82rem; font-weight: 700;">Occupation</label>
            <input type="text" id="editJob" class="glass-input" value="${this.user.job || ''}" />
          </div>

          <button class="btn-primary" id="btnSaveProfile" style="padding: 14px; margin-top: 8px;">Save Changes ✓</button>
          <button class="btn-secondary" id="btnCancelEdit">Cancel</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const grid = modal.querySelector('#editPhotoGrid');
    const fileInput = modal.querySelector('#editFileInput');

    const renderGrid = () => {
      grid.innerHTML = '';
      for (let i = 0; i < 6; i++) {
        const photoUrl = photos[i];
        const slot = document.createElement('div');
        slot.className = `photo-slot ${photoUrl ? 'has-image' : ''}`;
        if (photoUrl) {
          slot.innerHTML = `
            <img src="${photoUrl}" />
            ${i === 0 ? '<span class="badge-main">MAIN</span>' : ''}
            <button class="btn-remove-photo" data-idx="${i}">✕</button>
          `;
        } else {
          slot.innerHTML = `<span style="font-size: 1.3rem; color: rgba(255,255,255,0.4);">+</span>`;
          slot.onclick = () => fileInput.click();
        }
        grid.appendChild(slot);
      }

      grid.querySelectorAll('.btn-remove-photo').forEach((btn) => {
        btn.onclick = (e) => {
          e.stopPropagation();
          const idx = Number(btn.getAttribute('data-idx'));
          photos.splice(idx, 1);
          renderGrid();
        };
      });
    };

    renderGrid();

    modal.querySelector('#btnEditUploadPhoto').onclick = () => fileInput.click();
    fileInput.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (re) => {
        photos.push(re.target.result);
        renderGrid();
      };
      reader.readAsDataURL(file);
    };

    modal.querySelector('#btnCancelEdit').onclick = () => modal.remove();

    modal.querySelector('#btnSaveProfile').onclick = () => {
      this.user.name = modal.querySelector('#editName').value.trim() || this.user.name;
      this.user.bio = modal.querySelector('#editBio').value.trim();
      this.user.city = modal.querySelector('#editCity').value.trim() || this.user.city;
      this.user.job = modal.querySelector('#editJob').value.trim();
      if (photos.length > 0) {
        this.user.photos = photos;
      }
      api.saveUser(this.user);
      modal.remove();
      this.renderProfile(document.getElementById('mainViewport'));
    };
  }

  showPremiumModal(title = "Upgrade to Hipa Gold") {
    const cfg = api.getGatewayConfigs();
    const activeGw = cfg.payments?.activeGateway || "razorpay";
    const upiVpa = cfg.payments?.upiDirect?.vpa || "hipabiz@icici";
    const upiPayee = cfg.payments?.upiDirect?.payeeName || "Hipa Dating App";
    const goldPrice = cfg.payments?.upiDirect?.goldPrice || 299;

    let gatewayBadge = "";
    let gatewayButtonText = "Instant Unlock Gold 🚀";
    let gatewayDesc = "";

    if (activeGw === "razorpay") {
      const mode = (cfg.payments?.razorpay?.mode || "test").toUpperCase();
      gatewayBadge = `<span class="glass-pill" style="background: rgba(14, 116, 233, 0.2); color: #38bdf8; font-size: 0.72rem;">Razorpay PG (${mode})</span>`;
      gatewayDesc = "Secured via Razorpay: UPI, Google Pay, PhonePe, Cards & NetBanking";
      gatewayButtonText = `Pay ₹${goldPrice} via Razorpay 💳`;
    } else if (activeGw === "cashfree") {
      gatewayBadge = `<span class="glass-pill" style="background: rgba(16, 185, 129, 0.2); color: #10b981; font-size: 0.72rem;">Cashfree Payments</span>`;
      gatewayDesc = "Secured via Cashfree AutoPay & Instant UPI";
      gatewayButtonText = `Pay ₹${goldPrice} with Cashfree ⚡`;
    } else if (activeGw === "phonepe") {
      gatewayBadge = `<span class="glass-pill" style="background: rgba(147, 51, 234, 0.2); color: #c084fc; font-size: 0.72rem;">PhonePe PG</span>`;
      gatewayDesc = "Pay directly via PhonePe UPI Gateway";
      gatewayButtonText = `Pay ₹${goldPrice} via PhonePe 📱`;
    } else if (activeGw === "stripe") {
      gatewayBadge = `<span class="glass-pill" style="background: rgba(99, 102, 241, 0.2); color: #818cf8; font-size: 0.72rem;">Stripe Global</span>`;
      gatewayDesc = "International Credit/Debit Card Checkout";
      gatewayButtonText = `Pay ₹${goldPrice} via Stripe 🌐`;
    } else {
      gatewayBadge = `<span class="glass-pill" style="background: rgba(245, 158, 11, 0.2); color: #f59e0b; font-size: 0.72rem;">Direct UPI QR</span>`;
      gatewayDesc = `Direct zero-fee bank transfer to VPA: ${upiVpa}`;
      gatewayButtonText = `Confirm & Unlock Gold 🚀`;
    }

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="bottom-sheet">
        <div class="sheet-handle"></div>
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
          <h2 style="font-size: 1.5rem; font-weight: 800; color: #ffd166; margin: 0;">👑 ${title}</h2>
          ${gatewayBadge}
        </div>
        <p style="color: var(--text-muted); font-size: 0.88rem; margin-bottom: 16px;">
          Unlock all dating superpowers with zero boundaries.
        </p>

        <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; font-size: 0.88rem;">
          <div style="display: flex; gap: 10px; align-items: center;">
            <span style="color: #2ee6a6;">✓</span> <span>Unlimited Swipes (no daily limit)</span>
          </div>
          <div style="display: flex; gap: 10px; align-items: center;">
            <span style="color: #2ee6a6;">✓</span> <span>See everyone who Liked You</span>
          </div>
          <div style="display: flex; gap: 10px; align-items: center;">
            <span style="color: #2ee6a6;">✓</span> <span>Unlimited 1-to-1 Audio & Video Calls</span>
          </div>
          <div style="display: flex; gap: 10px; align-items: center;">
            <span style="color: #2ee6a6;">✓</span> <span>5 Free Super Likes every day</span>
          </div>
          <div style="display: flex; gap: 10px; align-items: center;">
            <span style="color: #2ee6a6;">✓</span> <span>Rewind / Undo accidental passes</span>
          </div>
        </div>

        <div class="glass-card" style="padding: 16px; margin-bottom: 18px; text-align: center;">
          <div style="font-size: 0.82rem; color: var(--text-muted);">${gatewayDesc}</div>
          <div style="font-size: 1.25rem; font-weight: 800; color: var(--accent-pink); margin: 6px 0;">
            ₹${goldPrice} / 1 Month Gold
          </div>
          
          <div style="margin-top: 10px; padding: 10px; background: rgba(0,0,0,0.25); border-radius: var(--radius-sm); font-size: 0.82rem;">
            <div>Payee VPA: <strong style="color: #38bdf8;">${upiVpa}</strong> (${upiPayee})</div>
            <a href="upi://pay?pa=${encodeURIComponent(upiVpa)}&pn=${encodeURIComponent(upiPayee)}&am=${goldPrice}&cu=INR" 
               class="btn-secondary" style="display: inline-block; margin-top: 8px; font-size: 0.78rem; padding: 4px 12px; text-decoration: none;">
              📲 Launch UPI App (GPay / PhonePe / Paytm)
            </a>
          </div>

          <input type="text" id="inputUtr" class="glass-input" placeholder="Enter 12-digit UPI UTR / Payment Ref No." style="margin-top: 12px;" />
        </div>

        <button class="btn-gold" id="btnSubmitUpiPay" style="width: 100%; padding: 14px;">${gatewayButtonText}</button>
        <button class="btn-secondary" id="btnCloseModal" style="width: 100%; margin-top: 10px;">Maybe Later</button>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('#btnCloseModal').onclick = () => modal.remove();
    modal.querySelector('#btnSubmitUpiPay').onclick = async () => {
      const utr = modal.querySelector('#inputUtr').value.trim() || ('PAY-' + Date.now().toString().slice(-8));
      await api.upgradeToGold('gold', utr);
      alert(`🎉 Payment of ₹${goldPrice} processed via ${activeGw.toUpperCase()}!\nHipa Gold is now active on your account!`);
      modal.remove();
      this.user = api.getUser();
      this.setupTopBar();
      this.renderCurrentTab();
    };
  }

  showSafetyModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="bottom-sheet">
        <div class="sheet-handle"></div>
        <h2 style="font-size: 1.5rem; font-weight: 800; color: #2ee6a6; margin-bottom: 8px;">🛡️ Safety Center</h2>
        <p style="color: var(--text-muted); font-size: 0.88rem; margin-bottom: 18px;">
          Your safety and privacy are our top priority. We comply with IT Rules 2021 & DPDP Act 2023.
        </p>

        <div class="glass-card" style="padding: 14px; margin-bottom: 14px;">
          <h4 style="color: #ef4444; font-size: 0.95rem; margin-bottom: 6px;">🚨 India Emergency Helplines</h4>
          <p style="font-size: 0.85rem; line-height: 1.5;">
            • National Emergency: <strong>112</strong><br/>
            • Women Helpline (All India): <strong>1091</strong><br/>
            • Cyber Crime Reporting: <strong>1930</strong> / cybercrime.gov.in
          </p>
        </div>

        <div class="glass-card" style="padding: 14px; margin-bottom: 18px;">
          <h4 style="color: #38bdf8; font-size: 0.95rem; margin-bottom: 6px;">✨ Date Safely Rules</h4>
          <p style="font-size: 0.82rem; line-height: 1.4; color: var(--text-muted);">
            1. Never send money or share bank OTPs with anyone.<br/>
            2. Meet in public places for first dates.<br/>
            3. Use in-app audio/video calls before meeting in person.
          </p>
        </div>

        <button class="btn-primary" id="btnCloseSafety" style="width: 100%;">Got it, Stay Safe!</button>
      </div>
    `;

    document.body.appendChild(modal);
    modal.querySelector('#btnCloseSafety').onclick = () => modal.remove();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new HipaApp();
  app.init();
});
