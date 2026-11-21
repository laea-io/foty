#!/bin/bash
# foty 스테이징을 gamma runner에 올린다(시연 데이터, 운영 비밀값 없음). alpha에서: ops/stg-up.sh [커밋, 기본 HEAD] [--reset]
#   --reset: DB·사진 볼륨을 지우고 시연 세계를 처음부터(시연 날짜도 다시 맞춘다)
# 보기: Tailscale 켠 기기에서 http://10.10.10.14:4060   내리기: ssh gamma-runner 'docker compose -f ~/stg/foty/compose.yml down -v'
set -euo pipefail
cd "$(git -C "$(dirname "$0")" rev-parse --show-toplevel)"
rev=$(git rev-parse --short "${1:-HEAD}")
reset=0; [[ " $* " == *" --reset "* ]] && reset=1
ssh gamma-runner 'mkdir -p ~/stg/foty && rm -rf ~/stg/foty/web'
git archive --format=tar "$rev" web | ssh gamma-runner 'tar -x -C ~/stg/foty'
sed "s#foty-web:stg-REV#foty-web:stg-$rev#" ops/stg-compose.yml | ssh gamma-runner 'cat > ~/stg/foty/compose.yml'
ssh gamma-runner "set -e; cd ~/stg/foty
  [ -s .env ] || { umask 077; echo \"AUTH_SECRET=\$(head -c 48 /dev/urandom | base64 | tr -d '/+=' | head -c 48)\" > .env; }
  docker build -q -t foty-web:stg-$rev web >/dev/null
  if [ $reset = 1 ]; then docker compose down -v >/dev/null 2>&1 || true; fi
  docker compose up -d >/dev/null 2>&1
  for i in \$(seq 60); do curl -sf http://10.10.10.14:4060/api/health >/dev/null && break; sleep 1; done
  docker images foty-web --format '{{.Tag}}' | grep -v stg-$rev | xargs -r -I{} docker rmi -f foty-web:{} >/dev/null"
echo "foty 스테이징 $rev → http://10.10.10.14:4060 (health $(curl -s -m 8 -o /dev/null -w '%{http_code}' http://10.10.10.14:4060/api/health))"
