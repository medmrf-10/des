# مُطالَع API — خدمة استعلام ثابتة فوق سلاسل التفريغ

أساس كل نقطة: `https://medmrf-10.github.io/des/mutalaa/api/`

## القراءة

| النقطة | الوصف |
|---|---|
| `index.json` | فهرس النقاط + العدّادات |
| `series.json` | كل السلاسل الـ1006 مصغّرة: `id,name,sheikh,total,done,status,pos,want,lists,requested` |
| `series/<id>.json` | سلسلة واحدة كاملة + `files[]` + `url` |
| `sheikhs.json` | المشايخ مجمّعين مع عدّادات السلاسل/الحلقات |
| `next.json` | `next` = السلسلة التالية غير المكتملة حسب الترتيب + `queue` + `requests` |

### حقول `want` (درجة الرغبة)
`-1` غير مرغوب · `0` محايد · `1` مرغوب · `2` مرغوب جدًا · `3` أولوية قصوى.
`pos` = موضعها في طابور «قريب البدء» (0 = خارجه). `lists` = القوائم التي تضمها.

## الكتابة (عن بُعد)
`POST https://ntfy.sh/des_mutalaa_q9` بجسد JSON — يستهلكه ديمن mutalaa_ctl على الهَب
خلال ثوانٍ ويدمج في `orders.json` ويعيد بناء هذه النقاط ويدفعها:

```json
{"kind":"order","ids":["55","91"],"requests":["822"],"lists":{"تزكية":["386"]},"want":{"55":3,"91":-1},"t":0}
{"kind":"want","id":"55","deg":-1}
{"kind":"feed","id":"822"}
```

## خادم MCP (stdio)
`api/mcp_server.py` — بلا اعتماديات، يغلّف هذه النقاط:
`list_series(sheikh,status,want,q,limit)` · `get_series(id)` · `list_sheikhs()` ·
`next_series()` · `set_want(id,deg)` · `request_series(id)`
(أدوات الكتابة تُرجع جسم الـPOST الجاهز — الوكيل ينشره على ntfy).
شغّله: `python3 api/mcp_server.py` وأضِفه كخادم stdio عند أي عميل MCP.
