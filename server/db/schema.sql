-- LoveLink Database Schema (SQLite 3) — v1.0
-- Run once: sqlite3 data/app.db < 02-database-schema.sql
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- ============ USERS & AUTH ============
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  password_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','hidden','suspended','banned','deleted')),
  email_verified INTEGER NOT NULL DEFAULT 0,
  photo_verified INTEGER NOT NULL DEFAULT 0,
  is_premium INTEGER NOT NULL DEFAULT 0,
  premium_until TEXT,
  boost_until TEXT,
  language TEXT NOT NULL DEFAULT 'en',
  last_seen_at TEXT,
  consent_version TEXT,
  consent_at TEXT,
  failed_logins INTEGER NOT NULL DEFAULT 0,
  locked_until TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at TEXT
);
CREATE INDEX idx_users_status ON users(status);

CREATE TABLE otp_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  purpose TEXT NOT NULL CHECK (purpose IN ('signup','reset','email_change')),
  attempts INTEGER NOT NULL DEFAULT 0,
  expires_at TEXT NOT NULL,
  used INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_otp_email ON otp_codes(email, purpose);

CREATE TABLE refresh_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  device TEXT,
  ip TEXT,
  expires_at TEXT NOT NULL,
  revoked INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============ PROFILE ============
CREATE TABLE profiles (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  dob TEXT NOT NULL,                       -- YYYY-MM-DD, must be >= 18 years
  gender TEXT NOT NULL CHECK (gender IN ('male','female','other')),
  interested_in TEXT NOT NULL CHECK (interested_in IN ('male','female','everyone')),
  bio TEXT,
  job_title TEXT,
  education TEXT,
  height_cm INTEGER,
  relationship_goal TEXT CHECK (relationship_goal IN ('long_term','short_term','friendship','marriage','not_sure')),
  languages TEXT,                          -- comma separated
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'India',
  latitude REAL,
  longitude REAL,
  location_updated_at TEXT,
  show_age INTEGER NOT NULL DEFAULT 1,
  show_distance INTEGER NOT NULL DEFAULT 1,
  show_online INTEGER NOT NULL DEFAULT 1,
  completion_pct INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_profiles_geo ON profiles(latitude, longitude);
CREATE INDEX idx_profiles_gender ON profiles(gender, interested_in);

CREATE TABLE profile_photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  thumb_url TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  is_main INTEGER NOT NULL DEFAULT 0,
  moderation_status TEXT NOT NULL DEFAULT 'pending' CHECK (moderation_status IN ('pending','approved','rejected')),
  rejected_reason TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_photos_user ON profile_photos(user_id, position);

CREATE TABLE interests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name_en TEXT NOT NULL UNIQUE,
  name_hi TEXT,
  icon TEXT,
  active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE user_interests (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  interest_id INTEGER NOT NULL REFERENCES interests(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, interest_id)
);

CREATE TABLE profile_prompts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL
);

CREATE TABLE discovery_preferences (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  min_age INTEGER NOT NULL DEFAULT 18,
  max_age INTEGER NOT NULL DEFAULT 40,
  max_distance_km INTEGER NOT NULL DEFAULT 50,
  show_gender TEXT NOT NULL DEFAULT 'everyone',
  verified_only INTEGER NOT NULL DEFAULT 0,
  goal_filter TEXT
);

CREATE TABLE verifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  selfie_url TEXT NOT NULL,
  pose_code TEXT NOT NULL,                 -- e.g. "peace sign + left hand up"
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  reviewed_by INTEGER REFERENCES admin_users(id),
  reviewed_at TEXT,
  reject_reason TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============ SWIPES & MATCHES ============
CREATE TABLE swipes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  from_user INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('like','pass','superlike')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (from_user, to_user)
);
CREATE INDEX idx_swipes_to ON swipes(to_user, action);
CREATE INDEX idx_swipes_day ON swipes(from_user, created_at);

CREATE TABLE matches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_a INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,   -- always smaller id
  user_b INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,   -- always larger id
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','unmatched','blocked')),
  unmatched_by INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (user_a, user_b),
  CHECK (user_a < user_b)
);
CREATE INDEX idx_matches_a ON matches(user_a, status);
CREATE INDEX idx_matches_b ON matches(user_b, status);

-- ============ CHAT ============
CREATE TABLE messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  match_id INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'text' CHECK (type IN ('text','image','voice','system','call')),
  body TEXT,
  media_url TEXT,
  client_id TEXT,                          -- for de-duplication / optimistic UI
  delivered_at TEXT,
  read_at TEXT,
  deleted_for_sender INTEGER NOT NULL DEFAULT 0,
  deleted_for_all INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_messages_match ON messages(match_id, id);
CREATE UNIQUE INDEX idx_messages_client ON messages(sender_id, client_id) WHERE client_id IS NOT NULL;

-- ============ CALLS ============
CREATE TABLE calls (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  match_id INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  caller_id INTEGER NOT NULL REFERENCES users(id),
  callee_id INTEGER NOT NULL REFERENCES users(id),
  type TEXT NOT NULL CHECK (type IN ('audio','video')),
  status TEXT NOT NULL DEFAULT 'ringing' CHECK (status IN ('ringing','accepted','rejected','missed','busy','ended','failed','cancelled')),
  started_at TEXT,                         -- when accepted
  ended_at TEXT,
  duration_sec INTEGER NOT NULL DEFAULT 0,
  end_reason TEXT,                         -- hangup, timeout, network, blocked
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_calls_match ON calls(match_id, id);
CREATE INDEX idx_calls_user ON calls(caller_id, callee_id);

-- ============ SAFETY ============
CREATE TABLE blocks (
  blocker_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (blocker_id, blocked_id)
);

CREATE TABLE reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reporter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reported_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL DEFAULT 'user' CHECK (target_type IN ('user','message','photo','call')),
  target_id INTEGER,
  reason TEXT NOT NULL CHECK (reason IN ('fake','harassment','nudity','scam','underage','spam','hate','other')),
  details TEXT,
  screenshot_url TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_review','action_taken','dismissed')),
  resolved_by INTEGER REFERENCES admin_users(id),
  resolution_note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  resolved_at TEXT
);
CREATE INDEX idx_reports_status ON reports(status, created_at);
CREATE INDEX idx_reports_reported ON reports(reported_id);

-- ============ NOTIFICATIONS ============
CREATE TABLE notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('match','message','like','superlike','call','missed_call','admin','system','plan')),
  title TEXT NOT NULL,
  body TEXT,
  data_json TEXT,
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_notif_user ON notifications(user_id, is_read, id);

CREATE TABLE push_subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('webpush','fcm')),
  endpoint_or_token TEXT NOT NULL,
  keys_json TEXT,
  device TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (user_id, endpoint_or_token)
);

CREATE TABLE notification_settings (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  push_matches INTEGER NOT NULL DEFAULT 1,
  push_messages INTEGER NOT NULL DEFAULT 1,
  push_likes INTEGER NOT NULL DEFAULT 1,
  push_calls INTEGER NOT NULL DEFAULT 1,
  email_updates INTEGER NOT NULL DEFAULT 0
);

-- ============ PREMIUM & PAYMENTS ============
CREATE TABLE plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,                      -- Gold, Platinum
  duration_days INTEGER NOT NULL,
  price_inr INTEGER NOT NULL,              -- in rupees
  features_json TEXT NOT NULL,             -- {"unlimited_swipes":true,"see_likes":true,"undo":true,"video_calls":true,"boosts_per_month":2,"superlikes_per_day":5}
  active INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE coupons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  discount_pct INTEGER,
  free_days INTEGER,
  max_uses INTEGER,
  used_count INTEGER NOT NULL DEFAULT 0,
  expires_at TEXT,
  active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id INTEGER NOT NULL REFERENCES plans(id),
  starts_at TEXT NOT NULL,
  ends_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','expired','cancelled')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id INTEGER REFERENCES plans(id),
  amount_inr INTEGER NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('razorpay','upi_manual','admin_grant','coupon')),
  gateway_order_id TEXT,
  gateway_payment_id TEXT,
  utr_number TEXT,                         -- for manual UPI
  proof_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','success','failed','refunded','rejected')),
  coupon_id INTEGER REFERENCES coupons(id),
  approved_by INTEGER REFERENCES admin_users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE daily_usage (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day TEXT NOT NULL,                       -- YYYY-MM-DD
  swipes INTEGER NOT NULL DEFAULT 0,
  superlikes INTEGER NOT NULL DEFAULT 0,
  call_seconds INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, day)
);

-- ============ ADMIN ============
CREATE TABLE admin_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('super_admin','moderator','support','finance')),
  active INTEGER NOT NULL DEFAULT 1,
  last_login_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE admin_audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  admin_id INTEGER NOT NULL REFERENCES admin_users(id),
  action TEXT NOT NULL,                    -- e.g. user.ban, report.resolve, plan.update
  entity TEXT,
  entity_id INTEGER,
  meta_json TEXT,
  ip TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_audit_admin ON admin_audit_logs(admin_id, created_at);

CREATE TABLE app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE cms_pages (
  slug TEXT PRIMARY KEY,                   -- terms, privacy, guidelines, safety, about, faq
  title_en TEXT NOT NULL,
  title_hi TEXT,
  body_en TEXT NOT NULL,
  body_hi TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE broadcasts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  audience TEXT NOT NULL DEFAULT 'all',    -- all, premium, free, city:<name>
  sent_by INTEGER NOT NULL REFERENCES admin_users(id),
  sent_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============ DEFAULT SETTINGS ============
INSERT INTO app_settings (key, value) VALUES
 ('free_daily_swipes','50'),
 ('free_daily_superlikes','1'),
 ('calls_access','all'),                  -- all | premium_only
 ('free_daily_call_minutes','30'),
 ('auto_suspend_report_count','5'),
 ('photo_moderation','post'),             -- pre | post
 ('min_age','18'),
 ('max_photos','6'),
 ('ring_timeout_sec','45'),
 ('maintenance_mode','0'),
 ('app_name','LoveLink');

INSERT INTO plans (name,duration_days,price_inr,features_json,sort_order) VALUES
 ('Gold',30,299,'{"unlimited_swipes":true,"see_likes":true,"undo":true,"video_calls":true,"boosts_per_month":1,"superlikes_per_day":5}',1),
 ('Platinum',90,699,'{"unlimited_swipes":true,"see_likes":true,"undo":true,"video_calls":true,"boosts_per_month":3,"superlikes_per_day":10,"priority_likes":true}',2);

INSERT INTO interests (name_en,name_hi) VALUES
 ('Music','संगीत'),('Travel','यात्रा'),('Movies','फ़िल्में'),('Fitness','फ़िटनेस'),('Cooking','खाना बनाना'),
 ('Reading','पढ़ना'),('Gaming','गेमिंग'),('Photography','फ़ोटोग्राफ़ी'),('Dancing','डांसिंग'),('Cricket','क्रिकेट'),
 ('Art','कला'),('Pets','पालतू जानवर'),('Foodie','खाने के शौकीन'),('Yoga','योग'),('Tech','टेक');
