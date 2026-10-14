"use strict";
const E = require("../../lib/bazi-engine.js");
const m = /^\d{4}-\d{2}-\d{2}$/.exec("1990-05-15");
console.log("regex match:", JSON.stringify(m));
const r = E.run({ birthDate: "1990-05-15", birthTime: "14:30", gender: "male" });
console.log(JSON.stringify(r.chart.pillars));
console.log("dayun:", r.chart.dayun.slice(0, 3).map((d) => d.ages + ":" + d.gz).join(" | "));
console.log("lunar:", r.chart.lunarText, "| qiyun:", r.chart.qiyunText, "| forward:", r.chart.forward);
