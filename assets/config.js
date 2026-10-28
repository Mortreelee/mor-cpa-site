/* הגדרות משותפות לאתר ולבוטים.
   mailEndpoint — כתובת הסקריפט בחשבון ה-Google של העסק (מסתיימת ב-/exec).
   הפניות מהבוטים ומטופס יצירת הקשר נשלחות אליו, והוא מעביר אותן ל-Gmail.
   דרכה גם רצים הבוטים (הקוד שלה שמור מחוץ למאגר).
   כל עוד השדה ריק, הפניות נפתחות בוואטסאפ במקום. */
window.MORE = {
  mailEndpoint: 'https://script.google.com/macros/s/AKfycbxrvPLd12cb82rGiT_l2d9Q2oAkWlapdjtqBXb45sm6Uo_M47tOqd66yWMOuUqARra6sQ/exec',
  whatsapp: '972525486486'
};

/* שליחה משותפת לבוטים ולטופס. מחזירה Promise שמצליח רק אם הסקריפט אישר.
   הגוף נשלח כ-text/plain כדי שהדפדפן לא יבצע בדיקת CORS מקדימה,
   שהסקריפט של Google לא עונה עליה. */
window.MORE.send = function (payload) {
  return fetch(window.MORE.mailEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload)
  }).then(function (r) { return r.json(); }).then(function (j) {
    if (!j.success) throw new Error(j.message || 'send failed');
    return 'mail';
  });
};
