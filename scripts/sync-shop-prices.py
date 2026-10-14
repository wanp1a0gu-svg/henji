#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""从 lib/shop-data.ts 提取商品价格表 → lib/shop-prices.json（服务端校验用）。

用途：server.js 下单时按此表校验商品与价格（防客户端篡改）。
改商品/改价后重跑：python scripts/sync-shop-prices.py
"""
import io
import json
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, ".."))

src = io.open(os.path.join(ROOT, "lib", "shop-data.ts"), encoding="utf-8").read()

# 按商品对象切块（每个商品以 "  {" 开头）
blocks = re.split(r"\n  \{", src)[1:]
out = {}
for b in blocks:
    m_id = re.search(r'id:\s*"([^"]+)"', b)
    m_price = re.search(r"price:\s*(\d+(?:\.\d+)?)", b)
    m_name = re.search(r'\n    name:\s*"([^"]+)"', b)
    if m_id and m_price:
        out[m_id.group(1)] = {
            "price": float(m_price.group(1)),
            "nameEn": m_name.group(1) if m_name else m_id.group(1),
        }

assert len(out) == 6, "应为 6 个商品，实际 %d" % len(out)

path = os.path.join(ROOT, "lib", "shop-prices.json")
io.open(path, "w", encoding="utf-8").write(json.dumps(out, ensure_ascii=False, indent=2) + "\n")
print("written:", path)
for k, v in out.items():
    print("  %-20s $%s  %s" % (k, v["price"], v["nameEn"]))
