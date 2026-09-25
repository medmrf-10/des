import re,json
SITE='/home/ubuntu/decisions_site'
s=open(f'{SITE}/index.html').read()
qs={}
for m in re.finditer(r"\{id:'([a-z0-9_]+)',sec:'[^']*',type:'(\w+)',q:'((?:[^'\\]|\\.)*)'(?:,\s*opts:\[((?:[^\]])*)\])?",s):
    qid,typ,q,opts=m.groups()
    ol=re.findall(r"'((?:[^'\\]|\\.)*)'",opts) if opts else []
    qs[qid]={'type':typ,'opts':ol}
last={}
for l in open(f'{SITE}/logs/answers.log',encoding='utf-8'):
    l=l.strip()
    if '|' in l:
        qid,rest=l.split('|',1)
        last[qid]=rest
seed={}
for qid,rest in last.items():
    q=qid.lower()
    if q not in qs: continue
    ans=rest.split('←',1)[-1].strip()
    st={'confirmed':True}
    if ans.startswith('[مُتخطّى]'): st['skipped']=True
    elif ans.startswith('ملاحظة:'): st['custom']=ans[7:].strip()
    elif ans.startswith('ترتيب:'): st['custom']=ans
    elif re.match(r'^\d+\s*/\s*10$',ans): st['rate']=int(ans.split('/')[0])
    else:
        t=qs[q]['type']
        if t=='rate':
            m2=re.search(r'\d+',ans);st['rate']=int(m2.group()) if m2 else 0
            if st['rate']==0: st.pop('rate');st['custom']=ans
        else:
            idxs=[i for i,o in enumerate(qs[q]['opts']) if o==ans]
            if idxs: st['opts']=idxs
            else: st['custom']=ans
    seed[q]=st
open(f'{SITE}/answers_seed.js','w').write('window.SEED_ANSWERS='+json.dumps(seed,ensure_ascii=False)+';')
print(len(seed))
