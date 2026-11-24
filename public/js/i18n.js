/* =========================================================
   Hipa Dating App — i18n Translation Engine (English & Hindi)
   ========================================================= */

class I18nManager {
  constructor() {
    this.currentLang = localStorage.getItem('hipa_lang') || 'en';
    this.translations = {
      en: {},
      hi: {}
    };
    this.listeners = [];
  }

  async init() {
    try {
      const [enRes, hiRes] = await Promise.all([
        fetch('/i18n/en.json'),
        fetch('/i18n/hi.json')
      ]);
      this.translations.en = await enRes.json();
      this.translations.hi = await hiRes.json();
    } catch (e) {
      console.warn('Could not load i18n json files, using defaults', e);
    }
    this.apply();
  }

  setLang(lang) {
    if (lang !== 'en' && lang !== 'hi') return;
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
  }

  onLangChange(fn) {
    this.listeners.push(fn);
  }
}

export const i18n = new I18nManager();
