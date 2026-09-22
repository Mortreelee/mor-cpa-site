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
  var FORM_MODE = 'whatsapp';

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
     כרגע FORM_MODE = 'whatsapp': הטופס פותח וואטסאפ עם הפרטים מוכנים,
     כך שהוא עובד מהרגע הראשון בלי שום הגדרה בצד שרת.

     כשנרצה שהפניות יגיעו למייל במקום:
       1. לארח את האתר ב-Netlify (הטופס כבר מסומן ב-data-netlify),
          או לפתוח חשבון ב-Formspree ולהוסיף action לטופס ב-index.html.
       2. לשנות למעלה את FORM_MODE ל-'server'.
  --------------------------------------------------------------- */
  var form = document.getElementById('contactForm');
  var note = document.getElementById('formNote');

  if (form && note) {
    var defaultNote = note.textContent;

    form.addEventListener('submit', function (e) {
      // במצב 'server' לא מתערבים — הדפדפן שולח את הטופס כרגיל.
      // (מלבד בפתיחה מקומית מהדיסק, שם אין לאן לשלוח)
      if (FORM_MODE === 'server' && location.protocol !== 'file:') return;

      e.preventDefault();

      if (!form.reportValidity()) return;

      var data = new FormData(form);
      var lines = [
        'פנייה מהאתר',
        'שם: ' + (data.get('name') || ''),
        'טלפון: ' + (data.get('phone') || ''),
        'אימייל: ' + (data.get('email') || '—'),
        'שנות עבודה: ' + (data.get('years') || '—'),
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
