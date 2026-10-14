#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""JS 塔罗引擎（lib/tarot-engine.js）与 Python 原版（draw.py）全量对拍。

对拍内容：牌阵名 + 每张牌的 (牌名, 正逆位, 位置)。
要求：多 seed（含 64 位）× 全牌阵 × 全时段因子，零差异。
"""
import importlib.util
import json
import os
import random
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
PROJECT = os.path.abspath(os.path.join(HERE, "..", ".."))
DRAW_PATH = os.path.join(PROJECT, "skills", "tarot", "tarot-skill-main", "scripts", "draw.py")

spec = importlib.util.spec_from_file_location("tarot_draw", DRAW_PATH)
draw = importlib.util.module_from_spec(spec)
spec.loader.exec_module(draw)

NODE = os.environ.get(
    "NODE_BIN",
    r"C:\Users\Administrator\.workbuddy\binaries\node\versions\22.22.2-6\node.exe",
)

SEEDS = [0, 1, 42, 123, 255, 256, 65536, 16777215, 2147483647, 2147483648, 4294967295, 4294967296, 1234567890123456789, 9876543210987654321]
SPREADS = ["single", "three", "diamond", "moon", "horseshoe", "celtic"]
FACTORS = ["morning", "afternoon", "night"]

cases = []
for si, spread in enumerate(SPREADS):
    for i, seed in enumerate(SEEDS):
        cases.append({
            "seed": str(seed),
            "spread": spread,
            "time_factor": FACTORS[(i + si) % 3],
            "question": "测试问题" if i % 2 else "",
        })

random.seed(7)
for _ in range(60):
    seed = random.getrandbits(random.choice([8, 16, 32, 40, 53, 64]))
    cases.append({
        "seed": str(seed),
        "spread": random.choice(SPREADS),
        "time_factor": random.choice(FACTORS),
        "question": random.choice(["", "事业", "relationship"]),
    })


def fresh_draw_module():
    """draw.py 无状态，但保持独立加载以便未来扩展。"""
    s = importlib.util.spec_from_file_location("tarot_draw_fresh", DRAW_PATH)
    m = importlib.util.module_from_spec(s)
    s.loader.exec_module(m)
    return m


def main():
    mod = fresh_draw_module()
    py_out = []
    for c in cases:
        r = mod.draw_cards(c["spread"], c["question"], int(c["seed"]), c["time_factor"])
        py_out.append({
            "spread_name": r["spread_name"],
            "cards": [[x["card"], x["orientation"], x["position"]] for x in r["cards"]],
        })

    with open(os.path.join(HERE, "tarot_cases.json"), "w", encoding="utf-8") as f:
        json.dump(cases, f, ensure_ascii=False)

    proc = subprocess.run(
        [NODE, os.path.join(HERE, "tarot_run_js.js")],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        universal_newlines=True,
        cwd=HERE,
    )
    if proc.returncode != 0:
        print("NODE FAILED:", proc.returncode)
        print(proc.stdout[-2000:])
        print(proc.stderr[-2000:])
        return 1

    with open(os.path.join(HERE, "tarot_out_js.json"), encoding="utf-8") as f:
        js_out = json.load(f)

    assert len(js_out) == len(py_out), "case count mismatch"

    mismatches = [i for i, (a, b) in enumerate(zip(py_out, js_out)) if a != b]
    total = len(py_out)
    if not mismatches:
        print("TAROT PARITY OK: %d/%d cases identical" % (total, total))
        return 0

    print("MISMATCH: %d / %d" % (len(mismatches), total))
    for i in mismatches[:3]:
        print("=" * 60)
        print("case:", cases[i])
        print("PY:", json.dumps(py_out[i], ensure_ascii=False))
        print("JS:", json.dumps(js_out[i], ensure_ascii=False))
    return 2


if __name__ == "__main__":
    sys.exit(main())
