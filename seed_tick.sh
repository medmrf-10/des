#!/bin/bash
SITE=/home/ubuntu/decisions_site
python3 $SITE/make_seed.py >/dev/null 2>&1
cd $SITE && git status --short | grep -q . && bash $SITE/../deploy.sh "answers: seed refresh" >/dev/null 2>&1
