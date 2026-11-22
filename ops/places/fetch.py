#!/usr/bin/env python3
"""남양주 실제 장소 데이터 만들기 → web/data/places-namyangju.json

- 관광지·문화시설·레포츠: stay-sync DB의 Attraction 표(관광공사 TourAPI에서 모은 것)
- 식당·카페: TourAPI areaBasedList2 (남양주 = 법정동 41/360)
- 모든 장소: TourAPI detailCommon2(소개·홈페이지) · detailIntro2(영업시간·휴무·메뉴·주차) · detailImage2(사진)

alpha에서 실행한다(stay-sync DB와 TourAPI 키가 alpha에만 있다). 결과 JSON은 공공데이터라 저장소에 커밋하고,
앱이 시작할 때 places 표에 반영한다(lib/db/places-sync.ts). 키·DB 비밀번호는 결과에 들어가지 않는다.

  python3 ops/places/fetch.py            # 캐시(ops/places/.cache)가 있으면 API를 다시 부르지 않는다
  python3 ops/places/fetch.py --refresh  # 새로 받기
"""
import html
import json
import os
import re
import subprocess
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CACHE = Path(__file__).resolve().parent / ".cache"
OUT = ROOT / "web" / "data" / "places-namyangju.json"
BASE = "https://apis.data.go.kr/B551011/KorService2/"
STAY_ENV = Path.home() / "projects/stay-sync/backend/.env.docker"
REFRESH = "--refresh" in sys.argv


def env_keys():
    """TourAPI 키: 환경변수 TOUR_API_SERVICE_KEY, 없으면 stay-sync .env.docker(기본 + 예비 키들)."""
    keys = [os.environ.get("TOUR_API_SERVICE_KEY", "")]
    if STAY_ENV.exists():
        for line in STAY_ENV.read_text().splitlines():
            k, _, v = line.partition("=")
            v = v.strip().strip('"')
            if k == "TOUR_API_SERVICE_KEY":
                keys.append(v)
            elif k == "TOUR_API_FALLBACK_SERVICE_KEYS":
                keys += [x.strip() for x in v.split(",")]
            elif k == "TOUR_API_FALLBACK_SERVICE_KEY":
                keys.append(v)
    return [k for i, k in enumerate(keys) if k and k not in keys[:i]]


KEYS = env_keys()
if not KEYS:
    sys.exit("TourAPI 키가 없습니다(TOUR_API_SERVICE_KEY 또는 stay-sync .env.docker)")
key_i = 0


def api(op, **params):
    """TourAPI 한 번. 결과를 캐시하고, 한도 초과면 예비 키로 넘어간다."""
    global key_i
    tag = op + "-" + "-".join(f"{k}={v}" for k, v in sorted(params.items()))
    f = CACHE / (re.sub(r"[^\w=.-]", "_", tag) + ".json")
    if f.exists() and not REFRESH:
        return json.loads(f.read_text())
    q = {"MobileOS": "ETC", "MobileApp": "foty", "_type": "json", **params}
    while True:
        url = BASE + op + "?" + urllib.parse.urlencode({**q, "serviceKey": KEYS[key_i]})
        try:
            with urllib.request.urlopen(url, timeout=20) as r:
                text = r.read().decode()
            data = json.loads(text)
            body = data["response"]["body"]
            items = body["items"]["item"] if body.get("items") else []
            if isinstance(items, dict):
                items = [items]
            break
        except Exception as e:  # 한도 초과·일시 오류
            msg = str(e)[:80]
            if key_i + 1 < len(KEYS):
                key_i += 1
                print(f"  ! {op}: {msg} → 예비 키 {key_i}", file=sys.stderr)
                continue
            raise SystemExit(f"TourAPI 실패({op}): {msg}")
    CACHE.mkdir(exist_ok=True)
    f.write_text(json.dumps({"total": body.get("totalCount", len(items)), "items": items}, ensure_ascii=False))
    time.sleep(0.08)
    return {"total": body.get("totalCount", len(items)), "items": items}


def staysync_attractions():
    """stay-sync DB(읽기 전용)에서 남양주 관광지·문화시설·레포츠."""
    sql = (
        "select json_agg(row_to_json(a)) from (select \"contentId\" as id, \"contentTypeId\" as type, title, "
        "address1, mapx, mapy, \"indoorOutdoor\" as io, \"firstImage\" as img, \"copyrightDivisionCode\" as cp, "
        "telephone from \"Attraction\" where address1 like '%남양주%' and \"contentTypeId\" in ('12','14','28')) a;"
    )
    inp = "\\pset format unaligned\n\\pset tuples_only on\n" + sql + "\n"
    out = subprocess.run(["laea", "db", "psql", "stay_sync_db"], input=inp, capture_output=True, text=True).stdout
    line = next(l for l in out.splitlines() if l.startswith("["))
    return json.loads(line)


def restaurants():
    rows, page = [], 1
    while True:
        r = api("areaBasedList2", lDongRegnCd=41, lDongSignguCd=360, contentTypeId=39, numOfRows=100, pageNo=page, arrange="Q")
        rows += r["items"]
        if len(rows) >= int(r["total"]) or not r["items"]:
            return rows
        page += 1


def clean(s):
    if not s:
        return None
    s = re.sub(r"<br\s*/?>", "\n", str(s), flags=re.I)
    s = html.unescape(re.sub(r"<[^>]+>", "", s))
    s = re.sub(r"[ \t]+", " ", s)
    s = "\n".join(x.strip() for x in s.splitlines() if x.strip())
    return s or None


def https(u):
    return ("https://" + u[len("http://"):]) if u and u.startswith("http://") else (u or None)


def area_of(addr):
    """주소 → 읍·면·동: '…조안면 북한강로' → 조안면, '…(수석동)' → 수석동"""
    m = re.search(r"남양주시\s+(\S+[읍면])", addr or "")
    if m:
        return m.group(1)
    m = re.search(r"\((\S+?동)\d*[가]?\)?", addr or "") or re.search(r"남양주시\s+(\S+동)\b", addr or "")
    return m.group(1) if m else "남양주"


REGION = {
    "조안면": "paldang", "와부읍": "paldang",
    "진접읍": "gwangneung", "진건읍": "gwangneung", "오남읍": "gwangneung",
    "별내동": "byeollae", "별내면": "byeollae",
    "화도읍": "hwado", "수동면": "hwado",
    "다산동": "dasan", "도농동": "dasan", "지금동": "dasan",
}


def region_of(area, name):
    if re.search(r"정약용|다산|실학", name):
        return "dasan"
    return REGION.get(area, "city")


INTRO = {  # 타입별 detailIntro2 필드: 시간 · 휴무 · 주차 · 문의
    "12": ("usetime", "restdate", "parking", "infocenter"),
    "14": ("usetimeculture", "restdateculture", "parkingculture", "infocenterculture"),
    "28": ("usetimeleports", "restdateleports", "parkingleports", "infocenterleports"),
    "39": ("opentimefood", "restdatefood", "parkingfood", "infocenterfood"),
}


PRETTY = {"불교": "사찰", "기타역사유적지": "역사 유적", "고분, 능": "왕릉", "산, 고개, 오름, 봉우리": "산",
          "일반야영장": "캠핑장", "수목원ㆍ정원": "정원", "주제공원": "테마 공원", "미술관/화랑": "미술관",
          "기타육상레저스포츠": "레저", "기타수상레저스포츠": "수상 레저", "윈드서핑/제트스키": "수상 레저",
          "마을관광지": "마을", "시민공원": "공원", "민물낚시": "낚시터"}


def group_kind(type_, cls3, cls_names, io):
    name = cls_names.get(cls3 or "", "")
    name = PRETTY.get(name, name)
    if type_ == "39":
        if (cls3 or "").startswith("FD05"):
            return "카페", name if name in ("찻집",) else "카페"
        if (cls3 or "").startswith("FD03"):
            return "맛집", "간단한 식사"
        return "맛집", {"중식": "중식", "일식": "일식", "서양식": "양식"}.get(name, "식당")
    if type_ == "14":
        return "문화 공간", name or "문화시설"
    if type_ == "28":
        return "기타", name or "레포츠"
    # 관광지: 자연(NA)·역사(HS)·문화(VE/EX) 등
    top = (cls3 or "")[:2]
    if top == "NA":
        return "자연", name or "자연"
    if top in ("HS", "VE", "EX"):
        return "문화 공간", name or "명소"
    return ("자연" if io == "실외" else "문화 공간"), name or "명소"


def main():
    names = {x["lclsSystm3Cd"]: x["lclsSystm3Nm"] for x in api("lclsSystmCode2", lclsSystmListYn="Y", numOfRows=5000, pageNo=1)["items"]}
    base = []
    for a in staysync_attractions():
        base.append({"id": a["id"], "type": a["type"], "title": a["title"], "addr": a["address1"], "x": a["mapx"], "y": a["mapy"], "io": a["io"], "img": a["img"], "cp": a["cp"], "tel": a["telephone"]})
    seen = {b["id"] for b in base}
    for r in restaurants():
        if r["contentid"] in seen:
            continue
        if (r.get("lclsSystm3") or "").startswith("FD04"):  # 주점은 당일 여행 코스에서 뺀다
            continue
        base.append({"id": r["contentid"], "type": "39", "title": r["title"], "addr": r.get("addr1"), "x": r.get("mapx"), "y": r.get("mapy"), "io": "실내", "img": r.get("firstimage"), "cp": r.get("cpyrhtDivCd"), "tel": r.get("tel")})
    print(f"후보 {len(base)}곳 — 상세·사진 받는 중", file=sys.stderr)

    out, skipped = [], 0
    for i, b in enumerate(base, 1):
        c = (api("detailCommon2", contentId=b["id"])["items"] or [{}])[0]
        it = (api("detailIntro2", contentId=b["id"], contentTypeId=b["type"])["items"] or [{}])[0]
        imgs = api("detailImage2", contentId=b["id"], imageYN="Y")["items"]
        if b["type"] == "39":  # 음식점은 메뉴 사진도
            imgs += api("detailImage2", contentId=b["id"], imageYN="N")["items"]
        photos = [https(c.get("firstimage") or b["img"])] + [https(x.get("originimgurl")) for x in imgs]
        photos = [p for j, p in enumerate(photos) if p and p not in photos[:j]][:6]
        if not photos:
            skipped += 1
            continue
        tf, rf, pf, inf = INTRO[b["type"]]
        group, kind = group_kind(b["type"], c.get("lclsSystm3"), names, b["io"])
        area = area_of(b["addr"] or c.get("addr1"))
        name = re.sub(r"\s*\((남양주|경기)\)$", "", b["title"]).strip()
        indoor = b["type"] in ("14", "39") or b["io"] == "실내"
        mod = (c.get("modifiedtime") or "")[:8]
        out.append({
            "id": f"tour-{b['id']}",
            "sourceId": b["id"],
            "contentType": b["type"],
            "name": name,
            "area": area,
            "kind": kind,
            "group": group,
            "region": region_of(area, name),
            "indoor": indoor,
            "cost": 15000 if group == "맛집" else 8000 if group == "카페" else 0,
            "address": clean(c.get("addr1") or b["addr"]),
            "lat": float(c.get("mapy") or b["y"] or 0) or None,
            "lng": float(c.get("mapx") or b["x"] or 0) or None,
            "phone": clean(it.get(inf) or c.get("tel") or b["tel"]),
            "hours": clean(it.get(tf)),
            "closed": clean(it.get(rf)),
            "parking": clean(it.get(pf)),
            "menu": clean(it.get("treatmenu") or it.get("firstmenu")),
            "overview": clean(c.get("overview")),
            "homepage": (re.search(r"https?://[^\s\"'<>]+", c.get("homepage") or "") or [None])[0],
            "image": photos[0],
            "images": photos,
            "imageCredit": c.get("cpyrhtDivCd") or b["cp"] or "Type1",
            "sourceModified": f"{mod[:4]}-{mod[4:6]}-{mod[6:8]}" if len(mod) == 8 else None,
        })
        if i % 25 == 0:
            print(f"  {i}/{len(base)}", file=sys.stderr)
    out.sort(key=lambda p: (p["group"], p["name"]))
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({"source": "한국관광공사 TourAPI(KorService2) · stay-sync", "fetchedOn": time.strftime("%Y-%m-%d"), "places": out}, ensure_ascii=False, indent=1) + "\n")
    from collections import Counter
    print(f"완료: {len(out)}곳 (사진 없어 뺀 곳 {skipped}) → {OUT.relative_to(ROOT)}", file=sys.stderr)
    print("  ", dict(Counter(p["group"] for p in out)), dict(Counter(p["region"] for p in out)), file=sys.stderr)


if __name__ == "__main__":
    main()
