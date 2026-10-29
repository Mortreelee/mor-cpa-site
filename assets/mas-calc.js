/* ============================================================
   YOURS — מחשבון מס הכנסה ליחיד (עמוד /machshevon/mas-yachid/)

   מדרגות המס, מס יסף ושווי נקודת זיכוי לשנים 2020–2026 — מתוך כלי קיבוע הזכויות
   (kibua/app.js, TAX), שנלקחו מלוחות העזר השנתיים לניכויים של רשות המסים.
   2026 נבדק שוב מול kibua/mekorot/luach_nikuim_2026.txt (פרק ב ופרק ג).
   הכנסה מיגיעה אישית בלבד. המדרגות החודשיות = השנתיות חלקי 12.

   עדכון שנתי (ינואר): להוסיף שורה ל-YEARS ולעדכן את LAST.
   ============================================================ */
(function () {
  'use strict';

  // br: מדרגות שנתיות; yesef: מס יסף, סעיף 121ב; cp: שווי נקודת זיכוי לחודש
  var YEARS = {
    2020: { br: [[75960,.10],[108960,.14],[174960,.20],[243120,.31],[505920,.35],[Infinity,.47]], yesef: { t: 651600, r: .03 }, cp: 219 },
    2021: { br: [[75480,.10],[108360,.14],[173880,.20],[241680,.31],[502920,.35],[Infinity,.47]], yesef: { t: 647640, r: .03 }, cp: 218 },
    2022: { br: [[77400,.10],[110880,.14],[178080,.20],[247440,.31],[514920,.35],[Infinity,.47]], yesef: { t: 663240, r: .03 }, cp: 223 },
    2023: { br: [[81480,.10],[116760,.14],[187440,.20],[260520,.31],[542160,.35],[Infinity,.47]], yesef: { t: 698280, r: .03 }, cp: 235 },
    2024: { br: [[84120,.10],[120720,.14],[193800,.20],[269280,.31],[560280,.35],[Infinity,.47]], yesef: { t: 721560, r: .03 }, cp: 242 },
    2025: { br: [[84120,.10],[120720,.14],[193800,.20],[269280,.31],[560280,.35],[Infinity,.47]], yesef: { t: 721560, r: .03 }, cp: 242 },
    2026: { br: [[84120,.10],[120720,.14],[228000,.20],[301200,.31],[560280,.35],[Infinity,.47]], yesef: { t: 721560, r: .03 }, cp: 242 }
  };
  var LAST = 2026;

  // מס לפי מדרגות, לחודש (months=1) או לשנה (months=12): שורה לכל מדרגה שיש בה הכנסה
  // townAnnual: הטבת יישוב מוטב לשנה (townCredit). כמו נקודות הזיכוי — לא יותר מהמס
  function compute(income, cpts, months, year, townAnnual) {
    var Y = YEARS[year] || YEARS[LAST];
    var d = 12 / (months || 1);
    var rows = [], prev = 0, gross = 0;
    for (var i = 0; i < Y.br.length && income > prev; i++) {
      var top = Y.br[i][0] / d, part = Math.min(income, top) - prev;
      rows.push({ from: prev, to: top, rate: Y.br[i][1], part: part, tax: part * Y.br[i][1] });
      gross += part * Y.br[i][1];
      prev = top;
    }
    var yt = Y.yesef.t / d;
    if (income > yt) {
      rows.push({ from: yt, to: Infinity, rate: Y.yesef.r, part: income - yt, tax: (income - yt) * Y.yesef.r, yesef: true });
      gross += (income - yt) * Y.yesef.r;
    }
    var cpv = Y.cp * (months || 1) * cpts;
    var credit = Math.min(gross, cpv);
    var town = Math.min(gross - credit, (townAnnual || 0) * (months || 1) / 12);
    var tax = gross - credit - town;
    var marginal = rows.length ? rows.filter(function (r) { return !r.yesef; }).pop().rate + (income > yt ? Y.yesef.r : 0) : 0;
    return { rows: rows, gross: gross, credit: credit, creditFull: cpv, town: town, tax: tax, net: income - tax,
             avg: income > 0 ? tax / income : 0, marginal: marginal };
  }

  /* ---------- יישוב מוטב, סעיף 11 ----------
     periods: [[היום בשנה שבו התקופה מתחילה, שיעור %, תקרה שנתית], ...] — מתוך לוח הניכויים של אותה שנה.
     בכל תקופה: שיעור × ההכנסה של התקופה, עד התקרה של התקופה (שתיהן לפי מספר הימים). */
  function townCredit(periods, annualIncome, year) {
    var days = (year % 4 === 0) ? 366 : 365, c = 0;
    for (var i = 0; i < periods.length; i++) {
      var end = i + 1 < periods.length ? periods[i + 1][0] - 1 : days;
      var f = (end - periods[i][0] + 1) / days;
      c += periods[i][1] / 100 * Math.min(annualIncome * f, periods[i][2] * f);
    }
    return c;
  }

  /* ---------- פירוט נקודות זיכוי ----------
     הכללים והמקורות לכל שנה: _build/mekorot-nekudot.md */

  // ילד, לפי הגיל בשנת המס (שנת המס פחות שנת הלידה). הורים נשואים: ס' 66(ג)(4) לאם, 66(ג)(5) לאב
  function kidPts(mother, y, age) {
    if (age < 0 || age > 18) return 0;
    if (age === 18) return mother ? 0.5 : 0;                       // שנת בגרות
    if (y >= 2024) {                                               // חוק סיוע להורים לילדים עד גיל שלוש, וחוק 2023 לגילי 6–17
      if (age === 0) return 2.5;
      if (age <= 2) return 4.5;
      if (age === 3) return 3.5;
      if (age <= 5) return 2.5;
      return mother ? 2 : 1;
    }
    if (age === 0) return 1.5;
    if (age <= 5) return 2.5;
    var p = mother ? 1 : 0;
    if ((y === 2022 || y === 2023) && age <= 12) p += 1;           // הוראת השעה, ילדים שטרם מלאו להם 13
    return p;
  }

  // תואר ראשון (נקודה) או שני (חצי), ס' 40ג. סיום 2014–2022: שנה אחת; מ-2023: עד 3 / 2 שנים
  function degreePts(kind, fin, y) {
    if (!fin) return 0;
    var v = kind === 'ba' ? 1 : 0.5, n = kind === 'ba' ? 3 : 2;
    if (fin >= 2023) return y > fin && y <= fin + n ? v : 0;
    if (fin >= 2014) return y === fin + 1 ? v : 0;
    return 0;
  }

  // חייל/ת משוחרר/ת, ס' 39א: לכל חודש מ-36 החודשים שאחרי חודש השחרור — ⅙ (שירות מלא) או 1/12
  function soldierPts(relY, relM, full, y) {
    if (!relY) return 0;
    var first = relY * 12 + relM + 1, last = first + 35;           // relM 1–12 = חודש השחרור; סופרים מהחודש שאחריו
    var from = Math.max(first, y * 12 + 1), to = Math.min(last, y * 12 + 12);
    return Math.max(0, to - from + 1) * (full ? 1 / 6 : 1 / 12);
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { compute: compute, YEARS: YEARS, LAST: LAST, kidPts: kidPts, degreePts: degreePts, soldierPts: soldierPts, townCredit: townCredit };
    return;
  }

  /* ---------- ממשק ---------- */
  var $ = function (id) { return document.getElementById(id); };
  if (!$('mc')) return;
  var BASE = document.currentScript ? document.currentScript.src.replace(/[^/]*$/, '') : '';
  var nis = function (v) { return '₪' + Math.round(v).toLocaleString('he-IL'); };
  var num = function (s) { return parseFloat(String(s).replace(/[^\d.]/g, '')) || 0; };
  var pc = function (v) { return (Math.round(v * 1000) / 10) + '%'; };
  var COLORS = { '0.1': '#2FE3A6', '0.14': '#8FE39A', '0.2': '#F2C14E', '0.31': '#F59E5B', '0.35': '#FF8A7A', '0.47': '#FF5F7E', '0.03': '#C46BFF' };
  var cptsDefault = 2.25;
  var months = 1;   // 1 = חודשי, 12 = שנתי
  var year = LAST;
  for (var yy = LAST; yy >= 2020; yy--) { var o = document.createElement('option'); o.value = yy; o.textContent = yy; $('yr').appendChild(o); }

  function render() {
    var inc = num($('inc').value);
    var cp = parseFloat(String($('cpts').value).replace(/[^\d.]/g, ''));
    if (!isFinite(cp)) cp = cptsDefault;
    var Y = YEARS[year];
    var tw = townNow();
    var r = compute(inc, cp, months, year, tw ? townCredit(tw, inc * 12 / months, year) : 0);
    // בתצוגה כל שורה מעוגלת לשקל, והסכומים נבנים מהשורות המעוגלות — כדי שהחשבון ייסגר על המסך
    var gR = 0;
    r.rows.forEach(function (x) { x.taxR = Math.round(x.tax); gR += x.taxR; });
    // המס לתשלום מעוגל מהסכום המדויק (כך שחודשי × 12 = שנתי), והזיכוי משלים את ההפרש
    var exact = r.tax;
    r.tax = Math.round(r.tax);
    var cR = Math.min(gR - r.tax, Math.round(r.credit)), tR = gR - r.tax - cR;
    r.net = inc - r.tax; r.avg = inc > 0 ? r.tax / inc : 0;

    var p = inc > 0 ? Math.round(r.net / inc * 100) : 100;
    $('ring').style.setProperty('--p', p);
    $('rNet').textContent = nis(r.net);
    $('rTax').textContent = nis(r.tax);
    $('rPct').textContent = p + '% מההכנסה';
    $('avg').textContent = pc(r.avg);
    $('marg').textContent = pc(r.marginal);
    $('year').textContent = months === 1 ? 'מס הכנסה בשנה: ' + nis(exact * 12) : 'בממוצע לחודש: ' + nis(exact / 12);

    // פס ושורות לפי מדרגה
    var bar = '', rows = '';
    r.rows.forEach(function (x) {
      var c = COLORS[String(x.rate)];
      if (!x.yesef) bar += '<i style="width:' + (x.part / inc * 100) + '%;background:' + c + '"></i>';
      var range = x.yesef ? 'מס יסף מעל ' + nis(x.from)
                : x.to === Infinity ? 'מעל ' + nis(x.from)
                : (x.from ? nis(x.from) + ' – ' : 'עד ') + nis(x.to);
      rows += '<div class="mc-r"><span class="mc-rate" style="--c:' + c + '">' + pc(x.rate) + '</span>'
            + '<span class="mc-range">' + range + '</span>'
            + '<span class="mc-part">' + nis(x.part) + '</span>'
            + '<span class="mc-tax">' + nis(x.taxR) + '</span></div>';
    });
    $('bar').innerHTML = bar;
    $('rows').innerHTML = rows;
    $('gross').textContent = nis(gR);
    $('credit').textContent = '−' + nis(cR);
    $('creditLbl').textContent = cp.toLocaleString('he-IL') + ' נקודות זיכוי × ₪' + (Y.cp * months).toLocaleString('he-IL');
    $('total').textContent = nis(r.tax);
    $('townRow').hidden = !tw;
    $('townCr').textContent = '−' + nis(tR);
    $('townLbl').textContent = 'הטבת יישוב — ' + $('town').value;
    $('townSum').textContent = tw ? '· ' + $('town').value : '';
    $('warn').textContent = r.creditFull > r.gross && inc > 0
      ? 'נקודות הזיכוי מכסות את כל המס — אין מס הכנסה לתשלום.' : '';
  }

  /* ---------- פירוט נקודות הזיכוי ---------- */
  var MONTHS = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'];
  var fmt = function (v) { return (Math.round(v * 100) / 100).toLocaleString('he-IL'); };
  function opts(sel, list) { sel.innerHTML = list.map(function (o) { return '<option value="' + o[0] + '">' + o[1] + '</option>'; }).join(''); }
  function yearList(from, to, none) {
    var l = none ? [['', none]] : [];
    for (var y = to; y >= from; y--) l.push([y, y]);
    return l;
  }
  opts($('ba'), yearList(2010, LAST, 'אין'));
  opts($('ma'), yearList(2010, LAST, 'אין'));
  opts($('relY'), yearList(2015, LAST, 'אין'));
  opts($('relM'), MONTHS.map(function (n, i) { return [i + 1, n]; }));
  var touched = false;   // אחרי שמשתמשים בפירוט, השדה "נקודות זיכוי" מתעדכן ממנו

  function addKid(by) {
    var row = document.createElement('div');
    row.className = 'mp-row mp-kid';
    row.innerHTML = '<span>ילד/ה ' + ($('kids').children.length + 1) + '</span><select class="mp-sel" aria-label="שנת לידה"></select><em></em>'
                  + '<button type="button" class="mp-x" aria-label="הסרה">×</button>';
    opts(row.querySelector('select'), yearList(2000, LAST));
    row.querySelector('select').value = by;
    row.querySelector('select').addEventListener('change', points);
    row.querySelector('.mp-x').addEventListener('click', function () {
      row.remove();
      Array.prototype.forEach.call($('kids').children, function (r, i) { r.firstChild.textContent = 'ילד/ה ' + (i + 1); });
      points();
    });
    $('kids').appendChild(row);
  }

  function points() {
    touched = true;
    var mother = document.querySelector('#sex [aria-pressed=true]').dataset.cp === '2.75';
    var base = mother ? 2.75 : 2.25, kids = 0;
    Array.prototype.forEach.call($('kids').children, function (r) {
      var by = +r.querySelector('select').value, age = year - by, v = kidPts(mother, year, age);
      kids += v;
      r.querySelector('em').textContent = age < 0 ? 'עוד לא נולד/ה' : age > 18 ? 'מעל 18' : '+' + fmt(v) + ' · גיל ' + age;
    });
    var ba = degreePts('ba', +$('ba').value, year), ma = degreePts('ma', +$('ma').value, year);
    var tag = function (on, v) { return !on ? '' : v ? '+' + fmt(v) : 'לא בשנה זו'; };
    $('baPts').textContent = tag($('ba').value, ba);
    $('maPts').textContent = tag($('ma').value, ma);
    var rel = soldierPts(+$('relY').value, +$('relM').value, $('relFull').checked, year);
    $('relPts').textContent = tag($('relY').value, rel);
    var extra = num($('extra').value);
    var total = base + kids + ba + ma + rel + extra;
    $('ptsLine').innerHTML = 'בסיס ' + fmt(base) + (kids ? ' · ילדים ' + fmt(kids) : '') + (ba + ma ? ' · תואר ' + fmt(ba + ma) : '')
      + (rel ? ' · שחרור ' + fmt(rel) : '') + (extra ? ' · נוספות ' + fmt(extra) : '')
      + ' = <b>' + fmt(total) + ' נקודות</b> בשנת ' + year;
    $('ptsSum').textContent = '· ' + fmt(total);
    $('cpts').value = Math.round(total * 100) / 100;
    render();
  }
  $('addKid').addEventListener('click', function () { addKid(year - 3); points(); });
  ['ba', 'ma', 'relY', 'relM', 'relFull'].forEach(function (id) { $(id).addEventListener('change', points); });
  $('extra').addEventListener('input', points);

  /* ---------- יישוב מגורים ---------- */
  var TOWNS = null;   // assets/yishuvim.json — נטען ברקע
  fetch(BASE + 'yishuvim.json').then(function (r) { return r.json(); }).then(function (d) {
    TOWNS = d;
    $('townList').innerHTML = d.n.map(function (n) { return '<option value="' + n.replace(/"/g, '&quot;') + '">'; }).join('');
    townInfo(); render();
  });
  var DAY = function (doy) { var t = new Date(year, 0, doy); return t.getDate() + '.' + (t.getMonth() + 1); };
  function townRec() {
    if (!TOWNS) return null;
    var i = TOWNS.n.indexOf($('town').value.trim());
    if (i < 0) return undefined;
    return (TOWNS.y[year] || {})[i] || false;      // false = היישוב לא ברשימה באותה שנה
  }
  function townNow() {
    var t = townRec();
    if (!t) return null;
    if (t.a) return t.a;
    var old = document.querySelector('input[name=since]:checked').value === 'o';
    return old ? (t.o || null) : (t.w || null);
  }
  function townInfo() {
    var t = townRec(), v = $('town').value.trim();
    $('sinceRow').hidden = !(t && !t.a);
    if (!v) { $('townInfo').textContent = ''; return; }
    if (!TOWNS) { $('townInfo').textContent = 'טוענים את רשימת היישובים...'; return; }
    if (t === undefined) { $('townInfo').textContent = 'היישוב לא מופיע ברשימות היישובים המוטבים 2020–2026'; return; }
    if (t === false) { $('townInfo').textContent = 'היישוב לא היה ברשימת היישובים המוטבים בשנת ' + year; return; }
    var p = townNow();
    if (!p) { $('townInfo').textContent = 'בשנת ' + year + ' אין הטבה למי שעבר לגור ביישוב מ־2019'; return; }
    $('townInfo').textContent = p.length === 1
      ? p[0][1] + '% על הכנסה של עד ' + nis(p[0][2]) + ' בשנה'
      : p.map(function (x, i) {   // "עד 31.7" / "מ־1.8" — טווח תאריכים עם מקף מתהפך בתצוגה מימין לשמאל
          var when = i === 0 ? 'עד ' + DAY(p[1][0] - 1) : 'מ־' + DAY(x[0]);
          return when + ': ' + (x[1] ? x[1] + '% עד ' + nis(x[2]) + ' בשנה' : 'אין הטבה');
        }).join(' · ');
  }
  $('town').addEventListener('input', function () { townInfo(); render(); });

  // הלחצנים הקטנים: פותחים וסוגרים את החלונית שמתחתם
  Array.prototype.forEach.call(document.querySelectorAll('.mc-tool'), function (b) {
    b.addEventListener('click', function () {
      var box = $(b.dataset.box), open = box.hidden;
      box.hidden = !open; b.setAttribute('aria-expanded', open);
      if (open && b.dataset.box === 'townBox') $('town').focus();
    });
  });
  Array.prototype.forEach.call(document.querySelectorAll('input[name=since]'), function (r) {
    r.addEventListener('change', function () { townInfo(); render(); });
  });

  // מספר עם פסיקים בזמן ההקלדה
  $('inc').addEventListener('input', function () {
    var v = num(this.value); this.value = v ? v.toLocaleString('en-US') : ''; render();
  });
  Array.prototype.forEach.call(document.querySelectorAll('#sex button'), function (b) {
    b.addEventListener('click', function () {
      Array.prototype.forEach.call(document.querySelectorAll('#sex button'), function (x) { x.setAttribute('aria-pressed', x === b); });
      cptsDefault = parseFloat(b.dataset.cp); $('cpts').value = b.dataset.cp;
      if (touched) points(); else render();
    });
  });
  $('cpts').addEventListener('input', render);
  $('yr').addEventListener('change', function () {
    year = +this.value;
    Array.prototype.forEach.call(document.querySelectorAll('.js-year'), function (el) { el.textContent = year; });
    townInfo();
    if (touched) points(); else render();
  });
  // חודשי / שנתי: הסכום שהוזן מומר, כדי שזה יישאר אותו אדם
  Array.prototype.forEach.call(document.querySelectorAll('#per button'), function (b) {
    b.addEventListener('click', function () {
      var m = +b.dataset.m;
      if (m === months) return;
      Array.prototype.forEach.call(document.querySelectorAll('#per button'), function (x) { x.setAttribute('aria-pressed', x === b); });
      var v = num($('inc').value) * m / months;
      months = m;
      $('inc').value = v ? Math.round(v).toLocaleString('en-US') : '';
      Array.prototype.forEach.call(document.querySelectorAll('[data-per]'), function (el) { el.textContent = el.dataset[m === 1 ? 'm' : 'y']; });
      render();
    });
  });
  render();
})();
