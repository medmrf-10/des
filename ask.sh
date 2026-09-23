#!/bin/bash
# نشر بطاقة قرار جديدة لموقع محمد فوراً عبر ntfy
# استعمال: ./ask.sh '<json>'   مثال:
# ./ask.sh '{"id":"n01","sec":"new","type":"single","q":"سؤال؟","opts":["أ","ب"]}'
# حذف بطاقة: ./ask.sh '{"del":"n01"}'
# type: single | multi | rate | text   |   sec: strategy | work | id | new
curl -s -X POST -H "Content-Type: application/json" -d "$1" https://ntfy.sh/med-qz-x7k2-in | grep -o '"id":"[^"]*"' | head -1
