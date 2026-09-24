#!/usr/bin/env python3
"""الحلقة المغلقة: إجابات محمد → محلل الإجابات → دمج+نشر تلقائي.
كل 20 إجابة جديدة تُرسل للمحلل؛ عند وصول بطاقاته تُدمج في index.html وتُدفع لجيتهب وتُبث حية عبر ntfy."""
import json, os, re, subprocess, time, urllib.request, hashlib, sys

SITE='/home/ubuntu/decisions_site'
ALOG=f'{SITE}/logs/answers.log'
IDX=f'{SITE}/index.html'
IN_TOPIC='https://ntfy.sh/med-qz-x7k2-in'
ANALYZER='devin-c7618eab19ec41f380e1d206e68793cc'
API='https://api.devin.ai/v1'
STEP=20
STATE_FILE=f'{SITE}/.loop_state'
LOG=f'{SITE}/logs/round_loop.log'

KEY=os.environ.get('DEVIN_API_KEY','')

def log(msg):
    line=f'{time.strftime("%H:%M:%S")} {msg}'
    print(line,flush=True)
    open(LOG,'a').write(line+'\n')

def api(path,data=None,method='GET'):
    req=urllib.request.Request(API+path,
        data=json.dumps(data).encode() if data is not None else None,
        method=method,
        headers={'Authorization':f'Bearer {KEY}','Content-Type':'application/json'})
    return json.load(urllib.request.urlopen(req,timeout=60))

def answers():
    last={}
    for l in open(ALOG,encoding='utf-8'):
        l=l.strip()
        if '|' in l:
            k=l.split('|',1)[0]
            if k!='TEST': last[k]=l
    return last

MARGIN=50   # لا يتجاوز المنتظر أمام محمد ~50 بطاقة — شرطه الصريح

def pending_count(ans):
    h=open(IDX,encoding='utf-8').read()
    ids=set(re.findall(r"\{id:'([a-z]\d+)'",h))
    done=set(k.lower() for k in ans)
    return len(ids-done)

def load_state():
    try: return json.load(open(STATE_FILE))
    except Exception: return {'n':0,'batch':0,'sohash':''}
def save_state(s): json.dump(s,open(STATE_FILE,'w'))

SECKEY=[('islamic',['شرع','شريعة','تفسير','حديث','درس','شيخ','فقه','عقيدة','تصوف','قرآن','إنتاج']),
        ('content',['ذرة','ذرات','كورس','كوربوس','محتوى','مادة خام','فهرس','مفصل']),
        ('product',['وكيل','منصة','واجهة','مستخدم','شاشة','تتبع','fsrs','فيد']),
        ('learn',['تعلم','مسار','تقدم','مذاكرة']),
        ('tech',['تقني','تخزين','نموذج','استضاف','api','مفتاح']),
        ('work',['سير','وقت','جلسة','أتمتة','مراجعة']),
        ('id',['اسم','هوية','نطاق']),
        ('strategy',['استراتيج','أولوي','هدف','رؤية','قرار','أصول'])]
def tosec(topic,q):
    t=(topic+' '+q).lower()
    for sec,kws in SECKEY:
        if any(k in t for k in kws): return sec
    return 'new'

def publish_cards(cards,letter):
    h=open(IDX,encoding='utf-8').read()
    block=[];live=[]
    for i,c in enumerate(cards,1):
        cid=f'{letter}{i:02d}'
        sec=tosec(c.get('topic',''),c['q'])
        t=c['type'] if c['type'] in ('single','multi','rate','rank','text') else 'single'
        q=c['q'].replace("'","\\'")
        o=''
        if c.get('opts'):
            opts=', '.join("'"+x.replace("'","\\'")+"'" for x in c['opts'])
            o=f",\n  opts:[{opts}]"
        block.append(f" {{id:'{cid}',sec:'{sec}',type:'{t}',q:'{q}'{o}}},")
        d={'id':cid,'sec':sec,'type':t,'q':c['q']}
        if c.get('opts'): d['opts']=c['opts']
        live.append(d)
    anchor=' // ══ دفعة الوكيل: محلل الكوربوس ══'
    i=h.find(anchor)
    if i<0: i=h.rfind('\n];')
    h=h[:i]+f' // ══ دفعة آلية — جولة {letter} ══\n'+'\n'.join(block)+'\n\n'+h[i:]
    open(IDX,'w',encoding='utf-8').write(h)
    subprocess.run(['git','-C',SITE,'add','-A'],check=True)
    subprocess.run(['git','-C',SITE,'-c','user.name=Devin','-c','user.email=devin@cognition.ai','commit','-qm',f'جولة آلية {letter}: {len(cards)} بطاقة'],check=True)
    subprocess.run(['git','-C',SITE,'push','-q'],check=True)
    sent=0
    for c in live:
        try:
            urllib.request.urlopen(urllib.request.Request(IN_TOPIC,data=json.dumps(c,ensure_ascii=False).encode(),method='POST'),timeout=20)
            sent+=1
        except Exception as e: log(f'ntfy fail {c["id"]}: {e}')
    log(f'نُشرت جولة {letter}: {len(cards)} بطاقة (ntfy {sent})')

def so_hash(so):
    try: return hashlib.md5(json.dumps(so.get('cards',[]),sort_keys=True,ensure_ascii=False).encode()).hexdigest()
    except Exception: return ''

def main():
    st=load_state()
    letters='fghijklmnopqrstuvwxyz'
    log(f'الحلقة بدأت — عتبة {STEP} إجابة، آخر عدد {st["n"]}')
    while True:
        try:
            ans=answers();n=len(ans)
            pend=pending_count(ans)
            if n>=st['n']+STEP and pend<MARGIN:
                room=MARGIN-pend+5
                new=[ans[k] for k in sorted(ans)][st['n']:]
                body='دفعة إجابات جديدة وصلت (الإجمالي '+str(n)+'). حللها مع كل ما أرسلته سابقاً وأنتج حتى '+str(room)+' بطاقة تالية فقط عبر provide_structured_output:\n\n'+'\n'.join(new)
                api(f'/sessions/{ANALYZER}/message',{'message':body},'POST')
                log(f'أُرسلت {len(new)} إجابة للمحلل (إجمالي {n}، منتظر {pend}، مساحة {room})')
                st['n']=n;save_state(st)
                deadline=time.time()+15*60
                while time.time()<deadline:
                    time.sleep(45)
                    try:
                        d=api(f'/sessions/{ANALYZER}')
                        so=d.get('structured_output') or {}
                        hh=so_hash(so)
                        if so.get('cards') and hh!=st['sohash']:
                            st['sohash']=hh;save_state(st)
                            letter=letters[st['batch']%len(letters)];st['batch']+=1;save_state(st)
                            publish_cards(so['cards'][:room],letter)
                            break
                        if d.get('status') in ('blocked','stopped','finished') and not so.get('cards'):
                            break
                    except Exception as e: log(f'poll err {e}')
                else: log('انتهت مهلة المحلل بلا بطاقات')
            time.sleep(60)
        except Exception as e:
            log(f'خطأ: {e}');time.sleep(120)

if __name__=='__main__':
    main()
