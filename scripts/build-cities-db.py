#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""构建城市经度数据库 lib/cities-data.json（真太阳时校正用）。

数据源：
  A. laiwz/city region.sql（中国省/市/区三级 + 坐标，百度 BD09，误差 <500m 可忽略）
  B. laiwz/city 澳港台.sql（港澳台省级）
  C. GeoNames cities15000（全球城市，CC-BY 4.0）
     - 用途 1：中国城市的拼音别名（就近匹配）
     - 用途 2：世界城市列表 + 非拉丁文别名

输出格式（紧凑数组，减小体积）：
  { "v": 1, "cn": [[name, lng, level, parent, aliases], ...],
    "world": [[name, lng, countryCode, "", aliases], ...] }
  level: 1=省 2=地级市 3=区县
"""
import io
import json
import math
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
SRC_REGION = "C:/Users/Administrator/AppData/Local/Temp/citydata/city-master/region.sql"
SRC_HKMT = "C:/Users/Administrator/AppData/Local/Temp/citydata/city-master/\u6fb3\u6e2f\u53f0.sql"
SRC_GEONAMES = "C:/Users/Administrator/AppData/Local/Temp/gn/cities15000.txt"
SRC_TRAD = "C:/Users/Administrator/AppData/Local/Temp/TSCharacters.txt"
OUT = os.path.join(HERE, "..", "lib", "cities-data.json")
OUT_TRAD = os.path.join(HERE, "..", "lib", "trad2simp.json")


def load_trad2simp(path):
    """OpenCC TSCharacters：繁体字 -> 简体字（取第一个变体；恒等映射剔除）。"""
    m = {}
    with io.open(path, encoding="utf-8") as f:
        for line in f:
            line = line.rstrip("\n")
            if not line or line.startswith("#"):
                continue
            parts = line.split("\t")
            if len(parts) != 2:
                continue
            trad = parts[0].strip()
            simp = parts[1].split(" ")[0].strip()
            if trad and simp and trad != simp:
                m[trad] = simp
    return m


TRAD2SIMP = {}


def to_simp(s):
    return "".join(TRAD2SIMP.get(ch, ch) for ch in s)


def parse_region_sql(path):
    """解析 region.sql → (prov, city, dist)，值为 (name, lng, lat, parent)。"""
    text = io.open(path, encoding="utf-8").read()
    rows = re.findall(r"\('(\d+)','([^']*)','([^']*)','([\d.]+)','([\d.]+)'", text)
    prov, city, dist = {}, {}, {}
    for rid, name, parent, lng, lat in rows:
        try:
            lngf, latf = float(lng), float(lat)
        except ValueError:
            continue
        if len(rid) == 2:
            prov[rid] = (name, lngf, latf, "")
        elif len(rid) == 4:
            city[rid] = (name, lngf, latf, parent)
        elif len(rid) == 6:
            dist[rid] = (name, lngf, latf, parent)
    return prov, city, dist


def load_geonames(path):
    out = []
    with io.open(path, encoding="utf-8") as f:
        for line in f:
            p = line.rstrip("\n").split("\t")
            if len(p) < 19:
                continue
            try:
                lat, lng = float(p[4]), float(p[5])
                pop = int(p[14] or 0)
            except ValueError:
                continue
            out.append({
                "name": p[1], "ascii": p[2], "alts": p[3],
                "lng": lng, "lat": lat, "fclass": p[6], "fcode": p[7],
                "cc": p[8], "pop": pop, "tz": p[17] if len(p) > 17 else "",
            })
    return out


ALIAS_RX = [
    (re.compile(r"[\u4e00-\u9fff]"), 0),   # CJK（中/日）
    (re.compile(r"[\u3040-\u30ff]"), 1),   # 日文假名
    (re.compile(r"[\uac00-\ud7af]"), 2),   # 韩文
    (re.compile(r"[\u0400-\u04ff]"), 3),   # 西里尔
    (re.compile(r"[\u0600-\u06ff]"), 4),   # 阿拉伯
]

# 各国优先脚本（让本地人能用自己的文字查到）：脚本编号见 ALIAS_RX
CC_SCRIPT = {}
for cc in ("RU", "UA", "BY", "BG", "RS", "MK", "ME", "KZ", "KG", "TJ", "MN"):
    CC_SCRIPT[cc] = 3  # 西里尔
for cc in ("KR", "KP"):
    CC_SCRIPT[cc] = 2  # 韩文
for cc in ("JP",):
    CC_SCRIPT[cc] = 0  # 日文（汉字优先，假名次之）
for cc in ("AE", "SA", "EG", "DZ", "IQ", "JO", "KW", "LB", "LY", "MA", "OM",
           "QA", "SD", "SY", "TN", "YE", "BH", "PS", "MR"):
    CC_SCRIPT[cc] = 4  # 阿拉伯


def script_of(s):
    for rx, pri in ALIAS_RX:
        if rx.search(s):
            return pri
    return -1


_BASIC_CYR = re.compile(r"^[\u0410-\u044f\u0401\u0451\s\-]+$")


def alias_sort_key(sc, name):
    """同一脚本内的排序：选出「最标准、最常用」的写法。"""
    if sc in (0, 1, 2):  # CJK / 假名 / 韩文：短名更常用（東京 优于 東京都）
        return lambda x: (len(x), x)
    if sc == 3:          # 西里尔：排除少数民族扩展字母（Москва 优于 Мәскәү）
        return lambda x: (0 if _BASIC_CYR.match(x) else 1, abs(len(x) - len(name)), len(x))
    if sc == 4:          # 阿拉伯：优先带定冠词的标准形（القاهرة）
        return lambda x: (0 if x.startswith("\u0627\u0644") else 1, abs(len(x) - len(name)), len(x))
    return lambda x: (len(x), x)


def extract_aliases(alts, name, cc, maxn=6):
    """提取非拉丁别名（仅作匹配键，宽松收录）：
    按【本国脚本 > CJK > 假名 > 韩文 > 西里尔 > 阿拉伯】配平；
    本国脚本与 CJK 最多 3 个，其余脚本最多 2 个；CJK 追加简体形式。"""
    buckets = {}
    for a in alts.split(","):
        a = a.strip()
        if not a or len(a) > 20 or len(a) < 2:
            continue
        sc = script_of(a)
        if sc < 0:
            continue
        buckets.setdefault(sc, set()).add(a)

    order = []
    local = CC_SCRIPT.get(cc)
    if local is not None:
        order.append(local)
    for sc in (0, 1, 2, 3, 4):
        if sc not in order:
            order.append(sc)

    out = []
    for sc in order:
        if sc not in buckets or len(out) >= maxn:
            continue
        limit = 3 if (sc == local or (local is None and sc == 0) or sc == 0) else 2
        pick = sorted(buckets[sc], key=alias_sort_key(sc, name))[:limit]
        for a in pick:
            if a not in out:
                out.append(a)
            if sc == 0:
                s = to_simp(a)
                if s != a and s not in out:
                    out.append(s)

    # 保证至少有一个 CJK 别名（方便中文用户检索）
    if not any(script_of(a) == 0 for a in out) and 0 in buckets:
        for a in sorted(buckets[0], key=alias_sort_key(0, name)):
            if a not in out:
                out.append(a)
                s = to_simp(a)
                if s != a and s not in out:
                    out.append(s)
            break

    return out[:maxn]


def main():
    global TRAD2SIMP
    TRAD2SIMP = load_trad2simp(SRC_TRAD)
    print("trad2simp:", len(TRAD2SIMP), "entries")

    prov, city, dist = parse_region_sql(SRC_REGION)
    print("provinces:", len(prov), "cities:", len(city), "districts:", len(dist))

    # 港澳台省级
    hkmt_text = io.open(SRC_HKMT, encoding="utf-8").read()
    for rid, name, lng in re.findall(r"\('(\d+)', '([^']*)', '', '([\d.]+)'", hkmt_text):
        prov[rid] = (name, float(lng), 0.0, "")
    print("provinces(with hkmt):", len(prov))

    entries = []
    # 省级
    for pid, (name, lng, lat, _) in prov.items():
        entries.append([name, round(lng, 4), 1, "", []])
    # 地级市
    city_parent = {}   # city id -> 城市名（直辖市的“市辖区”映射到直辖市名）
    for cid, (name, lng, lat, pid) in city.items():
        pname = prov.get(pid, ("", 0, 0, ""))[0]
        if name == "市辖区":
            city_parent[cid] = pname
            continue
        city_parent[cid] = name
        entries.append([name, round(lng, 4), 2, pname, []])
    # 区县
    n_dist = 0
    for did, (name, lng, lat, cid) in dist.items():
        if name in ("市辖区", "县", "省直辖县级行政区划", "自治区直辖县级行政区划"):
            continue
        entries.append([name, round(lng, 4), 3, city_parent.get(cid, ""), []])
        n_dist += 1
    print("district entries:", n_dist, "total cn:", len(entries))

    # GeoNames
    gn = load_geonames(SRC_GEONAMES)
    gn_cn = [c for c in gn if c["cc"] == "CN"]
    print("geonames CN:", len(gn_cn))

    # 中国城市加拼音别名：与 GeoNames CN 城市就近匹配
    # 规则：直辖市(level1, 仅四个) + 地级市(level2)；在 0.35° 内取【人口最高】的
    # GeoNames 城市（否则会把通州/门头沟等卫星城误配给北京主城）。
    MUNICIPAL = {"北京市", "天津市", "上海市", "重庆市"}
    targets = []
    for i, e in enumerate(entries):
        if e[2] == 2 or (e[2] == 1 and e[0] in MUNICIPAL):
            lat = None
            for src in (prov, city):
                for k, v in src.items():
                    if v[0] == e[0]:
                        lat = v[2]
                        break
                if lat is not None:
                    break
            targets.append((i, e[1], lat if lat is not None else 35.0))

    alias_count = 0
    for ti, tlng, tlat in targets:
        best, best_pop = None, -1
        for c in gn_cn:
            if c["fclass"] != "P":
                continue
            d = math.hypot(tlng - c["lng"], (tlat - c["lat"]) * 1.3)
            if d <= 0.35 and c["pop"] > best_pop:
                best, best_pop = c, c["pop"]
        if best is None:
            continue
        e = entries[ti]
        for nm in (best["ascii"], best["name"]):
            nm = nm.strip()
            if (nm and nm != e[0] and nm not in e[4]
                    and not re.search(r"[\u4e00-\u9fff]", nm) and len(nm) <= 24):
                e[4].append(nm)
                alias_count += 1
        e[4] = e[4][:2]
    print("pinyin aliases added:", alias_count)

    # 世界城市：pop>=100000 或首都（PPLC），排除 CN（已有高质量中文数据）
    # 字段：[name, lng, cc, "", aliases, pop, tz]（tz 供本地产时换算，含夏令时）
    world = []
    for c in gn:
        if c["cc"] == "CN":
            continue
        if not (c["pop"] >= 100000 or c["fcode"] == "PPLC"):
            continue
        alts = []
        if c["pop"] >= 300000 or c["fcode"] == "PPLC":
            alts = extract_aliases(c["alts"], c["name"], c["cc"])
        world.append([c["name"], round(c["lng"], 4), c["cc"], "", alts, c["pop"], c.get("tz", "")])
    print("world cities:", len(world))

    data = {"v": 1, "cn": entries, "world": world}
    out_path = os.path.abspath(OUT)
    with io.open(out_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, separators=(",", ":"))
    print("written:", out_path, "%.1f KB" % (os.path.getsize(out_path) / 1024.0))

    # 繁简映射表（供服务端查询时转换用户输入）
    trad_path = os.path.abspath(OUT_TRAD)
    with io.open(trad_path, "w", encoding="utf-8") as f:
        json.dump(TRAD2SIMP, f, ensure_ascii=False, separators=(",", ":"))
    print("written:", trad_path, "%.1f KB" % (os.path.getsize(trad_path) / 1024.0))


if __name__ == "__main__":
    main()
