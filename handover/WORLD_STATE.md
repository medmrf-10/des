# WORLD_STATE — خارطة كل شيء قبل تسليم الوكيل الجديد
تاريخ: 2026-09-26 — أُعدّت لتسليم مدير جديد نظيف الذاكرة.

## 0. اقرأ أولاً (بالترتيب)
1. هذا الملف — الخارطة.
2. `TAHQIQ.md` — ماذا كُسر ولماذا (أخطاء تُحفظ لا تُكرر).
3. `mac_index.jsonl.gz` — فهرس الماك الكامل: 5820 سجلاً (فك الضغط: `gunzip -c mac_index.jsonl.gz`).
4. مهارة `newdev/fleet.md` — خريطة السرب والقنوات والوصول SSH.
5. `RULES.md` — القواعد الإلزامية.

## 1. الريبوهات (medmrf-10 — 43 ريبو، كلها Private)

### الأصول الحية (لا تُمس / لا تُعاد)
| repo | المحتوى | الحالة |
|---|---|---|
| **des** | المنظومة كاملة: الموقع المنشور + جاديد٢ + كل الصفحات | **الريبو الواحد الحاكم — العمل هنا** |
| **wahy** | أطلس: 106 تفاسير مطبّعة + hadith-kg.db (425 كتاباً، 715K ورودة، 20,745 مجموعة معنى) + SPA منشور | مكتمل — بياناته جاهزة مقطّعة |
| **rlg** | فهرس فقهي: 55 كتاباً → ~800K ذرة + مصفوفة 35×55 (31,068 موضعاً) + قارئ منشور reader-frmsglyo.devinapps.com | مكتمل — لا توسعة كمية بأمر المالك |
| **akidsofi** | فهرس العقيدة الموحّد + نصوص مقطّعة | مكتمل |
| **cod** | RAG عربي/إنجليزي على كوربوس allCourses (FTS5 trigram) | يعمل |
| **full** | مركز الرؤية: VISION.md + AGENTS.md (قواعد المدير الدائمة — اقرأها أولاً) | مرجع |
| **med** | مستودع المنتج الأول | فارغ — ينتظر ضوءاً |
| **din, krn, tswf, sna, akd** | تجارب سبتمبر | أرشيفية غالباً |

### الأرشيف/التجارب (لا تبنِ عليها بلا أمر)
learning, lrn, learn, learnag, learn99, learn-pro, fsrs-ai-platform, sm20, qrn, stm, max, maxx, lastcode, twt, speeek, gimi, picode, app1, qwen, agent0, antigravity, wiki, save, manager, SKILLS, claude-code-summary, islamic-transcribe, crsr, crsr2, royal, med… (الباقي أرشيف)

## 2. الماك (الخارطة الكاملة في mac_index.jsonl.gz)

المسار: `/Users/macm1pro` — الوصول: `ssh macm1pro@100.72.220.19` (Tailscale، مفتاح المدير مسجل).

**أثقل الأصول:**
- `REPOS/swe/Shamela4_Full_DB` — مكتبة الشاملة 19GB كاملة
- `REPOS/swe/hadith-kg/` — hadith-app.db 2.9GB + hadith-kg.db 1.6GB + matn/athar embeddings 480MB
- `Desktop/studio/islamic_corpus_vectors.db` — 1GB متجهات
- `Desktop/learnmax/` — `local_books_map.json` = **61,140 كتاباً** + catalogs: allCourses, Shortform-1414, Udemy, Saad, Josh + `openiti_books.json`
- `Google Drive/GG/` — صوتيات ~55GB: البردوني ~26GB + السريري ~21GB + الحبيب عمر ~8GB
- `bus/` — غرفة قيادة السرب (helm :8788 + events.jsonl + agents.tsv)
- `NEW/` — المستودع المركزي المخطط (rule.md + roadmap.md)
- `REPOS/mudir/` — مرحل slackbot.py + .env الأسرار
- `REPOS/learnREPOS/` — cog + learnser + learnag (منظومة التعلم)
- `terminals/` — 105 سجل إدارة مفاتيح Google

**تحذيرات مكررة مسجلة في الفهرس:** 8+ مشاريع تعلم ذاتي مكررة على Desktop، مكتبة الكتب الشرعية بـ4 نسخ، سلسلة rightV*. **القاعدة: لا تبنِ نظاماً جديداً قبل grep في الفهرس.**

## 3. جهاز المدير (اللينكس — الوكيل الجديد يصله مباشرة)

⚠️ **لا تنسخ شيئاً — الوكيل الجديد له وصول حي لكل مكان.** هذه الجلسة تبقى قابلة للـSSH ما دامت حية/معلّقة:
`ssh -p 443 -i <مفتاح> devin-afe9efc814a549c78aad8b075a8fab41@ssh.devin.ai` (المفتاح مسجل في الحساب).

الموجود هنا (اقرأه في مكانه):
- `~/decisions_site/` = checkout des (فرع durus-site — فرع الشغل؛ main = النشر)
- `~/durus/` 34GB — pipeline صوتي + `transcripts_agy/` التفريغات + `keyrot/` + `gkeys/the100key3.txt` (250 مفتاح Gemini، الصيغة `id KEY`)
- `~/mac_index/index.jsonl` — فهرس الماك الحي
- `~/.config/devin/skills/newdev/` — مهارات newdev (المصدر الأصلي على الماك `~/.config/devin/skills/`)

والماك نفسه متاح عبر `ssh macm1pro@100.72.220.19` (Tailscale) — مفتاح المدير في `authorized_keys`.

## 4. ما تم الليلة (في des/jadid2/)

صفحة `jadid2/` = فهرس «حصاد الليلة». التطبيقات:
- `jadid2/murji/` — مُرجِع: آية↔تفسير / حديث↔شرح / متن↔شرحه (تقييمات EVAL_*.md مثبتة)
- `jadid2/core/` — المدرسة: نواة FSRS-للمهارات
- `jadid2/fihris/` — الفهرس العام لأصول الفقه (عينة 88 عقدة / 97.7% — **بانتظار قبول المالك**)
- `jadid2/reader/` — مُتعلِّم: قارئ الذرات i+1
- أصول بياناتية: atoms/ (117 فهرساً)، schema/, learner/, selector/, exercises/, english/, xlink/, graph/, oss/, ux_audit/, annotation_work/, spec.md

## 5. المعلّق (لا يُعمل قبل قرار المالك)

- تعميم الفهرس العام (العينة معروضة)
- طابور تفريغ 188 ملفاً — متوقف بأمر المالك
- بنوك التمارين للبرمجة + بنية الإنجليزية + مخطط الذرة — برومبتات جاهزة لم تُطلق
- atoms-4 وatoms-5 — معلّقتان
- إصلاحات حدودية murji: 775/012.03، و38 عنواناً inferred

## 6. الحارس الدائم (لا توقفه)

على جهاز المدير، كرون `ans_guard.sh` + `seed_tick.sh` — يلتقطان إجابات موقع القرارات ويحفظانها في git. **إيقافهما = تصفير إجابات المالك.** قبل موت هذه الجلسة: انقلهما للماك أو لجهاز دائم.

## 7. الوصول والهويات

- المدير = جلسة `devin-afe9efc814a549c78aad8b075a8fab41` — مفتاحها مسجل «mudir» على الماك.
- العمال: dev1-4 في fleet.md (ids كاملة).
- Slack: المالك U0BPTKEV80Y، DM D0C3WMZB2LQ، فريق T0BNX9ZCHTQ. بوت المرحل «sasi» على الماك — مات أمس وسبب أزمة الهوية.
- عينة SSH بين الجلسات: `ssh -p 443 -i ~/.ssh/id_ed25519 devin-XXXX@ssh.devin.ai`.
