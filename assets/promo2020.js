/* מודעת הצד "שנת 2020 נסגרת" בעמוד החזרי מס.
   שעון לאחור עד סוף 31.12.2026 (שעון ישראל). אחרי המועד המודעה לא מוצגת בכלל.
   מי שסגר אותה (✕) לא יראה אותה שוב באותו ביקור. */
(function () {
  var box = document.getElementById('promo2020');
  if (!box) return;
  var END = new Date('2027-01-01T00:00:00+02:00').getTime();
  if (Date.now() >= END) return;
  try { if (sessionStorage.getItem('promo2020-closed')) return; } catch (e) {}

  var cells = {};
  box.querySelectorAll('[data-u]').forEach(function (b) { cells[b.getAttribute('data-u')] = b; });
  function pad(n) { return (n < 10 ? '0' : '') + n; }

  var timer;
  function tick() {
    var left = Math.floor((END - Date.now()) / 1000);
    if (left <= 0) { clearInterval(timer); box.hidden = true; return; }
    cells.d.textContent = Math.floor(left / 86400);
    cells.h.textContent = pad(Math.floor(left % 86400 / 3600));
    cells.m.textContent = pad(Math.floor(left % 3600 / 60));
    cells.s.textContent = pad(left % 60);
  }
  tick();
  timer = setInterval(tick, 1000);
  box.hidden = false;

  box.querySelector('.promo2020-close').onclick = function () {
    clearInterval(timer);
    box.hidden = true;
    try { sessionStorage.setItem('promo2020-closed', '1'); } catch (e) {}
  };
})();
