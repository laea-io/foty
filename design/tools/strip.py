# 디자인 .dc.html을 읽기 쉽게: svg 생략, 태그마다 줄바꿈. 사용: python3 -I strip.py 파일 [--svg]
import sys,re
s=open(sys.argv[1]).read()
s=s[s.index('<x-dc>')+6:s.index('</x-dc>')]
s=re.sub(r'<helmet>.*?</helmet>','',s,flags=re.S)
if '--svg' not in sys.argv: s=re.sub(r'<svg.*?</svg>','<svg/>',s,flags=re.S)
s=re.sub(r'box-sizing:border-box;?','',s)
s=re.sub(r'>\s*<','>\n<',s)
print(s)
