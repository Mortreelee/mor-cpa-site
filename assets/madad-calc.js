/* ============================================================
   YOURS — מחשבון הצמדה למדד (עמוד /machshevon/madad/)

   הנתונים: assets/madad.json — מדד המחירים לצרכן, כללי (סדרה 120010 של הלמ"ס).
   לכל חודש מדד: המקדם ממנו עד חודש הייחוס (ref), כפי שמחזיר המחשבון הרשמי של הלמ"ס
   (api.cbs.gov.il/index/data/calculator), כולל מקדמי השרשור בין הבסיסים.
   הצמדה מחודש מדד a לחודש מדד b = f[a] / f[b].

   מתאריך עד תאריך — לפי "המדד הידוע" בכל תאריך, כמו במחשבון של הלמ"ס:
   מה-16 בחודש — המדד של החודש הקודם; עד ה-15 — המדד של החודש שלפניו.
   (נבדק מול המחשבון של הלמ"ס, 13–17 בתשעה חודשים, 27.10.2026.)

   "לפי חודש" (ברירת המחדל, מתג בראש המחשבון): בלי יום — לפי המדד של החודש שנבחר עצמו,
   כמו במחשבון של הלמ"ס כשבוחרים חודשים. "לפי תאריך" — לפי המדד הידוע ביום שנבחר.

   עדכון חודשי: אוטומטי — .github/workflows/madad.yml מריץ את _build/update_madad.py מה-16 בכל חודש.
   ============================================================ */
(function () {
  'use strict';

  function link(f, a, b) { return f[a] / f[b]; }

  // המדד הידוע ביום d בחודש m בשנה y → "YYYY-MM"
  function knownIndex(y, m, d) {
    var back = d >= 16 ? 1 : 2, idx = y * 12 + (m - 1) - back;
    return Math.floor(idx / 12) + '-' + ('0' + (idx % 12 + 1)).slice(-2);
  }

  if (typeof module !== 'undefined' && module.exports) { module.exports = { link: link, knownIndex: knownIndex }; return; }

  var $ = function (id) { return document.getElementById(id); };
  if (!$('md')) return;
  var MONTHLY = true;   // המתג: לפי חודש / לפי תאריך
  var BASE = document.currentScript ? document.currentScript.src.replace(/[^/]*$/, '') : '';
  var MONTHS = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'];
  var nis = function (v) { return '₪' + v.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
  var num = function (s) { return parseFloat(String(s).replace(/[^\d.]/g, '')) || 0; };
  var D = null;

  function opts(sel, list) { sel.innerHTML = list.map(function (o) { return '<option value="' + o[0] + '">' + o[1] + '</option>'; }).join(''); }
  function label(k) { var p = k.split('-'); return MONTHS[+p[1] - 1] + ' ' + p[0]; }
  function dateOf(p) { return [MONTHLY ? 0 : +$(p + 'D').value, +$(p + 'M').value, +$(p + 'Y').value]; }
  function indexOf(d) { return MONTHLY ? d[2] + '-' + ('0' + d[1]).slice(-2) : knownIndex(d[2], d[1], d[0]); }

  function setup(d) {
    D = d;
    var now = new Date(), days = [], months = MONTHS.map(function (n, i) { return [i + 1, n]; }), years = [];
    for (var i = 1; i <= 31; i++) days.push([i, i]);
    for (var y = now.getFullYear(); y >= 1990; y--) years.push([y, y]);
    ['a', 'b'].forEach(function (p) { opts($(p + 'D'), days); opts($(p + 'M'), months); opts($(p + 'Y'), years); });
    $('aD').value = 1; $('aM').value = 1; $('aY').value = 2020;
    setMode(true);
  }

  // בכל מעבר: חודש הסיום — לפי חודש: המדד האחרון שפורסם; לפי תאריך: היום
  function setMode(monthly) {
    MONTHLY = monthly;
    var now = new Date(), ref = D.ref.split('-');
    $('md').classList.toggle('md-monthly', monthly);
    [].forEach.call(document.querySelectorAll('#mdMode button'), function (b) { b.setAttribute('aria-pressed', String((b.dataset.mode === 'm') === monthly)); });
    $('mdModeTxt').textContent = monthly
      ? 'לפי המדד של החודשים שבחרתם — למשל בחוזה שכתוב בו "מדד חודש…".'
      : 'לפי המדד הידוע בכל תאריך: המדד מתפרסם ב־15 בחודש, ולכן מה־16 ידוע המדד של החודש הקודם, ועד ה־15 — של החודש שלפניו.';
    if (monthly) { $('bM').value = +ref[1]; $('bY').value = +ref[0]; }
    else { $('bD').value = now.getDate(); $('bM').value = now.getMonth() + 1; $('bY').value = now.getFullYear(); }
    render();
  }

  function render() {
    if (!D) return;
    var amt = num($('amt').value), da = dateOf('a'), db = dateOf('b');
    var a = indexOf(da), b = indexOf(db);
    $('aIdx').textContent = MONTHLY ? '' : 'המדד הידוע: ' + label(a);
    $('bIdx').textContent = MONTHLY ? '' : 'המדד הידוע: ' + label(b);
    if (!(a in D.f) || !(b in D.f)) {
      $('mdOut').hidden = true;
      var miss = !(a in D.f) ? a : b;
      $('mdWarn').textContent = miss > D.ref
        ? 'המדד של ' + label(miss) + ' עוד לא פורסם. המדד האחרון שפורסם: ' + label(D.ref) + '.'
        : MONTHLY ? 'המחשבון מתחיל במדד ינואר 1990.' : 'המחשבון מתחיל במדד ינואר 1990 — כלומר מתאריך 16.2.1990.';
      return;
    }
    $('mdOut').hidden = false; $('mdWarn').textContent = '';
    var k = link(D.f, a, b), res = amt * k, ch = (k - 1) * 100;
    $('res').textContent = nis(res);
    $('diff').textContent = (res >= amt ? '+' : '−') + nis(Math.abs(res - amt));
    $('chg').textContent = (ch >= 0 ? 'עלייה של ' : 'ירידה של ') + Math.abs(ch).toFixed(2) + '%';
    $('chg').className = ch >= 0 ? 'md-up' : 'md-down';
    $('fac').textContent = k.toFixed(5);
    $('latest').textContent = label(D.ref);
  }

  fetch(BASE + 'madad.json').then(function (r) { return r.json(); }).then(setup);
  $('amt').addEventListener('input', function () {
    var v = num(this.value); this.value = v ? v.toLocaleString('en-US', { maximumFractionDigits: 2 }) : ''; render();
  });
  ['aD', 'aM', 'aY', 'bD', 'bM', 'bY'].forEach(function (id) { $(id).addEventListener('change', render); });
  [].forEach.call(document.querySelectorAll('#mdMode button'), function (b) {
    b.addEventListener('click', function () { if (D) setMode(b.dataset.mode === 'm'); });
  });
})();
