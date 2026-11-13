<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

---

# 本站点发布须知（务必先读）

**目标域名**：`https://traces.app.workbuddy.host`

**发布参数**（照抄，不要改）：

```
directory : D:\网站\traces-live
language  : node
startCmd  : node server.js
installCmd: （留空）
domainPrefix: traces
```

## 背景（2026-11-11）

- 原应用 `wbapp_9pvnTdP5dI1cB9PjsWg1Ou` 承载 `mingli-club.app.workbuddy.host`，因重装系统丢失工作区归属，**已无法从当前工具链更新**，故新建应用迁到 `traces` 域名。
- 老应用**不要删除**，它承载着线上的数据库、用户与订单，迁移完成前它是唯一数据源。

## 已完成，不要回退

- 小痕（站内猫咪助理）已下线：根目录 `cat-status.json` 的 `online: false`，前端 5 处入口与 `/api/chat` 均已按此开关拦截。
- 验证判据：`/zh/features` 的 `feat-row` 应为 **7** 条；页面不含“小痕”；`POST /api/chat` 返回 **503**。

## 迁移注意

- 业务数据备份：`db/backups/2026-11-11/backup.json`（含真实邮箱与金额，**已在 .gitignore，禁止提交**）。
- 三张核心表带邮箱（`wallet_accounts.owner_email`、`payment_orders.payer_email`），迁移后可按邮箱重新挂接用户。
- 切换域名后必须同步更新 `lib/cloud.ts` 的 `endpoint` 与 `publishableKey`、`lib/site-config.ts` 的 `SITE_URL`，否则云服务 origin 校验失败，登录与钱包全部不可用。
- 切换域名后需在 PayPal 开发者后台更新 webhook 与回跳地址。

## 禁止

- 不要发布到 `mingli-club.app.workbuddy.host`（发不进去，只会新建应用浪费前缀）。
- 不要提交 `server-config.json`、`db/backups/`、`.wbapp_*.genie` 到 git。

