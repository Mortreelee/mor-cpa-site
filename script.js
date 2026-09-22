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
  // 'treelee'  — שולח למערכת של מור: נפתח ליד ב-CRM + מייל אליה
  // 'server'   — Netlify Forms (דורש הגדרת התראה בממשק Netlify)
  // 'whatsapp' — פותח וואטסאפ עם הפרטים מוכנים
  var FORM_MODE = 'treelee';
  var TREELEE_ENDPOINT = 'https://treelee.ai/api/treelee/site-contact';
  var TREELEE_API_KEY = 'tb_05c257614b6f66f681bc9596e793eed4e54c0c02af3d0cdd';

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
     FORM_MODE = 'treelee': הפניה נשלחת למערכת של מור (treelee.ai),
     נפתחת שם כליד ב-CRM ונשלח מייל התראה. הנתונים לא
     עוברים דרך אף צד שלישי — כפי שמובטח למבקר מתחת לטופס.

     ה-apiKey כאן הוא מפתח ציבורי ולא סוד: הוא מזהה את הלקוחה
     בלבד, והשרת מאמת בנוסף שהבקשה הגיעה מדומיין מורשה.

     הטופס נשאר מסומן data-netlify במכוון: אם JavaScript נכשל
     או נחסם, הדפדפן שולח את הטופס כרגיל ל-Netlify Forms,
     והפניה עדיין נשמרת שם במקום להיעלם.
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
      if ((FORM_MODE === 'treelee' || FORM_MODE === 'server') && location.protocol !== 'file:') {
        e.preventDefault();
        if (!form.reportValidity()) return;

        var btn = form.querySelector('[type="submit"]');
        var btnLabel = btn ? btn.textContent : '';
        if (btn) { btn.disabled = true; btn.textContent = 'שולח...'; }

        var d = new FormData(form);
        var request = FORM_MODE === 'treelee'
          ? fetch(TREELEE_ENDPOINT, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                apiKey: TREELEE_API_KEY,
                name: d.get('name') || '',
                phone: d.get('phone') || '',
                email: d.get('email') || '',
                message: d.get('message') || '',
                company: d.get('company') || ''   // מלכודת ספאם
              })
            })
          : fetch('/', {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: new URLSearchParams(d).toString()
            });

        request
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
