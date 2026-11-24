/* =========================================================
   Hipa Dating App — Admin Panel Controller
   Specification: PRD File 06
   Includes: Admin Authentication Guard, Role Checks, Dashboard KPIs,
             User Ban/Suspend/Verify, Side-by-Side Selfie Queue,
             Photo Moderation, Reports Resolution, Calls Log, UPI Approvals, Broadcast
   ========================================================= */

const ADMIN_DATA = {
  kpis: {
    totalUsers: "1,248",
    activeToday: "342",
    matchesToday: "89",
    callsToday: "41",
    monthlyRevenue: "₹84,500",
    openReports: 2,
    pendingVerifications: 3
  },
  users: [
    { id: 101, name: "Ananya Sharma", email: "ananya@example.com", city: "Mumbai", status: "active", verified: true, isPremium: true, reports: 0 },
    { id: 102, name: "Rohan Verma", email: "rohan@example.com", city: "Bengaluru", status: "active", verified: true, isPremium: false, reports: 0 },
    { id: 103, name: "Pooja Malhotra", email: "pooja@example.com", city: "Delhi", status: "active", verified: false, isPremium: false, reports: 0 },
    { id: 104, name: "Karan Singhania", email: "karan@example.com", city: "Pune", status: "active", verified: true, isPremium: true, reports: 0 },
    { id: 105, name: "Sneha Patel", email: "sneha@example.com", city: "Jaipur", status: "active", verified: true, isPremium: false, reports: 0 },
    { id: 106, name: "Vikram Malhotra", email: "vikram@spam.io", city: "Kolkata", status: "suspended", verified: false, isPremium: false, reports: 4 }
  ],
  verifications: [
    {
      id: 1,
      userId: 103,
      name: "Pooja Malhotra",
      profilePhoto: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80",
      selfiePhoto: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80",
      submittedAt: "10 mins ago",
      poseReq: "Peace Sign ✌️"
    },
    {
      id: 2,
      userId: 107,
      name: "Rahul Mehta",
      profilePhoto: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80",
      selfiePhoto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
      submittedAt: "25 mins ago",
      poseReq: "Thumbs Up 👍"
    }
  ],
  reports: [
    {
      id: 201,
      reporterName: "Sneha Patel",
      reportedUser: "Vikram Malhotra",
      reason: "Harassment & inappropriate messages",
      severity: "High",
      time: "1 hour ago",
      status: "open"
    },
    {
      id: 202,
      reporterName: "Ananya Sharma",
      reportedUser: "FakeProfile404",
      reason: "Suspected fake bot account",
      severity: "Medium",
      time: "3 hours ago",
      status: "open"
    }
  ],
  calls: [
    { id: "C-9821", caller: "Ananya Sharma", callee: "Aman Kapoor", type: "Video", duration: "12m 45s", status: "Completed", time: "Today 12:15 PM" },
    { id: "C-9820", caller: "Rohan Verma", callee: "Pooja Malhotra", type: "Audio", duration: "05m 12s", status: "Completed", time: "Today 11:30 AM" },
    { id: "C-9819", caller: "Karan Singhania", callee: "Sneha Patel", type: "Video", duration: "00m 45s", status: "Missed", time: "Today 10:10 AM" }
  ],
  payments: [
    { id: "P-401", user: "Aman Kapoor", plan: "Hipa Gold (1 Mo)", amount: "₹299", utr: "982348234291", date: "Today 11:00 AM", status: "Approved" },
    { id: "P-402", user: "Karan Singhania", plan: "Hipa Platinum (3 Mo)", amount: "₹699", utr: "772198421045", date: "Today 10:20 AM", status: "Pending" }
  ]
};

class AdminController {
  constructor() {
    this.currentView = 'dashboard';
    this.adminSession = JSON.parse(localStorage.getItem('hipa_admin_session') || 'null');
  }

  init() {
    if (!this.adminSession) {
      this.renderLoginScreen();
    } else {
      this.renderApp();
    }
  }

  renderLoginScreen() {
    const layout = document.querySelector('.admin-layout');
    if (!layout) return;

    layout.innerHTML = `
      <div style="flex: 1; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px;">
        <div class="glass-panel" style="width: 100%; max-width: 440px; padding: 36px 30px; text-align: center; border-color: rgba(255, 77, 126, 0.4);">
          <div style="width: 60px; height: 60px; background: var(--accent-pink); border-radius: 18px; margin: 0 auto 16px auto; display: flex; align-items: center; justify-content: center; font-size: 2rem; box-shadow: 0 8px 24px var(--accent-pink-glow);">
            🛡️
          </div>
          <h1 style="font-size: 1.8rem; font-weight: 800; margin-bottom: 6px;">Hipa Admin Portal</h1>
          <p style="color: var(--text-muted); font-size: 0.88rem; margin-bottom: 24px;">
            Authorized Moderation & Staff Login Only
          </p>

          <div class="glass-card" style="padding: 12px; margin-bottom: 20px; text-align: left; font-size: 0.78rem; border-color: rgba(56, 189, 248, 0.4); color: #bae6fd;">
            🔒 Protected under IT Rules 2021 & DPDP Act 2023. All admin audit events are cryptographically logged.
          </div>

          <form id="formAdminLogin" style="display: flex; flex-direction: column; gap: 14px; text-align: left;">
            <div>
              <label style="font-size: 0.82rem; font-weight: 700; color: var(--text-muted);">Admin Email</label>
              <input type="text" id="adminEmail" required class="glass-input" value="admin@hipa.com" style="margin-top: 4px;" />
            </div>

            <div>
              <label style="font-size: 0.82rem; font-weight: 700; color: var(--text-muted);">Master Password</label>
              <input type="password" id="adminPassword" required class="glass-input" value="admin123" style="margin-top: 4px;" />
            </div>

            <div id="adminLoginError" style="color: #ef4444; font-size: 0.82rem; display: none;"></div>

            <button type="submit" class="btn-primary" style="padding: 14px; margin-top: 8px;">
              Access Control Center ➔
            </button>
          </form>

          <div style="margin-top: 20px; font-size: 0.82rem; color: var(--text-faint);">
            Demo Credentials: <code>admin@hipa.com</code> / <code>admin123</code>
          </div>
        </div>
      </div>
    `;

    const form = layout.querySelector('#formAdminLogin');
    form.onsubmit = (e) => {
      e.preventDefault();
      const email = layout.querySelector('#adminEmail').value.trim();
      const pass = layout.querySelector('#adminPassword').value;
      const errEl = layout.querySelector('#adminLoginError');

      if ((email === 'admin@hipa.com' || email === 'admin') && pass === 'admin123') {
        this.adminSession = { email, role: 'Super Admin', token: 'adm_' + Date.now() };
        localStorage.setItem('hipa_admin_session', JSON.stringify(this.adminSession));
        this.renderApp();
      } else {
        errEl.textContent = 'Invalid admin credentials. Use admin@hipa.com / admin123';
        errEl.style.display = 'block';
      }
    };
  }

  renderApp() {
    const layout = document.querySelector('.admin-layout');
    if (!layout) return;

    layout.innerHTML = `
      <!-- Sidebar -->
      <aside class="admin-sidebar">
        <div class="admin-brand">
          <div class="btn-icon-circle" style="width: 38px; height: 38px; background: var(--accent-pink);">♥</div>
          <div>
            <h2 style="font-size: 1.2rem; font-weight: 800;">Hipa Admin</h2>
            <span style="font-size: 0.72rem; color: #2ee6a6;">Super Admin Role</span>
          </div>
        </div>

        <nav class="admin-nav">
          <a class="admin-nav-item active" data-view="dashboard">
            <span>📊</span> Dashboard
          </a>
          <a class="admin-nav-item" data-view="users">
            <span>👥</span> Users
            <span class="admin-nav-badge">1,248</span>
          </a>
          <a class="admin-nav-item" data-view="verifications">
            <span>🤳</span> Verifications
            <span class="admin-nav-badge" style="background: #38bdf8;">3</span>
          </a>
          <a class="admin-nav-item" data-view="reports">
            <span>🚨</span> Reports
            <span class="admin-nav-badge" style="background: #ef4444;">2</span>
          </a>
          <a class="admin-nav-item" data-view="calls">
            <span>📞</span> Calls Log
          </a>
          <a class="admin-nav-item" data-view="payments">
            <span>💳</span> UPI Payments
            <span class="admin-nav-badge" style="background: #10b981;">1</span>
          </a>
          <a class="admin-nav-item" data-view="broadcast">
            <span>📢</span> Broadcast Alert
          </a>
          <a class="admin-nav-item" data-view="settings">
            <span>⚙️</span> App Settings
          </a>
        </nav>

        <div style="margin-top: auto; padding-top: 14px; border-top: 1px solid rgba(255,255,255,0.1); display: flex; flex-direction: column; gap: 8px;">
          <button id="btnAdminLogout" class="btn-secondary" style="width: 100%; font-size: 0.85rem; padding: 10px; color: #ef4444; border-color: rgba(239, 68, 68, 0.4);">
            🚪 Log Out Admin
          </button>
        </div>
      </aside>

      <!-- Main Content Panel -->
      <main class="admin-main" id="adminMainContent"></main>
    `;

    layout.querySelector('#btnAdminLogout').onclick = () => {
      localStorage.removeItem('hipa_admin_session');
      this.adminSession = null;
      this.renderLoginScreen();
    };

    this.bindSidebar();
    this.renderView('dashboard');
  }

  bindSidebar() {
    document.querySelectorAll('.admin-nav-item').forEach((item) => {
      item.onclick = () => {
        document.querySelectorAll('.admin-nav-item').forEach((i) => i.classList.remove('active'));
        item.classList.add('active');
        const view = item.getAttribute('data-view');
        this.renderView(view);
      };
    });
  }

  renderView(view) {
    this.currentView = view;
    const container = document.getElementById('adminMainContent');
    if (!container) return;

    if (view === 'dashboard') {
      this.renderDashboard(container);
    } else if (view === 'users') {
      this.renderUsers(container);
    } else if (view === 'verifications') {
      this.renderVerifications(container);
    } else if (view === 'reports') {
      this.renderReports(container);
    } else if (view === 'calls') {
      this.renderCalls(container);
    } else if (view === 'payments') {
      this.renderPayments(container);
    } else if (view === 'broadcast') {
      this.renderBroadcast(container);
    } else if (view === 'settings') {
      this.renderSettings(container);
    } else {
      container.innerHTML = `<div class="glass-panel" style="padding: 24px;"><h3>Module: ${view}</h3></div>`;
    }
  }

  renderDashboard(container) {
    container.innerHTML = `
      <div class="admin-topbar">
        <div>
          <h1 style="font-size: 1.8rem; font-weight: 800;">Real-Time Operations Dashboard</h1>
          <p style="color: var(--text-muted); font-size: 0.9rem;">Live system metrics, calls and safety overview</p>
        </div>
        <button class="btn-primary" onclick="alert('System healthy. Sockets active: 342. CPU: 12%')">System Status 🟢</button>
      </div>

      <div class="kpi-grid">
        <div class="kpi-card glass-panel">
          <span class="kpi-label">Total Users</span>
          <span class="kpi-val">${ADMIN_DATA.kpis.totalUsers}</span>
          <span class="kpi-sub">↑ +14% this week</span>
        </div>
        <div class="kpi-card glass-panel">
          <span class="kpi-label">Active Today</span>
          <span class="kpi-val">${ADMIN_DATA.kpis.activeToday}</span>
          <span class="kpi-sub">🟢 38 calls in progress</span>
        </div>
        <div class="kpi-card glass-panel">
          <span class="kpi-label">Matches Formed</span>
          <span class="kpi-val">${ADMIN_DATA.kpis.matchesToday}</span>
          <span class="kpi-sub">♥ 74% sent a message</span>
        </div>
        <div class="kpi-card glass-panel">
          <span class="kpi-label">Monthly Revenue</span>
          <span class="kpi-val">${ADMIN_DATA.kpis.monthlyRevenue}</span>
          <span class="kpi-sub">👑 28 new Gold users</span>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 20px;">
        <div class="glass-panel" style="padding: 24px;">
          <h3 style="font-size: 1.15rem; font-weight: 800; margin-bottom: 14px;">Recent User Registrations</h3>
          <div class="table-container">
            <table class="glass-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>City</th>
                  <th>Status</th>
                  <th>Tier</th>
                </tr>
              </thead>
              <tbody>
                ${ADMIN_DATA.users.slice(0, 4).map((u) => `
                  <tr>
                    <td><strong>${u.name}</strong></td>
                    <td>${u.city}</td>
                    <td><span class="badge-status badge-${u.status}">${u.status}</span></td>
                    <td>${u.isPremium ? '👑 Gold' : 'Free'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <div class="glass-panel" style="padding: 24px;">
          <h3 style="font-size: 1.15rem; font-weight: 800; margin-bottom: 14px;">Pending Action Items</h3>
          <div style="display: flex; flex-direction: column; gap: 12px;">
            <div class="glass-card" style="padding: 12px; display: flex; justify-content: space-between; align-items: center;">
              <span>🚨 Open Safety Reports</span>
              <span class="badge-status badge-banned">2 Open</span>
            </div>
            <div class="glass-card" style="padding: 12px; display: flex; justify-content: space-between; align-items: center;">
              <span>🤳 Blue Tick Selfie Verifications</span>
              <span class="badge-status badge-pending">3 Pending</span>
            </div>
            <div class="glass-card" style="padding: 12px; display: flex; justify-content: space-between; align-items: center;">
              <span>💳 Manual UPI Payment Approvals</span>
              <span class="badge-status badge-pending">1 Pending</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderUsers(container) {
    container.innerHTML = `
      <div class="admin-topbar">
        <div>
          <h1 style="font-size: 1.8rem; font-weight: 800;">User Management</h1>
          <p style="color: var(--text-muted); font-size: 0.9rem;">View, verify, suspend or grant VIP access</p>
        </div>
      </div>

      <div class="table-container">
        <table class="glass-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name & Email</th>
              <th>City</th>
              <th>Verified</th>
              <th>Status</th>
              <th>Plan</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${ADMIN_DATA.users.map((u) => `
              <tr>
                <td>#${u.id}</td>
                <td>
                  <div style="font-weight: 700;">${u.name}</div>
                  <div style="font-size: 0.78rem; color: var(--text-muted);">${u.email}</div>
                </td>
                <td>${u.city}</td>
                <td>${u.verified ? '<span class="badge-verified">✓ Blue Tick</span>' : '<span style="color: var(--text-faint);">No</span>'}</td>
                <td><span class="badge-status badge-${u.status}">${u.status}</span></td>
                <td>${u.isPremium ? '👑 Gold' : 'Free'}</td>
                <td>
                  <div style="display: flex; gap: 6px;">
                    <button class="btn-secondary" style="padding: 6px 12px; font-size: 0.78rem;" onclick="alert('User #${u.id} Blue Tick Granted!')">Verify</button>
                    <button class="btn-secondary" style="padding: 6px 12px; font-size: 0.78rem; color: #ef4444;" onclick="alert('User #${u.id} Suspended!')">Suspend</button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  renderVerifications(container) {
    container.innerHTML = `
      <div class="admin-topbar">
        <div>
          <h1 style="font-size: 1.8rem; font-weight: 800;">Selfie Verification Queue</h1>
          <p style="color: var(--text-muted); font-size: 0.9rem;">Side-by-side pose comparison for Blue Tick grant</p>
        </div>
      </div>

      <div class="verify-grid">
        ${ADMIN_DATA.verifications.map((v) => `
          <div class="verify-card glass-panel">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <h3 style="font-size: 1.1rem; font-weight: 800;">${v.name}</h3>
              <span class="glass-pill" style="font-size: 0.75rem;">${v.poseReq}</span>
            </div>

            <div class="verify-comparison">
              <div class="verify-photo-box">
                <img src="${v.profilePhoto}" />
                <span class="verify-photo-label">Profile Photo</span>
              </div>
              <div class="verify-photo-box">
                <img src="${v.selfiePhoto}" />
                <span class="verify-photo-label">Selfie Pose</span>
              </div>
            </div>

            <div style="display: flex; gap: 10px; margin-top: 6px;">
              <button class="btn-primary" style="flex: 1; padding: 10px; font-size: 0.85rem;" onclick="alert('Blue Tick Verified & Approved!')">Approve ✓</button>
              <button class="btn-secondary" style="flex: 1; padding: 10px; font-size: 0.85rem; color: #ef4444;" onclick="alert('Verification rejected.')">Reject ✕</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  renderReports(container) {
    container.innerHTML = `
      <div class="admin-topbar">
        <div>
          <h1 style="font-size: 1.8rem; font-weight: 800;">Safety & Moderation Reports</h1>
          <p style="color: var(--text-muted); font-size: 0.9rem;">Review flagged behavior under IT Rules 2021</p>
        </div>
      </div>

      <div class="table-container">
        <table class="glass-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Reported User</th>
              <th>Reporter</th>
              <th>Reason</th>
              <th>Severity</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${ADMIN_DATA.reports.map((r) => `
              <tr>
                <td>#${r.id}</td>
                <td><strong style="color: #ef4444;">${r.reportedUser}</strong></td>
                <td>${r.reporterName}</td>
                <td>${r.reason}</td>
                <td><span class="badge-status badge-banned">${r.severity}</span></td>
                <td>
                  <button class="btn-primary" style="padding: 6px 12px; font-size: 0.78rem; background: #ef4444;" onclick="alert('Action taken: User suspended for 7 days.')">Resolve & Warn</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  renderCalls(container) {
    container.innerHTML = `
      <div class="admin-topbar">
        <div>
          <h1 style="font-size: 1.8rem; font-weight: 800;">Audio & Video Calls Log</h1>
          <p style="color: var(--text-muted); font-size: 0.9rem;">Privacy compliant call metadata (no media recorded)</p>
        </div>
      </div>

      <div class="table-container">
        <table class="glass-table">
          <thead>
            <tr>
              <th>Call ID</th>
              <th>Caller</th>
              <th>Callee</th>
              <th>Type</th>
              <th>Duration</th>
              <th>Status</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            ${ADMIN_DATA.calls.map((c) => `
              <tr>
                <td>${c.id}</td>
                <td><strong>${c.caller}</strong></td>
                <td><strong>${c.callee}</strong></td>
                <td>${c.type === 'Video' ? '📹 Video' : '📞 Audio'}</td>
                <td>${c.duration}</td>
                <td><span class="badge-status badge-active">${c.status}</span></td>
                <td>${c.time}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  renderPayments(container) {
    container.innerHTML = `
      <div class="admin-topbar">
        <div>
          <h1 style="font-size: 1.8rem; font-weight: 800;">Manual UPI & Subscription Approvals</h1>
          <p style="color: var(--text-muted); font-size: 0.9rem;">Verify UTR numbers and approve premium status</p>
        </div>
      </div>

      <div class="table-container">
        <table class="glass-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>User</th>
              <th>Plan</th>
              <th>Amount</th>
              <th>UTR / Ref</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${ADMIN_DATA.payments.map((p) => `
              <tr>
                <td>${p.id}</td>
                <td><strong>${p.user}</strong></td>
                <td>${p.plan}</td>
                <td style="color: #2ee6a6; font-weight: 700;">${p.amount}</td>
                <td><code>${p.utr}</code></td>
                <td><span class="badge-status ${p.status === 'Approved' ? 'badge-active' : 'badge-pending'}">${p.status}</span></td>
                <td>
                  ${p.status === 'Pending' ? `
                    <button class="btn-primary" style="padding: 6px 12px; font-size: 0.78rem;" onclick="alert('UTR ${p.utr} verified! VIP activated.')">Approve</button>
                  ` : '<span>✓ Approved</span>'}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  renderBroadcast(container) {
    container.innerHTML = `
      <div class="admin-topbar">
        <div>
          <h1 style="font-size: 1.8rem; font-weight: 800;">Push Notification Broadcast</h1>
          <p style="color: var(--text-muted); font-size: 0.9rem;">Send immediate in-app & web push notification to all users</p>
        </div>
      </div>

      <div class="glass-panel" style="max-width: 600px; padding: 24px;">
        <div style="margin-bottom: 16px;">
          <label style="display: block; font-size: 0.85rem; margin-bottom: 6px; font-weight: 700;">Notification Title</label>
          <input type="text" class="glass-input" id="bcTitle" value="✨ Special Weekend Boost on Hipa!" />
        </div>
        <div style="margin-bottom: 20px;">
          <label style="display: block; font-size: 0.85rem; margin-bottom: 6px; font-weight: 700;">Message Body</label>
          <textarea class="glass-input" id="bcBody" rows="4">Over 500 people are active near you right now. Open Hipa and find your match!</textarea>
        </div>
        <button class="btn-primary" onclick="alert('Broadcast successfully dispatched to 1,248 active users!')">Send Broadcast 🚀</button>
      </div>
    `;
  }

  renderSettings(container) {
    container.innerHTML = `
      <div class="admin-topbar">
        <div>
          <h1 style="font-size: 1.8rem; font-weight: 800;">System Settings</h1>
          <p style="color: var(--text-muted); font-size: 0.9rem;">Global app configuration, limits & safety rules</p>
        </div>
      </div>

      <div class="glass-panel" style="max-width: 680px; padding: 28px; display: flex; flex-direction: column; gap: 18px;">
        <div>
          <label style="font-weight: 700; font-size: 0.9rem;">Free Daily Swipes Limit</label>
          <input type="number" class="glass-input" value="25" style="margin-top: 6px;" />
        </div>
        <div>
          <label style="font-weight: 700; font-size: 0.9rem;">Daily Free Call Minutes</label>
          <input type="number" class="glass-input" value="30" style="margin-top: 6px;" />
        </div>
        <div>
          <label style="font-weight: 700; font-size: 0.9rem;">UPI ID for Manual Payments</label>
          <input type="text" class="glass-input" value="hipa@upi" style="margin-top: 6px;" />
        </div>
        <button class="btn-primary" style="align-self: flex-start;" onclick="alert('Settings saved successfully!')">Save Configuration</button>
      </div>
    `;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const admin = new AdminController();
  admin.init();
});
