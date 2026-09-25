# موقع «الفهرس القياسي — فقه»

صفحة ثابتة (HTML/CSS/JS خالص، بلا build) تعرض الفهرس الموحد: كتب ← أبواب/فصول، مع شارة المصادر لكل بند، وتبويب للتعارضات وآخر للمصادر.

## التشغيل

- افتح `index.html` مباشرة — البيانات محمّلة عبر `data.js` (لا fetch، فتعمل على file://).
- أو محلياً: `python3 -m http.server 8765 --directory indexes/fiqh/site` من جذر المستودع.

## إعادة توليد البيانات

`data.json` و`data.js` مولّدان — لا تحررهما يدوياً:

```bash
python3 indexes/fiqh/tools/build_index.py
```

يقرأ `indexes/fiqh/outlines/*.txt` و`indexes/fiqh/data/*_book_metadata.json` ويعيد كتابة المخرجات كلها (التقرير + التعارضات + المصفوفة + بيانات الموقع).
