# crawl9 — أحدث الصفحات (wave-25)

CDP 360px · 2026-09-25.

## التحقق الأول (origin/main)

من الأسماء الـ21 المعطاة (mihzam, mislak, mihkam2, minshad, mishrad, mi3raf, mi3yad, mi3raz, minsaa, mitwaq, mikhlas, miqdah, mirdad, mi3lam, mihiyi, misfad, mishrat, misra3 + takhrij, story_builder, patterns):

- **موجود على main**: mi3lam (dir) + hadith/takhrij.html + english/story.html (=story_builder المرجح) — كلها **404 حيّاً = pending-deploy**.
- **غائب كلياً من الفرع**: الـ18 الأخرى + patterns — لم تُدفع من أي worker.
- prog/: index حي؛ reference/debugger/playground موجودة على main لكنها **404 حيّاً = pending**.

## الزحف الحي الفعلي

| الصفحة | أخطاء JS | فيض 360px | روابط مكسورة | ملاحظة |
|---|---|---|---|---|

| prog/index.html | 0 | 0 | 0/1 | سليم — دروس+بطاقات+اختبار+محرر |

الباقي: pending أو غائب — لا حي ليزحف إليه. النشر ما زال متقافزاً (`errored`/`building` حتى 04:43) — كل «الأحدث» منذ موجات متراكم في قائمة الانتظار نفسها.

## الأولويات

- **P1**: النشر — ~70+ صفحة على main تنتظر بناءً ناجحاً واحداً؛ كل المشاكل الحية المتبقية (kutub/tabaqat/الـ40) تشفيها نفس العملية.
- **P2**: عند هبوط النشر، إعادة زحف الدُفعة pending كاملة (mi3lam, takhrij, story, prog/3, mi3tad, …).
