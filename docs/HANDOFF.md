# 痕迹 Traces · 会话交接（Railway 已上线版）

> 更新：2026-11-13 15:55
> 换账号 / 换机器后，新会话**先读这份**，不要让用户重讲一遍。

---

## 一句话现状

**站已经活了**：Railway 上跑着，`https://traces-live-production.up.railway.app` 全部功能正常；
`tracesclub.com` 已在 Railway 绑定好，**只差阿里云两条 DNS 记录**就能用自有域名访问。

---

## 线上位置

```
Railway 面板   : https://railway.com/project/b0872dd3-f9f7-4b0e-8637-3e9fe0a8a8c0
账号           : wanp1a0gu@gmail.com（TRIAL，30 天或 $5 额度）
项目 / 服务    : traces-live / traces-live（serviceId ee3395da-387a-4924-afea-a82ce6f179d8）
默认域名       : https://traces-live-production.up.railway.app
自定义域名     : https://tracesclub.com（已绑定，Verified: no，等 DNS）
```

实测通过：`POST /api/health` 200、`POST /api/chat` 503 `cat_offline`、`/zh/features` 7 条 `feat-row`、
`/en` 200、`/sitemap.xml` 200、未知路径 404。

---

## 部署方式（重要，别再走弯路）

`release/` 在 `.gitignore` 里，直接 `railway up` 会**漏掉静态文件**，所以走暂存目录：

```bash
bash scripts/deploy-railway.sh            # 同步 + 部署（内置网络重试）
bash scripts/deploy-railway.sh --no-sync  # 只重部署（改完环境变量用）
```

暂存目录 `D:\网站\traces-deploy` 只放 `server.js / lib / release / cat-status.json / Dockerfile / railway.json / .dockerignore / package.json`。

- Railway 服务端按 `Dockerfile` 构建，镜像里不装 npm 包（`server.js` 零依赖）
- `railway.json`（Config as Code）官方已标记 deprecated，**2026-12-01 后失效**，届时需要迁到 `.railway/railway.ts`
- 改了环境变量必须重新部署才生效：`railway redeploy -y`（变量面板里直接改会自动触发）

CLI 已全局安装：`railway 5.74.0`；登录态在 `~/.railway`，失效就 `railway login --browserless` 走设备码。

---

## 待办

1. **DNS（唯一阻塞项）**：阿里云域名控制台 → `tracesclub.com` 解析设置，加两条：

   | 记录类型 | 主机记录 | 记录值 |
   |---|---|---|
   | CNAME | `@` | `zoyyaqek.up.railway.app` |
   | TXT | `_railway-verify` | `railway-verify=ce97417c04d9b1b6c7c66bc486a210b15071396e066fead8ee46e495b0922938` |

   加完用 `railway domain status c72bd3fc-5508-4e80-88d7-6fb2f1464f8a` 看
   `Verified` 是否变 yes、证书状态是否 VALID。备案若未完成，国内访问仍可能被拦。

2. **PayPal webhook 换地址**：开发者后台把 webhook 指向 `https://tracesclub.com/api/paypal/webhook`。
   回跳地址不用管（前端 SDK 现算，`server.js` 里没有硬编码 return_url）。
   顺带把 `server.js` CSP 里遗留的 `https://mingli-bazi-api.wanp1a0gu.workers.dev` 删掉。

3. **www 子域**：TRIAL 档每个服务只允许 **1 个自定义域名**，`www.tracesclub.com` 加不进去。
   要么升级 Hobby（$5/月）后补绑，要么在阿里云做 301 转发。

4. **用户重挂**：10 个老用户在新站重新注册（同邮箱）后执行 `db/supabase/05-remap-users.sql`。

5. **邮件验证码**：Supabase 默认发链接，页面 UI 是输 6 位码 —— 仍需改邮件模板或后端自建发码。

---

## 已知坑（别再踩）

- **Dockerfile 必须 COPY `cat-status.json`**：`server.js` 启动时读它，读不到会按「在线」兜底，
  结果小痕照常烧豆包额度。已于 2026-11-13 修复，并加了 `CAT_ONLINE=false` 环境变量兜底。
- **Railway 会间歇性连不上**：`backboard.railway.com` 报 `tls handshake eof` / `operation timed out`，
  CLI 不自动重试，`scripts/deploy-railway.sh` 已内置重试，手敲命令时记得重试几次。
- **`railway up` 报 "Multiple services found"**：加 `-s traces-live`。
- 老应用 `wbapp_9pvnTdP5dI1cB9PjsWg1Ou` 是孤儿应用，发布工具发不进去；已下线且**不要删除**。
- `.wbapp_*.genie` 是平台写的新建标记，不是绑定输入，手改无效。
- 本机 `http_proxy` 会劫持 localhost，curl 调试本机服务要 `--noproxy '*'`；`*.supabase.co`
  直连被墙，需走浏览器（CDP）或代理。
- 工具启动的 Chrome 进程会随命令结束被回收，CDP 操作必须**在同一条命令里**起浏览器 + 跑脚本。
- Chrome 用默认 User Data 目录时**拒绝开远程调试**（157 版新限制），必须 `--user-data-dir` 指向别的目录。
  而会话 Cookie 是内存态、不落盘，所以「复制配置」拿不到别人的登录态 —— 需要人在那个窗口里登录一次。
- `wallet_transactions_ref_uniq` 只约束 `kind='grant'`（旧数据两笔提现 ref_id 都是 1）。
- 钱包密钥必须与 `app_secrets.wallet_secret` 和 `WALLET_RECHARGE_SECRET` 三处一致。

---

## 关键路径

| 用途 | 路径 |
|---|---|
| 项目根目录 | `D:\网站\traces-live` |
| 部署暂存（railway up 从这里推） | `D:\网站\traces-deploy` |
| 环境变量（含密钥，已 gitignore） | `D:\网站\traces-live\.env` |
| 原始备份 JSON | `db/backups/2026-11-11/backup.json` |
| 建表 / 权限 / 函数 / 导入 SQL | `db/supabase/*.sql` |
| CDP 脚本 | `D:\wbtmp\cdp.mjs` / `nav.mjs` / `click.mjs` / `fill.mjs` / `run-sql.mjs` |

Supabase 项目：`https://eyetamiemmpnbwipusjx.supabase.co`（ap-southeast-1，ACTIVE_HEALTHY，独立账号，换号不受影响）。

---

## 快速自检

```bash
cd "/d/网站/traces-live" && git log --oneline -3 && cat cat-status.json | head -5
curl -s -X POST https://traces-live-production.up.railway.app/api/health -w '\n%{http_code}\n'
```
