/* =========================================================
   Peelin's Dating App — Multi-Language i18n Engine (10 Indian Languages)
   ========================================================= */

const BUILTIN_STRINGS = {
  en: {
    choose_lang: "Choose your language",
    choose_lang_sub: "Select language to connect with real people who speak your mother tongue",
    continue: "Continue ➔",
    home: "Home",
    recent: "Recent",
    friends: "Friends",
    profile: "Profile",
    online: "Online",
    offline: "Offline"
  },
  hi: {
    choose_lang: "अपनी भाषा चुनें",
    choose_lang_sub: "अपनी मातृभाषा बोलने वाले असली लोगों से जुड़ने के लिए भाषा चुनें",
    continue: "आगे बढ़ें ➔",
    home: "होम",
    recent: "रीसेंट",
    friends: "दोस्त",
    profile: "प्रोफ़ाइल",
    online: "ऑनलाइन",
    offline: "ऑफ़लाइन"
  },
  pa: {
    choose_lang: "ਆਪਣੀ ਭਾਸ਼ਾ ਚੁਣੋ",
    choose_lang_sub: "ਆਪਣੀ ਮਾਂ-ਬੋਲੀ ਬੋਲਣ ਵਾਲੇ ਅਸਲੀ ਲੋਕਾਂ ਨਾਲ ਜੁੜਨ ਲਈ ਭਾਸ਼ਾ ਚੁਣੋ",
    continue: "ਅੱਗੇ ਵਧੋ ➔",
    home: "ਹੋਮ",
    recent: "ਤਾਜ਼ਾ",
    friends: "ਦੋਸਤ",
    profile: "ਪ੍ਰੋਫ਼ਾਈਲ",
    online: "ਆਨਲਾਈਨ",
    offline: "ਆਫ਼ਲਾਈਨ"
  },
  mr: {
    choose_lang: "तुमची भाषा निवडा",
    choose_lang_sub: "तुमची मातृभाषा बोलणाऱ्या खऱ्या लोकांशी जोडण्यासाठी भाषा निवडा",
    continue: "पुढे जा ➔",
    home: "होम",
    recent: "अलीकडील",
    friends: "मित्र",
    profile: "प्रोफाइल",
    online: "ऑनलाइन",
    offline: "ऑफलाइन"
  },
  bn: {
    choose_lang: "আপনার ভাষা নির্বাচন করুন",
    choose_lang_sub: "আপনার মাতৃভাষায় কথা বলা আসল মানুষের সাথে যুক্ত হতে ভাষা বেছে নিন",
    continue: "এগিয়ে যান ➔",
    home: "হোম",
    recent: "সাম্প্রতিক",
    friends: "বন্ধু",
    profile: "প্রোফাইল",
    online: "অনলাইন",
    offline: "অফলাইন"
  },
  te: {
    choose_lang: "మీ భాషను ఎంచుకోండి",
    choose_lang_sub: "మీ మాతృభాష మాట్లాడే నిజమైన వ్యక్తులతో కనెక్ట్ అవ్వడానికి భాషను ఎంచుకోండి",
    continue: "కొనసాగించు ➔",
    home: "హోమ్",
    recent: "ఇటీవలి",
    friends: "స్నేహితులు",
    profile: "ప్రొఫైల్",
    online: "ఆన్‌లైన్",
    offline: "ఆఫ్‌లైన్"
  },
  ta: {
    choose_lang: "உங்கள் மொழியைத் தேர்ந்தெடுக்கவும்",
    choose_lang_sub: "உங்கள் தாய்மொழி பேசும் உண்மையான நபர்களுடன் இணைய மொழியைத் தேர்ந்தெடுக்கவும்",
    continue: "தொடரவும் ➔",
    home: "முகப்பு",
    recent: "சமீபத்திய",
    friends: "நண்பர்கள்",
    profile: "சுயவிவரம்",
    online: "ஆன்லைன்",
    offline: "ஆஃப்லைன்"
  },
  gu: {
    choose_lang: "તમારી ભાષા પસંદ કરો",
    choose_lang_sub: "તમારી માતૃભાષા બોલતા સાચા લોકો સાથે જોડાવા માટે ભાષા પસંદ કરો",
    continue: "આગળ વધો ➔",
    home: "હોમ",
    recent: "તાજેતરનું",
    friends: "મિત્રો",
    profile: "પ્રોફાઇલ",
    online: "ઓનલાઇન",
    offline: "ઓફલાઇન"
  },
  kn: {
    choose_lang: "ನಿಮ್ಮ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ",
    choose_lang_sub: "ನಿಮ್ಮ ಮಾತೃಭಾಷೆ ಮಾತನಾಡುವ ನಿಜವಾದ ಜನರೊಂದಿಗೆ ಸಂಪರ್ಕಿಸಲು ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ",
    continue: "ಮುಂದುವರಿಸಿ ➔",
    home: "ಮುಖಪುಟ",
    recent: "ಇತ್ತೀಚಿನ",
    friends: "ಸ್ನೇಹಿತರು",
    profile: "ಪ್ರೊಫೈಲ್",
    online: "ಆನ್‌ಲೈನ್",
    offline: "ಆಫ್‌ಲೈನ್"
  },
  ml: {
    choose_lang: "നിങ്ങളുടെ ഭാഷ തിരഞ്ഞെടുക്കുക",
    choose_lang_sub: "നിങ്ങളുടെ മാതൃഭാഷ സംസാരിക്കുന്ന യഥാർത്ഥ ആളുകളുമായി ബന്ധപ്പെടാൻ ഭാഷ തിരഞ്ഞെടുക്കുക",
    continue: "തുടരുക ➔",
    home: "ഹോം",
    recent: "സമീപകാലം",
    friends: "സുഹൃത്തുക്കൾ",
    profile: "പ്രൊഫൈൽ",
    online: "ഓൺലൈൻ",
    offline: "ഓഫ്‌ലൈൻ"
  }
};

class I18nManager {
  constructor() {
    this.currentLang = localStorage.getItem('hipa_lang') || 'en';
    this.translations = { ...BUILTIN_STRINGS };
    this.listeners = [];
  }

  async init() {
    try {
      const [enRes, hiRes] = await Promise.all([
        fetch('/i18n/en.json'),
        fetch('/i18n/hi.json')
      ]);
      const enJson = await enRes.json();
      const hiJson = await hiRes.json();
      this.translations.en = { ...enJson, ...BUILTIN_STRINGS.en };
      this.translations.hi = { ...hiJson, ...BUILTIN_STRINGS.hi };
    } catch (e) {}
    this.apply();
  }

  setLang(lang) {
    if (!BUILTIN_STRINGS[lang]) return;
    this.currentLang = lang;
    localStorage.setItem('hipa_lang', lang);
    this.apply();
    this.listeners.forEach((fn) => fn(lang));
  }

  toggle() {
    this.setLang(this.currentLang === 'en' ? 'hi' : 'en');
  }

  t(key, params = {}) {
    let str = this.translations[this.currentLang]?.[key] || this.translations.en?.[key] || key;
    for (const [k, v] of Object.entries(params)) {
      str = str.replace(`{${k}}`, v);
    }
    return str;
  }

  apply() {
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (key) {
        el.textContent = this.t(key);
      }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (key) {
        el.placeholder = this.t(key);
      }
    });

    // Update Bottom Nav labels dynamically
    const navMap = { home: 'home', recent: 'recent', friends: 'friends', profile: 'profile' };
    Object.keys(navMap).forEach(tab => {
      const span = document.querySelector(`.hipa-nav-item[data-tab="${tab}"] span:last-child`);
      if (span) span.textContent = this.t(navMap[tab]);
    });
  }

  onLangChange(fn) {
    this.listeners.push(fn);
  }
}

export const i18n = new I18nManager();
window.peelinsI18n = i18n;
