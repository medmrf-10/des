import json
rows=json.load(open('samples.json'))
parts=''
for idx,model,txt in rows:
    n=idx.replace('c','مقطع ')
    parts+=f'''<div class="card"><div class="head"><span class="badge">{n}</span><span class="model">{model}</span></div><p class="tr">{txt}</p></div>\n'''
html=f'''<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>عينات التفريغ — مفاتيح خارج الماك</title><style>
:root{{--bg:#0d1117;--card:#161b22;--card2:#1c2128;--border:#30363d;--txt:#e6edf3;--dim:#8b949e;--acc:#58a6ff;--acc2:#3fb950;--ok:#3fb950;--r-lg:12px;--font-ar:'Amiri','Noto Naskh Arabic',serif;--font-ui:system-ui}}
*{{box-sizing:border-box}}body{{background:var(--bg);color:var(--txt);font-family:var(--font-ui);margin:0;padding:20px;max-width:900px;margin:auto}}
h1{{font-family:var(--font-ar);font-size:1.6rem;color:var(--acc);margin-bottom:4px}}
.sub{{color:var(--dim);font-size:.9rem;margin-bottom:18px}}
.meta{{background:var(--card2);border:1px solid var(--border);border-radius:var(--r-lg);padding:14px 16px;margin-bottom:20px;font-size:.85rem;line-height:1.9}}
.meta b{{color:var(--acc2)}}
.card{{background:var(--card);border:1px solid var(--border);border-radius:var(--r-lg);padding:16px;margin-bottom:14px}}
.head{{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}}
.badge{{background:var(--acc);color:#0d1117;font-weight:700;font-size:.75rem;padding:3px 10px;border-radius:20px}}
.model{{color:var(--dim);font-size:.75rem;direction:ltr}}
.tr{{font-family:var(--font-ar);font-size:1.15rem;line-height:2.1;margin:0}}
.failed{{border-color:#8b3a3a;opacity:.6}}
footer{{color:var(--dim);font-size:.75rem;text-align:center;margin-top:30px}}
</style></head><body>
<h1>عينات تفريغ حقيقية — مفاتيح AI Studio خارج الماك</h1>
<div class="sub">تقرير تجربة حيّة: تفريغ بمفتاح واحد من جهاز ديفن (سيرفر سحابي) — كل مقطع نجح بنداء API مباشر لجوجل</div>
<div class="meta">
<b>السلسلة:</b> شرح المنهج المنتخب (د83 — ق136: الأصل أن من أتلف مثلياً فعليه مثله) — الشيخ محمد البردوني الحسيمي<br>
<b>المصدر:</b> يوتيوب، الدرس الأول من قائمة السلسلة (985)<br>
<b>الطريقة:</b> تقسيم الصوت لمقاطع 60 ثانية + نداء واحد لكل مقطع + تدوير 5 نماذج على نفس المفتاح عند الـ503<br>
<b>النتيجة حتى الآن:</b> {len(rows)} مقطعاً ناجحاً من 20 معالَجاً — 19 نجاح / 1 فشل كلي (c002 بعد 8 محاولات)<br>
<b>أول 429 حقيقي:</b> ظهر على gemini-3.5-flash بعد ~20 طلباً — يؤكد كوتة 20/يوم/نموذج لكل مفتاح
</div>
{parts}
<div class="card failed"><div class="head"><span class="badge">مقطع 002</span><span class="model">FAILED ×8</span></div><p class="tr">فشل بعد 8 محاولات موزّعة على 5 نماذج — نافذة سعة مغلقة في تلك الدقائق.</p></div>
<footer>أُنشئ آلياً من نتائج تجربة حيّة — {len(rows)} مقطعاً — {__import__('datetime').datetime.now().strftime('%Y-%m-%d %H:%M')} UTC</footer>
</body></html>'''
open('index.html','w').write(html)
print("BUILT",len(html))
