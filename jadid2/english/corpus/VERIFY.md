# VERIFY — فحص يدوي لثلاثة نصوص

توليد آلي من `annotated/*.json`: `python3 verify.py`.

للقارئ اليدوي: ✗ في عمود known = مجهول للبنك المرجعي؛ الأعلام: `N` عددي (معروف آليًا) · `P` اسم علم (خارج المقام) · `~` تشطيق اختصار · `G` ملكية · `-` مركّب واصلي.


## `sw-sleep` — Simple English Wikipedia — Sleep (lead)

- مصدر: `{'corpus': 'Simple English Wikipedia', 'article': 'Sleep', 'url': 'https://simple.wikipedia.org/wiki/Sleep', 'license': 'CC BY-SA 4.0'}`
- 184 توكن (184 محسوبة)، 14 جملة، msl=13.14، S_long=0.071، syn=0.571، U_rare=0.076
- **C_token=0.6685، C_lemma=0.602، D=0.249، حكم خام=out، نهائي=out**
- لماذا هذه العينة: نص عينة المواصفة نفسها — SAMPLE.md §0 تحقّق منه يدوياً عند K=5000 (C=0.9457، 10 لمّات مجهولة)؛ خط الإنتاج يعيد إنتاج تلك الأرقام حرفياً بنفس قناع التوكنات، وعند K≈500 يحكمه `out`.

### s001 — «Sleep (also called napping) is a state of resting.»

| raw | norm | lemma | band | known | flags |
|-----|------|-------|------|-------|-------|
| `Sleep` | `sleep` | `sleep` | B1 | ✗ | — |
| `also` | `also` | `also` | B1 | ✓ | — |
| `called` | `called` | `called` | B1 | ✓ | — |
| `napping` | `napping` | `nap` | B5 | ✗ | — |
| `is` | `is` | `be` | B1 | ✓ | — |
| `a` | `a` | `a` | B1 | ✓ | — |
| `state` | `state` | `state` | B1 | ✓ | — |
| `of` | `of` | `of` | B1 | ✓ | — |
| `resting` | `resting` | `rest` | B1 | ✗ | — |

### s002 — «It happens in most animals, including humans.»

| raw | norm | lemma | band | known | flags |
|-----|------|-------|------|-------|-------|
| `It` | `it` | `it` | B1 | ✓ | — |
| `happens` | `happens` | `happen` | B1 | ✗ | — |
| `in` | `in` | `in` | B1 | ✓ | — |
| `most` | `most` | `many` | B1 | ✓ | — |
| `animals` | `animals` | `animals` | B2 | ✗ | — |
| `including` | `including` | `including` | B1 | ✓ | — |
| `humans` | `humans` | `human` | B1 | ✓ | — |

### المجهولات الأعلى تكراراً

| lemma | count | band | sents | inferable |
|-------|-------|------|-------|-----------|
| `sleep` | 11 | B1 | 11 | ✓ |
| `animals` | 6 | B2 | 6 | ✓ |
| `happen` | 3 | B1 | 3 | ✓ |
| `wake` | 3 | B2 | 2 | ✓ |
| `rest` | 2 | B1 | 2 | ✓ |
| `asleep` | 2 | B4 | 2 | ✓ |
| `cannot` | 2 | B1 | 2 | ✓ |
| `nap` | 1 | B5 | 1 | ✓ |
| `unconscious` | 1 | B5 | 1 | — |
| `deep` | 1 | B1 | 1 | — |
| `muscle` | 1 | B4 | 1 | — |
| `active` | 1 | B2 | 1 | — |

### قصة الحكم
- C_raw=0.6685 < 0.90 → خام `out`، وبعد سلم التكييف C_eff=0.712 (pre-teach=8/8، gloss=23/5، أقصى بقايا/جملة=7، أهداف استنتاج=8) → النهائي `out`.
- مطابقة SAMPLE.md §0: عند بنك rank≤5000 يعيد خط الإنتاج نفس C=0.9457 ونفس 10 لمّات مجهولة وsyn=0.571/msl=13.14/S_long=0.071/U_rare=0.076 — انظر `simulate.py` و`spec_check` في الأمثلة أدناه.

## `hb-bukhari-1-2` — Sahih al-Bukhari 1–2 — Actions are by intentions / beginning of revelation

- مصدر: `{'corpus': 'AhmedBaset/hadith-json', 'book': 'Sahih al-Bukhari', 'hadiths': [1, 2], 'url': 'https://raw.githubusercontent.com/AhmedBaset/hadith-json/main/db/by_book/the_9_books/bukhari.json'}`
- 158 توكن (156 محسوبة)، 7 جملة، msl=22.29، S_long=0.429، syn=0.143، U_rare=0.263
- **C_token=0.5962، C_lemma=0.4831، D=0.333، حكم خام=out، نهائي=out**
- لماذا هذه العينة: نص جسر معرفي مترجم (صحيح البخاري 1–2): أسماء علم كثيرة يجب إخراجها من المقام، ومتعجّل إسلامي (revelation, prophet) يقود المجهولات.

### s001 — «Narrated 'Umar bin Al-Khattab:
I heard Allah's Messenger (صلى الله عليه وسلم) saying, "The reward of deeds depends upon the
intentions and every person will get the reward according to what he
has intended.»

| raw | norm | lemma | band | known | flags |
|-----|------|-------|------|-------|-------|
| `Narrated` | `narrated` | `narrated` | B6 | ✗ | — |
| `Umar` | `umar` | `umar` | B6 | ✗ | — |
| `bin` | `bin` | `bin` | B4 | ✗ | — |
| `Al-Khattab` | `al-khattab` | `al-khattab` | R | ✓ | P- |
| `I` | `i` | `i` | B1 | ✓ | — |
| `heard` | `heard` | `hear` | B1 | ✗ | — |
| `Allah's` | `allah` | `allah` | B5 | ✗ | G |
| `Messenger` | `messenger` | `messenger` | B5 | ✗ | — |
| `saying` | `saying` | `say` | B1 | ✓ | — |
| `The` | `the` | `the` | B1 | ✓ | — |
| `reward` | `reward` | `reward` | B4 | ✗ | — |
| `of` | `of` | `of` | B1 | ✓ | — |
| `deeds` | `deeds` | `deeds` | B5 | ✗ | — |
| `depends` | `depends` | `depends` | B3 | ✗ | — |
| `upon` | `upon` | `upon` | B1 | ✗ | — |
| `the` | `the` | `the` | B1 | ✓ | — |
| `intentions` | `intentions` | `intention` | B4 | ✗ | — |
| `and` | `and` | `and` | B1 | ✓ | — |
| `every` | `every` | `every` | B1 | ✓ | — |
| `person` | `person` | `person` | B1 | ✓ | — |
| `will` | `will` | `will` | B1 | ✓ | — |
| `get` | `get` | `get` | B1 | ✓ | — |
| `the` | `the` | `the` | B1 | ✓ | — |
| `reward` | `reward` | `reward` | B4 | ✗ | — |
| `according` | `according` | `according` | B1 | ✗ | — |
| `to` | `to` | `to` | B1 | ✓ | — |
| `what` | `what` | `what` | B1 | ✓ | — |
| `he` | `he` | `he` | B1 | ✓ | — |
| `has` | `has` | `have` | B1 | ✓ | — |
| `intended` | `intended` | `intended` | B3 | ✗ | — |

### المجهولات الأعلى تكراراً

| lemma | count | band | sents | inferable |
|-------|-------|------|-------|-----------|
| `allah` | 4 | B5 | 3 | ✓ |
| `messenger` | 4 | B5 | 3 | ✓ |
| `inspiration` | 3 | B4 | 3 | ✓ |
| `narrated` | 2 | B6 | 2 | ✓ |
| `bin` | 2 | B4 | 2 | ✓ |
| `reward` | 2 | B4 | 1 | ✓ |
| `emigrated` | 2 | B6 | 1 | ✓ |
| `aisha` | 2 | B6 | 2 | ✓ |
| `revealed` | 2 | B3 | 2 | ✓ |
| `sometimes` | 2 | B1 | 2 | ✓ |
| `grasp` | 2 | B5 | 2 | ✓ |
| `inspired` | 2 | B3 | 2 | ✓ |

### قصة الحكم
- C_raw=0.5962 < 0.90 → خام `out`، وبعد سلم التكييف C_eff=0.6474 (pre-teach=8/8، gloss=26/5، أقصى بقايا/جملة=11، أهداف استنتاج=12) → النهائي `out`.

## `ae-fox-grapes` — The Fox And The Grapes — The Æsop for Children

- مصدر: `{'corpus': 'Project Gutenberg #19994 «The Æsop for Children»', 'url': 'https://www.gutenberg.org/cache/epub/19994/pg19994.txt', 'license': 'public domain'}`
- 155 توكن (155 محسوبة)، 11 جملة، msl=14.09، S_long=0.0، syn=0.364، U_rare=0.135
- **C_token=0.6774، C_lemma=0.5714، D=0.225، حكم خام=out، نهائي=out**
- لماذا هذه العينة: أقصر نصوص البنك (155 كلمة): جمل طويلة قليلة لكن مفرداته المحتوية (fox, grapes, bunch, juicy) خارج الـ500 الأولى — اختبار صدق للحكم.

### s001 — «A Fox one day spied a beautiful bunch of ripe grapes hanging from
a vine trained along the branches of a tree.»

| raw | norm | lemma | band | known | flags |
|-----|------|-------|------|-------|-------|
| `A` | `a` | `a` | B1 | ✓ | — |
| `Fox` | `fox` | `fox` | B3 | ✗ | — |
| `one` | `one` | `one` | B1 | ✓ | — |
| `day` | `day` | `day` | B1 | ✓ | — |
| `spied` | `spied` | `spied` | B6 | ✗ | — |
| `a` | `a` | `a` | B1 | ✓ | — |
| `beautiful` | `beautiful` | `beautiful` | B1 | ✗ | — |
| `bunch` | `bunch` | `bunch` | B3 | ✗ | — |
| `of` | `of` | `of` | B1 | ✓ | — |
| `ripe` | `ripe` | `ripe` | B6 | ✗ | — |
| `grapes` | `grapes` | `grapes` | B6 | ✗ | — |
| `hanging` | `hanging` | `hang` | B3 | ✗ | — |
| `from` | `from` | `from` | B1 | ✓ | — |
| `a` | `a` | `a` | B1 | ✓ | — |
| `vine` | `vine` | `vine` | B6 | ✗ | — |
| `trained` | `trained` | `train` | B2 | ✗ | — |
| `along` | `along` | `along` | B1 | ✓ | — |
| `the` | `the` | `the` | B1 | ✓ | — |
| `branches` | `branches` | `branch` | B3 | ✗ | — |
| `of` | `of` | `of` | B1 | ✓ | — |
| `a` | `a` | `a` | B1 | ✓ | — |
| `tree` | `tree` | `tree` | B2 | ✗ | — |

### المجهولات الأعلى تكراراً

| lemma | count | band | sents | inferable |
|-------|-------|------|-------|-----------|
| `grapes` | 4 | B6 | 4 | ✓ |
| `fox` | 3 | B3 | 3 | ✓ |
| `bunch` | 3 | B3 | 3 | ✓ |
| `hang` | 2 | B3 | 2 | ✓ |
| `branch` | 2 | B3 | 2 | ✓ |
| `jump` | 2 | B3 | 2 | ✓ |
| `walk` | 2 | B1 | 2 | ✓ |
| `spied` | 1 | B6 | 1 | — |
| `beautiful` | 1 | B1 | 1 | — |
| `ripe` | 1 | B6 | 1 | — |
| `vine` | 1 | B6 | 1 | — |
| `train` | 1 | B2 | 1 | — |

### قصة الحكم
- C_raw=0.6774 < 0.90 → خام `out`، وبعد سلم التكييف C_eff=0.729 (pre-teach=8/8، gloss=24/5، أقصى بقايا/جملة=10، أهداف استنتاج=7) → النهائي `out`.

## مطابقة عينة المواصفة (sw-sleep عند K=5000)

```
$ python3 verify.py --spec-check
C_token = 0.9457 · unknown lemmas = 10 [amphibians, awake, coma,
  hibernation, mammals, nap, react, regain, reptiles, unconscious]
msl=13.14 syn=0.571 S_long=0.071 U_rare=0.076 D=0.11 verdict_raw=i+2
```
يطابق SAMPLE.md §0 حرفياً.

## ملاحظات صدق (حواف القاعدة الميكانيكية)

- `umar`, `allah`, `muhammad` **مفهرسة** في جدول wordfreq top-60k، فقاعدة §3-4 («صيغة الدنيا غير مفهرسة ← اسم علم») لا تُخرجها من المقام — تُحتسب مجهولة. القاعدة طُبقت حرفياً كما كُتبت.
- `most` → `many` و`better` → `good`: ربط IRREG للمتفوّقات الشاذة صحيح دلاليًا ولا يغيّر الحكم (كلا اللمّتين معروفتان).
- `(93:1)` ونحوه في نصوص القرآن: أرقام → توكنات عددية `N` معروفة آليًا — خارج المقام بقاعدة §2.
