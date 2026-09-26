# SAMPLE — تطبيق `pipeline.md` على نص حقيقي خطوة بخطوة

**النص**: المقدمة وثلاث فقرات ونصف من مقال «Sleep» في **Simple English
Wikipedia** (CC BY-SA) — `text_id = src:simple-wiki:Sleep#p0-3` —
184 توكناً في 14 جملة. النص منسوخ verbatim أدناه في §0.

**ملف المتعلم الافتراضي `P4`**: يعرف كل لمّات النطاقات B1–B4
(`rank ≤ 5000`) — يحاكي متعلماً في مستوى L4/B2 حسب SPEC §5.1. لا
`extras` — كل «معروف» أدناه سببه التردد وحده.

**الأرقام**: حُسبت كلها بتطبيق حرفي لقواعد `pipeline.md` على النص —
لا تقديراً يدوياً.

## 0. المدخل

```
Sleep (also called napping) is a state of resting. It happens in most
animals, including humans. To sleep is to be unconscious.
During deep sleep, most of the muscles that animals can control are not
active, but resting to regain the energy they need for the next time
they wake up. When asleep, humans cannot tell what is happening around
them. Like most animals, healthy sleep in humans most often happens at
night.
When something is asleep, it cannot react like it would if it was
awake. However, waking up from sleep is easier than waking up from
hibernation or a coma. All mammals and birds, as well as many reptiles,
amphibians and fish have a sleep cycle. In humans and many other
animals, regular sleep is essential for survival.
It seems that all animals with complex brains have sleep. We know that
sleep is extremely important to human health and well-being. Humans and
animals need sleep but we do not know exactly why. If one is tired
(from not getting enough sleep), one will not be able to function
properly in common activities.
```

## 1. تقسيم الجمل — 14 جملة

الحماية فعّلت `(` و `)` بدون أثر على القطع؛ لا اختصارات بنقطة ولا أعداد
عشرية في هذا النص — القطع كله على `[.]` + فراغ + كبير.

| id | توكنات | بداية الجملة |
|---|---|---|
| s001 | 9 | Sleep (also called napping) is a state of resting. |
| s002 | 7 | It happens in most animals, including humans. |
| s003 | 6 | To sleep is to be unconscious. |
| s004 | **29** | During deep sleep, most of the muscles that animals can control are not active… |
| s005 | 10 | When asleep, humans cannot tell what is happening around them. |
| s006 | 12 | Like most animals, healthy sleep in humans most often happens at night. |
| s007 | 14 | When something is asleep, it cannot react like it would if it was awake. |
| s008 | 15 | However, waking up from sleep is easier than waking up from hibernation or a coma. |
| s009 | 16 | All mammals and birds, as well as many reptiles, amphibians and fish have a sleep cycle. |
| s010 | 12 | In humans and many other animals, regular sleep is essential for survival. |
| s011 | 10 | It seems that all animals with complex brains have sleep. |
| s012 | 12 | We know that sleep is extremely important to human health and well-being. |
| s013 | 12 | Humans and animals need sleep but we do not know exactly why. |
| s014 | 20 | If one is tired (from not getting enough sleep), one will not be able to function properly… |

`msl = 184/14 = 13.1` · جملة واحدة >25 توكناً (s004) ⟵ `S_long = 1/14 = 0.071`.

## 2+3. التوكينة والتلميذة — أمثلة محسوبة

| السطح | اللمّة | القاعدة المستعملة |
|---|---|---|
| is, was, are | be | `IRREG` |
| happens, happening | happen | `s` / `ing` |
| muscles | muscle | `es` → قاعدة `s` بعد فشل `es` على `muscl` |
| napping | nap | `ing` + إلغاء تشديد (`napp`→`nap`) |
| resting | rest | `ing` |
| waking | wake | `ing` + إعادة `e` (`wak`→`wake`) |
| getting | get | `ing` + إلغاء تشديد |
| well-being | well-being | مركَّب: أجزاؤه `well`,`being→be` كلها معروفة ⟵ known |
| humans | human | `s` |

لا `proper` ولا `numeric` في النص — المقام كامل: `scored_tokens = 184`.

## 4. الوسم الترددي

توزيع التوكنات على النطاقات: **B1=146 (79.3%) · B2=19 (10.3%) ·
B3=5 · B4=4 · B5=4 · B6=5 · R=1** ⟵ `U_rare = 14/184 = 0.076`.

أندر الخارج عن معرفة P4 (الجدول الكامل في §6):

| لمّة | rank | zipf | band |
|---|---|---|---|
| amphibians | خارج الجدول | 2.94 | R |
| hibernation | 28580 | 3.01 | B6 |
| reptiles | 18177 | 3.36 | B6 |
| mammals | 11246 | 3.70 | B6 |
| regain | 10751 | 3.73 | B6 |
| coma | 10514 | 3.74 | B6 |
| nap | 9369 | 3.82 | B5 |
| unconscious | 7866 | 3.94 | B5 |
| awake | 5658 | 4.14 | B5 |
| react | 5538 | 4.16 | B5 |

## 5. الربط بالبنك — جملة كاملة موثّقة

`s007` — «When something is asleep, it cannot react like it would if it
was awake.»

| raw | lemma | rank | zipf | band | known |
|---|---|---|---|---|---|
| When | when | 48 | 6.37 | B1 | ✓ |
| something | something | 152 | 5.81 | B1 | ✓ |
| is | be | 17 | 6.79 | B1 | ✓ |
| asleep | asleep | 3860 | 4.36 | B4 | ✓ |
| it | it | 12 | 6.95 | B1 | ✓ |
| cannot | cannot | 802 | 5.11 | B1 | ✓ |
| react | react | 5538 | 4.16 | B5 | **؟** |
| like | like | 42 | 6.41 | B1 | ✓ |
| it | it | 12 | 6.95 | B1 | ✓ |
| would | would | 63 | 6.27 | B1 | ✓ |
| if | if | 37 | 6.47 | B1 | ✓ |
| it | it | 12 | 6.95 | B1 | ✓ |
| was | be | 17 | 6.79 | B1 | ✓ |
| awake | awake | 5658 | 4.14 | B5 | **؟** |

## 6. الحساب الدقيق

\[
C_{token} = \frac{174}{184} = 0.9457, \qquad
C_{lemma} = \frac{90}{100} = 0.90
\]

المجهولات: **10 لمّات × توكن واحد لكل** — مفصَّلة في جدول §4.
`syn = 0.57` علامة تبعية/جملة.

| الحكم على الخام | |
|---|---|
| `C_token = 0.9457` ∈ [0.90, 0.95) | **i+2** — أصعب من المستوى بقليل |

## 7. قابلية الاستنتاج

| لمّة | count | علامة تعريف؟ | inferable |
|---|---|---|---|
| nap | 1 | `called` في s001 — «(also called **napping**)» ضمن 6 توكنات | **نعم** |
| التسع الباقية | 1 | — | لا |

ملاحظة صدق: «To sleep **is to be** unconscious» تعريف ضمني لكنه ليس من
`DEF_MARKERS` — القاعدة محافظة ⟵ `unconscious` غير قابلة وتدخل خطة
pre-teach.

## 8. خطة التكييف → الحكم النهائي

خوارزمية §5.3 في SPEC.md — أضف مجهولات غير قابلة بترتيب `zipf`
الأعلى حتى \(C_{eff} \geq 0.95\) وgloss ≤5 وحمل الجملة ≤3:

| خطوة | تُدرَّس | \(C_{eff}\) | gloss المتبقّي | أقصى حمل جملة |
|---|---|---|---|---|
| 0 | — | 0.9457 | 9 | 3 (s009) |
| 1 | react | 0.9511 | 8 | 3 |
| 2 | awake | 0.9565 | 7 | 3 |
| 3 | unconscious | 0.9620 | 6 | 3 |
| 4 | coma | **0.9674** | **5** | **3** |

⇒ `preteach = [react, awake, unconscious, coma]` ·
`inference_targets = [nap]` ·
`gloss = [regain, hibernation, mammals, reptiles, amphibians]`
(5 لمّات — عند سقف 5/200 بالضبط).

**الحكم بعد التكييف: `i+1`** — \(C_{eff} = 178/184 = 0.9674\).
تحذير هامشي: s009 تحمل 3 مجهولات متبقية (mammals, reptiles, amphibians)
— عند السقف، تُقدَّم الجملة بتظليل gloss كثيف أو يُسمح ببطاقة سادسة
(mammals، zipf 3.70) إن تعثرت القراءة فعلياً.

## 9. المخرج النهائي (ملخص stats)

```json
{"text_id": "src:simple-wiki:Sleep#p0-3",
 "tokens": 184, "scored_tokens": 184, "sentences": 14,
 "msl": 13.1, "S_long": 0.071, "syn": 0.57, "U_rare": 0.076,
 "D": 0.11,
 "C_token": 0.9457, "C_lemma": 0.90,
 "verdict": "i+2", "verdict_after": "i+1",
 "preteach": ["react", "awake", "unconscious", "coma"],
 "inference_targets": ["nap"],
 "gloss": ["regain", "hibernation", "mammals", "reptiles", "amphibians"],
 "residual_per_sent": {"s001": 1, "s004": 1, "s008": 1, "s009": 3}}
```

**ما يتغذى به**: بطاقات pre-teach الأربع تدخل `vocab_bank`
بـ`added_by=preteach` و`state=seen` ثم `known` بعد دراستها؛ `nap`
تولّد شريحة استنتاج رباعية (exercises.md §2) على s001؛ الخمس الباقية
تُظلَّل gloss عند القراءة وتُسجَّل `exposure`. لو كان المتعلم P3
(`rank ≤ 2000`) بدل P4 لسقط `C_token` إلى 164/184 = **0.891** ⟵ دون
عتبة i+2 نفسها، وحتى استنزاف ميزانية pre-teach كاملة (8) يبقى
\(C_{eff} = 0.935 < 0.95\) ⟵ `out` ويُؤجَّل النص — نفس الخط، حكم مختلف
بمستوى مختلف: هذا هو العقد.
