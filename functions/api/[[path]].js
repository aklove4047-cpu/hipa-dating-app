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
