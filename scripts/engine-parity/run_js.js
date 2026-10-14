/**
 * JS 侧对拍运行器：读取 cases.json，用 lib/bazi-engine.js 计算并输出 out_js.json。
 * 由 parity_check.py 调用（node run_js.js）。
 */
"use strict";

const fs = require("fs");
const path = require("path");
const Engine = require("../../lib/bazi-engine.js");

const here = __dirname;
const cases = JSON.parse(fs.readFileSync(path.join(here, "cases.json"), "utf8"));

const out = cases.map((c) => {
  try {
    const result = Engine.compute({
      y: c.y,
      m: c.m,
      d: c.d,
      hour: c.hour,
      minute: c.minute,
      sex: c.sex,
      nowMs: c.nowMs,
    });
    return Engine.formatReport(result);
  } catch (e) {
    return "ERROR: " + (e && e.message ? e.message : e);
  }
});

fs.writeFileSync(path.join(here, "out_js.json"), JSON.stringify(out), "utf8");
console.log("js done:", out.length);
