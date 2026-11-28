// Cloudflare Pages Functions - Full API Router for Hipa Dating App
// Handles /api/v1/* endpoints according to 03-api-spec.md

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Registered Users Management Endpoint (Cloud Sync for Admin Panel)
  if (path.includes('/api/v1/users')) {
    const kv = context.env?.HIPA_DATA;

    if (request.method === 'POST') {
      try {
        const newUser = await request.json();
        if (!newUser || !newUser.phone) {
          return new Response(JSON.stringify({ ok: false, error: "Invalid user data" }), { status: 400, headers: corsHeaders });
        }

        let users = [];
        if (kv) {
          try {
            const raw = await kv.get('hipa_all_users');
            if (raw) users = JSON.parse(raw);
          } catch (e) {}
        } else {
          if (!globalThis.__HIPA_USERS__) globalThis.__HIPA_USERS__ = [];
          users = globalThis.__HIPA_USERS__;
        }

        const existingIdx = users.findIndex(u => u.phone === newUser.phone);
        if (existingIdx >= 0) {
          users[existingIdx] = { ...users[existingIdx], ...newUser, updatedAt: new Date().toISOString() };
        } else {
          users.unshift({
            ...newUser,
            id: newUser.id || Date.now(),
            registeredAt: newUser.registeredAt || new Date().toISOString()
          });
        }

        if (users.length > 2000) users = users.slice(0, 2000);

        if (kv) {
          await kv.put('hipa_all_users', JSON.stringify(users));
        } else {
          globalThis.__HIPA_USERS__ = users;
        }

        return new Response(JSON.stringify({ ok: true, message: "User registered successfully", user: newUser, totalUsers: users.length }), { headers: corsHeaders });
      } catch (err) {
        return new Response(JSON.stringify({ ok: false, error: err.message }), { status: 500, headers: corsHeaders });
      }
    }

    if (request.method === 'PUT') {
      try {
        const updateData = await request.json();
        let users = [];
        if (kv) {
          try {
            const raw = await kv.get('hipa_all_users');
            if (raw) users = JSON.parse(raw);
          } catch (e) {}
        } else {
          users = globalThis.__HIPA_USERS__ || [];
        }

        const idx = users.findIndex(u => u.id == updateData.id || u.phone == updateData.phone);
        if (idx >= 0) {
          users[idx] = { ...users[idx], ...updateData, updatedAt: new Date().toISOString() };
          if (kv) {
            await kv.put('hipa_all_users', JSON.stringify(users));
          } else {
            globalThis.__HIPA_USERS__ = users;
          }
          return new Response(JSON.stringify({ ok: true, user: users[idx] }), { headers: corsHeaders });
        }
        return new Response(JSON.stringify({ ok: false, error: "User not found" }), { status: 404, headers: corsHeaders });
      } catch (err) {
        return new Response(JSON.stringify({ ok: false, error: err.message }), { status: 500, headers: corsHeaders });
      }
    }

    if (request.method === 'DELETE') {
      try {
        if (kv) {
          await kv.put('hipa_all_users', JSON.stringify([]));
        } else {
          globalThis.__HIPA_USERS__ = [];
        }
        return new Response(JSON.stringify({ ok: true, message: "All users reset", totalUsers: 0 }), { headers: corsHeaders });
      } catch (err) {
        return new Response(JSON.stringify({ ok: false, error: err.message }), { status: 500, headers: corsHeaders });
      }
    }

    // GET /api/v1/users
    let users = [];
    if (kv) {
      try {
        const raw = await kv.get('hipa_all_users');
        if (raw) users = JSON.parse(raw);
      } catch (e) {}
    } else {
      users = globalThis.__HIPA_USERS__ || [];
    }

    return new Response(JSON.stringify({
      ok: true,
      totalUsers: users.length,
      users: users
    }), { headers: corsHeaders });
  }

  // 18+ Verification & Audio/Selfie Review Queue
  if (path.includes('/api/v1/verifications')) {
    const kv = context.env?.HIPA_DATA;

    if (request.method === 'POST') {
      try {
        const item = await request.json();
        let queue = [];
        if (kv) {
          try {
            const raw = await kv.get('hipa_verifications_queue');
            if (raw) queue = JSON.parse(raw);
          } catch (e) {}
        } else {
          if (!globalThis.__HIPA_VERIFICATIONS__) globalThis.__HIPA_VERIFICATIONS__ = [];
          queue = globalThis.__HIPA_VERIFICATIONS__;
        }

        const newEntry = {
          id: item.id || Date.now(),
          userId: item.userId || Date.now(),
          name: item.name || "User",
          phone: item.phone || "",
          gender: item.gender || "female",
          age: item.age || 21,
          dob: item.dob || "2003-05-15",
          profilePhoto: item.profilePhoto || "/images/avatar_female_ashley.jpg",
          selfiePhoto: item.selfiePhoto || "/images/avatar_female_ashley.jpg",
          audioUrl: item.audioUrl || "https://actions.google.com/sounds/v1/speech/hello_greeting.ogg",
          poseReq: item.poseReq || "Peace Sign ✌️",
          status: "pending",
          submittedAt: new Date().toISOString()
        };

        queue.unshift(newEntry);
        if (queue.length > 500) queue = queue.slice(0, 500);

        if (kv) {
          await kv.put('hipa_verifications_queue', JSON.stringify(queue));
        } else {
          globalThis.__HIPA_VERIFICATIONS__ = queue;
        }

        return new Response(JSON.stringify({ ok: true, message: "Verification submitted for admin approval", item: newEntry }), { headers: corsHeaders });
      } catch (err) {
        return new Response(JSON.stringify({ ok: false, error: err.message }), { status: 500, headers: corsHeaders });
      }
    }

    if (request.method === 'PUT') {
      try {
        const updateData = await request.json();
        let queue = [];
        if (kv) {
          try {
            const raw = await kv.get('hipa_verifications_queue');
            if (raw) queue = JSON.parse(raw);
          } catch (e) {}
        } else {
          queue = globalThis.__HIPA_VERIFICATIONS__ || [];
        }

        const idx = queue.findIndex(v => v.id == updateData.id || v.userId == updateData.userId);
        if (idx >= 0) {
          queue[idx] = { ...queue[idx], ...updateData };
          if (kv) {
            await kv.put('hipa_verifications_queue', JSON.stringify(queue));
          } else {
            globalThis.__HIPA_VERIFICATIONS__ = queue;
          }
          return new Response(JSON.stringify({ ok: true, item: queue[idx] }), { headers: corsHeaders });
        }
        return new Response(JSON.stringify({ ok: false, error: "Entry not found" }), { status: 404, headers: corsHeaders });
      } catch (err) {
        return new Response(JSON.stringify({ ok: false, error: err.message }), { status: 500, headers: corsHeaders });
      }
    }

    // GET /api/v1/verifications
    let queue = [];
    if (kv) {
      try {
        const raw = await kv.get('hipa_verifications_queue');
        if (raw) queue = JSON.parse(raw);
      } catch (e) {}
    } else {
      queue = globalThis.__HIPA_VERIFICATIONS__ || [];
    }

    return new Response(JSON.stringify({
      ok: true,
      total: queue.length,
      verifications: queue
    }), { headers: corsHeaders });
  }

  // Safety & Moderation Reports Endpoint
  if (path.includes('/api/v1/reports')) {
    if (request.method === 'POST') {
      try {
        const report = await request.json();
        let reports = [];
        if (kv) {
          try {
            const raw = await kv.get('hipa_safety_reports');
            if (raw) reports = JSON.parse(raw);
          } catch (e) {}
        } else {
          if (!globalThis.__HIPA_REPORTS__) globalThis.__HIPA_REPORTS__ = [];
          reports = globalThis.__HIPA_REPORTS__;
        }

        const newReport = {
          id: report.id || Date.now(),
          reporterId: report.reporterId || "anonymous",
          reporterName: report.reporterName || "User",
          reportedUser: report.reportedUser || "Target User",
          reportedId: report.reportedId || "",
          reason: report.reason || "Safety guideline violation",
          severity: report.severity || "High",
          status: "open",
          createdAt: new Date().toISOString()
        };

        reports.unshift(newReport);
        if (reports.length > 500) reports = reports.slice(0, 500);

        if (kv) {
          await kv.put('hipa_safety_reports', JSON.stringify(reports));
        } else {
          globalThis.__HIPA_REPORTS__ = reports;
        }

        return new Response(JSON.stringify({ ok: true, message: "Report logged successfully", report: newReport }), { headers: corsHeaders });
      } catch (err) {
        return new Response(JSON.stringify({ ok: false, error: err.message }), { status: 500, headers: corsHeaders });
      }
    }

    if (request.method === 'PUT') {
      try {
        const updateData = await request.json();
        let reports = [];
        if (kv) {
          try {
            const raw = await kv.get('hipa_safety_reports');
            if (raw) reports = JSON.parse(raw);
          } catch (e) {}
        } else {
          reports = globalThis.__HIPA_REPORTS__ || [];
        }

        const idx = reports.findIndex(r => String(r.id) === String(updateData.id));
        if (idx >= 0) {
          reports[idx] = { ...reports[idx], ...updateData };
          if (kv) {
            await kv.put('hipa_safety_reports', JSON.stringify(reports));
          } else {
            globalThis.__HIPA_REPORTS__ = reports;
          }
          return new Response(JSON.stringify({ ok: true, report: reports[idx] }), { headers: corsHeaders });
        }
        return new Response(JSON.stringify({ ok: false, error: "Report not found" }), { status: 404, headers: corsHeaders });
      } catch (err) {
        return new Response(JSON.stringify({ ok: false, error: err.message }), { status: 500, headers: corsHeaders });
      }
    }

    // GET /api/v1/reports
    let reports = [];
    if (kv) {
      try {
        const raw = await kv.get('hipa_safety_reports');
        if (raw) reports = JSON.parse(raw);
      } catch (e) {}
    } else {
      reports = globalThis.__HIPA_REPORTS__ || [];
    }

    return new Response(JSON.stringify({
      ok: true,
      total: reports.length,
      reports: reports
    }), { headers: corsHeaders });
  }

  // Gateway & API Config Endpoint
  if (path.includes('/api/v1/gateways/config')) {
    if (request.method === 'POST') {
      try {
        const body = await request.json();
        return new Response(JSON.stringify({ ok: true, message: "Gateways configuration updated", config: body }), { headers: corsHeaders });
      } catch (err) {
        return new Response(JSON.stringify({ ok: false, error: "Invalid JSON body" }), { status: 400, headers: corsHeaders });
      }
    }
    return new Response(JSON.stringify({
      ok: true,
      data: {
        activePaymentGateway: "razorpay",
        razorpayKeyId: "rzp_test_1DP5mmOlF5G5ag",
        activeOtpProvider: "mock",
        upiVpa: "hipabiz@icici",
        geminiEnabled: true
      }
    }), { headers: corsHeaders });
  }

  // OTP Dispatch Endpoint
  if (path.includes('/api/v1/auth/send-otp')) {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    return new Response(JSON.stringify({
      ok: true,
      message: "OTP dispatched successfully",
      testCode: "123456"
    }), { headers: corsHeaders });
  }

  // Payment Order Creation Endpoint
  if (path.includes('/api/v1/payments/create-order')) {
    const orderId = 'order_' + Date.now();
    return new Response(JSON.stringify({
      ok: true,
      orderId,
      amount: 29900,
      currency: "INR",
      activeGateway: "razorpay"
    }), { headers: corsHeaders });
  }

  // Dynamic Global Settings Endpoint
  if (path.includes('/api/v1/settings')) {
    const kv = context.env?.HIPA_DATA;
    if (request.method === 'POST' || request.method === 'PUT') {
      try {
        const body = await request.json();
        if (kv) {
          await kv.put('peelins_global_settings', JSON.stringify(body));
        } else {
          globalThis.__PEELINS_SETTINGS__ = body;
        }
        return new Response(JSON.stringify({ ok: true, message: "Settings saved successfully", settings: body }), { headers: corsHeaders });
      } catch (e) {
        return new Response(JSON.stringify({ ok: false, error: e.message }), { status: 500, headers: corsHeaders });
      }
    }

    let settings = null;
    if (kv) {
      try {
        const raw = await kv.get('peelins_global_settings');
        if (raw) settings = JSON.parse(raw);
      } catch (e) {}
    } else {
      settings = globalThis.__PEELINS_SETTINGS__;
    }
    return new Response(JSON.stringify({ ok: true, settings: settings || null }), { headers: corsHeaders });
  }

  // Dynamic Avatars Library Endpoint
  if (path.includes('/api/v1/avatars')) {
    const kv = context.env?.HIPA_DATA;
    if (request.method === 'POST' || request.method === 'PUT') {
      try {
        const body = await request.json();
        const list = Array.isArray(body) ? body : (body.avatars || []);
        if (kv) {
          await kv.put('peelins_custom_avatars', JSON.stringify(list));
        } else {
          globalThis.__PEELINS_AVATARS__ = list;
        }
        return new Response(JSON.stringify({ ok: true, message: "Avatars saved successfully", avatars: list }), { headers: corsHeaders });
      } catch (e) {
        return new Response(JSON.stringify({ ok: false, error: e.message }), { status: 500, headers: corsHeaders });
      }
    }

    let avatars = null;
    if (kv) {
      try {
        const raw = await kv.get('peelins_custom_avatars');
        if (raw) avatars = JSON.parse(raw);
      } catch (e) {}
    } else {
      avatars = globalThis.__PEELINS_AVATARS__;
    }
    return new Response(JSON.stringify({ ok: true, avatars: avatars || null }), { headers: corsHeaders });
  }

  // App Config
  if (path.includes('/api/v1/app-config')) {
    return new Response(JSON.stringify({
      ok: true,
      data: {
        appName: "Hipa",
        version: "1.0.0",
        dailyFreeSwipes: 25,
        freeCallMinutesDaily: 30,
        maintenance: false
      }
    }), { headers: corsHeaders });
  }

  // WebRTC Call Signaling Endpoint (Cloudflare KV-backed Real-Time Fallback)
  if (path.includes('/api/v1/calls') && !path.includes('ice-config')) {
    const kv = context.env?.HIPA_DATA;

    const loadCalls = async () => {
      if (kv) {
        try {
          const raw = await kv.get('peelins_active_calls');
          if (raw) return JSON.parse(raw);
        } catch (e) {}
      }
      return globalThis.__PEELINS_CALLS__ || [];
    };

    const saveCalls = async (calls) => {
      // Keep only calls from last 15 minutes
      const cutoff = Date.now() - 15 * 60 * 1000;
      const trimmed = calls.filter(c => (c.createdAtMs || 0) > cutoff).slice(0, 100);
      if (kv) {
        await kv.put('peelins_active_calls', JSON.stringify(trimmed));
      } else {
        globalThis.__PEELINS_CALLS__ = trimmed;
      }
    };

    if (request.method === 'POST') {
      try {
        const body = await request.json();
        const calls = await loadCalls();
        const callId = body.id || ('call_' + Date.now() + '_' + Math.floor(Math.random() * 1000));
        const newCall = {
          ...body,
          id: callId,
          status: body.status || 'ringing',
          callerCandidates: body.callerCandidates || [],
          receiverCandidates: body.receiverCandidates || [],
          createdAtMs: Date.now()
        };
        calls.unshift(newCall);
        await saveCalls(calls);
        return new Response(JSON.stringify({ ok: true, call: newCall }), { headers: corsHeaders });
      } catch (err) {
        return new Response(JSON.stringify({ ok: false, error: err.message }), { status: 500, headers: corsHeaders });
      }
    }

    if (request.method === 'PUT') {
      try {
        const body = await request.json();
        const calls = await loadCalls();
        const idx = calls.findIndex(c => String(c.id) === String(body.id));
        if (idx === -1) {
          return new Response(JSON.stringify({ ok: false, error: 'Call not found' }), { status: 404, headers: corsHeaders });
        }
        if (body.addCandidate && body.role) {
          const field = body.role === 'caller' ? 'callerCandidates' : 'receiverCandidates';
          calls[idx][field] = calls[idx][field] || [];
          calls[idx][field].push(body.addCandidate);
        } else {
          calls[idx] = { ...calls[idx], ...body, updatedAtMs: Date.now() };
        }
        await saveCalls(calls);
        return new Response(JSON.stringify({ ok: true, call: calls[idx] }), { headers: corsHeaders });
      } catch (err) {
        return new Response(JSON.stringify({ ok: false, error: err.message }), { status: 500, headers: corsHeaders });
      }
    }

    if (request.method === 'GET') {
      const receiverId = url.searchParams.get('receiverId');
      const callId = url.searchParams.get('callId');
      const calls = await loadCalls();
      if (callId) {
        const found = calls.find(c => String(c.id) === String(callId));
        return new Response(JSON.stringify({ ok: true, call: found || null }), { headers: corsHeaders });
      }
      if (receiverId) {
        const incoming = calls.filter(c => String(c.receiverId) === String(receiverId) && c.status === 'ringing');
        return new Response(JSON.stringify({ ok: true, calls: incoming }), { headers: corsHeaders });
      }
      return new Response(JSON.stringify({ ok: true, calls }), { headers: corsHeaders });
    }
  }

  // Firebase Web Client Config (API key loaded from Cloudflare Pages secret env)
  if (path.includes('/api/v1/firebase-config')) {
    return new Response(JSON.stringify({
      ok: true,
      config: {
        apiKey: context.env?.FIREBASE_API_KEY || "",
        authDomain: "peelins-app.firebaseapp.com",
        projectId: "peelins-app",
        storageBucket: "peelins-app.firebasestorage.app",
        messagingSenderId: "844854977384",
        appId: "1:844854977384:android:29b2c6b13721ccc1f12cdd"
      }
    }), { headers: corsHeaders });
  }

  // ICE Config for WebRTC (Coturn / STUN)
  if (path.includes('/api/v1/calls/ice-config')) {
    return new Response(JSON.stringify({
      ok: true,
      data: {
        ttl: 3600,
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" }
        ]
      }
    }), { headers: corsHeaders });
  }

  // Auth Status / Me
  if (path.includes('/api/v1/me')) {
    return new Response(JSON.stringify({
      ok: true,
      data: {
        id: 1,
        name: "Aman Kapoor",
        email: "aman@example.com",
        city: "Mumbai",
        isPremium: false,
        verified: true
      }
    }), { headers: corsHeaders });
  }

  // Default Fallback
  return new Response(JSON.stringify({
    ok: true,
    message: "Hipa API endpoint active",
    path: path
  }), { headers: corsHeaders });
}
