"""בונה את עמודי האתר מתבנית אחת.

הכותרת, התפריט והתחתית נמצאים פעם אחת ב-layout.html, והתוכן של כל
עמוד ב-pages/. מוסיפים עמוד (למשל מחשבון)? מוסיפים שורה ל-PAGES,
ואם צריך גם ל-NAV, ומריצים:

    python _build/build.py

הסקריפט כותב את index.html בשורש, תיקייה עם index.html לכל עמוד אחר,
ואת sitemap.xml. GitHub Pages לא מפרסם תיקיות שמתחילות ב-_ ,
כך שהתיקייה הזו לא עולה לאתר.
"""
from pathlib import Path
from urllib.parse import quote

BUILD = Path(__file__).resolve().parent
SITE = BUILD.parent
DOMAIN = "https://mor-cpa.co.il/"

# path = הכתובת באתר ("" = דף הבית). file = קובץ התוכן ב-pages/.
PAGES = [
    {"path": "", "file": "home.html",
     "title": "MOR CPA · החזרי מס, פרישה וקיבוע זכויות, דוחות שנתיים",
     "desc": "החזרי מס, מיסוי פרישה, קיבוע זכויות ודוחות שנתיים — הכל דיגיטלי, בליווי רו״ח מוסמך. בלי שיחות טלפון מתישות ובלי ערימות של טפסים."},
    {"path": "hechzer-mas/", "file": "hechzer-mas.html",
     "title": "החזרי מס לשכירים ולפנסיונרים · MOR CPA",
     "desc": "בודקים בצ'אט קצר אם מגיע לך החזר מס, עד שש שנים אחורה. בדיקה ראשונית ללא עלות, ואם יש החזר — מגישים ועוקבים עד שהכסף נכנס."},
    {"path": "prisha/", "file": "prisha.html",
     "title": "מיסוי פרישה וקיבוע זכויות · MOR CPA",
     "desc": "פורשים? בודקים את המיסוי של מענקי הפרישה, פריסה, וקיבוע זכויות (טופס 161ד), כדי שיישאר לכם כמה שיותר מהכסף."},
    {"path": "dochot/", "file": "dochot.html",
     "title": "דוחות שנתיים · MOR CPA",
     "desc": "מכינים ומגישים את הדוח השנתי לרשות המסים, כולל הדוחות שמוגשים בשנים שבהן נפרס מענק פרישה."},

    # הבוטים — תבנית אחת (bot.html). bot_file = שם הבוט בשרת (Apps Script); העץ עצמו לא באתר
    {"path": "bdika/hechzer/", "file": "bot.html", "bot": True,
     "title": "בדיקת החזר מס בחינם · MOR CPA",
     "desc": "כמה שאלות קצרות, 2-3 דקות, ויודעים אם מגיע לך החזר מס. בלי מסמכים ובלי עלות.",
     "bot_file": "hechzer", "bot_kicker": "בדיקת החזר מס",
     "bot_title": "מגיע לך <span class=\"grad\">החזר מס</span>?",
     "bot_lede": "כמה שאלות קצרות, 2-3 דקות, בלי מסמכים ובלי עלות. בסוף תדעו אם יש כיוון."},
    {"path": "bdika/prisha/", "file": "bot.html", "bot": True,
     "title": "בדיקה מהירה לפורשים · MOR CPA",
     "desc": "פורשים? בשתי דקות מבינים מה כדאי לבדוק: מיסוי המענק, פריסה, קיבוע זכויות והחזר מס.",
     "bot_file": "prisha", "bot_kicker": "בדיקה מהירה לפורשים",
     "bot_title": "מה כדאי לבדוק <span class=\"grad\">בפרישה שלך</span>?",
     "bot_lede": "שתי דקות של שאלות קצרות, ובסוף רשימה ברורה של מה ששווה לבדוק במקרה שלך."},
    {"path": "bdika/atzmai/", "file": "bot.html", "bot": True,
     "title": "פתיחת תיק לעצמאי · MOR CPA",
     "desc": "פותחים עסק? שתי דקות של פרטים בסיסיים, ואנחנו מכינים את פתיחת התיקים מול הרשויות.",
     "bot_file": "atzmai", "bot_kicker": "פתיחת תיק לעצמאי",
     "bot_title": "יוצאים לדרך <span class=\"grad\">עצמאית</span>?",
     "bot_lede": "שתי דקות של פרטים בסיסיים, ואנחנו מכינים את פתיחת התיקים מול כל הרשויות."},

    # מחשבונים — "js" = קובץ ב-assets/ שנטען רק בעמוד הזה
    {"path": "machshevon/", "file": "machshevon.html",
     "title": "מחשבונים למס — קיבוע זכויות, גיל פרישה ועוד · MOR CPA",
     "desc": "מחשבונים חינמיים למס: קיבוע זכויות, גיל פרישה ועוד. תשובה מהירה, ובדיקה מלאה כשצריך."},
    {"path": "machshevon/gil-prisha/", "file": "machshevon-gil.html", "js": "gil-calc.js",
     "title": "מחשבון גיל פרישה — מתי תגיעו לגיל פרישה · MOR CPA",
     "desc": "מחשבון גיל פרישה לפי חוק גיל פרישה: 67 לגבר, ולאישה בין 62 ל-65 לפי חודש הלידה. באיזה גיל ובאיזה חודש בדיוק."},
    {"path": "machshevon/kibua/", "file": "machshevon-kibua.html", "js": "kibua-calc.js",
     "title": "מחשבון קיבוע זכויות 2026 — כמה מהקצבה פטור ממס · MOR CPA",
     "desc": "מחשבון קיבוע זכויות 2026: כמה מהקצבה שלך תהיה פטורה ממס, כמה זה חוסך בכל חודש, ואיך מענקי פרישה והיוון משפיעים על סל ההון הפטור."},
    {"path": "machshevon/madad/", "file": "machshevon-madad.html", "js": "madad-calc.js",
     "title": "מחשבון הצמדה למדד — כמה הסכום שווה היום · MOR CPA",
     "desc": "מחשבון הצמדה למדד המחירים לצרכן: שכר דירה, מזונות, הלוואה או חוזה. מזינים סכום ושני חודשי מדד, ומקבלים את הסכום המוצמד, לפי נתוני הלמ\"ס."},
    {"path": "machshevon/mas-yachid/", "file": "machshevon-mas.html", "js": "mas-calc.js",
     "title": "מחשבון מס הכנסה 2020–2026 — כמה מס יורד לך · MOR CPA",
     "desc": "מחשבון מס הכנסה ליחיד לשנים 2020–2026: מדרגות המס, נקודות זיכוי לילדים, תואר וחייל משוחרר, והטבת יישוב מוטב — כמה מס יורד וכמה נשאר לך."},
]

# התפריט העליון. "#about" = עוגן בדף הבית.
NAV = [
    ("hechzer-mas/", "החזרי מס"),
    ("prisha/", "פרישה וקיבוע זכויות"),
    ("dochot/", "דוחות שנתיים"),
    ("machshevon/", "מחשבונים"),
    ("#about", "אודות"),
]

WA_ICON = (BUILD / "wa-icon.svg").read_text(encoding="utf-8").strip()


def wa_link(text):
    return "https://wa.me/972525486486?text=" + quote(text)


def render(page):
    depth = page["path"].count("/")
    root = "../" * depth if depth else ""
    nav, foot = [], []
    for href, label in NAV:
        url = root + href
        active = ' aria-current="page"' if href == page["path"] else ""
        nav.append(f'      <a href="{url}"{active}>{label}</a>')
        foot.append(f'      <a href="{url}">{label}</a>')

    content = (BUILD / "pages" / page["file"]).read_text(encoding="utf-8")
    html = (BUILD / "layout.html").read_text(encoding="utf-8")
    for key, val in {
        "{{content}}": content,
        "{{nav}}": "\n".join(nav),
        "{{footer_nav}}": "\n".join(foot),
        "{{title}}": page["title"],
        "{{desc}}": page["desc"],
        "{{path}}": page["path"],
        "{{scripts}}": (f'\n<script src="{root}assets/bot.js"></script>' if page.get("bot") else "")
                       + (f'\n<script src="{root}assets/{page["js"]}"></script>' if page.get("js") else ""),
    }.items():
        html = html.replace(key, val)
    for key in ("bot_file", "bot_kicker", "bot_title", "bot_lede"):
        html = html.replace("{{" + key + "}}", page.get(key, ""))
    # אחרי שהתוכן בפנים — מחליפים את הקיצורים שמופיעים גם בתוכו
    html = html.replace("{{wa_icon}}", WA_ICON)
    html = html.replace("{{wa_refund}}", wa_link("היי MOR CPA, אשמח לבדוק זכאות להחזר מס"))
    html = html.replace("{{wa_prisha}}", wa_link("היי MOR CPA, אני לקראת פרישה ואשמח לבדוק את המיסוי"))
    html = html.replace("{{wa_dochot}}", wa_link("היי MOR CPA, אשמח לקבל הצעה לדוח שנתי"))
    html = html.replace("{{wa_general}}", wa_link("היי MOR CPA, הגעתי מהאתר ואשמח לשמוע פרטים"))
    html = html.replace("{{root}}", root)
    return html


for page in PAGES:
    out = SITE / page["path"] / "index.html"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(render(page), encoding="utf-8", newline="\n")
    print("wrote", out.relative_to(SITE))

urls = "\n".join(f"  <url>\n    <loc>{DOMAIN}{p['path']}</loc>\n  </url>" for p in PAGES)
(SITE / "sitemap.xml").write_text(
    '<?xml version="1.0" encoding="UTF-8"?>\n'
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    f"{urls}\n</urlset>\n", encoding="utf-8", newline="\n")
print("wrote sitemap.xml")
