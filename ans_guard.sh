#!/bin/bash
# حارس إجابات دائم: يلتقط med-qz-x7k2-out → answers.log ثم يجدد answers_seed.js وينشر
SITE=/home/ubuntu/decisions_site
ALOG=$SITE/logs/answers.log
TOPIC=https://ntfy.sh/med-qz-x7k2-out
touch "$ALOG"
# عودة للملاحة الخلفية: استكمال من آخر رسالة محفوظة
while true; do
  curl -s -N "$TOPIC/sse?since=all" | while IFS= read -r line; do
    case "$line" in
      data:*)
        msg="${line#data:}"
        # صيغة الرسائل: QID|text ← answer — استخرجها من JSON إن لزم
        body=$(printf '%s' "$msg" | python3 -c "import sys,json
try:
 m=json.load(sys.stdin); print(m.get('message',''))
except: print('')" 2>/dev/null)
        if [ -n "$body" ] && printf '%s' "$body" | grep -q '|'; then
          grep -qxF "$body" "$ALOG" || { printf '%s\n' "$body" >> "$ALOG"; echo "$(date +%T) +$body" >> $SITE/logs/guard.log; }
        fi
        ;;
    esac
  done
  # جدد البذرة وانشر كل دقيقة
  python3 $SITE/make_seed.py 2>/dev/null >> $SITE/logs/guard.log
  cd $SITE && git status --short | grep -q . && bash $SITE/../deploy.sh "answers: new captured" >/dev/null 2>&1
  sleep 60
done
