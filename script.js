/* ============================================================
   mor-cpa.co.il — לוגיקת האתר
   ============================================================ */
(function () {
  'use strict';

  var WA_NUMBER = '972525486486'; // מספר הוואטסאפ, בפורמט בינלאומי ללא +


  // איך נשלח טופס יצירת הקשר:
  //   'whatsapp' — נפתח וואטסאפ עם הפרטים מוכנים (עובד מיד, בלי שום הגדרה)
  //   'server'   — הטופס נשלח לשרת. לבחור רק אחרי שהגדרנו Netlify Forms
  //                או Formspree, אחרת הפניות פשוט יאבדו.
  var FORM_MODE = 'server';

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

  /* ---------- טופס יצירת קשר ----------
     FORM_MODE = 'server': הפניות נשלחות ל-Netlify Forms, ומשם
     למייל. הטופס ב-index.html כבר מסומן data-netlify עם שדה
     form-name ומלכודת ספאם (netlify-honeypot).

     ⚠️ ההתראה למייל מוגדרת בממשק של Netlify, לא כאן:
     Site configuration → Forms → Form notifications → Email notification.
     בלעדיה הפניות נשמרות אבל אף מייל לא נשלח.

     'whatsapp' נשאר כמסלול חלופי, וגם משמש אוטומטית
     בפתיחה מקומית מהדיסק (file://), שם אין לאן לשלוח.
  --------------------------------------------------------------- */
  var form = document.getElementById('contactForm');
  var note = document.getElementById('formNote');

  if (form && note) {
    var defaultNote = note.textContent;

    form.addEventListener('submit', function (e) {
      // מצב 'server': שולחים ל-Netlify ברקע (fetch) במקום לתת לדפדפן
      // לנווט. אחרת המבקר נזרק לעמוד התודה הגנרי של Netlify — באנגלית,
      // בלי העיצוב של האתר. ככה הוא נשאר בעמוד ומקבל אישור בעברית.
      // (בפתיחה מקומית מהדיסק אין לאן לשלוח — נופלים חזרה לוואטסאפ)
      if (FORM_MODE === 'server' && location.protocol !== 'file:') {
        e.preventDefault();
        if (!form.reportValidity()) return;

        var btn = form.querySelector('[type="submit"]');
        var btnLabel = btn ? btn.textContent : '';
        if (btn) { btn.disabled = true; btn.textContent = 'שולח...'; }

        fetch('/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams(new FormData(form)).toString()
        })
          .then(function (res) {
            if (!res.ok) throw new Error('HTTP ' + res.status);
            form.reset();
            note.textContent = 'תודה! הפנייה התקבלה ואחזור בהקדם.';
            note.className = 'form-note ok';
          })
          .catch(function () {
            note.textContent = 'השליחה נכשלה. אפשר לנסות שוב, או לפנות ישירות בוואטסאפ.';
            note.className = 'form-note err';
          })
          .then(function () {
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
