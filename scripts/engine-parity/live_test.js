/**
 * 线上 API 冒烟测试（异步任务模式）：POST 拿 jobId → 轮询 → 打印结果。
 * 用法：node live_test.js [url]
 */
"use strict";

const BASE = process.argv[2] || "https://mingli-club.app.workbuddy.host/api/bazi";
const PAYLOAD = {
  name: "测试",
  birthDate: "1995-08-15",
  birthTime: "14:30",
  gender: "female",
  focus: "career",
  locale: "zh",
};

function printResult(s) {
  console.log("pillars:", JSON.stringify(s.chart.pillars));
  console.log(
    "lunar:",
    s.chart.lunarText,
    "| shichen:",
    s.chart.shichenText,
    "| qiyun:",
    s.chart.qiyunText,
    "| forward:",
    s.chart.forward
  );
  console.log("engine:", JSON.stringify(s.engine));
  console.log("--- report head ---");
  console.log(String(s.report || "").slice(0, 300));
}

(async () => {
  const t0 = Date.now();
  const post = await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(PAYLOAD),
  });
  console.log("POST", post.status, "in", Date.now() - t0, "ms");
  const j = await post.json();

  if (j.report) {
    console.log("(sync mode)");
    printResult(j);
    return;
  }
  if (!j.jobId) {
    console.log("no jobId:", JSON.stringify(j));
    process.exit(1);
  }
  console.log("jobId:", j.jobId);

  const deadline = Date.now() + 180000;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 3000));
    const res = await fetch(BASE + "?id=" + encodeURIComponent(j.jobId));
    if (!res.ok) {
      console.log("poll http", res.status);
      continue;
    }
    const s = await res.json();
    if (s.status === "pending") continue;
    if (s.status === "done") {
      console.log("DONE in", ((Date.now() - t0) / 1000).toFixed(1), "s");
      printResult(s);
      return;
    }
    if (s.status === "error") {
      console.log("JOB ERROR:", s.error);
      process.exit(1);
    }
  }
  console.log("TIMEOUT");
  process.exit(1);
})().catch((e) => {
  console.error("FAILED:", e && e.message);
  process.exit(1);
});
