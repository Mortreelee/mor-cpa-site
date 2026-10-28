/* ============================================================
   MOR CPA — נגן בוטים
   הבוט רץ בשרת (הסקריפט בחשבון ה-Google של העסק, אותה כתובת של שליחת הפניות
   ב-assets/config.js). האתר לא מחזיק את עץ השאלות: הוא שולח את המסלול שהגולש
   עבר עד עכשיו, ומקבל בחזרה רק את המסך הבא. בסוף, השרת עצמו שולח את הפנייה למייל.

   שימוש בעמוד:
     <div class="bot" data-bot="prisha"></div>
   ============================================================ */
(function (root) {
  'use strict';

  var doc = root.document;
  var cfg = root.MORE || {};

  function el(tag, cls, text) {
    var e = doc.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  // **מודגש** או *מודגש*, _נטוי_ ושורות חדשות, בלי innerHTML על טקסט חיצוני.
  // "__" ריק (סימון בלי טקסט) — מוסר, כדי שהסימנים לא יופיעו על המסך
  function rich(text) {
    var p = el('div', 'bot-text');
    String(text).replace(/__/g, '').split('\n').forEach(function (line, i) {
      if (i) p.appendChild(doc.createElement('br'));
      line.split(/(\*\*[^*]+\*\*|\*[^*]+\*|_[^_]+_)/).forEach(function (part) {
        if (/^\*\*[^*]+\*\*$/.test(part)) p.appendChild(el('strong', null, part.slice(2, -2)));
        else if (/^\*[^*]+\*$/.test(part)) p.appendChild(el('strong', null, part.slice(1, -1)));
        else if (/^_[^_]+_$/.test(part)) p.appendChild(el('em', null, part.slice(1, -1)));
        else if (part) p.appendChild(doc.createTextNode(part));
      });
    });
    return p;
  }

  // שאלה לשרת: המסלול עד עכשיו → המסך הבא. text/plain כדי שלא תהיה בדיקת CORS מקדימה.
  function ask(payload) {
    return fetch(cfg.mailEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    }).then(function (r) { return r.json(); }).then(function (j) {
      if (!j.success || !j.view || j.view.type === 'error') throw new Error(j.message || 'bot failed');
      return j.view;
    });
  }

  // אישור פרטיות לפני השליחה, כמו בבוט של Treelee: לשם מה נשמרים הפרטים בכל בוט
  var PURPOSE = {
    hechzer: 'בדיקת זכאות להחזר מס',
    prisha: 'הבדיקה לפורשים',
    atzmai: 'פתיחת התיק לעצמאי'
  };

  // חלון מדיניות הפרטיות
  function showPrivacy(purpose, opener) {
    var overlay = el('div', 'bot-privacy');
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    var panel = el('div', 'bot-privacy-panel');
    var close = el('button', 'bot-privacy-close', '✕');
    close.type = 'button'; close.setAttribute('aria-label', 'סגירה');
    var h = el('h2', null, 'מדיניות פרטיות ואבטחת מידע');
    h.id = 'botPrivacyTitle'; overlay.setAttribute('aria-labelledby', h.id);
    panel.appendChild(close);
    panel.appendChild(h);
    panel.appendChild(el('p', 'bot-privacy-lede', 'הפרטיות שלכם חשובה לנו. כך אנחנו אוספים ושומרים את המידע במסגרת ' + purpose + ':'));
    [
      ['איסוף המידע', 'אנחנו אוספים את הפרטים שהזנתם מרצונכם (שם, טלפון ומה שכתבתם בהערות), ואת התשובות שלכם בבדיקה.'],
      ['מטרת השימוש', 'המידע משמש אך ורק כדי לחזור אליכם, לתת לכם שירות מקצועי ולבדוק את המקרה שלכם.'],
      ['אבטחת המידע', 'הפרטים נשלחים ישירות לתיבת הדואר של העסק ונשמרים בה באופן מאובטח, בהתאם לחוק הגנת הפרטיות, התשמ"א־1981. האתר עצמו לא שומר אותם.'],
      ['העברה לצד שלישי', 'הפרטים נשמרים בסודיות. לא נמכור, לא נעביר ולא נשתף אותם עם גופים מסחריים או צדדים שלישיים, למעט רשות המסים או גופים ממשלתיים — רק לצורך הטיפול בתיק שלכם, ולאחר שתיתנו לנו ייפוי כוח מפורש.'],
      ['הזכויות שלכם', 'אפשר לפנות אלינו בכל עת ולבקש לעיין במידע שנאסף עליכם, לתקן אותו או למחוק אותו.'],
      ['נתוני גלישה', 'האתר משתמש ב־Google Analytics כדי לדעת כמה מבקרים מגיעים, מאיפה ואיזה עמודים הם רואים (עיר משוערת, סוג מכשיר ומקור ההגעה). המידע נאסף בעזרת עוגיות (cookies), אינו כולל את הפרטים שאתם משאירים בבדיקה, ונשמר חודשיים.']
    ].forEach(function (row, i) {
      var p = el('p');
      p.appendChild(el('strong', null, (i + 1) + '. ' + row[0] + ': '));
      p.appendChild(doc.createTextNode(row[1]));
      panel.appendChild(p);
    });
    panel.appendChild(el('p', 'bot-privacy-foot', 'בסימון האישור ושליחת הפרטים, אתם מסכימים לאמור במדיניות זו.'));
    overlay.appendChild(panel);

    function done() {
      overlay.remove(); doc.removeEventListener('keydown', esc);
      if (opener) opener.focus();
    }
    function esc(e) { if (e.key === 'Escape') done(); }
    close.onclick = done;
    overlay.onclick = function (e) { if (e.target === overlay) done(); };
    doc.addEventListener('keydown', esc);
    doc.body.appendChild(overlay);
    close.focus();
  }

  function Bot(box, bot, first) {
    var path = [], views = [], view = first, busy = false;
    var card = el('div', 'bot-card');
    var bar = el('div', 'bot-progress'); var fill = el('span'); bar.appendChild(fill);
    var body = el('div', 'bot-body');
    card.appendChild(bar); card.appendChild(body);
    box.innerHTML = ''; box.appendChild(card);

    function fail(msg) {
      busy = false; card.classList.remove('bot-busy');
      var m = body.querySelector('.bot-msg') || body.appendChild(el('p', 'bot-msg'));
      m.textContent = msg || 'משהו השתבש בחיבור. אפשר לנסות שוב, או לכתוב לנו בוואטסאפ.';
    }

    // צעד קדימה: שולחים לשרת את המסלול החדש ומחכים למסך הבא
    function go(stepItem, extra) {
      if (busy) return;
      busy = true; card.classList.add('bot-busy');
      var next = path.concat([stepItem]);
      var req = { action: 'bot', bot: bot, path: extra ? path : next };
      if (extra) { req.submit = true; req.contact = extra; }
      ask(req).then(function (v) {
        busy = false; card.classList.remove('bot-busy');
        views.push(view);
        if (!extra) path = next;
        view = v; render();
      }).catch(function () { fail(); });
    }
    // חזרה: המסך הקודם כבר אצלנו, אין צורך לפנות לשרת
    function back() { if (views.length && !busy) { path.pop(); view = views.pop(); render(); } }

    function render() {
      var v = view;
      body.innerHTML = '';
      fill.style.width = (v.pct || 8) + '%';
      var screen = el('div', 'bot-screen');
      body.appendChild(screen);

      if (v.type === 'welcome') {
        screen.appendChild(rich(v.text));
        var start = el('button', 'btn btn-primary btn-lg', v.cta);
        start.onclick = function () { go({ t: 'w' }); };
        screen.appendChild(start);
      } else if (v.type === 'input') {
        screen.appendChild(rich(v.text));
        var form = el('form', 'bot-input'), input = el('input');
        input.required = true;
        input.placeholder = v.validation === 'date' ? '' : (v.placeholder || 'הקלד/י כאן…');
        if (v.validation === 'date') input.type = 'date';
        else if (v.validation === 'number') { input.type = 'text'; input.inputMode = 'numeric'; }
        else input.type = 'text';
        form.appendChild(input);
        form.appendChild(el('button', 'btn btn-primary', 'המשך ←'));
        form.onsubmit = function (e) { e.preventDefault(); var x = input.value.trim(); if (x) go({ t: 'x', v: x }); };
        screen.appendChild(form);
        setTimeout(function () { input.focus(); }, 50);
      } else if (v.type === 'question') {
        screen.appendChild(rich(v.text));
        var opts = el('div', 'bot-options');
        v.options.forEach(function (label, i) {
          var b = el('button', 'bot-opt', label);
          b.type = 'button';
          b.onclick = function () { go({ t: 'c', i: i }); };
          opts.appendChild(b);
        });
        screen.appendChild(opts);
      } else if (v.type === 'ending') {
        renderEnding(screen, v);
      } else if (v.type === 'end') {
        screen.classList.add('bot-done');
        screen.appendChild(el('span', 'bot-check', '✓'));
        screen.appendChild(rich(v.text));
      }

      if (views.length && v.type !== 'end') {
        var bk = el('button', 'bot-back', '→ חזרה');
        bk.type = 'button'; bk.onclick = back;
        body.appendChild(bk);
      }
      card.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }

    function renderEnding(screen, v) {
      if (v.title) screen.appendChild(el('h3', 'bot-title', v.title));
      screen.appendChild(rich(v.text));

      if (v.docs && v.docs.length) {
        var box = el('div', 'bot-docs');
        box.appendChild(el('strong', null, 'המסמכים שנצטרך ממך:'));
        var ul = el('ul');
        v.docs.forEach(function (d) { ul.appendChild(el('li', null, d)); });
        box.appendChild(ul);
        var wa = el('a', 'bot-wa-self', 'שמירת הרשימה אצלי בוואטסאפ');
        wa.href = 'https://wa.me/?text=' + encodeURIComponent('המסמכים ש-MOR CPA צריכים ממני:\n' + v.docs.map(function (d) { return '□ ' + d; }).join('\n'));
        wa.target = '_blank'; wa.rel = 'noopener';
        box.appendChild(wa);
        screen.appendChild(box);
      }

      var form = el('form', 'bot-contact');
      form.appendChild(el('strong', null, 'לאן נחזור אליך?'));
      var name = el('input'); name.placeholder = 'שם מלא'; name.required = true; name.autocomplete = 'name';
      if (v.name) name.value = v.name;
      var phone = el('input'); phone.placeholder = 'טלפון'; phone.type = 'tel'; phone.required = true; phone.autocomplete = 'tel';
      phone.pattern = '[0-9+\\- ]{9,15}';
      var note = el('textarea');
      note.placeholder = v.note || 'יש עוד משהו שחשוב שנדע? (לא חובה)';
      note.rows = 3;
      var trap = el('input', 'hp'); trap.tabIndex = -1; trap.autocomplete = 'off';
      // אישור פרטיות: כפתור השליחה פעיל רק אחרי הסימון
      var consent = el('label', 'bot-consent');
      var check = el('input'); check.type = 'checkbox';
      var purpose = PURPOSE[bot] || 'הבדיקה';
      var ctext = el('span', null, 'אני מאשר/ת את שמירת הפרטים לצורך ' + purpose + ' בהתאם ל');
      var plink = el('button', 'bot-privacy-link', 'מדיניות הפרטיות');
      plink.type = 'button';
      plink.onclick = function (e) { e.preventDefault(); showPrivacy(purpose, plink); };
      ctext.appendChild(plink);
      consent.appendChild(check); consent.appendChild(ctext);
      var btn = el('button', 'btn btn-primary btn-block', 'שליחה');
      btn.disabled = true; btn.title = 'יש לאשר את מדיניות הפרטיות לפני השליחה';
      check.onchange = function () { btn.disabled = !check.checked; btn.title = check.checked ? '' : 'יש לאשר את מדיניות הפרטיות לפני השליחה'; };
      var msg = el('p', 'bot-msg');
      [name, phone, note, trap, consent, btn, msg].forEach(function (x) { form.appendChild(x); });
      form.onsubmit = function (e) {
        e.preventDefault();
        if (!check.checked) return;
        btn.disabled = true; btn.textContent = 'שולח…';
        go(null, { name: name.value.trim(), phone: phone.value.trim(), note: note.value.trim(), botcheck: trap.value });
        // אם השליחה נכשלה — fail() מציג הודעה, והכפתור חוזר
        var t = setInterval(function () { if (!busy) { clearInterval(t); btn.disabled = !check.checked; btn.textContent = 'שליחה'; } }, 300);
      };
      screen.appendChild(form);
    }

    render();
  }

  function boot() {
    Array.prototype.forEach.call(doc.querySelectorAll('.bot[data-bot]'), function (box) {
      var bot = box.getAttribute('data-bot');
      box.classList.add('bot-busy');
      ask({ action: 'bot', bot: bot, path: [] })
        .then(function (v) { box.classList.remove('bot-busy'); Bot(box, bot, v); })
        .catch(function () { box.textContent = 'לא הצלחנו לטעון את הבדיקה. אפשר לפנות אלינו בוואטסאפ.'; });
    });
  }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', boot); else boot();
})(window);
