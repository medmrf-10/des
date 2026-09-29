#!/bin/bash
# جامع طلبات مُطالَع: ntfy des_mutalaa_q9 → logs/mutalaa_orders.jsonl + mutalaa/orders.json
SITE=/home/ubuntu/decisions_site
OLOG=$SITE/logs/mutalaa_orders.jsonl
OJSON=$SITE/mutalaa/orders.json
TOPIC=https://ntfy.sh/des_mutalaa_q9
touch "$OLOG"
while true; do
  curl -s -N --max-time 50 "$TOPIC/sse" | while IFS= read -r line; do
    case "$line" in
      data:*)
        msg="${line#data:}"
        body=$(printf '%s' "$msg" | python3 -c "import sys,json
try:
 m=json.load(sys.stdin); print(json.dumps(m.get('message',''),ensure_ascii=False))
except: print('')" 2>/dev/null)
        if [ -n "$body" ]; then
          printf '%s\n' "$body" >> "$OLOG"
          python3 -c "
import json
lines=[l for l in open('$OLOG') if l.strip()]
orders=[]
for l in lines:
    try: orders.append(json.loads(json.loads(l)))
    except Exception:
        try: orders.append(json.loads(l))
        except: pass
order=[];req=[]
for o in orders:
    if o.get('kind')=='order': order=o.get('ids',[])
    if o.get('kind')=='request': req=o.get('ids',[])
json.dump({'order':order,'requests':req},open('$OJSON','w'),ensure_ascii=False)
" 2>/dev/null
        fi ;;
    esac
  done
  sleep 8
done
