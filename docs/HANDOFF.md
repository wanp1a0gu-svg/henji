# 痕迹 Traces · 会话交接（已上线 · 自有域名可用）

> 更新：2026-11-13 16:25
> 换账号 / 换机器后，新会话**先读这份**，不要让用户重讲一遍。

---

## 一句话现状

**站已经完全活了**：`https://tracesclub.com` 证书已签发、DNS 已生效，全部接口实测通过。

---

## 线上位置

```
Railway 面板   : https://railway.com/project/b0872dd3-f9f7-4b0e-8637-3e9fe0a8a8c0
账号           : wanp1a0gu@gmail.com（TRIAL，30 天或 $5 额度）
项目 / 服务    : traces-live / traces-live（serviceId ee3395da-387a-4924-afea-a82ce6f179d8）
默认域名       : https://traces-live-production.up.railway.app
自定义域名     : https://tracesclub.com（ACTIVE，证书 VALID）
域名 ID        : c72bd3fc-5508-4e80-88d7-6fb2f1464f8a
DNS 托管       : 阿里云云解析（dns17/dns18.hichina.com），账号 nk2763432559
```

实测通过（走 `curl --noproxy '*'`，本机 http_proxy 会掐 TLS 重协商）：
`/zh` 200 · `/en` 200 · `/sitemap.xml` 200 · `/zh/features` 7 条 `feat-row` ·
`POST /api/health` 200 · `POST /api/chat` 503 `cat_offline` · 未知路径 404。

### DNS 现状（重要）

阿里云已加两条：

| 类型 | 主机记录 | 记录值 |
|---|---|---|
| CNAME | `@` | `zoyyaqek.up.railway.app` |
| TXT | `_railway-verify` | `railway-verify=ce97417c04d9b1b6c7c66bc486a210b15071396e066fead8ee46e495b0922938` |

**遗留隐患**：顶点 `@` 上原本就有企业邮箱的 3 条 MX + 1 条 SPF TXT，现在又挂了 CNAME。
DNS 规范里 CNAME 不能与其他类型共存 —— 阿里云允许这么存，Google/阿里 DNS 实测能同时返回 MX 和 CNAME，
但严格的解析器可能返回空答案。彻底解决只有三条路：

1. 把域名 DNS 迁到 Cloudflare（免费版支持顶平 CNAME 展平），NS 改到 CF；
2. 阿里云升级套餐用 ALIAS（免费档的 ALIAS 在控制台存在但**不可选/灰**，已试过）；
3. 确认企业邮箱不用了 → 删掉 `@` 的 MX/TXT，只留 CNAME。

在此之前，`@` 的 SPF（TXT）实际已被 CNAME 覆盖，发信 SPF 校验会失效（当前用 Gmail SMTP 代发，影响有限）。

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

1. **PayPal webhook 换地址**：开发者后台把 webhook 指向 `https://tracesclub.com/api/paypal/webhook`。
   ⚠️ PayPal **不能改已建 webhook 的 URL**，只能删掉重建；重建后 webhookId 会变，必须同步更新
   Railway 的 `PAYPAL_WEBHOOK_ID` 变量并重新部署，否则 `/api/paypal/webhook` 验签会失败。
   回跳地址不用管（前端 SDK 现算，`server.js` 里没有硬编码 return_url）。
   顺带把 `server.js` CSP 里遗留的 `https://mingli-bazi-api.wanp1a0gu.workers.dev` 删掉。

2. **www 子域**：TRIAL 档每个服务只允许 **1 个自定义域名**，`www.tracesclub.com` 加不进去。
   要么升级 Hobby（$5/月）后补绑，要么在阿里云做 301 转发（显性URL）。

3. **顶点 CNAME 与邮箱记录的冲突**：见上面「DNS 现状」，需要用户决定走哪条路。

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
- **本机 curl 访问 `*.railway.app` / `tracesclub.com` 要加 `--noproxy '*'`**：走本机
  `http_proxy` 时 schannel 会卡在 TLS 重协商，直接返回 `HTTP 000`，看起来像站点挂了。

### 阿里云控制台自动化（下次别再摸索）

- 控制台是 SPA，`解析设置` 之类的链接**没有 href**，合成 `click()` 事件无效，必须用
  CDP `Input.dispatchMouseEvent` 发真实鼠标事件（`D:\wbtmp\xy.mjs` / `tapsel.mjs`）。
- 下拉框（Flex/Next 组件）**鼠标点选项不生效**，只有键盘能在选项间移动：打开后读
  `.next-menu-item` 里带 `active/focus` 类的项，按 `ArrowDown` 走到目标再 `Enter`
  （`D:\wbtmp\picktype.mjs`）。
- 选项里 `ALIAS` 是灰的（免费版不给用），键盘会跳过它 —— 所以顶点只能用 CNAME。
- 表单会出现「主机记录填写说明」浮层**盖住记录值输入框**，此时 `elementFromPoint`
  命中不到 input，打字会丢。先点一下抽屉空白处关掉浮层再填（`D:\wbtmp\type3.mjs` 已内置可见性校验）。
- 页面底表和抽屉里都有 `placeholder="请输入主机记录"` 的输入框，按 `getBoundingClientRect().left>1100`
  区分抽屉内的那个。
- 提交后还有一层「解析变更确认」弹窗，要点 `.next-dialog` 里的 `确定`。

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
curl -s --noproxy '*' -X POST https://tracesclub.com/api/health -w '\n%{http_code}\n'
```
