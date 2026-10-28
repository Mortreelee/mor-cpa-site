"""עדכון חודשי של assets/madad.json — מוסיף כל מדד חדש שפורסם.

רץ ב-GitHub Actions (.github/workflows/madad.yml) מה-16 בכל חודש, וגם ידנית: python _build/update_madad.py [קובץ]
המקור: ה-API הפתוח של בנק ישראל, סדרה CP_1951 — מדד המחירים לצרכן הכללי של הלמ"ס,
משורשר לבסיס ספטמבר 1951 = 100. המקדם מחודש n עד חודש הייחוס = CP_1951[ref] / CP_1951[n].
(אומת 27.10.2026: זהה למקדמים מהמחשבון של הלמ"ס בכל 441 החודשים, עד הספרה השמינית.)
את ה-API של הלמ"ס עצמו אי אפשר לקרוא מסקריפט — השרת מנתק בקשות שלא באות מדפדפן.
"""
import csv, io, json, sys, time, urllib.request
from pathlib import Path

FILE = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).resolve().parent.parent / 'assets' / 'madad.json'
URL = 'https://edge.boi.org.il/FusionEdgeServer/sdmx/v2/data/dataflow/BOI.STATISTICS/PRI/1.0/CP_1951?startperiod={}&format=csv'


def series(start):
    for attempt in range(4):
        try:
            with urllib.request.urlopen(URL.format(start), timeout=60) as r:
                rows = csv.DictReader(io.StringIO(r.read().decode('utf-8')))
                return {x['TIME_PERIOD']: float(x['OBS_VALUE']) for x in rows if x['OBS_VALUE']}
        except Exception as e:
            err = e
            time.sleep(10 * (attempt + 1))
    raise err


def main():
    d = json.loads(FILE.read_text(encoding='utf-8'))
    last = max(d['f'])
    v = series(min(d['ref'], last))
    if d['ref'] not in v:
        sys.exit('reference month missing from the Bank of Israel series')
    # בדיקת שפיות: החודש האחרון שכבר בקובץ צריך לצאת אותו דבר
    if abs(v[d['ref']] / v[last] / d['f'][last] - 1) > 1e-6:
        sys.exit(f'Bank of Israel series disagrees with the file at {last}')
    added = [k for k in sorted(v) if k > last]
    for k in added:
        d['f'][k] = round(v[d['ref']] / v[k], 8)
    if added:
        FILE.write_text(json.dumps(d, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    print('added:', ' '.join(added) or 'nothing new')


if __name__ == '__main__':
    main()
