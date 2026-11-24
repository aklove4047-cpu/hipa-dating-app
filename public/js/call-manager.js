/* =========================================================
   Hipa Dating App — WebRTC Audio & Video Call Manager
   Specification: PRD File 05
   Includes: Synthesized Web Audio Tone Generator (No external MP3s needed)
   ========================================================= */

class CallManager {
  constructor() {
    this.activeCall = null;
    this.localStream = null;
    this.remoteStream = null;
    this.audioCtx = null;
    this.ringInterval = null;
    this.callTimerInterval = null;
    this.durationSeconds = 0;
  }

  // Synthesize Phone Ringback / Incoming Ringtone via Web Audio API
  startRingtone(type = 'outgoing') {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      this.audioCtx = new AudioContext();

      const playTone = () => {
        if (!this.audioCtx || this.audioCtx.state === 'closed') return;
        const osc1 = this.audioCtx.createOscillator();
        const osc2 = this.audioCtx.createOscillator();
        const gainNode = this.audioCtx.createGain();

        // Standard Indian / UK Telecom Dual Tone (400Hz + 450Hz)
        osc1.frequency.value = type === 'outgoing' ? 400 : 440;
        osc2.frequency.value = type === 'outgoing' ? 450 : 480;

        gainNode.gain.setValueAtTime(0.08, this.audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 1.2);

        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(this.audioCtx.destination);

        osc1.start();
        osc2.start();
        osc1.stop(this.audioCtx.currentTime + 1.2);
        osc2.stop(this.audioCtx.currentTime + 1.2);
      };

      playTone();
      this.ringInterval = setInterval(playTone, 3000);
    } catch (e) {
      console.warn('AudioContext not allowed without user interaction yet', e);
    }
  }

  stopRingtone() {
    if (this.ringInterval) {
      clearInterval(this.ringInterval);
      this.ringInterval = null;
    }
    if (this.audioCtx) {
      this.audioCtx.close().catch(() => {});
      this.audioCtx = null;
    }
  }

  // Start Outgoing Call
  async startCall(partner, callType = 'video') {
    this.activeCall = {
      partner,
      type: callType,
      status: 'ringing',
      startedAt: null
    };

    this.startRingtone('outgoing');
    this.renderCallModal();

    // Acquire Local Media (Camera/Microphone)
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callType === 'video'
      });
      const localVid = document.getElementById('callLocalVideo');
      if (localVid && callType === 'video') {
        localVid.srcObject = this.localStream;
      }
    } catch (err) {
      console.warn('Camera/Mic not accessible in current environment, using simulated video', err);
    }

    // Simulated Peer Acceptance after 3.5 seconds
    setTimeout(() => {
      if (this.activeCall && this.activeCall.status === 'ringing') {
        this.acceptCall();
      }
    }, 3500);
  }

  acceptCall() {
    this.stopRingtone();
    if (!this.activeCall) return;

    this.activeCall.status = 'connected';
    this.activeCall.startedAt = Date.now();
    this.durationSeconds = 0;

    // Start timer
    this.callTimerInterval = setInterval(() => {
      this.durationSeconds += 1;
      const mins = String(Math.floor(this.durationSeconds / 60)).padStart(2, '0');
      const secs = String(this.durationSeconds % 60).padStart(2, '0');
      const timerEl = document.getElementById('callTimerDisplay');
      if (timerEl) {
        timerEl.textContent = `${mins}:${secs}`;
      }
    }, 1000);

    this.renderConnectedUI();
  }

  endCall() {
    this.stopRingtone();
    if (this.callTimerInterval) {
      clearInterval(this.callTimerInterval);
      this.callTimerInterval = null;
    }

    // Stop Media Tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    const modal = document.getElementById('callOverlayModal');
    if (modal) {
      modal.remove();
    }

    this.activeCall = null;
  }

  toggleMute() {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        const btn = document.getElementById('btnCallMute');
        if (btn) {
          btn.style.background = audioTrack.enabled ? 'rgba(255,255,255,0.15)' : '#ef4444';
        }
      }
    }
  }

  toggleVideo() {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        const btn = document.getElementById('btnCallVideo');
        if (btn) {
          btn.style.background = videoTrack.enabled ? 'rgba(255,255,255,0.15)' : '#ef4444';
        }
      }
    }
  }

  renderCallModal() {
    let modal = document.getElementById('callOverlayModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'callOverlayModal';
      modal.className = 'call-modal';
      document.body.appendChild(modal);
    }

    const isVideo = this.activeCall.type === 'video';

    modal.innerHTML = `
      ${isVideo ? `
        <div class="video-container-remote">
          <img src="${this.activeCall.partner.photo}" class="remote-video-el" style="filter: brightness(0.65) blur(10px); transform: scale(1.1);" />
        </div>
        <div class="pip-local-video" id="pipContainer">
          <video id="callLocalVideo" autoplay playsinline muted class="local-video-el"></video>
        </div>
      ` : `
        <div class="audio-call-stage">
          <div class="audio-pulse-avatar-wrap">
            <div class="pulse-ring"></div>
            <div class="pulse-ring"></div>
            <img src="${this.activeCall.partner.photo}" class="audio-call-avatar" />
          </div>
          <h2 style="font-size: 1.6rem; font-weight: 800; margin-bottom: 6px;">${this.activeCall.partner.name}</h2>
          <p id="callStatusText" style="color: var(--accent-pink); font-size: 0.95rem; font-weight: 600;">Calling...</p>
        </div>
      `}

      <div class="call-header-overlay">
        <div class="call-timer-badge" id="callTimerDisplay">Ringing...</div>
        <div class="call-quality-dot" title="HD Connection"></div>
      </div>

      <div class="call-controls-bar">
        <button class="btn-icon-circle" id="btnCallMute" onclick="window.hipaCall.toggleMute()">🎤</button>
        ${isVideo ? `<button class="btn-icon-circle" id="btnCallVideo" onclick="window.hipaCall.toggleVideo()">📹</button>` : ''}
        <button class="btn-icon-circle btn-call-end" onclick="window.hipaCall.endCall()">📞</button>
      </div>
    `;
  }

  renderConnectedUI() {
    const isVideo = this.activeCall.type === 'video';
    const timerDisplay = document.getElementById('callTimerDisplay');
    if (timerDisplay) timerDisplay.textContent = '00:00';

    const statusText = document.getElementById('callStatusText');
    if (statusText) statusText.textContent = 'Connected • HD Audio';

    if (isVideo) {
      const container = document.querySelector('.video-container-remote');
      if (container) {
        container.innerHTML = `
          <img src="${this.activeCall.partner.photo}" class="remote-video-el" style="object-fit: cover;" />
        `;
      }
    }
  }
}

export const callManager = new CallManager();
window.hipaCall = callManager;
