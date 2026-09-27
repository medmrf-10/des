#!/usr/bin/env bash
# يجلب بيانات spa5k/tafsir_api ويستخرج الطبعات العربية الـ57 إلى data/tafsir_api-main/
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p data
cd data

echo "== تنزيل أرشيف المستودع (~934MB)"
curl -sL -o tafsir_main.tar.gz https://codeload.github.com/spa5k/tafsir_api/tar.gz/refs/heads/main

echo "== تحديد الطبعات العربية"
curl -s https://cdn.jsdelivr.net/gh/spa5k/tafsir_api@main/tafsir/editions.json -o editions_raw.json
python3 - <<'PY'
import json
eds = json.load(open('editions_raw.json'))
slugs = [e['slug'] for e in eds if e.get('language_name') == 'arabic']
open('ar_slugs.txt', 'w').write('\n'.join(slugs))
print(len(slugs), 'طبعة عربية')
PY

echo "== فهرسة أعضاء الأرشيف المطلوبين"
python3 - <<'PY'
import re, tarfile
slugs = open('ar_slugs.txt').read().split()
pat = re.compile(r'tafsir_api-main/(tafsir/(' + '|'.join(map(re.escape, slugs)) + r')/|tafsir/editions\.json|data/|LICENSE|README\.md)')
with tarfile.open('tafsir_main.tar.gz') as tf, open('members.txt', 'w') as out:
    for m in tf:
        if pat.search(m.name):
            out.write(m.name + '\n')
PY

echo "== استخراج (~330 ألف ملف — بضع دقائق)"
tar -xzf tafsir_main.tar.gz -T members.txt || true   # tar يشكو من أعضاء غائبين فرعيين — مقبول
mv tafsir_api-main/data/ayah_data.json . 2>/dev/null || true
ls tafsir_api-main/tafsir | wc -l
echo "تم — البيانات في data/tafsir_api-main/tafsir"
