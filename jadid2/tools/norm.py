"""Arabic text normalization — same recipe as akidsofi/tools/cut_texts.py."""
import re
import unicodedata

_DIAC = re.compile(r'[ً-ْٰـٱ]')
_PUNCT = re.compile(r'[،,؛;:؟?!"«»()\[\]{}<>«»ـ…\.]')
_WS = re.compile(r'\s+')


def norm(s: str) -> str:
    """NFKC + strip harakat/tatweel + unify alef/ة/ى/ؤ/ئ + drop punctuation."""
    s = unicodedata.normalize('NFKC', s)
    s = s.replace('أ', 'ا').replace('إ', 'ا').replace('آ', 'ا').replace('ٱ', 'ا')
    s = _DIAC.sub('', s)
    s = s.replace('ة', 'ه').replace('ى', 'ي').replace('ؤ', 'و').replace('ئ', 'ي')
    s = _PUNCT.sub(' ', s)
    return _WS.sub(' ', s).strip()


def tokens(s: str) -> list:
    return norm(s).split()
