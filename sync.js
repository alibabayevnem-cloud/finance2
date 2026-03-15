/**
 * sync.js — Mobil InputPad versiyası
 * ────────────────────────────────────
 * Yalnız APPS_SCRIPT_URL konfiqini ixrac edir.
 * Polling yoxdur, DB bridge yoxdur.
 * Bütün məntiq InputPad.html içindədir.
 */

const APPS_SCRIPT_URL = 'BURAYA_WEB_APP_URL_GELECEK';

window.FireSync = window.SBSync = window.GistSync = {
  APPS_SCRIPT_URL,
  pull: async () => ({ ok: true, rows: [] }),
  push: async () => ({ ok: true }),
};

// gist-ready event-i göndər ki InputPad init() işləsin
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () =>
    window.dispatchEvent(new CustomEvent('gist-ready')));
} else {
  setTimeout(() => window.dispatchEvent(new CustomEvent('gist-ready')), 0);
}
