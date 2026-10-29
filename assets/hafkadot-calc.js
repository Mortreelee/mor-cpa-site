/* ============================================================
   YOURS — מחשבון הפקדות לעצמאי (עמוד /machshevon/hafkadot/)

   החישוב לא כאן: הדף שולח את הנתונים לסקריפט (config.js, mailEndpoint)
   ומקבל רק את התוצאות.
   ============================================================ */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  if (!$('hf')) return;
  var cfg = window.MORE || {};
  var MONTHS = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'];
  var sex = 'm', busy = false;

  function opt(sel, v, t) { var o = document.createElement('option'); o.value = v; o.textContent = t; sel.appendChild(o); }
  for (var d = 1; d <= 31; d++) opt($('bd'), d, d);
  MONTHS.forEach(function (n, i) { opt($('bm'), i + 1, n); });
  var thisYear = new Date().getFullYear();
  for (var yy = thisYear - 18; yy >= thisYear - 80; yy--) opt($('by'), yy, yy);
  $('bd').value = 1; $('bm').value = 1; $('by').value = 1985;

  Array.prototype.forEach.call(document.querySelectorAll('#hsex button'), function (b) {
    b.addEventListener('click', function () {
      Array.prototype.forEach.call(document.querySelectorAll('#hsex button'), function (x) { x.setAttribute('aria-pressed', x === b); });
      sex = b.getAttribute('data-sex');
    });
  });

  // סכומים: ספרות בלבד, עם פסיקים תוך כדי הקלדה
  function num(el) { return Number(String(el.value).replace(/[^\d]/g, '')) || 0; }
  function fmt(n) { return Math.round(n).toLocaleString('he-IL'); }
  ['hInc', 'hPen', 'hSf'].forEach(function (id) {
    $(id).addEventListener('input', function () { var n = num(this); this.value = n ? fmt(n) : ''; });
  });
  function ils(n) { return '₪' + fmt(n); }

  function warn(t) {
    $('hWarn').textContent = t; $('rAge').hidden = true; $('rHova').hidden = true; $('hOut').hidden = !t;
    $('rPen').hidden = true; $('rSf').hidden = true;
  }

  $('hf').addEventListener('submit', function (e) {
    e.preventDefault();
    if (busy) return;
    var income = num($('hInc'));
    if (!income) { warn('הזינו את הרווח השנתי מהעסק.'); $('hInc').focus(); return; }
    busy = true; $('hGo').disabled = true; $('hGo').textContent = 'מחשבים…';
    var timeout = new Promise(function (_, no) { setTimeout(function () { no(new Error('timeout')); }, 30000); });
    Promise.race([timeout, fetch(cfg.mailEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },   // בלי בדיקת CORS מקדימה
      body: JSON.stringify({ action: 'hafkadot', income: income, sex: sex, pension: num($('hPen')), study: num($('hSf')),
                             birth: { d: +$('bd').value, m: +$('bm').value, y: +$('by').value } })
    }).then(function (r) { return r.json(); })]).then(function (j) {
      if (!j.success) throw new Error(j.message || 'failed');
      render(j);
    }).catch(function () {
      warn('לא הצלחנו לחשב כרגע. נסו שוב בעוד רגע.');
    }).then(function () {
      busy = false; $('hGo').disabled = false; $('hGo').textContent = 'לחישוב ←';
    });
  });

  // מתחת לכל שדה: כמה מה שהוקלד חוסך, ועד איזה סכום יש הטבה
  function box(el, x, other) {
    if (x.none) {
      el.innerHTML = x.why === 'other'
        ? '<b>אין עוד מס לחסוך</b><span>ההפקדה ל' + other + ' כבר מורידה את המס לאפס, ולכן ההפקדה הזו לא חוסכת עוד מס.</span>'
        : '<b>ברווח הזה אין מס הכנסה לשלם</b><span>נקודות הזיכוי מכסות אותו, ולכן ההפקדה לא חוסכת מס.</span>';
      el.hidden = false; return;
    }
    var html = '<b>' + (x.saved > 0 ? 'ההפקדה הזו חוסכת לך ' + ils(x.saved) + ' במס' : 'ההפקדה הזו לא חוסכת מס') + '</b>';
    html += '<span>ההטבה המלאה עד ' + ils(x.cap) + '. ' + (x.zero ? 'בסכום הזה המס כבר יורד לאפס, ומעליו' : 'מעל הסכום הזה,') + ' כל שקל נוסף לא חוסך מס.</span>';
    if (x.above > 0) html += '<span class="hf-over">' + ils(x.above) + ' מתוכה מעל התקרה ולא חוסכים מס.</span>';
    else if (x.more > 0 && x.moreSave > 0) html += '<span class="hf-more">עוד ' + ils(x.more) + ' יחסכו עוד ' + ils(x.moreSave) + '.</span>';
    el.innerHTML = html; el.hidden = false;
  }

  function render(j) {
    $('hWarn').textContent = '';
    box($('rPen'), j.pension, 'קרן השתלמות');
    box($('rSf'), j.study, 'פנסיה');
    $('rAge').hidden = !j.age50;
    var h = j.hova || {};
    $('rHova').hidden = !(h.missing > 0);
    if (h.missing > 0) $('rHova').textContent = 'שימו לב: עצמאי חייב להפקיד לפנסיה ' + ils(h.duty) + ' בשנה לפי ההכנסה שלו. חסרים ' + ils(h.missing) + '.';
    $('hOut').hidden = !(j.age50 || h.missing > 0);
    $('rPen').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
})();
