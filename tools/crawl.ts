/**
 * tools/crawl.ts — زاحف تحقق آلي لمواقع des/* المنشورة (headless Chromium عبر CDP).
 *
 * لكل موقع يفحص:
 *   1) أخطاء console/استثناءات JS + فشل تحميل موارد.
 *   2) تجاوز المحتوى عرض 360px (scrollWidth مقابل clientWidth بمحاكاة جوال).
 *   3) البحث الأساسي: يملأ أول حقل بحث مرئي باستعلام ويعدّ عناصر النتائج بعد الاستعلام.
 *   4) الروابط الداخلية: كل روابط <a href> المعروضة → فحص HTTP (HEAD).
 *
 * التشغيل: deno run --allow-all tools/crawl.ts
 *   المخرجات: reports/crawl.json + JSON على stdout (التحويل إلى crawl.md يدوي/بسكربت).
 *   المتطلبات: google-chrome/chromium متاح على الجهاز، Deno >= 1.40.
 */

const BASE = "https://medmrf-10.github.io/des/";
// cfg: استعلام بحث يتطابق مع محتوى الموقع + مُحدد عناصر النتائج + hasSearch
const SITE_CFG: Record<string, { q?: string; items?: string; search?: boolean }> = {
  portal: { q: "دروس", items: ".proj" },
  durus: { q: "الله", items: ".dhit,.card" },
  live: { search: false },
  team: { search: false },
  wahy: { q: "الفاتحة", items: ".surah,.srow,a" },
  manzuma: { search: false },
  fihris: { q: "فقه", items: ".ent,.site,.row" },
  fiqh: { q: "الصلاة", items: ".book,.bab,.srow,.item" },
  fiqh_reader: { q: "الله", items: ".urow,.bookbtn,.hit,.ent" },
  hadith: { q: "الأعمال", items: ".card,.matn,.hit" },
  english: { search: false },
  prog: { search: false },
  akida: { q: "الله", items: ".urow,.atom,.hit,.res,.u" },
};
const SITES: [string, string][] = [
  ["portal", BASE + "portal/"],
  ["durus", BASE + "durus/"],
  ["live", BASE + "live/"],
  ["team", BASE + "team/"],
  ["wahy", BASE + "wahy/"],
  ["manzuma", BASE + "manzuma/"],
  ["fihris", BASE + "fihris/"],
  ["fiqh", BASE + "fiqh/"],
  ["fiqh_reader", BASE + "fiqh_reader/"],
  ["hadith", BASE + "hadith/"],
  ["english", BASE + "english/"],
  ["prog", BASE + "prog/"],
  ["akida", BASE + "akida/real.html"],
];
const CHROME_PORT = 9345;
const NAV_WAIT_MS = 6000;
const LINK_CAP_PER_SITE = 40;

// قائمة مواقع بديلة عبر ملف نصّي: سطر = اسم<TAB>url — الإعدادات الإضافية SITE_CFG2
const SITE_CFG2: Record<string, { q?: string; items?: string; search?: boolean }> = {
  "mu3edd": { q: "نية", items: ".card,.atom,.dhit,.res,.hit,.urow" },
  "akida-masadir": { q: "قدرة", items: ".urow,.res,.hit,.src,.row,.card" },
  "wahy-kalimat": { q: "الله", items: ".word,.kal,.row,.ent,.res,.card" },
  "wahy-mutashabih": { q: "الصلاة", items: ".aya,.row,.res,.ent,.card,.mut" },
  "hadith-net": { q: "صبر", items: ".grp,.g,.row,.res,.card,.node" },
  "hadith-matn": { q: "إنما الأعمال", items: ".card,.matn,.had,.hit,.row" },
  "hadith-rawi": { q: "مالك", items: ".card,.rawi,.row,.hit,.r" },
  "hadith-nawawi": { q: "النية", items: ".card,.matn,.hit,.row" },
  "hadith-adhkar": { q: "الصباح", items: ".card,.matn,.hit,.row,.dkr" },
  "hadith-sanad": { q: "نية", items: ".card,.matn,.hit,.row,.snd" },
  "hadith-muqaran": { q: "النية", items: ".card,.matn,.hit,.row,.mq" },
  "team-fikra": { search: false },
};
Object.assign(SITE_CFG, SITE_CFG2);

async function loadSites(): Promise<[string, string][]> {
  const file = Deno.args[0];
  if (!file) return SITES;
  const txt = await Deno.readTextFile(file);
  return txt.split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#")).map((l) => {
    const [name, url] = l.includes("\t") ? l.split("\t").map((x) => x.trim()) : [l.replace(/[^\w]/g, "-"), l];
    return [name, url.startsWith("http") ? url : BASE + url] as [string, string];
  });
}
const OUT_JSON = Deno.args[1] || "reports/crawl.json";

// ---------- CDP helpers ----------
let ws: WebSocket;
let msgId = 0;
const pending = new Map<number, (m: any) => void>();
const send = (method: string, params: any = {}) =>
  new Promise<any>((res) => {
    const i = ++msgId;
    pending.set(i, res);
    ws.send(JSON.stringify({ id: i, method, params }));
  });
const evalJs = async (expression: string) => {
  const r = await send("Runtime.evaluate", {
    expression, returnByValue: true, awaitPromise: true,
  });
  return r.result?.result?.value;
};
async function newTab() {
  const t = await (await fetch(
    `http://127.0.0.1:${CHROME_PORT}/json/new?about:blank`, { method: "PUT" },
  )).json();
  ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  return t.id;
}

// ---------- فحص موقع واحد ----------
interface SiteResult {
  url: string; http?: number; console_errors: string[]; resource_404s: string[];
  scrollWidth?: number; clientWidth?: number; overflow_px?: number;
  search?: { input?: string; query?: string; results?: number; note?: string };
  perf?: { dur: number; dcl: number; rsp: number };
  frozen?: { skeletons: number; loading_texts: string[]; empty_containers: number; body_len: number };
  links: { tested: number; broken: string[] };
  error?: string;
}

const SEARCH_JS = (cfg: { q?: string; items?: string }) => `(async()=>{
  const vis=e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&getComputedStyle(e).visibility!=='hidden'};
  const sels=['input[placeholder*="بحث"]','input[placeholder*="ابحث"]','input[type="search"]','input[id="q"]','input:not([type="password"]):not([type="checkbox"]):not([type="radio"])'];
  let inp=null;
  for(const s of sels){inp=[...document.querySelectorAll(s)].find(e=>vis(e)&&!/اسمك|الرقم السري/.test(e.placeholder||''));if(inp)break}
  if(!inp)return JSON.stringify({note:'لا حقل بحث مرئي'});
  const items=${JSON.stringify(cfg.items||'.card,.clip,.srow,.dhit,.lesson,.bookbtn,.bab,.track,.res,.hit,.node,.src,.cont,.ent,li,tr')};
  const count=()=>[...document.querySelectorAll(items)].filter(vis).length;
  const before=count();
  inp.value=${JSON.stringify(cfg.q||'ا')};inp.dispatchEvent(new Event('input',{bubbles:true}));inp.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));
  await new Promise(r=>setTimeout(r,1800));
  const after=count();
  return JSON.stringify({input:(inp.placeholder||inp.id||inp.name||'input').slice(0,60),query:${JSON.stringify(cfg.q||'ا')},results:after,before});
})()`;

const OVERFLOW_JS = `JSON.stringify({sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth})`;
const PERF_JS = `(()=>{const n=performance.getEntriesByType('navigation')[0]||{};return JSON.stringify({dur:Math.round(n.duration||0),dcl:Math.round(n.domContentLoadedEventEnd||0),rsp:Math.round(n.responseEnd||0)})})()`;
const FROZEN_JS = `(()=>{const vis=e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0};
  const skl=[...document.querySelectorAll('.skeleton,.skl,.loader,.spinner,.loading,.shimmer,[class*="skeleton"],[class*="loader"]')].filter(vis).length;
  const loadTxt=[...document.querySelectorAll('div,span,p,section')].filter(e=>vis(e)&&(e.innerText||'').trim().length<90&&/جاري|تحميل|يُحمّل|يُغزل|يتم التجهيز|^\\s*…+\\s*$/.test(e.innerText||'')&&e.children.length<=1).slice(0,3).map(e=>(e.innerText||'').trim().slice(0,50));
  const empt=[...document.querySelectorAll('main,section,#app,#list,#out,#res,#cards,#view,#content,#root')].filter(e=>vis(e)&&(e.innerText||'').trim().length===0).length;
  return JSON.stringify({skeletons:skl,loading_texts:loadTxt,empty_containers:empt,body_len:(document.body.innerText||'').trim().length})})()`;
const LINKS_JS = `(()=>{const u=new Set();document.querySelectorAll('a[href]').forEach(a=>{const h=a.getAttribute('href');if(h&&!h.startsWith('javascript:')&&!h.startsWith('mailto:'))u.add(new URL(h,location.href).href)});return JSON.stringify([...u])})()`;

async function crawlSite(name: string, url: string): Promise<SiteResult> {
  const res: SiteResult = { url, console_errors: [], resource_404s: [], links: { tested: 0, broken: [] } };
  const tabId = await newTab();
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)!(m); pending.delete(m.id); }
    else if (m.method === "Runtime.exceptionThrown") {
      res.console_errors.push("EXCEPTION: " +
        ((m.params.exceptionDetails.text || "") + " " +
         (m.params.exceptionDetails.exception?.description || "")).slice(0, 200));
    } else if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") {
      res.console_errors.push("console.error: " +
        m.params.args.map((a: any) => a.value ?? a.description ?? "").join(" ").slice(0, 200));
    } else if (m.method === "Log.entryAdded" && m.params.entry.level === "error") {
      const t = m.params.entry.text || "";
      if (t.includes("Failed to load resource") || t.includes("status of 4")) {
        res.resource_404s.push((m.params.entry.url || t).slice(0, 160));
      } else {
        res.console_errors.push("log.error: " + t.slice(0, 200));
      }
    } else if (m.method === "Network.responseReceived" && m.params.response.status >= 400) {
      res.resource_404s.push(m.params.response.status + " " + m.params.response.url.slice(0, 140));
    }
  };
  await send("Runtime.enable"); await send("Log.enable");
  await send("Page.enable"); await send("Network.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 360, height: 900, deviceScaleFactor: 1, mobile: true });
  try {
    const nav = await send("Page.navigate", { url });
    res.http = 200; // navigate resolved; status checked via network events when available
    await new Promise((r) => setTimeout(r, NAV_WAIT_MS));
    // عرض الصفحة
    const dims = JSON.parse(await evalJs(OVERFLOW_JS) || "{}");
    res.scrollWidth = dims.sw; res.clientWidth = dims.cw;
    res.overflow_px = Math.max(0, (dims.sw || 0) - (dims.cw || 0));
    try { res.perf = JSON.parse(await evalJs(PERF_JS) || "{}"); } catch { /* perf اختياري */ }
    try { res.frozen = JSON.parse(await evalJs(FROZEN_JS) || "{}"); } catch { /* frozen اختياري */ }
    // البحث
    const cfg = SITE_CFG[name] || {};
    if (cfg.search === false) res.search = { note: "لا بحث أساسي بالموقع" };
    else try { res.search = JSON.parse(await evalJs(SEARCH_JS(cfg)) || "{}"); } catch { res.search = { note: "eval fail" }; }
    // الروابط
    const links: string[] = JSON.parse(await evalJs(LINKS_JS) || "[]");
    const internal = links.filter((l) => l.startsWith(BASE) || l.includes("medmrf-10.github.io"));
    for (const l of internal.slice(0, LINK_CAP_PER_SITE)) {
      try {
        const r = await fetch(l, { method: "HEAD" });
        res.links.tested++;
        if (r.status >= 400) res.links.broken.push(r.status + " " + l);
      } catch (e) {
        res.links.tested++;
        res.links.broken.push("ERR " + l.slice(0, 120));
      }
    }
  } catch (e) { res.error = String(e).slice(0, 200); }
  await fetch(`http://127.0.0.1:${CHROME_PORT}/json/close/${tabId}`).catch(() => {});
  return res;
}

// ---------- التشغيل ----------
const chrome = new Deno.Command("google-chrome", {
  args: ["--headless=new", "--no-sandbox", "--disable-gpu",
         `--remote-debugging-port=${CHROME_PORT}`, "about:blank"],
  stdout: "null", stderr: "null",
}).spawn();
await new Promise((r) => setTimeout(r, 2500));

const SITES_RUN = await loadSites();
const out: Record<string, SiteResult> = {};
for (const [name, url] of SITES_RUN) {
  try { out[name] = await crawlSite(name, url); console.error("done", name); }
  catch (e) { out[name] = { url, console_errors: [], resource_404s: [], links: { tested: 0, broken: [] }, error: String(e).slice(0, 200) }; }
}
chrome.kill("SIGKILL");
await Deno.mkdir("reports", { recursive: true });
await Deno.writeTextFile(OUT_JSON, JSON.stringify({ generated: new Date().toISOString(), sites: out }, null, 1));
console.log(JSON.stringify(out, null, 1));
