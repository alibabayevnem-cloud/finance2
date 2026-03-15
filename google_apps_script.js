/**
 * Google Apps Script — Maliyya InputPad Inbox
 * ─────────────────────────────────────────────
 * Deploy: Extensions > Apps Script > Deploy > Web App
 *   Execute as: Me
 *   Who has access: Anyone  (və ya "Anyone with Google account")
 *
 * Sheet adı: InputInbox
 * Sütunlar (A-dan başlayaraq):
 *   A: id | B: createdAt | C: Tarix | D: Emeliyyat | E: Kateqoriya
 *   F: Qeyd | G: Mebleg | H: source | I: status
 */

// ── Konfiqurasiya ──────────────────────────────────────────────
const SHEET_NAME   = 'InputInbox';
const STATUS_NEW   = 'new';
const STATUS_DONE  = 'processed';

// Sütun sırası (1-based)
const COL = {
  id:         1,
  createdAt:  2,
  Tarix:      3,
  Emeliyyat:  4,
  Kateqoriya: 5,
  Qeyd:       6,
  Mebleg:     7,
  source:     8,
  status:     9,
};
const TOTAL_COLS = 9;

// ── Sheet əldə et (yoxdursa yarat) ────────────────────────────
function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    // Başlıq sırası
    sh.getRange(1, 1, 1, TOTAL_COLS).setValues([[
      'id','createdAt','Tarix','Emeliyyat','Kateqoriya',
      'Qeyd','Mebleg','source','status'
    ]]);
    sh.setFrozenRows(1);
  }
  return sh;
}

// ── CORS headers ───────────────────────────────────────────────
function corsHeaders() {
  return ContentService
    .createTextOutput()
    .setMimeType(ContentService.MimeType.JSON);
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── doGet: PC polling → yeni qeydlər ──────────────────────────
// URL: ?action=pull
function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) || 'pull';
    if (action !== 'pull') return jsonResponse({ ok: false, msg: 'unknown action' });

    const sh = getSheet();
    const lastRow = sh.getLastRow();

    if (lastRow <= 1) {
      return jsonResponse({ ok: true, rows: [] });
    }

    // Bütün sətirləri oxu (başlıq sırası xaric)
    const data = sh.getRange(2, 1, lastRow - 1, TOTAL_COLS).getValues();
    const rows = [];

    for (const r of data) {
      const status = String(r[COL.status - 1] || '').trim();
      if (status !== STATUS_NEW) continue;  // Yalnız 'new' qeydlər

      rows.push({
        id:         String(r[COL.id         - 1] || ''),
        createdAt:  String(r[COL.createdAt  - 1] || ''),
        Tarix:      String(r[COL.Tarix      - 1] || ''),
        Emeliyyat:  String(r[COL.Emeliyyat  - 1] || ''),
        Kateqoriya: String(r[COL.Kateqoriya - 1] || ''),
        Qeyd:       String(r[COL.Qeyd       - 1] || ''),
        Mebleg:     String(r[COL.Mebleg     - 1] || '0'),
        source:     String(r[COL.source     - 1] || ''),
      });
    }

    return jsonResponse({ ok: true, rows });

  } catch (err) {
    return jsonResponse({ ok: false, msg: err.message });
  }
}

// ── doPost: submit (InputPad) + ack (PC) ──────────────────────
function doPost(e) {
  try {
    let body;
    try {
      body = JSON.parse(e.postData.contents);
    } catch (_) {
      return jsonResponse({ ok: false, msg: 'invalid JSON' });
    }

    // ── action=submit: yeni əməliyyat əlavə et ────────────────
    if (body.action === 'submit') {
      const tx = body.tx;
      if (!tx || !tx.id) return jsonResponse({ ok: false, msg: 'id yoxdur' });

      // Duplicate yoxlaması: eyni id mövcuddursa rədd et
      const sh = getSheet();
      const lastRow = sh.getLastRow();
      if (lastRow > 1) {
        const ids = sh.getRange(2, COL.id, lastRow - 1, 1).getValues().flat().map(String);
        if (ids.includes(String(tx.id))) {
          return jsonResponse({ ok: true, msg: 'duplicate — skip' });
        }
      }

      sh.appendRow([
        tx.id         || '',
        tx.createdAt  || new Date().toISOString(),
        tx.Tarix      || '',
        tx.Emeliyyat  || '',
        tx.Kateqoriya || '',
        tx.Qeyd       || '',
        tx.Mebleg     || '0',
        tx.source     || 'inputpad_mobile',
        STATUS_NEW,
      ]);

      return jsonResponse({ ok: true, msg: 'submitted' });
    }

    // ── action=ack: PC-nin import etdiyi id-ləri işarələ ──────
    if (body.action === 'ack') {
      const ids = body.ids;
      if (!Array.isArray(ids) || ids.length === 0) {
        return jsonResponse({ ok: true, msg: 'no ids' });
      }

      const sh = getSheet();
      const lastRow = sh.getLastRow();
      if (lastRow <= 1) return jsonResponse({ ok: true, acked: 0 });

      const idCol  = sh.getRange(2, COL.id,     lastRow - 1, 1).getValues();
      const stCol  = sh.getRange(2, COL.status, lastRow - 1, 1).getValues();

      let acked = 0;
      for (let i = 0; i < idCol.length; i++) {
        if (ids.includes(String(idCol[i][0])) && stCol[i][0] !== STATUS_DONE) {
          sh.getRange(i + 2, COL.status).setValue(STATUS_DONE);
          acked++;
        }
      }

      return jsonResponse({ ok: true, acked });
    }

    return jsonResponse({ ok: false, msg: 'unknown action: ' + body.action });

  } catch (err) {
    return jsonResponse({ ok: false, msg: err.message });
  }
}
