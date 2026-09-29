#!/usr/bin/env python3
import json,urllib.request,time,os,subprocess
OLOG='/home/ubuntu/decisions_site/logs/mutalaa_orders.jsonl'
OJSON='/home/ubuntu/decisions_site/mutalaa/orders.json'
MAN='/home/ubuntu/decisions_site/mutalaa/data/manifest.json'
Q='/home/ubuntu/durus/agy_queue.txt'
SITE='/home/ubuntu/decisions_site'
TOPIC='https://ntfy.sh/des_mutalaa_q9/sse'
POLL='https://ntfy.sh/des_mutalaa_q9/json?poll=1'
req_ids=set()
def backfill():
    seen=set(l.strip() for l in open(OLOG)) if os.path.exists(OLOG) else set()
    try:
        for l in urllib.request.urlopen(POLL,timeout=20):
            try: m=json.loads(l)
            except Exception: continue
            if m.get('event')!='message': continue
            b=m.get('message','')
            if not b or b in seen: continue
            try:
                o=json.loads(b)
                if isinstance(o,str): o=json.loads(o)
                if o.get('t',1e18)<1e6: continue
            except Exception: pass
            seen.add(b);open(OLOG,'a').write(b+'\n')
    except Exception: pass
def rebuild():
    global req_ids
    order=[];req=[];lst={}
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
        if o.get('lists'): lst=o['lists']
    json.dump({'order':order,'requests':req,'lists':lst},open(OJSON,'w'),ensure_ascii=False)
    req_ids={str(x) for x in req}
    apply(order,req_ids)
def sid(l):
    if '/pipeline/' not in l: return ''
    try: return l.split('/pipeline/')[1].split('/')[1].split('_')[0]
    except Exception: return ''
def apply(order,reqs):
    changed=False
    if reqs and os.path.exists(Q):
        lines=[l for l in open(Q) if l.strip()]
        first=[l for l in lines if sid(l) in reqs]
        rest=[l for l in lines if sid(l) not in reqs]
        if first:
            open(Q,'w').write(''.join(first+rest))
            changed=True
    want=set(reqs)|{str(x) for x in order}
    if want and os.path.exists(MAN):
        man=json.load(open(MAN));ch=False
        for s in man:
            if str(s.get('id')) in want and s.get('status')=='none':
                s['status']='soon';ch=True
        if ch:
            json.dump(man,open(MAN,'w'),ensure_ascii=False)
            changed=True
    if order and os.path.exists(MAN):
        man=json.load(open(MAN));ordmap={str(x):i for i,x in enumerate(order)}
        for s in man:
            s['ord']=ordmap.get(str(s.get('id')),999)
        json.dump(man,open(MAN,'w'),ensure_ascii=False)
    if reqs:
        try: subprocess.Popen(['bash','/home/ubuntu/durus/dl_requests.sh'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
        except Exception: pass
    if changed:
        try:
            subprocess.run(['git','add','mutalaa/data/manifest.json','mutalaa/orders.json'],cwd=SITE,timeout=30)
            subprocess.run(['git','commit','-qm','mutalaa: طلبات وترتيب المالك'],cwd=SITE,timeout=30)
            subprocess.run(['git','push','origin','durus-site','-q'],cwd=SITE,timeout=60)
            subprocess.run(['git','checkout','main','-q'],cwd=SITE,timeout=30)
            subprocess.run(['git','merge','origin/durus-site','--no-edit','-q'],cwd=SITE,timeout=60)
            subprocess.run(['git','push','origin','main','-q'],cwd=SITE,timeout=60)
            subprocess.run(['git','checkout','durus-site','-q'],cwd=SITE,timeout=30)
        except Exception:
            try: subprocess.run(['git','checkout','durus-site','-q'],cwd=SITE,timeout=30)
            except Exception: pass
while True:
    try:
        backfill();rebuild()
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
