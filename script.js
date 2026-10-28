/* ============================================================
   mor-cpa.co.il — לוגיקת האתר
   ============================================================ */
(function () {
  'use strict';

  // ההגדרות ב-assets/config.js: מספר הוואטסאפ וכתובת סקריפט המייל
  var CFG = window.MORE || {};
  var WA_NUMBER = CFG.whatsapp || '972525486486';

  /* ---------- שנה בפוטר ---------- */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- תפריט מובייל ---------- */
  var burger = document.getElementById('burger');
  var nav = document.getElementById('nav');

  if (burger && nav) {
    burger.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'סגירת תפריט' : 'פתיחת תפריט');
    });

    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        nav.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---------- קו הפרדה לכותרת בגלילה ---------- */
  var header = document.getElementById('siteHeader');
  if (header) {
    var onScroll = function () {
      header.classList.toggle('is-stuck', window.scrollY > 8);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- וידאו עץ הכסף ----------
     מי שהגדיר במערכת ההפעלה "צמצום אנימציות" לא אמור לקבל לופ רץ,
     אז במקרה כזה עוצרים ומציגים פקדים כדי שיוכל להפעיל בעצמו.
  --------------------------------------------------------------- */
  var treeVideo = document.querySelector('.tree-media video');

  if (treeVideo && window.matchMedia) {
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reduce.matches) {
      treeVideo.removeAttribute('autoplay');
      treeVideo.autoplay = false;
      treeVideo.loop = false;
      treeVideo.controls = true;
      treeVideo.removeAttribute('aria-hidden');
      treeVideo.pause();
    }
  }

  /* ---------- הופעה בגלילה ----------
     אלמנטים נכנסים בעדינות כשמגיעים אליהם. מי שביקש "צמצום אנימציות"
     או דפדפן ישן בלי IntersectionObserver — רואה הכל מיד. */
  var calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if ('IntersectionObserver' in window && !calm) {
    var targets = document.querySelectorAll(
      '.section-head, .what, .scenario, .moment, .timeline li, .chat-cta, .tree-title, .tree-media, .tree-lede, .card, .steps li, .prose, .faq details, .contact > div, .form'
    );
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        el.classList.add('in');
        io.unobserve(el);
        // בסיום מחזירים לאלמנט את המעברים שלו עצמו (למשל ההרמה של כרטיס בריחוף)
        setTimeout(function () {
          el.classList.remove('reveal', 'in');
          el.style.transitionDelay = '';
        }, 1000);
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    Array.prototype.forEach.call(targets, function (el, i) {
      el.classList.add('reveal');
      // כרטיסים באותה שורה נכנסים בהפרש קטן, לא כולם יחד
      if (el.matches('.card, .what, .scenario, .moment, .timeline li, .steps li, .faq details')) {
        el.style.transitionDelay = (Array.prototype.indexOf.call(el.parentNode.children, el) % 4) * 70 + 'ms';
      }
      io.observe(el);
    });
  }

  /* ---------- הגרף החי: מתחיל לזוז רק כשרואים אותו ---------- */
  document.documentElement.classList.add('js');
  var stages = document.querySelectorAll('.tech-stage');
  if ('IntersectionObserver' in window) {
    var stageIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in-view'); stageIO.unobserve(en.target); }
      });
    }, { threshold: .35 });
    Array.prototype.forEach.call(stages, function (el) { stageIO.observe(el); });
  } else {
    Array.prototype.forEach.call(stages, function (el) { el.classList.add('in-view'); });
  }

  /* ---------- זרקור בכרטיסים ---------- */
  document.addEventListener('pointermove', function (e) {
    var c = e.target.closest && e.target.closest('.card, .what, .steps li');
    if (!c) return;
    var r = c.getBoundingClientRect();
    c.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    c.style.setProperty('--my', (e.clientY - r.top) + 'px');
  }, { passive: true });

  /* ---------- טופס יצירת קשר ----------
     עם כתובת הסקריפט (assets/config.js) — הפנייה נשלחת למייל ברקע,
     והמבקר נשאר בעמוד ומקבל אישור. בלי כתובת — נפתח וואטסאפ
     עם הפרטים מוכנים, כך שאף פנייה לא הולכת לאיבוד.
  --------------------------------------------------------------- */
  var form = document.getElementById('contactForm');
  var note = document.getElementById('formNote');

  if (form && note) {
    var defaultNote = note.textContent;

    form.addEventListener('submit', function (e) {
      if (CFG.mailEndpoint) {
        e.preventDefault();
        if (!form.reportValidity()) return;

        var btn = form.querySelector('[type="submit"]');
        var btnLabel = btn ? btn.textContent : '';
        if (btn) { btn.disabled = true; btn.textContent = 'שולח...'; }

        var d = new FormData(form);
        var sent = false;
        CFG.send({
          subject: 'פנייה חדשה מהאתר · ' + (d.get('name') || ''),
          name: d.get('name') || '',
          phone: d.get('phone') || '',
          email: d.get('email') || '',
          message: d.get('message') || '',
          botcheck: d.get('company') || ''   // מלכודת ספאם
        })
          .then(function () {
            // במקום השדות — הודעת תודה שממלאת את כל הריבוע (באותו גובה, בלי קפיצה)
            form.style.minHeight = form.offsetHeight + 'px';
            form.reset();
            var thanks = document.createElement('div');
            thanks.className = 'form-thanks';
            thanks.setAttribute('role', 'status');
            thanks.innerHTML =
              '<span class="form-thanks-icon" aria-hidden="true">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>' +
              '</span>' +
              '<h3>תודה! הפנייה התקבלה</h3>' +
              '<p>נחזור אליך בהקדם.</p>';
            form.classList.add('sent');
            form.appendChild(thanks);
            sent = true;
          })
          .catch(function () {
            note.textContent = 'השליחה נכשלה. אפשר לנסות שוב, או לפנות ישירות בוואטסאפ.';
            note.className = 'form-note err';
          })
          .then(function () {
            if (sent) return;
            if (btn) { btn.disabled = false; btn.textContent = btnLabel; }
            setTimeout(function () {
              note.textContent = defaultNote;
              note.className = 'form-note';
            }, 8000);
          });
        return;
      }

      e.preventDefault();

      if (!form.reportValidity()) return;

      var data = new FormData(form);
      var lines = [
        'פנייה מהאתר',
        'שם: ' + (data.get('name') || ''),
        'טלפון: ' + (data.get('phone') || ''),
        'אימייל: ' + (data.get('email') || '—'),
        'הודעה: ' + (data.get('message') || '—')
      ];

      window.open('https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(lines.join('\n')), '_blank', 'noopener');

      note.textContent = 'נפתח וואטסאפ עם הפרטים — נותר רק ללחוץ שליחה.';
      note.className = 'form-note ok';

      setTimeout(function () {
        note.textContent = defaultNote;
        note.className = 'form-note';
      }, 7000);
    });
  }
})();
