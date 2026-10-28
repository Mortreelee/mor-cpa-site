/* ============================================================
   MOR CPA — מחשבון קיבוע זכויות (עמוד /machshevon/kibua/)

   הערכים והנוסחאות מתוך כלי קיבוע הזכויות:
   kibua/mapa-misuy-prisha.md — §1 סל הפטור, §3 המקדם והרצפה, §5 היוון (1:1).
   מדרגות המס ושווי נקודת זיכוי 2026 — kibua/app.js, TAX[2026].

   עדכון שנתי (ינואר): רק האובייקט Y למטה. ב-2027 שיעור הפטור 62.5%;
   התקרות קפואות עד 2027 (חוק ההתייעלות, התשפ"ה-2024).
   ============================================================ */
(function () {
  'use strict';

  var Y = {
    year: 2026,
    ceiling: 9430,       // תקרת הקצבה המזכה
    rate: 0.575,         // שיעור הפטור הכולל
    rateBase: 0.35,      // הרובד הבסיסי — רק הוא נשחק ממענקים
    kHon: 180,           // מכפיל ההמרה להון שבחוק
    grantCap: 13750,     // תקרת מענק פטור לשנה, 9(7א)(א)
    br: [[84120,.10],[120720,.14],[228000,.20],[301200,.31],[560280,.35],[Infinity,.47]],
    yesef: { t: 721560, r: .03 },
    cp: 242,             // שווי נקודת זיכוי לחודש
    minPension: 5306     // קצבה מזערית — תנאי להיוון
  };
  var kOff     = (Y.kHon * Y.ceiling * Y.rateBase) / (32 * Y.grantCap); // חוזר 2/2013 §4.2.3, לא 1.35 קבוע
  var basket   = Y.ceiling * Y.rate * Y.kHon;                            // סל הפטור
  var floorCap = Y.ceiling * Y.rateBase * Y.kHon;                        // הקיזוז המרבי — רצפת 35%

  function bracketTax(x) {
    if (!(x > 0)) return 0;
    var t = 0, prev = 0;
    for (var i = 0; i < Y.br.length; i++) {
      if (x <= prev) break;
      t += (Math.min(x, Y.br[i][0]) - prev) * Y.br[i][1];
      prev = Y.br[i][0];
    }
    if (x > Y.yesef.t) t += (x - Y.yesef.t) * Y.yesef.r;
    return t;
  }
  function taxYear(x, cpts) { return Math.max(0, bracketTax(x) - Y.cp * 12 * cpts); }

  // ההכנסה הנוספת יושבת מתחת, והקצבה החייבת נערמת מעליה
  function compute(pension, grants, hivun, cpts, other) {
    var gOff    = Math.min(grants * kOff, floorCap);
    var afterG  = basket - gOff;
    var hOff    = Math.min(hivun, afterG);
    var left    = afterG - hOff;
    var monthly = Math.min(pension, left / Y.kHon);
    var base    = (other || 0) * 12;
    var save    = taxYear(base + pension * 12, cpts) - taxYear(base + (pension - monthly) * 12, cpts);
    return { gOff: gOff, hOff: hOff, left: left, monthly: monthly, saveYear: save, hivunCut: hivun > afterG };
  }

  if (typeof module !== 'undefined' && module.exports) { module.exports = { compute: compute, basket: basket, kOff: kOff, Y: Y }; return; }

  /* ---------- ממשק ---------- */
  var $ = function (id) { return document.getElementById(id); };
  if (!$('kc')) return;
  var nis = function (v) { return '₪' + Math.round(v).toLocaleString('he-IL'); };
  var num = function (s) { return parseFloat(String(s).replace(/[^\d.]/g, '')) || 0; };
  var cptsDefault = 2.25;

  function render() {
    var pen = num($('pen').value), gr = num($('grant').value), hv = num($('hivun').value), ot = num($('other').value);
    var cp = parseFloat(String($('cpts').value).replace(/[^\d.]/g, ''));
    if (!isFinite(cp)) cp = cptsDefault;
    var r = compute(pen, gr, hv, cp, ot);
    var pct = pen > 0 ? Math.round(r.monthly / pen * 100) : 0;
    $('ring').style.setProperty('--p', pct);
    $('pct').textContent = pct + '% מהקצבה';
    $('rEx').textContent = nis(r.monthly);
    $('rTx').textContent = nis(Math.max(0, pen - r.monthly));
    $('save').textContent = nis(r.saveYear / 12);
    $('saveY').textContent = 'שהם ' + nis(r.saveYear) + ' בשנה';
    $('basket').textContent = nis(basket);
    $('bg').style.width = (r.gOff / basket * 100) + '%';
    $('bh').style.width = (r.hOff / basket * 100) + '%';
    $('bp').style.width = (r.left / basket * 100) + '%';
    $('kG').textContent = nis(r.gOff); $('kH').textContent = nis(r.hOff); $('kP').textContent = nis(r.left);
    $('warn').textContent =
      r.hivunCut ? 'ההיוון גדול מהיתרה בסל — רק עד ' + nis(basket - r.gOff) + ' יכול להיות פטור.' :
      (hv > 0 && pen < Y.minPension) ? 'שימו לב: היוון מותנה בקצבה מזערית של ' + nis(Y.minPension) + ' בחודש.' : '';
  }

  ['pen', 'grant', 'hivun', 'other'].forEach(function (id) {
    $(id).addEventListener('input', function () {
      var v = num(this.value);
      this.value = v ? v.toLocaleString('he-IL') : '';
      render();
    });
  });
  Array.prototype.forEach.call(document.querySelectorAll('#sex button'), function (b) {
    b.addEventListener('click', function () {
      Array.prototype.forEach.call(document.querySelectorAll('#sex button'), function (x) { x.setAttribute('aria-pressed', x === b); });
      cptsDefault = parseFloat(b.dataset.cp);
      $('cpts').value = cptsDefault;
      render();
    });
  });
  $('cpts').addEventListener('input', render);
  render();
})();
