#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""生成 public/sitemap.xml 与 public/robots.txt（多语言 + hreflang）。

- 站点地址读取 lib/site-config.ts 的 SITE_URL（绑定自定义域名后改那一处并重跑本脚本）
- 语言列表读取 lib/i18n.ts 的 locales
- 重跑：python scripts/build-sitemap.py
"""
import io
import os
import re
import datetime

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, ".."))


def read(path):
    return io.open(os.path.join(ROOT, path), encoding="utf-8").read()


i18n = read("lib/i18n.ts")
m = re.search(r"export const locales: Locale\[\] = \[(.*?)\]", i18n, re.S)
assert m, "locales not found"
locales = re.findall(r"'([a-z]{2})'", m.group(1))
assert len(locales) == 10, "locales parse: %s" % locales

cfg = read("lib/site-config.ts")
m = re.search(r'export const SITE_URL = "([^"]+)"', cfg)
assert m, "SITE_URL not found"
site = m.group(1).rstrip("/")

# 收录页面（不含 /account 等私有页）
PAGES = ["", "/features", "/bazi", "/tarot", "/bagua", "/ziwei", "/courses", "/learn", "/shop"]
TODAY = datetime.date.today().isoformat()

lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
]
for page in PAGES:
    for loc in locales:
        url = "%s/%s%s" % (site, loc, page)
        lines.append("  <url>")
        lines.append("    <loc>%s</loc>" % url)
        lines.append("    <lastmod>%s</lastmod>" % TODAY)
        for alt in locales:
            lines.append(
                '    <xhtml:link rel="alternate" hreflang="%s" href="%s/%s%s"/>'
                % (alt, site, alt, page)
            )
        lines.append(
            '    <xhtml:link rel="alternate" hreflang="x-default" href="%s/en%s"/>' % (site, page)
        )
        lines.append("  </url>")
lines.append("</urlset>")
io.open(os.path.join(ROOT, "public", "sitemap.xml"), "w", encoding="utf-8").write("\n".join(lines) + "\n")

robots = (
    "User-agent: *\n"
    "Allow: /\n"
    "Disallow: /account\n"
    "Disallow: /admin\n"
    "Disallow: /api/\n"
    "\n"
    "Sitemap: %s/sitemap.xml\n" % site
)
io.open(os.path.join(ROOT, "public", "robots.txt"), "w", encoding="utf-8").write(robots)

print("sitemap.xml: %d urls (%d pages x %d locales)" % (len(PAGES) * len(locales), len(PAGES), len(locales)))
print("robots.txt: sitemap -> %s/sitemap.xml" % site)
