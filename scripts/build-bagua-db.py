#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""构建文王卦（易经六十四卦）数据库 lib/bagua-data.json。

数据源（均已缓存到 %TEMP%/yijing/）：
  A. freizl/yijing zh-CN 64gua.json —— 结构基础（卦辞/彖/大象/爻辞/小象，含二进制卦码）
  B. open-iching iching.json —— 交叉校验（逐条比对，差异人工裁定，见 OVERRIDES）
  C. mark-leppa iching-wilhelm-dataset —— 拼音 + 英文名交叉参考
  D. 通行本《周易》文本知识 —— 争议条目的最终裁定

裁定记录（fz = freizl，oi = open-iching）：
  · 大有·2   fz 误抄同人卦（"同人于宗吝"）→ 取通行本「大车以载，有攸往，无咎」
  · 复·1     fz 语序误（"不复远"）→ 取「不远复，无祗悔，元吉」（oi 同）
  · 姤·5     fz 文本重复损坏 → 取「以杞包瓜，含章，有陨自天」
  · 姤·1     fz/oi 分别为踟躅/踯躅，通行本作「蹢躅」
  · 乾·2     oi 误「见龙再田」→ 通行本「见龙在田」（fz 已是）
  · 蒙·3     通行本「勿用取女」（fz 作娶女）
  · 坎卦、遯卦 oi 数据缺失 → 取 fz
  · 其余为繁简/异体字差异（訴訴→愬愬、號啕→號咷、佑→祐、碩→鼫 等）按通行本裁定

输出（紧凑数组）：[n, name, full, sym, bin, up, lo, gua, xiang, yao[[爻题,辞]...], en, py, ko]
  n: 卦序(1-64) · bin: 自下而上 1=阳 · up/lo: 上卦/下卦名 · ko: 韩文卦名
"""
import io
import json
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
TMP = "C:/Users/Administrator/AppData/Local/Temp/yijing"
SRC_FZ = os.path.join(TMP, "yijing-main/zh-CN/64gua.json")
SRC_OI = os.path.join(TMP, "open-iching-main/iching/iching.json")
OUT = os.path.join(HERE, "..", "lib", "bagua-data.json")

# ---------------------------------------------------------------------------
# 人工裁定覆盖（覆盖键：(卦名, 爻序 1-6|7=用九/用六)）
# ---------------------------------------------------------------------------
YAO_OVERRIDES = {
    ("蒙", 3): "勿用取女，见金夫，不有躬，无攸利。",
    ("比", 1): "有孚比之，无咎。有孚盈缶，终来有它，吉。",
    ("履", 4): "履虎尾，愬愬，终吉。",
    ("同人", 5): "同人先号咷而后笑，大师克相遇。",
    ("大有", 2): "大车以载，有攸往，无咎。",
    ("大有", 6): "自天祐之，吉无不利。",
    ("复", 1): "不远复，无祗悔，元吉。",
    ("无妄", 2): "不耕获，不菑畬，则利有攸往。",
    ("大畜", 5): "豮豕之牙，吉。",
    ("大过", 5): "枯杨生华，老妇得其士夫，无咎无誉。",
    ("晋", 4): "晋如鼫鼠，贞厉。",
    ("明夷", 4): "入于左腹，获明夷之心，于出门庭。",
    ("家人", 5): "王假有家，勿恤，吉。",
    ("损", 1): "已事遄往，无咎，酌损之。",
    ("损", 6): "弗损益之，无咎，贞吉，利有攸往，得臣无家。",
    ("姤", 1): "系于金柅，贞吉。有攸往，见凶，羸豕孚蹢躅。",
    ("姤", 5): "以杞包瓜，含章，有陨自天。",
    ("丰", 6): "丰其屋，蔀其家，窥其户，阒其无人，三岁不觌，凶。",
    ("中孚", 1): "虞吉，有它不燕。",
}
GUA_OVERRIDES = {
    "泰": "小往大来，吉亨。",
    "观": "盥而不荐，有孚颙若。",
    "咸": "亨，利贞，取女吉。",
    "巽": "小亨，利有攸往，利见大人。",
    "坎": "习坎，有孚，维心亨，行有尚。",
    "遯": "亨，小利贞。",
}

# 繁简归一（仅用于 freizl 混入的繁体字，逐字白名单，避免误伤 乾/兌/離 等卦名用字）
SIMP_MAP = {
    "來": "来", "顒": "颙", "彙": "汇", "馮": "冯", "遺": "遗", "復": "复",
    "艱": "艰", "鄰": "邻", "歸": "归", "師": "师", "貞": "贞", "訴": "诉",
    "萬": "万", "國": "国", "無": "无", "雲": "云", "龍": "龙", "鳳": "凤",
    "車": "车", "馬": "马", "門": "门", "開": "开", "關": "关", "見": "见",
    "東": "东", "擊": "击", "豐": "丰", "澤": "泽", "風": "风", "雷": "雷",
}

# 八卦名（自下而上三位二进制 → 卦名/自然象）
TRIGRAM = {
    "111": ("乾", "天"), "110": ("兑", "泽"), "101": ("离", "火"), "100": ("震", "雷"),
    "011": ("巽", "风"), "010": ("坎", "水"), "001": ("艮", "山"), "000": ("坤", "地"),
}

# 英文卦名（Wilhelm 标准译名，按卦序 1-64）
EN_NAMES = [
    "The Creative", "The Receptive", "Difficulty at the Beginning", "Youthful Folly",
    "Waiting", "Conflict", "The Army", "Holding Together", "The Taming Power of the Small",
    "Treading", "Peace", "Standstill", "Fellowship with Men", "Possession in Great Measure",
    "Modesty", "Enthusiasm", "Following", "Work on What Has Been Spoiled", "Approach",
    "Contemplation", "Biting Through", "Grace", "Splitting Apart", "Return", "Innocence",
    "The Taming Power of the Great", "The Corners of the Mouth", "Preponderance of the Great",
    "The Abysmal", "The Clinging", "Influence", "Duration", "Retreat", "The Power of the Great",
    "Progress", "Darkening of the Light", "The Family", "Opposition", "Obstruction",
    "Deliverance", "Decrease", "Increase", "Break-through", "Coming to Meet",
    "Gathering Together", "Pushing Upward", "Oppression", "The Well", "Revolution",
    "The Cauldron", "The Arousing", "Keeping Still", "Development", "The Marrying Maiden",
    "Abundance", "The Wanderer", "The Gentle", "The Joyous", "Dispersion", "Limitation",
    "Inner Truth", "Preponderance of the Small", "After Completion", "Before Completion",
]

# 韩文卦名（주역 64괘 표준명，按卦序）
KO_NAMES = [
    "건위천", "곤위지", "수뢰둔", "산수몽", "수천수", "천수송", "지수사", "수지비",
    "풍천소축", "천택리", "지천태", "천지비", "천화동인", "화천대유", "지산겸", "뇌지예",
    "택뢰수", "산풍고", "지택림", "풍지관", "화뢰서합", "산화비", "산지박", "지뢰복",
    "천뢰무망", "산천대축", "산뢰이", "택풍대과", "감위수", "리위화", "택산함", "뇌풍항",
    "천산둔", "뇌천대장", "화지진", "지화명이", "풍화가인", "화택규", "수산건", "뇌수해",
    "산택손", "풍뢰익", "택천쾌", "천풍구", "택지췌", "지풍승", "택수곤", "수풍정",
    "택화혁", "화풍정", "진위뢰", "간위산", "풍산점", "뇌택귀매", "뇌화풍", "화산려",
    "손위풍", "태위택", "풍수환", "수택절", "풍택중부", "뇌산소과", "수화기제", "화수미제",
]


def norm(s):
    """繁简白名单归一 + 去多余空白。"""
    s = s or ""
    for a, b in SIMP_MAP.items():
        s = s.replace(a, b)
    return s.strip()


def main():
    fz = json.load(io.open(SRC_FZ, encoding="utf-8"))
    oi = json.load(io.open(SRC_OI, encoding="utf-8"))
    oi_map = {x["name"]: x for x in oi}
    assert len(fz) == 64, "freizl 卦数异常: %d" % len(fz)

    out = []
    for idx, x in enumerate(fz):
        n = idx + 1
        name = x["name"]
        bin6 = x["id"]
        assert len(bin6) == 6 and set(bin6) <= {"0", "1"}, "二进制异常 %s: %s" % (name, bin6)

        lo_name, lo_nat = TRIGRAM[bin6[0:3]]         # 下卦 = 低三位
        up_name, up_nat = TRIGRAM[bin6[3:6]]         # 上卦 = 高三位
        oi_x = oi_map.get(name)
        if oi_x and oi_x.get("combination"):
            assert oi_x["combination"] == [lo_name, up_name], \
                "上下卦不一致 %s: fz=%s,%s oi=%s" % (name, lo_name, up_name, oi_x["combination"])

        full = name + "为" + lo_nat if lo_name == up_name else up_nat + lo_nat + name

        # 卦辞：去「卦名：」前缀
        gua = x.get("gua_ci", "")
        gua = gua.split("：", 1)[-1] if "：" in gua[:8] else gua
        gua = norm(gua)
        if name in GUA_OVERRIDES:
            gua = GUA_OVERRIDES[name]

        xiang = norm(x.get("da_xiang", ""))

        yao = []
        for i, y in enumerate(x.get("yao_ci", [])):
            parts = y.split("：", 1)
            if len(parts) == 2 and re.match(r"^(初|[六九][二三四五]|上|用)", parts[0]):
                title, text = parts[0], parts[1]
            else:
                title, text = "", y
            text = norm(text)
            key = (name, i + 1)
            if key in YAO_OVERRIDES:
                text = YAO_OVERRIDES[key]
            yao.append([title, text])
        assert len(yao) >= 6, "%s 爻数异常 %d" % (name, len(yao))

        out.append([
            n, name, full, x.get("symbol", ""), bin6, up_name, lo_name,
            gua, xiang, yao, EN_NAMES[idx], x.get("pinyin", ""), KO_NAMES[idx],
        ])

    # 完整性校验
    assert len(out) == 64
    assert sum(1 for h in out if len(h[9]) == 7) == 2, "用九/用六 应仅见于乾坤"

    path = os.path.abspath(OUT)
    with io.open(path, "w", encoding="utf-8") as f:
        json.dump({"v": 1, "hex": out}, f, ensure_ascii=False, separators=(",", ":"))
    print("written:", path, "%.1f KB" % (os.path.getsize(path) / 1024.0))

    # 抽检输出（含裁定条目 + 未交叉校验的坎/遯）
    by_name = {h[1]: h for h in out}
    for nm, i in [("大有", 2), ("复", 1), ("姤", 5), ("乾", 2), ("坎", 2), ("遯", 1), ("泰", 1)]:
        h = by_name[nm]
        print("抽检 %s·%d: %s" % (nm, i, h[9][i - 1][1]))
    print("抽检 坎卦辞:", by_name["坎"][7])
    print("抽检 遯爻辞:", " / ".join(t[1] for t in by_name["遯"][9]))
    print("抽检 全称:", by_name["乾"][2], by_name["屯"][2], by_name["未济"][2])


if __name__ == "__main__":
    main()
