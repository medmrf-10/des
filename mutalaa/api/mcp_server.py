#!/usr/bin/env python3
"""mcp_server.py — خادم MCP (stdio) يغلّف mutalaa/api/ HTTP endpoints.
يشغّل محليًا: python3 mcp_server.py
يتكلم بروتوكول MCP الأساسي (initialize / tools/list / tools/call) فوق stdin/stdout —
بلا اعتماديات خارجية. الأدوات:
  list_series(sheikh?, status?, want?, q?, limit?)
  get_series(id)
  list_sheikhs()
  next_series()
  set_want(id, deg)        — يُرجع حمولة POST لـ ntfy des_mutalaa_q9 (الكتابة عن بُعد)
"""
import json, sys, urllib.request, urllib.parse

BASE = "https://medmrf-10.github.io/des/mutalaa/api/"
NTFY = "https://ntfy.sh/des_mutalaa_q9"


def get(path):
    with urllib.request.urlopen(BASE + path, timeout=30) as r:
        return json.load(r)


def tools_list():
    return [
        {"name": "list_series", "description": "سرد سلاسل مُطالع — مرشّحات: sheikh,status,want,q,limit",
         "inputSchema": {"type": "object", "properties": {
             "sheikh": {"type": "string"}, "status": {"type": "string"},
             "want": {"type": "integer"}, "q": {"type": "string"},
             "limit": {"type": "integer", "default": 50}}}},
        {"name": "get_series", "description": "سلسلة كاملة + ملفاتها",
         "inputSchema": {"type": "object", "properties": {"id": {"type": "string"}}, "required": ["id"]}},
        {"name": "list_sheikhs", "description": "المشايخ مع عدّادات سلاسلهم/حلقاتهم",
         "inputSchema": {"type": "object", "properties": {}}},
        {"name": "next_series", "description": "السلسلة التالية حسب الطابور + قائمة الطلبات",
         "inputSchema": {"type": "object", "properties": {}}},
        {"name": "set_want", "description": "وسم درجة رغبة لسلسلة (-1 غير مرغوب..3 قصوى) — يعيد جسماً لـPOST",
         "inputSchema": {"type": "object", "properties": {
             "id": {"type": "string"}, "deg": {"type": "integer"}}, "required": ["id", "deg"]}},
        {"name": "request_series", "description": "طلب تفريغ سلسلة — يعيد جسماً لـPOST",
         "inputSchema": {"type": "object", "properties": {"id": {"type": "string"}}, "required": ["id"]}},
    ]


def call(name, a):
    if name == "list_series":
        rows = get("series.json")
        if a.get("sheikh"):
            rows = [r for r in rows if a["sheikh"] in (r["sheikh"] or "")]
        if a.get("status"):
            rows = [r for r in rows if r["status"] == a["status"]]
        if a.get("want") is not None:
            rows = [r for r in rows if r["want"] == a["want"]]
        if a.get("q"):
            q = a["q"]
            rows = [r for r in rows if q in r["name"] or q in (r["sheikh"] or "")]
        return {"count": len(rows), "rows": rows[: int(a.get("limit") or 50)]}
    if name == "get_series":
        return get(f"series/{a['id']}.json")
    if name == "list_sheikhs":
        return get("sheikhs.json")
    if name == "next_series":
        return get("next.json")
    if name == "set_want":
        return {"post_to": NTFY, "body": {"kind": "want", "id": str(a["id"]), "deg": int(a["deg"])}}
    if name == "request_series":
        return {"post_to": NTFY, "body": {"kind": "feed", "id": str(a["id"])}}
    raise ValueError("unknown tool " + name)


def reply(i, result=None, error=None):
    m = {"jsonrpc": "2.0", "id": i}
    if error:
        m["error"] = {"code": -32000, "message": str(error)}
    else:
        m["result"] = result
    sys.stdout.write(json.dumps(m, ensure_ascii=False) + "\n")
    sys.stdout.flush()


def main():
    for line in sys.stdin:
        try:
            req = json.loads(line)
        except Exception:
            continue
        i, meth, params = req.get("id"), req.get("method"), req.get("params") or {}
        if meth == "initialize":
            reply(i, {"protocolVersion": "2024-11-05", "capabilities": {"tools": {}},
                      "serverInfo": {"name": "mutalaa", "version": "1.0"}})
        elif meth == "notifications/initialized":
            pass
        elif meth == "tools/list":
            reply(i, {"tools": tools_list()})
        elif meth == "tools/call":
            try:
                out = call(params.get("name"), params.get("arguments") or {})
                reply(i, {"content": [{"type": "text", "text": json.dumps(out, ensure_ascii=False)}]})
            except Exception as e:
                reply(i, error=e)
        elif i is not None:
            reply(i, result={})


if __name__ == "__main__":
    main()
