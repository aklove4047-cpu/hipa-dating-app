/* =========================================================
   Hipa Dating App — Main Application Logic
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
    this.profiles = api.getProfiles();
    this.setupNavigation();
    this.setupTopBar();
    this.renderCurrentTab();

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

  setupTopBar() {
    const langBtn = document.getElementById('btnLangToggle');
    if (langBtn) {
      langBtn.textContent = i18n.currentLang === 'en' ? 'हिन्दी' : 'English';
      langBtn.addEventListener('click', () => {
        i18n.toggle();
        langBtn.textContent = i18n.currentLang === 'en' ? 'हिन्दी' : 'English';
      });
    }

    const coinsPill = document.getElementById('userSwipesCount');
    if (coinsPill) {
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

    // Render top 2 cards for depth performance
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

      // Stamp visibility
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
        // Return to center
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

    // Bind chat events
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
  // PROFILE & SETTINGS VIEW
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

          <a href="/admin/" target="_blank" class="settings-item glass-card" style="text-decoration: none; color: inherit;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <span style="font-size: 1.4rem;">⚙️</span>
              <div>
                <div style="font-weight: 700;">Admin Moderation Panel</div>
                <div style="font-size: 0.78rem; color: #a855f7;">Dashboard, users, queues & reports</div>
              </div>
            </div>
            <span>➔</span>
          </a>
        </div>
      </div>
    `;

    container.querySelector('#btnOpenPremium').onclick = () => this.showPremiumModal();
    container.querySelector('#btnOpenSafety').onclick = () => this.showSafetyModal();
    container.querySelector('#btnRequestVerify').onclick = () => alert("Blue Tick verification request submitted! A moderator will review your selfie pose shortly.");
  }

  showPremiumModal(title = "Upgrade to Hipa Gold") {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="bottom-sheet">
        <div class="sheet-handle"></div>
        <h2 style="font-size: 1.6rem; font-weight: 800; color: #ffd166; margin-bottom: 6px;">👑 ${title}</h2>
        <p style="color: var(--text-muted); font-size: 0.92rem; margin-bottom: 20px;">
          Unlock all dating superpowers with zero boundaries.
        </p>

        <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 24px;">
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

        <div class="glass-card" style="padding: 18px; margin-bottom: 20px; text-align: center;">
          <div style="font-size: 0.85rem; color: var(--text-muted);">Pay via Direct UPI (Zero Gateway Charge)</div>
          <div style="font-size: 1.25rem; font-weight: 800; color: var(--accent-pink); margin: 6px 0;">UPI ID: hipa@upi</div>
          <div style="font-size: 0.82rem; color: var(--text-faint);">Amount: ₹299 / 1 Month Gold</div>
          <input type="text" id="inputUtr" class="glass-input" placeholder="Enter 12-digit UPI UTR / Ref No." style="margin-top: 12px;" />
        </div>

        <button class="btn-gold" id="btnSubmitUpiPay" style="width: 100%; padding: 14px;">Instant Unlock Gold 🚀</button>
        <button class="btn-secondary" id="btnCloseModal" style="width: 100%; margin-top: 10px;">Maybe Later</button>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('#btnCloseModal').onclick = () => modal.remove();
    modal.querySelector('#btnSubmitUpiPay').onclick = async () => {
      const utr = modal.querySelector('#inputUtr').value.trim() || 'UPI-9823482342';
      await api.upgradeToGold('gold', utr);
      alert("🎉 Payment Approved! Hipa Gold is now active on your account!");
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
