#!/usr/bin/env python3
"""운영(foty.laea.io) 시연용 데이터 — 시연 영상 촬영용. 계정은 모두 @demo.foty.kr, users.demo = true.

  python3 ops/demo/make-demo.py > /tmp/demo.sql   (비밀번호는 표준오류로, 파일은 직접 psql에)
  laea db psql foty_db --write < demo.sql

다시 돌리면 같은 id의 시연 데이터를 지우고 새로 넣는다(다른 사용자 데이터는 건드리지 않는다).
"""
import base64
import hashlib
import json
import os
import secrets
import sys

def b64(b):
    return base64.urlsafe_b64encode(b).decode().rstrip("=")

def scrypt_hash(pw):
    salt = os.urandom(16)
    h = hashlib.scrypt(pw.encode(), salt=salt, n=16384, r=8, p=1, dklen=32, maxmem=64 * 1024 * 1024)
    return f"scrypt${16384}${b64(salt)}${b64(h)}"

def q(v):
    if v is None:
        return "null"
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, (int, float)):
        return str(v)
    if isinstance(v, (dict, list)):
        return "'" + json.dumps(v, ensure_ascii=False).replace("'", "''") + "'::jsonb"
    return "'" + str(v).replace("'", "''") + "'"

# 비밀번호는 ops/demo/.pw.json(git 제외)에 두고 다시 돌려도 같게 쓴다
PW_FILE = os.path.join(os.path.dirname(__file__), ".pw.json")
if os.path.exists(PW_FILE):
    saved = json.load(open(PW_FILE))
    PW = {k: saved[k] for k in ("jimin", "harin", "admin")}
    COMMON = saved["group_members"]
else:
    PW = {k: f"foty-{k}-{secrets.token_hex(3)}" for k in ("jimin", "harin", "admin")}
    COMMON = "foty-demo-" + secrets.token_hex(3)  # 화면에 안 나오는 그룹 멤버들
    with open(os.open(PW_FILE, os.O_WRONLY | os.O_CREAT, 0o600), "w") as f:
        json.dump({**PW, "group_members": COMMON}, f)

U = {
    "jimin": dict(name="지민", email="jimin@demo.foty.kr", origin="노원역", role="user",
                  prefs={"activities": ["자연", "카페", "사진"], "pace": "여유롭게", "transport": "대중교통"}, pw=PW["jimin"]),
    "harin": dict(name="하린", email="harin@demo.foty.kr", origin="운길산역", role="user", prefs={}, pw=PW["harin"]),
    "admin": dict(name="foty 운영팀", email="admin@demo.foty.kr", origin="상봉역", role="admin", prefs={}, pw=PW["admin"]),
    "suah": dict(name="수아", email="suah@demo.foty.kr", origin="청량리역", role="user", prefs={"activities": ["카페"]}, pw=COMMON),
    "doyun": dict(name="도윤", email="doyun@demo.foty.kr", origin="잠실역", role="user", prefs={"activities": ["맛집"]}, pw=COMMON),
    "minseo": dict(name="민서", email="minseo@demo.foty.kr", origin="구리역", role="user", prefs={"activities": ["산책"]}, pw=COMMON),
}
uid = lambda h: f"(select id from users where handle = 'demo-{h}')"

out = ["begin;"]
T = ["demo-sujongsa-1128", "demo-water-1129", "demo-dasan-1115"]
tl = ", ".join(q(x) for x in T)
emails = ", ".join(q(u["email"]) for u in U.values())
# 지우기(시연 데이터만)
out += [
    f"delete from posts where author_id in (select id from users where email in ({emails}));",
    f"delete from themes where id in ({tl});",  # stops·applications·messages·checkins는 cascade
    "delete from hosts where id = 'h-demo-harin';",
    f"delete from users where email in ({emails});",
]
for h, u in U.items():
    out.append(
        "insert into users (handle, name, email, password_hash, role, adult, origin, prefs, onboarded, demo) values "
        f"({q('demo-' + h)}, {q(u['name'])}, {q(u['email'])}, {q(scrypt_hash(u['pw']))}, {q(u['role'])}, true, "
        f"{q(u['origin'])}, {q(u['prefs'])}, true, true);"
    )
out.append(
    "insert into hosts (id, user_id, kind, name, area, intro, contact, status, confirm_mode, verified_at) values "
    f"('h-demo-harin', {uid('harin')}, 'resident', '하린', '조안면', "
    "'운길산역 근처에 살아요. 수종사 찻집 창가 자리를 좋아해요.', '시연 계정', '확인 완료', 'auto', now());"
)

def theme(id, core, title, intro, day, stops, end, status, min_, max_, cost, include, acts, meet_detail=""):
    prev = f"(date '{day}' - 1)"
    out.append(
        "insert into themes (id, host_id, core_place_id, title, intro, day, start, \"end\", min, max, deadline, origin, "
        "travel_min, transit, cost_won, meet, include, exclude, activities, status, confirm_mode, meet_detail) values "
        f"({q(id)}, 'h-demo-harin', {q(core)}, {q(title)}, {q(intro)}, {q(day)}, {q(stops[0][1])}, {q(end)}, {min_}, {max_}, "
        f"({prev}::timestamp + time '18:00') at time zone 'Asia/Seoul', '운길산역', 55, true, {cost}, "
        "'운길산역 1번 출구에서 모여 함께 이동해요. 상세 위치는 성사 후 공개돼요.', "
        f"{q(include)}, '교통비, 식사·음료 · 현장에서 각자 결제', array[{', '.join(q(a) for a in acts)}]::text[], "
        f"{q(status)}, 'auto', {q(meet_detail)});"
    )
    for i, (pid, time, stay, nxt) in enumerate(stops):
        out.append(
            "insert into theme_stops (theme_id, ord, place_id, time, stay_min, next, fixed) values "
            f"({q(id)}, {i}, {q(pid)}, {q(time)}, {stay}, {q(nxt)}, {q(pid == core)});"
        )

def app(theme_id, h, days_ago=1):
    out.append(
        "insert into applications (theme_id, user_id, party, status, created_at, decided_at) values "
        f"({q(theme_id)}, {uid(h)}, 1, '수락', now() - interval '{days_ago} days', now() - interval '{days_ago} days');"
    )

# A. 이번 주말 — 지민이 신청하면 3명이 돼서 '성사'(영상의 핵심 장면)
theme("demo-sujongsa-1128", "tour-129516", "수종사 오르고 동치미국수 한 그릇",
      "운길산 중턱 수종사에서 두물머리를 내려다보고, 내려와서 동치미국수로 점심해요. 마지막은 강이 보이는 카페예요.",
      "2026-11-28", [("tour-129516", "10:30", 80, "버스 10분"), ("tour-2857667", "12:05", 70, "버스 12분"), ("tour-2830366", "13:35", 50, None)],
      "14:25", "모집 중", 3, 5, 23000, "코스 안내 · 수종사 찻집 차 한 잔", ["자연", "맛집", "카페"])
app("demo-sujongsa-1128", "suah", 2)
app("demo-sujongsa-1128", "doyun", 1)

# B. 다음 날 — 이미 성사·일정 확정(그룹 공간 · 대화 · 집결 · 지도)
theme("demo-water-1129", "tour-2602619", "물의 정원 걷고 오리 한 상",
      "북한강변 물의 정원을 천천히 걷고, 이가네자연밥상에서 점심을 먹어요. 마지막은 강가 카페에서 쉬어요.",
      "2026-11-29", [("tour-2602619", "11:00", 80, "버스 10분"), ("tour-2870331", "12:35", 70, "버스 9분"), ("tour-2850245", "14:00", 50, None)],
      "14:50", "일정 확정", 3, 5, 25000, "코스 안내", ["자연", "산책", "맛집"], "운길산역 1번 출구 앞 · 10:40")
for i, h in enumerate(["jimin", "suah", "doyun", "minseo"]):
    app("demo-water-1129", h, 6 - i)
for who, body, mins in [
    (None, "최소 인원이 모여 테마가 성사됐어요. 집결과 일정을 함께 정해요.", 300),
    ("harin", "안녕하세요, 하린이에요! 일요일에 물의 정원에서 만나요 :)", 240),
    ("suah", "처음 가 보는데 기대돼요. 운동화면 될까요?", 200),
    ("harin", "네, 평지라 운동화면 충분해요. 강바람이 차니 겉옷 챙겨 오세요.", 180),
    (None, "집결: 운길산역 1번 출구 앞 · 10:40", 170),
    ("doyun", "점심 오리주물럭 맛있다고 해서 기대 중이에요", 60),
    ("jimin", "저도 혼자 신청했는데 반가워요! 일요일에 봬요", 20),
]:
    out.append(
        f"insert into messages (theme_id, user_id, body, created_at) values ('demo-water-1129', "
        f"{uid(who) if who else 'null'}, {q(body)}, now() - interval '{mins} minutes');"
    )

# C. 지난주 — 여행 완료 · 체크인(스탬프) · 후기
theme("demo-dasan-1115", "tour-126806", "정약용유적지 들러 초계국수 먹기",
      "다산 정약용이 나고 자란 마재마을을 걷고, 초계국수로 점심해요. 마무리는 팔당 카페예요.",
      "2026-11-15", [("tour-126806", "10:30", 80, "버스 10분"), ("tour-2845766", "12:05", 70, "버스 10분"), ("tour-2863127", "13:30", 50, None)],
      "14:20", "여행 완료", 3, 5, 18000, "코스 안내", ["문화 공간", "맛집", "카페"])
for h in ["jimin", "suah", "doyun"]:
    app("demo-dasan-1115", h, 10)
    out.append(
        "insert into checkins (theme_id, user_id, place_id, method, first_visit, created_at) values "
        f"('demo-dasan-1115', {uid(h)}, 'tour-126806', 'qr', true, timestamptz '2026-11-15 10:34+09');"
    )
    out.append(f"insert into attendance (theme_id, user_id, status) values ('demo-dasan-1115', {uid(h)}, '참여 확인');")
out.append(
    "insert into posts (id, kind, author_id, theme_id, place_id, title, body, transport, spent_won, visited_on, created_at) values "
    f"('p-demo-jimin-dasan', '여행 후기', {uid('jimin')}, 'demo-dasan-1115', 'tour-126806', "
    "'혼자 갔는데 셋이 돌아왔어요', "
    "'주말에 같이 갈 사람이 없어서 혼자 신청했는데, 정약용유적지에서 만난 두 분과 초계국수까지 같이 먹었어요. "
    "코스를 따로 짤 필요가 없어서 편했고, 다음엔 수종사 테마도 가 보려고요.', '대중교통', 21000, '2026-11-15', now() - interval '5 days');"
)
out.append("commit;")
print("\n".join(out))
print(json.dumps({**PW, "group_members": COMMON}, ensure_ascii=False), file=sys.stderr)
