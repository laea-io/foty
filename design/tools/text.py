# 디자인 .dc.html의 글자만(블록마다 한 줄). 사용: python3 -I text.py 파일...
import sys,re
for f in sys.argv[1:]:
    s=open(f).read(); s=s[s.index('<x-dc>'):s.index('</x-dc>')]
    s=re.sub(r'<helmet>.*?</helmet>','',s,flags=re.S); s=re.sub(r'<svg.*?</svg>','',s,flags=re.S)
    s=re.sub(r'<img [^>]*alt="([^"]*)"[^>]*>',r' [img:\1] ',s)
    s=re.sub(r'<a [^>]*href="([^"#]+)\.dc\.html"[^>]*>',r'\n[→\1] ',s)
    s=re.sub(r'<(/?)(div|header|nav|section|a|button|h1|h2|li|footer|aside|main)\b[^>]*>','\n',s); s=re.sub(r'<[^>]+>',' ',s)
    print('=== '+f); print(re.sub(r'\n\s*\n+','\n',re.sub(r'[ \t]+',' ',s)).strip())
