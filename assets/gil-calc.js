/* ============================================================
   MOR CPA — מחשבון גיל פרישה (עמוד /machshevon/gil-prisha/)

   הטבלאות מתוך כלי קיבוע הזכויות (kibua/app.js, MEN_TABLE / WOMEN_TABLE):
   חוק גיל פרישה, התשס"ד-2004, התוספת — חלק א' לגבר, חלק ב' לאישה.
   בסיס: 67 לגבר, 65 לאישה. מפת הידע §8.
   שיעור הפטור לפי שנה: kibua/app.js, rateForYear (מדריך 2026, תיקונים 190 ו-275).
   ============================================================ */
(function () {
  'use strict';

  // [שנה, חודש] אחרון שבו חלה השורה → גיל בשנים וחודשים
  var MEN_TABLE = [
    { to: [1939, 3],  y: 65, m: 0 },
    { to: [1939, 8],  y: 65, m: 4 },
    { to: [1940, 4],  y: 65, m: 8 },
    { to: [1940, 12], y: 66, m: 0 },
    { to: [1941, 8],  y: 66, m: 4 },
    { to: [1942, 4],  y: 66, m: 8 }
  ];
  var WOMEN_TABLE = [
    { to: [1959, 12], y: 62, m: 0 },
    { to: [1960, 12], y: 62, m: 4 },
    { to: [1961, 12], y: 62, m: 8 },
    { to: [1962, 12], y: 63, m: 0 },
    { to: [1963, 12], y: 63, m: 3 },
    { to: [1964, 12], y: 63, m: 6 },
    { to: [1965, 12], y: 63, m: 9 },
    { to: [1966, 12], y: 64, m: 0 },
    { to: [1967, 12], y: 64, m: 3 },
    { to: [1968, 12], y: 64, m: 6 },
    { to: [1969, 12], y: 64, m: 9 }
  ];
  var MIN_BIRTH_YEAR = 1950;   // הטבלה בכלי אינה מכסה נשים שנולדו לפני 1947 — ומי שנולד לפני 1950 כבר עבר את הגיל

  function mi(y, m) { return y * 12 + (m - 1); }

  function retirementAge(sex, by, bm) {
    var idx = mi(by, bm), tbl = sex === 'm' ? MEN_TABLE : WOMEN_TABLE;
    for (var i = 0; i < tbl.length; i++) {
      if (idx <= mi(tbl[i].to[0], tbl[i].to[1])) return { y: tbl[i].y, m: tbl[i].m };
    }
    return sex === 'm' ? { y: 67, m: 0 } : { y: 65, m: 0 };
  }

  // שיעור הפטור הכולל על הקצבה, לפי שנת הזכאות
  function rateForYear(y) {
    if (y < 2012) return null;
    if (y <= 2015) return 43.5;
    if (y <= 2019) return 49;
    if (y <= 2024) return 52;
    if (y === 2025) return 57;
    if (y === 2026) return 57.5;
    if (y === 2027) return 62.5;
    return 67;
  }

  // היום שבו מגיעים לגיל: אותו יום בחודש. יום שאינו קיים באותו חודש
  // (למשל 31 בנובמבר) — היום האחרון בחודש.
  function compute(sex, by, bm, bd, now) {
    var ra = retirementAge(sex, by, bm);
    var at = mi(by, bm) + ra.y * 12 + ra.m;
    var y = Math.floor(at / 12), m = (at % 12) + 1;
    var last = new Date(y, m, 0).getDate();
    var date = new Date(y, m - 1, Math.min(bd, last));
    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return { age: ra, date: date, diff: diffYMD(today, date), rate: rateForYear(y) };
  }

  // הפרש בשנים, חודשים וימים מ-a ל-b (a ≤ b), או null אם b כבר עבר
  function diffYMD(a, b) {
    if (b < a) return null;
    var y = b.getFullYear() - a.getFullYear(), m = b.getMonth() - a.getMonth(), d = b.getDate() - a.getDate();
    if (d < 0) { m -= 1; d += new Date(b.getFullYear(), b.getMonth(), 0).getDate(); }
    if (m < 0) { y -= 1; m += 12; }
    return { y: y, m: m, d: d };
  }

  if (typeof module !== 'undefined' && module.exports) { module.exports = { compute: compute, retirementAge: retirementAge }; return; }

  /* ---------- ממשק ---------- */
  var $ = function (id) { return document.getElementById(id); };
  if (!$('gc')) return;
  var MONTHS = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'];
  var sex = 'm';

  // רשימות יום, חודש ושנה
  function opt(sel, v, t) { var o = document.createElement('option'); o.value = v; o.textContent = t; sel.appendChild(o); }
  for (var d = 1; d <= 31; d++) opt($('bd'), d, d);
  MONTHS.forEach(function (n, i) { opt($('bm'), i + 1, n); });
  var thisYear = new Date().getFullYear();
  for (var yy = thisYear - 18; yy >= MIN_BIRTH_YEAR; yy--) opt($('by'), yy, yy);
  $('bd').value = 15; $('bm').value = 6; $('by').value = 1962;

  // חודשים במילים — ספרה צמודה ל-ו' מתהפכת בתצוגה מימין לשמאל
  var MW = ['', 'חודש', 'חודשיים', 'שלושה חודשים', 'ארבעה חודשים', 'חמישה חודשים', 'שישה חודשים',
            'שבעה חודשים', 'שמונה חודשים', 'תשעה חודשים', 'עשרה חודשים', 'אחד עשר חודשים'];
  function ageText(a) {
    return a.y + (a.m ? ' ו' + MW[a.m] : '');
  }
  function leftText(t) {
    var parts = [];
    if (t.y) parts.push(t.y === 1 ? 'שנה' : t.y === 2 ? 'שנתיים' : t.y + ' שנים');
    if (t.m) parts.push(MW[t.m]);
    if (t.d) parts.push(t.d === 1 ? 'יום' : t.d === 2 ? 'יומיים' : t.d + ' ימים');
    // ספרה צמודה ל-ו' מתהפכת בתצוגה — לפני מספר כותבים "ועוד"
    if (parts.length > 1) {
      var lastP = parts[parts.length - 1];
      parts[parts.length - 1] = (/^\d/.test(lastP) ? 'ועוד ' : 'ו') + lastP;
    }
    return parts.join(parts.length > 2 ? ', ' : ' ').replace(/, (ו)/, ' $1');
  }
  function fullAge(a) {
    var y = a.y + ' שנים';
    return a.m ? y + ' ו' + MW[a.m] : y;
  }

  function render() {
    var r = compute(sex, +$('by').value, +$('bm').value, +$('bd').value, new Date());
    $('gAge').textContent = fullAge(r.age);
    $('gDate').textContent = r.date.getDate() + ' ב' + MONTHS[r.date.getMonth()] + ' ' + r.date.getFullYear();
    var t = r.diff;
    if (t && (t.y || t.m || t.d)) {
      $('gLeft').textContent = 'עוד ' + leftText(t);
      $('gLeft').className = 'gc-left';
    } else {
      $('gLeft').textContent = t ? 'היום!' : 'כבר הגעת לגיל הפרישה';
      $('gLeft').className = 'gc-left done';
    }
    $('gRate').textContent = r.rate == null ? '—' : r.rate + '%';
    $('gRateY').textContent = r.date.getFullYear();
    // ציר: מהיום ועד גיל הפרישה, על פני 10 שנים לכל היותר
    var months = t ? t.y * 12 + t.m : 0;
    var p = !t ? 100 : Math.max(4, 100 - Math.min(months, 120) / 120 * 100);
    $('gBar').style.width = p + '%';
  }

  Array.prototype.forEach.call(document.querySelectorAll('#gsex button'), function (b) {
    b.addEventListener('click', function () {
      Array.prototype.forEach.call(document.querySelectorAll('#gsex button'), function (x) { x.setAttribute('aria-pressed', x === b); });
      sex = b.dataset.sex; render();
    });
  });
  ['bd', 'bm', 'by'].forEach(function (id) { $(id).addEventListener('change', render); });
  render();
})();
