#!/usr/bin/env python3
"""시연용 큐레이션 테마 50개 → web/data/curated-themes.json

- 장소는 web/data/places-namyangju.json(관광공사 실제 장소)에서만 고른다.
- 코스: 핵심 장소 + 가까운(좌표 거리) 자연·문화 1곳 · 식당 1곳 · 카페 1곳. 이동은 거리로 어림한다.
- 제목·소개·포함/불포함·활동은 OpenAI(gpt-5.4-mini)가 이 코스 정보만 보고 쓴다(사실을 지어내지 않게).
- 호스트는 'foty 큐레이션'(운영팀이 직접 연 테마) — 실제 가게가 여는 것처럼 보이지 않게.
- 날짜: 다음 신청 가능한 주말부터 주말 10일에 5개씩. 앱이 시작할 때 lib/db/curated-sync.ts가 넣는다.

alpha에서: python3 ops/themes/make.py   (키: web/.env.docker의 OPENAI_API_KEY, 결과는 캐시 ops/themes/.cache)
"""
import datetime as dt
import hashlib
import json
import math
import re
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PLACES = json.loads((ROOT / "web/data/places-namyangju.json").read_text())["places"]
OUT = ROOT / "web/data/curated-themes.json"
CACHE = Path(__file__).resolve().parent / ".cache"
KEY = next(l.split("=", 1)[1] for l in (ROOT / "web/.env.docker").read_text().splitlines() if l.startswith("OPENAI_API_KEY="))
N = 50
ACTS = ["자연", "산책", "카페", "맛집", "사진", "문화 공간"]
SKIP_KIND = re.compile(r"캠핑|낚시|수상|레저|승마|골프|스케이트|수영|사격|썰매|쇼핑|아울렛")


def km(a, b):
    if not (a["lat"] and b["lat"]):
        return 99
    la1, lo1, la2, lo2 = map(math.radians, [float(a["lat"]), float(a["lng"]), float(b["lat"]), float(b["lng"])])
    h = math.sin((la2 - la1) / 2) ** 2 + math.cos(la1) * math.cos(la2) * math.sin((lo2 - lo1) / 2) ** 2
    return 6371 * 2 * math.asin(math.sqrt(h))


def move(d):
    if d < 0.9:
        return f"도보 {max(3, round(d * 14))}분"
    return f"차로 {max(5, round(d * 2.2 + 4))}분" if d > 6 else f"버스 {max(8, round(d * 3 + 6))}분"


USAGE = {}  # 다른 테마에 이미 쓴 장소는 뒤로 — 같은 카페가 계속 나오지 않게


def nearest(core, pred, used, limit=8):
    c = [p for p in PLACES if p["id"] not in used and pred(p) and km(core, p) <= limit and p["hours"]]
    c.sort(key=lambda p: (km(core, p) + 2.5 * USAGE.get(p["id"], 0), -len(p["overview"] or "")))
    return c[0] if c else None


is_sight = lambda p: p["group"] in ("자연", "문화 공간") and not SKIP_KIND.search(p["kind"])
is_eat = lambda p: p["group"] == "맛집" and p["kind"] != "간단한 식사"
is_cafe = lambda p: p["group"] == "카페"
STAY = {"맛집": 70, "카페": 50}


def course(core):
    used = {core["id"]}
    if is_eat(core):
        seq = [nearest(core, is_sight, used), core]
        used |= {p["id"] for p in seq if p}
        seq += [nearest(core, is_sight, used), nearest(core, is_cafe, used)]
        core_time = 12 * 60 + 10 * (len(core["id"]) % 3)
    elif is_cafe(core):
        a = nearest(core, is_sight, used)
        used |= {a["id"]} if a else set()
        b = nearest(core, is_eat, used)
        seq, core_time = [a, b, core], 14 * 60
    else:
        b = nearest(core, is_eat, used)
        used |= {b["id"]} if b else set()
        seq, core_time = [core, b, nearest(core, is_cafe, used)], 10 * 60 + 30 * (int(core["sourceId"]) % 3)
    seq = [p for p in seq if p]
    if len(seq) < 3:
        return None
    ci = seq.index(core)
    stay = [80 if p is core and is_sight(p) else STAY.get(p["group"], 60) for p in seq]
    moves = [km(seq[i], seq[i + 1]) for i in range(len(seq) - 1)]
    gap = [int(re.search(r"\d+", move(d)).group()) + 5 for d in moves]
    gap = [5 * math.ceil(g / 5) for g in gap]  # 5분 단위
    t = [0] * len(seq)
    t[ci] = core_time
    for i in range(ci - 1, -1, -1):
        t[i] = t[i + 1] - stay[i] - gap[i]
    for i in range(ci + 1, len(seq)):
        t[i] = t[i - 1] + stay[i - 1] + gap[i - 1]
    hm = lambda m: f"{m // 60:02d}:{m % 60:02d}"
    return [
        {"placeId": p["id"], "time": hm(t[i]), "stayMin": stay[i], "next": move(moves[i]) if i < len(moves) else None, "fixed": p is core}
        for i, p in enumerate(seq)
    ], hm(t[-1] + stay[-1])


def pick_cores():
    # 관광지·문화시설은 소개와 사진이 넉넉한 곳, 식당·카페는 소개가 있는 곳 — 권역이 고르게 섞이게
    sights = [p for p in PLACES if is_sight(p) and p["overview"] and len(p["images"]) >= 2]
    eats = [p for p in PLACES if (is_eat(p) or is_cafe(p)) and p["overview"] and len(p["images"]) >= 3]
    score = lambda p: -(len(p["overview"] or "") + 200 * len(p["images"]))
    sights.sort(key=score)
    eats.sort(key=score)
    out, per_region = [], {}
    for pool, want in ((sights, 36), (eats, N)):
        for p in pool:
            if len(out) >= want:
                break
            if per_region.get(p["region"], 0) >= 11 or any(km(p, q) < 0.3 for q in out):
                continue
            c = course(p)
            # 이미 고른 코스와 장소가 둘 이상 겹치면 뺀다
            if c and not any(len({s["placeId"] for s in c[0]} & {s["placeId"] for s in course(q)[0]}) >= 2 for q in out):
                for st in c[0]:
                    USAGE[st["placeId"]] = USAGE.get(st["placeId"], 0) + 1
                out.append(p)
                per_region[p["region"]] = per_region.get(p["region"], 0) + 1
    return out[:N]


ORIGIN = {"paldang": ("상봉역", 45, True), "dasan": ("상봉역", 50, True), "gwangneung": ("상봉역", 50, True),
          "byeollae": ("상봉역", 30, True), "hwado": ("상봉역", 55, False), "city": ("상봉역", 35, True)}

SYSTEM = """너는 남양주 당일 여행 서비스 foty의 운영팀이다. 운영팀이 직접 짠 소규모(3~6명) 당일 테마의 문구를 쓴다.
- 주어진 장소 정보(이름·종류·소개·메뉴·영업시간)에 있는 사실만 쓴다. 없는 메뉴·가격·체험·풍경을 지어내지 않는다.
- 말투는 foty 화면처럼 부드러운 해요체(~해요, ~돼요). "~하십니다/드립니다" 금지.
- title: 12~20자. 그 코스에서만 할 수 있는 구체적인 한 가지가 보이게(장소 소개·메뉴에 있는 사실에서).
  좋은 예: "한정식 점심과 여유당 산책", "로스터리에서 배우는 핸드드립", "운길산 수종사 오르고 동치미국수".
  나쁜 예: "OO와 남양주 식사·카페 코스", "OO 코스"처럼 '식사·카페·코스'만 나열한 제목. 느낌표·이모지·과장 금지.
- intro: 해요체 두 문장. 코스 흐름(어디서 무엇을 하고 어디로 가는지)을 담는다.
- include: 참가비에 포함되는 것 — 운영팀 테마라 '코스 안내'만 포함, 나머지는 현장 결제. 짧게.
- exclude: '교통비, 식사·음료·입장료 · 현장에서 각자 결제' 같은 식으로 코스에 맞게 짧게.
- activities: 다음 중 1~3개만 — 자연, 산책, 카페, 맛집, 사진, 문화 공간."""

SCHEMA = {"type": "object", "additionalProperties": False, "required": ["title", "intro", "include", "exclude", "activities"],
          "properties": {"title": {"type": "string"}, "intro": {"type": "string"}, "include": {"type": "string"},
                         "exclude": {"type": "string"}, "activities": {"type": "array", "items": {"type": "string", "enum": ACTS}}}}


def write(stops):
    info = []
    for s in stops:
        p = next(x for x in PLACES if x["id"] == s["placeId"])
        info.append({"순서": len(info) + 1, "시간": s["time"], "이름": p["name"], "종류": p["kind"], "핵심": s["fixed"],
                     "소개": (p["overview"] or "")[:260], "메뉴": p["menu"], "영업시간": (p["hours"] or "")[:80], "다음 이동": s["next"]})
    body = json.dumps({"model": "gpt-5.4-mini", "reasoning_effort": "low",
                       "messages": [{"role": "system", "content": SYSTEM}, {"role": "user", "content": json.dumps(info, ensure_ascii=False)}],
                       "response_format": {"type": "json_schema", "json_schema": {"name": "theme", "strict": True, "schema": SCHEMA}}}).encode()
    f = CACHE / (hashlib.sha1(body).hexdigest()[:16] + ".json")
    if f.exists():
        return json.loads(f.read_text())
    req = urllib.request.Request("https://api.openai.com/v1/chat/completions", body,
                                 {"Authorization": f"Bearer {KEY}", "Content-Type": "application/json"})
    for attempt in range(4):  # 가끔 응답이 늦다 — 다시 시도
        try:
            with urllib.request.urlopen(req, timeout=90) as r:
                out = json.loads(json.loads(r.read())["choices"][0]["message"]["content"])
            break
        except Exception:
            if attempt == 3:
                raise
    CACHE.mkdir(exist_ok=True)
    f.write_text(json.dumps(out, ensure_ascii=False))
    return out


def weekend_days(n_days):
    kst = dt.datetime.now(dt.timezone(dt.timedelta(hours=9)))
    d = kst.date()
    days = []
    while len(days) < n_days:
        d += dt.timedelta(days=1)
        deadline = dt.datetime.combine(d - dt.timedelta(days=1), dt.time(18), kst.tzinfo)
        if d.weekday() in (5, 6) and deadline > kst + dt.timedelta(hours=12):
            days.append(d)
    return days


def main():
    cores = pick_cores()
    days = weekend_days(10)
    out = []
    for i, core in enumerate(cores):
        stops, end = course(core)
        text = write(stops)
        day = days[i % len(days)]
        origin, travel, transit = ORIGIN.get(core["region"], ("상봉역", 45, True))
        cost = sum(next(p for p in PLACES if p["id"] == s["placeId"])["cost"] for s in stops)
        slug = re.sub(r"\D", "", core["id"])
        out.append({
            "id": f"c-{slug}-{day.strftime('%m%d')}",
            "corePlaceId": core["id"], "day": day.isoformat(), "start": stops[0]["time"], "end": end,
            "min": 3, "max": 6, "origin": origin, "travelMin": travel, "transit": transit, "costWon": cost,
            "meet": f"{origin} 1번 출구에서 모여 함께 이동해요. 상세 위치는 성사 후 공개돼요." if transit
            else "각자 차로 첫 장소에서 만나요. 상세 위치는 성사 후 공개돼요.",
            **text, "activities": text["activities"][:3] or ["산책"],
            "stops": stops,
        })
        print(f"  {i + 1:2d}/{len(cores)} {day} {text['title']}  ({' → '.join(next(p for p in PLACES if p['id'] == s['placeId'])['name'] for s in stops)})", file=sys.stderr)
    OUT.write_text(json.dumps({"made": dt.date.today().isoformat(), "themes": out}, ensure_ascii=False, indent=1) + "\n")
    print(f"완료: {len(out)}개 → {OUT.relative_to(ROOT)}", file=sys.stderr)


if __name__ == "__main__":
    main()
