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
