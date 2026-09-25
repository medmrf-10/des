---
name: testing-prog
description: How to test the static برمج (prog) learning app in ~/des_src/prog — local server, Arabic-input workarounds, localStorage state keys
---

# Testing the برمج (prog) static app

## Serving
Serve the REPO ROOT (not prog/) so `../shared/` resolves:
`cd ~/des_src && python3 -m http.server 8477` → pages at `http://localhost:8477/prog/<page>.html`.
All state lives in localStorage (`prog_v1`, `prog_lab`, `prog_ref`, `prog_debug`, `prog_proj`, `prog_exam`, `prog_review`, `prog_level`) — clear keys via console before a controlled baseline run.

## browser_console rejects non-ASCII script content
`browser_console` calls containing Arabic (or any non-ASCII) characters fail with `Remote tool validation failed` BEFORE reaching the page. To inject Arabic text (e.g. search input), write it with `\u` escapes — pure ASCII script:
`q.value='\u0645\u0643\u062f\u0633'` for «مكدس». Compute escapes with `python3 -c "print(''.join(f'\\\\u{ord(c):04x}' for c in 'WORD'))"`.
The DOM in the page is unaffected — this is a tool-side validation limit. The GUI `type` action also cannot enter Arabic reliably; `.value` + dispatched `input` event is the workaround.

## prog engine gotchas
- `debugger.js` / `lab.js` / `refactor.js` `execSrc` exports top-level `let|const|var`, `function`, and `async function` declarations via regex — functions nested inside other functions are NOT exported (line-anchored `^`), so hidden tests must call top-level names.
- Hidden-test textarea entry: set `#dbEd`/editor `.value` then click run — no input event needed (handlers read `.value` directly).
- Search inputs need `dispatchEvent(new Event('input',{bubbles:true}))` after setting `.value`.
- Buttons: «تحقّق بالاختبارات» is `disabled` until «تشغيل» succeeds at least once.
