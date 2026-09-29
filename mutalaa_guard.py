#!/usr/bin/env python3
import json,urllib.request,time
OLOG='/home/ubuntu/decisions_site/logs/mutalaa_orders.jsonl'
OJSON='/home/ubuntu/decisions_site/mutalaa/orders.json'
TOPIC='https://ntfy.sh/des_mutalaa_q9/sse'
def rebuild():
    order=[];req=[]
    for l in open(OLOG):
        l=l.strip()
        if not l: continue
        try:
            o=json.loads(l)
            if isinstance(o,str): o=json.loads(o)
        except Exception: continue
        if o.get('kind')=='order': order=o.get('ids',[])
        elif o.get('kind')=='request': req=o.get('ids',[])
        if o.get('requests'): req=o['requests']
    json.dump({'order':order,'requests':req},open(OJSON,'w'),ensure_ascii=False)
while True:
    try:
        with urllib.request.urlopen(TOPIC,timeout=55) as r:
            for raw in r:
                line=raw.decode('utf-8','replace').strip()
                if not line.startswith('data:'): continue
                msg=line[5:].strip()
                try: body=json.loads(msg).get('message','')
                except Exception: body=msg
                if not body: continue
                open(OLOG,'a').write(str(body)+'\n')
                rebuild()
    except Exception:
        time.sleep(8)
