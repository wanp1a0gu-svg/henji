#!/usr/bin/env bash
# ============================================================================
# 痕迹 Traces · Railway 一键部署
# ----------------------------------------------------------------------------
# 为什么要有这个脚本：
#   1. `release/` 在 .gitignore 里，直接 `railway up` 会把静态文件漏掉（Railway 按
#      gitignore 过滤上传内容），所以必须先同步到一个干净的暂存目录；
#   2. 本机访问 backboard.railway.com 会间歇性超时（TLS EOF / timeout），CLI 不会
#      自动重试，所以这里包一层重试；
#   3. `railway up` 在项目里有多个服务时要求显式 -s，统一写死避免歧义。
#
# 用法：
#   bash scripts/deploy-railway.sh            # 同步 + 部署
#   bash scripts/deploy-railway.sh --no-sync  # 只重部署（改了环境变量后用）
# ============================================================================
set -euo pipefail

SRC="/d/网站/traces-live"
DST="/d/网站/traces-deploy"
SERVICE="traces-live"
TRIES=6

if [ "${1:-}" != "--no-sync" ]; then
  echo "==> 同步源码到暂存目录 $DST"
  mkdir -p "$DST"
  rm -rf "$DST/release" "$DST/lib"
  cp -r "$SRC/release" "$SRC/lib" "$DST/"
  cp "$SRC/server.js" "$SRC/Dockerfile" "$SRC/railway.json" \
     "$SRC/.dockerignore" "$SRC/package.json" "$SRC/cat-status.json" "$DST/"
  mkdir -p "$DST/data"
  du -sh "$DST"
fi

cd "$DST"
for i in $(seq 1 $TRIES); do
  echo "==> 部署尝试 $i/$TRIES"
  if out=$(railway up -y -d -s "$SERVICE" 2>&1); then
    echo "$out" | grep -E "Deployment:|Uploading" || true
    echo "==> 已提交部署，等待构建…"
    for j in $(seq 1 30); do
      st=$(railway deployment list 2>/dev/null | head -2 | awk -F'|' '{print $2}' | tr -d ' ' | head -1)
      case "$st" in
        SUCCESS) echo "==> 构建成功"; exit 0 ;;
        FAILED|CRASHED) echo "==> 构建失败，去 Railway 面板看日志"; exit 1 ;;
      esac
      sleep 10
    done
    echo "==> 构建超时，去面板确认"; exit 1
  fi
  # 网络类错误才重试；其它错误直接抛出
  if echo "$out" | grep -qi "failed to fetch\|timed out\|tls handshake\|operation timed"; then
    echo "    网络抖动，${i}0s 后重试"
    sleep $((i * 4))
  else
    echo "$out"
    exit 1
  fi
done
echo "==> 重试用尽，部署未提交"
exit 1
