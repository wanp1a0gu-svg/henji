"use strict";
const fs = require("fs");
const r = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
if (r.error) {
  console.log("API ERROR:", r.error);
  process.exit(1);
}
console.log("pillars:", JSON.stringify(r.chart.pillars));
console.log("lunar:", r.chart.lunarText, "| shichen:", r.chart.shichenText, "| qiyun:", r.chart.qiyunText, "| forward:", r.chart.forward);
console.log("dayun[0..2]:", r.chart.dayun.slice(0, 3).map((d) => d.ages + "=" + d.gz).join(", "));
console.log("elements:", JSON.stringify(r.chart.elements));
console.log("engine:", JSON.stringify(r.engine));
console.log("---report head---");
console.log(r.report.slice(0, 500));
console.log("---report tail---");
console.log(r.report.slice(-260));
