import { locales } from "./i18n";

/**
 * 每个页面自己的 canonical + hreflang。
 *
 * 背景：`app/[locale]/layout.tsx` 原来统一返回
 *   alternates: { canonical: "/{locale}", languages: { en: "/en", zh: "/zh", ... } }
 * 子页面（bazi / shop / courses …）没有覆盖 alternates，于是全部继承了语言首页：
 *   /en/bazi 的 canonical 变成 /en，hreflang 也全部指向各语言首页
 * → Google 判定 70 个 URL 只有 10 个不同页面，商业页进不了索引。
 *
 * 用法：在页面 generateMetadata 里 `alternates: pageAlternates(locale, "/bazi")`
 */
export function pageAlternates(locale: string, path: string) {
  const clean = path === "/" ? "" : path.startsWith("/") ? path : "/" + path;
  const languages: Record<string, string> = {};
  for (const l of locales) languages[l] = `/${l}${clean}`;
  languages["x-default"] = `/en${clean}`;
  return {
    canonical: `/${locale}${clean}`,
    languages,
  };
}
