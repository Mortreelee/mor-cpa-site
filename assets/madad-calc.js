/* ============================================================
   YOURS — מחשבון הצמדה למדד (עמוד /machshevon/madad/)

   הנתונים: assets/madad.json — מדד המחירים לצרכן, כללי (סדרה 120010 של הלמ"ס).
   לכל חודש מדד: המקדם ממנו עד חודש הייחוס (ref), כפי שמחזיר המחשבון הרשמי של הלמ"ס
   (api.cbs.gov.il/index/data/calculator), כולל מקדמי השרשור בין הבסיסים.
   הצמדה מחודש מדד a לחודש מדד b = f[a] / f[b].

   מתאריך עד תאריך — לפי "המדד הידוע" בכל תאריך, כמו במחשבון של הלמ"ס:
   מה-16 בחודש — המדד של החודש הקודם; עד ה-15 — המדד של החודש שלפניו.
   (נבדק מול המחשבון של הלמ"ס, 13–17 בתשעה חודשים, 27.10.2026.)

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
  var BASE = document.currentScript ? document.currentScript.src.replace(/[^/]*$/, '') : '';
  var MONTHS = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'];
  var nis = function (v) { return '₪' + v.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
  var num = function (s) { return parseFloat(String(s).replace(/[^\d.]/g, '')) || 0; };
  var D = null;

  function opts(sel, list) { sel.innerHTML = list.map(function (o) { return '<option value="' + o[0] + '">' + o[1] + '</option>'; }).join(''); }
  function label(k) { var p = k.split('-'); return MONTHS[+p[1] - 1] + ' ' + p[0]; }
  function dateOf(p) { return [+$(p + 'D').value, +$(p + 'M').value, +$(p + 'Y').value]; }

  function setup(d) {
    D = d;
    var now = new Date(), days = [], months = MONTHS.map(function (n, i) { return [i + 1, n]; }), years = [];
    for (var i = 1; i <= 31; i++) days.push([i, i]);
    for (var y = now.getFullYear(); y >= 1990; y--) years.push([y, y]);
    ['a', 'b'].forEach(function (p) { opts($(p + 'D'), days); opts($(p + 'M'), months); opts($(p + 'Y'), years); });
    $('aD').value = 1; $('aM').value = 1; $('aY').value = 2020;
    $('bD').value = now.getDate(); $('bM').value = now.getMonth() + 1; $('bY').value = now.getFullYear();
    render();
  }

  function render() {
    if (!D) return;
    var amt = num($('amt').value), da = dateOf('a'), db = dateOf('b');
    var a = knownIndex(da[2], da[1], da[0]), b = knownIndex(db[2], db[1], db[0]);
    $('aIdx').textContent = 'המדד הידוע: ' + label(a);
    $('bIdx').textContent = 'המדד הידוע: ' + label(b);
    if (!(a in D.f) || !(b in D.f)) {
      $('mdOut').hidden = true;
      var miss = !(a in D.f) ? a : b;
      $('mdWarn').textContent = miss > D.ref
        ? 'המדד של ' + label(miss) + ' עוד לא פורסם. המדד האחרון שפורסם: ' + label(D.ref) + '.'
        : 'המחשבון מתחיל במדד ינואר 1990 — כלומר מתאריך 16.2.1990.';
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
})();
