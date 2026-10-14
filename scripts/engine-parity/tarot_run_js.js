/** JS 侧塔罗对拍运行器（由 tarot_parity.py 调用） */
"use strict";

const fs = require("fs");
const path = require("path");
const Engine = require("../../lib/tarot-engine.js");

const here = __dirname;
const cases = JSON.parse(fs.readFileSync(path.join(here, "tarot_cases.json"), "utf8"));

const out = cases.map((c) => {
  try {
    const r = Engine.drawCards({
      spread: c.spread,
      question: c.question,
      seed: c.seed,
      timeFactor: c.time_factor,
    });
    return {
      spread_name: r.spreadName,
      cards: r.cards.map((x) => [x.card, x.orientation, x.position]),
    };
  } catch (e) {
    return { error: String((e && e.message) || e) };
  }
});

fs.writeFileSync(path.join(here, "tarot_out_js.json"), JSON.stringify(out), "utf8");
console.log("tarot js done:", out.length);
