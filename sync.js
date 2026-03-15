/**
 * sync.js — Mobil InputPad versiyası
 * ────────────────────────────────────
 * Yalnız APPS_SCRIPT_URL konfiqini ixrac edir.
 * Polling yoxdur, DB bridge yoxdur.
 * Bütün məntiq InputPad.html içindədir.
 */

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxyOuDSryH3AEH63cBZ95WyXx1vcCzFcNn1WrstOPgeM7sumNVz5mt8xGCWBkyGbL-9Zw/exec';

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
