#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""JS 排盘引擎（lib/bazi-engine.js）与 Python 原版（pai_pan.py）全量对拍。

对拍内容：formatReport 全文（含四柱/十神/藏干/大运/流年/神煞/警告）。
要求：280+ 用例（固定边界 + 随机）零差异。
"""
import json
import os
import random
import subprocess
import sys
from datetime import date, datetime, timezone, timedelta

HERE = os.path.dirname(os.path.abspath(__file__))
PROJECT = os.path.abspath(os.path.join(HERE, "..", ".."))
SKILL_SCRIPTS = os.path.join(PROJECT, "skills", "bazi", "bazi-skill-main", "scripts")
sys.path.insert(0, SKILL_SCRIPTS)
import pai_pan  # noqa: E402

NODE = os.environ.get(
    "NODE_BIN",
    r"C:\Users\Administrator\.workbuddy\binaries\node\versions\22.22.2-6\node.exe",
)

NOW = datetime(2026, 10, 10, 12, 0, 0, tzinfo=pai_pan.BJ)
NOW_MS = int(NOW.timestamp() * 1000)

# 固定边界用例：(y, m, d, hour, minute, sex)
FIXED = [
    (1990, 2, 3, 10, 0, "男"),    # 立春前 → 年柱己巳
    (1990, 2, 4, 10, 0, "男"),    # 立春当日
    (1990, 2, 4, 11, 0, "女"),    # 立春后一小时间
    (1990, 5, 15, 14, 30, "男"),  # 金标准：庚午/辛巳/庚辰/壬午
    (1990, 5, 15, 14, 30, "女"),  # 阳年女逆排
    (1990, 5, 15, 23, 10, "男"),  # 夜子时
    (1990, 5, 15, 23, 59, "男"),
    (1990, 5, 15, 0, 0, "男"),    # 早子时
    (1990, 5, 15, 0, 30, "男"),
    (1990, 5, 15, 0, 59, "男"),   # 子丑边界
    (1990, 5, 15, 1, 0, "男"),
    (1990, 5, 15, 2, 59, "女"),
    (1990, 5, 15, 3, 0, "女"),
    (1990, 5, 15, 12, 0, "男"),
    (1990, 5, 15, 22, 59, "男"),
    (1990, 5, 15, 23, 0, "男"),   # 日界精确点
    (1991, 6, 15, 12, 0, "男"),   # 阴年男逆排
    (1984, 2, 4, 23, 59, "男"),
    (2000, 1, 1, 0, 0, "女"),
    (2000, 2, 29, 12, 0, "女"),   # 闰日
    (1900, 1, 1, 8, 0, "男"),     # 范围下限附近
    (1900, 12, 31, 23, 30, "男"),
    (2099, 12, 31, 20, 0, "女"),  # 范围上限附近
    (2024, 2, 4, 16, 30, "女"),   # 2024 立春前后
    (2025, 8, 7, 12, 0, "男"),    # 立秋
    (2026, 10, 10, 12, 0, "女"),
    # 时辰未知（无明显时辰输入）
    (1990, 5, 15, None, None, "男"),
    (1998, 7, 7, None, None, "女"),
    (1965, 3, 3, None, None, "男"),
]

random.seed(42)
RANDOM_N = 260
for _ in range(RANDOM_N):
    y = random.randint(1900, 2099)
    m = random.randint(1, 12)
    d = random.randint(1, 28)
    h = random.randint(0, 23)
    mi = random.choice([0, 1, 15, 29, 30, 44, 45, 59])
    sex = random.choice(["男", "女"])
    FIXED.append((y, m, d, h, mi, sex))


def main():
    cases = []
    py_out = []
    for (y, m, d, h, mi, sex) in FIXED:
        cases.append({"y": y, "m": m, "d": d, "hour": h, "minute": mi, "sex": sex, "nowMs": NOW_MS})
        try:
            r = pai_pan.compute(
                solar_date=date(y, m, d),
                hour=h,
                minute=mi if h is not None else None,
                sex=sex,
                now=NOW,
            )
            py_out.append(pai_pan.format_report(r))
        except Exception as exc:  # noqa: BLE001
            py_out.append("ERROR: %s" % exc)

    cases_path = os.path.join(HERE, "cases.json")
    with open(cases_path, "w", encoding="utf-8") as f:
        json.dump(cases, f, ensure_ascii=False)

    # 运行 JS 侧
    js_script = os.path.join(HERE, "run_js.js")
    proc = subprocess.run(
        [NODE, js_script],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        universal_newlines=True,
        cwd=HERE,
    )
    if proc.returncode != 0:
        print("NODE FAILED:", proc.returncode)
        print(proc.stdout[-3000:])
        print(proc.stderr[-3000:])
        return 1

    with open(os.path.join(HERE, "out_js.json"), encoding="utf-8") as f:
        js_out = json.load(f)

    assert len(js_out) == len(py_out), "case count mismatch: js=%d py=%d" % (len(js_out), len(py_out))

    mismatches = []
    for i, (a, b) in enumerate(zip(py_out, js_out)):
        if a != b:
            mismatches.append(i)

    total = len(py_out)
    if not mismatches:
        print("PARITY OK: %d/%d cases identical" % (total, total))
        return 0

    print("MISMATCH: %d / %d cases differ" % (len(mismatches), total))
    for i in mismatches[:3]:
        c = cases[i]
        print("=" * 70)
        print("case #%d: %s" % (i, c))
        py_lines = py_out[i].splitlines()
        js_lines = js_out[i].splitlines()
        for j in range(max(len(py_lines), len(js_lines))):
            pl = py_lines[j] if j < len(py_lines) else "<missing>"
            jl = js_lines[j] if j < len(js_lines) else "<missing>"
            if pl != jl:
                print("  line %d:" % j)
                print("    PY: %s" % pl)
                print("    JS: %s" % jl)
        print("")
    return 2


if __name__ == "__main__":
    sys.exit(main())
