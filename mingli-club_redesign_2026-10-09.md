# MingLi Club 网站视觉重设计

## 目标
将原本的骨架式页面升级为具有东方高级感、适合玄学/命理出海商业站的视觉设计。

## 主要改动
1. **配色**：深墨黑背景 `#090807` + 米白文字 `#f7f3ed` + 暗金色强调 `#c9a87c`
2. **导航**：固定顶部、毛玻璃、圆形 Logo、悬停状态、移动端汉堡菜单
3. **首页 Hero**：大字标题渐变、光晕背景、双 CTA 按钮、滚动提示
4. **数据区**：三列卡片，带分隔线
5. **特色区**：三卡片网格，图标+标题+描述
6. **课程区**：卡片网格，序号装饰、价格、报名按钮
7. **CTA 区**：渐变边框卡片
8. **八字测算页**：左侧表单 + 右侧价格/说明卡片，支持性别选择、关注方向、报告展示
9. **课程页**：Hero + 课程卡片网格
10. **Footer**：Logo + 标语 + 版权

## 文件变更
- `app/globals.css` - 新配色、字体、动效工具类
- `components/Nav.tsx` - 重写导航
- `components/HomeContent.tsx` - 重写首页
- `components/Footer.tsx` - 重写页脚
- `components/CoursesContent.tsx` - 重写课程页
- `components/BaziContent.tsx` - 重写八字测算页
- `components/PayPalButton.tsx` - 美化占位按钮
- `lib/i18n.ts` - 扩展多语言文案
- `app/[locale]/courses/page.tsx` - 传入 locale
- `app/[locale]/bazi/page.tsx` - 传入 locale

## 部署
- 构建通过，部署到 Cloudflare Pages
- 新预览地址：https://f7eed7ae.mingli-club.pages.dev
- 正式地址：https://mingli-club.pages.dev
- 八字 API Worker：https://mingli-bazi-api.wanp1a0gu.workers.dev

## 待办
- 接入真实 PayPal Client ID
- 移除 Worker 代码中的硬编码 API key，改用 env secret
- 绑定自定义域名
- 接入真实 pai_pan.py 排盘（当前用豆包 LLM 生成报告）
