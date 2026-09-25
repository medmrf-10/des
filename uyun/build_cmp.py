import json,os,re
data=json.load(open('/tmp/cmp_data.json'))
rows=''
for m,d in data.items():
    if not d['txt']: continue
    st=f"{d['ok']}/8 مقاطع"
    txt=d['txt'].replace('[FAILED','<span class="fb">[فشل المقطع</span>').replace('.mp3]','</span>')
    rows+=f'''<div class="card"><div class="head"><span class="badge mdl">{m}</span><span class="ok">{st}</span></div><p class="tr">{txt}</p></div>'''
html=f'''<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>مقارنة جودة التفريغ بين النماذج</title><style>
:root{{--bg:#0d1117;--card:#161b22;--card2:#1c2128;--border:#30363d;--txt:#e6edf3;--dim:#8b949e;--acc:#58a6ff;--acc2:#3fb950;--r-lg:12px;--font-ar:'Amiri','Noto Naskh Arabic',serif;--font-ui:system-ui}}
*{{box-sizing:border-box}}body{{background:var(--bg);color:var(--txt);font-family:var(--font-ui);margin:0;padding:20px;max-width:900px;margin:auto}}
h1{{font-family:var(--font-ar);font-size:1.6rem;color:var(--acc);margin-bottom:4px}}
.sub{{color:var(--dim);font-size:.9rem;margin-bottom:18px}}
.meta{{background:var(--card2);border:1px solid var(--border);border-radius:var(--r-lg);padding:14px 16px;margin-bottom:20px;font-size:.85rem;line-height:1.9}}
.meta b{{color:var(--acc2)}}
.card{{background:var(--card);border:1px solid var(--border);border-radius:var(--r-lg);padding:16px;margin-bottom:14px}}
.head{{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}}
.badge{{background:var(--acc);color:#0d1117;font-weight:700;font-size:.75rem;padding:3px 10px;border-radius:20px}}
.mdl{{direction:ltr}}
.ok{{color:var(--acc2);font-size:.75rem}}
.tr{{font-family:var(--font-ar);font-size:1.15rem;line-height:2.1;margin:0}}
.fb{{background:#3d1f1f;color:#f88;padding:0 4px;border-radius:3px;font-size:.85rem}}
footer{{color:var(--dim);font-size:.75rem;text-align:center;margin-top:30px}}
</style></head><body>
<h1>مقارنة جودة التفريغ — نفس الصوت × كل النماذج</h1>
<div class="sub">أول 8 دقائق من الدرس الثاني (ق135: كل ما أدى ثبوته إلى نفيه فنفيه أولى — المنهج المنتخب)، مقسومة 8 مقاطع × 60ث، نفس المفتاح، نفس الأمر: «Transcribe the audio verbatim in Arabic»</div>
<div class="meta"><b>الوقت:</b> الضغط الحالي على خوادم جوجل عالٍ جداً — النماذج التي لم تظهر بعد ما زالت تُجرّب (تُحدّث الصفحة عند اكتمالها). <b>أُثبت اليوم بالدليل:</b> الـ503 ليس حظراً — نفس المفتاح فشل من جهازك على 3.8 ونجح على 3.5-lite في نفس الدقيقة.</div>
{rows}
<footer>مقارنة حيّة — {__import__('datetime').datetime.now().strftime('%Y-%m-%d %H:%M')} UTC — المفتاح رقم 2 من 50</footer>
</body></html>'''
open('muqaran.html','w').write(html)
print("BUILT",len(html))
