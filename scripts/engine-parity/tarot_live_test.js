/**
 * 塔罗 API 冒烟测试（异步任务模式）：POST 拿 jobId+牌面 → 轮询 → 打印解读。
 * 用法：node tarot_live_test.js [url] ["问题"]
 */
"use strict";

const BASE = process.argv[2] || "https://mingli-club.app.workbuddy.host/api/tarot";
const QUESTION = process.argv[3] || "这段关系的发展方向";

(async () => {
  const t0 = Date.now();
  const post = await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ spread: "three", question: QUESTION, locale: "zh" }),
  });
  console.log("POST", post.status, "in", Date.now() - t0, "ms");
  const j = await post.json();

  if (j.reading) {
    // Worker 同步模式
    console.log("(sync mode) draw:", j.draw.cards.map((c) => `${c.position}:${c.card}(${c.orientation})`).join(" | "));
    console.log("---reading head---");
    console.log(String(j.reading).slice(0, 400));
    return;
  }
  if (!j.jobId) {
    console.log("no jobId:", JSON.stringify(j));
    process.exit(1);
  }
  console.log("jobId:", j.jobId);
  console.log("draw:", j.draw.cards.map((c) => `${c.position}:${c.card}(${c.orientation})`).join(" | "));
  console.log("seed:", j.draw.seed.slice(0, 16), "factor:", j.draw.timeFactor, "spread:", j.draw.spreadName);

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
      console.log("---reading head---");
      console.log(String(s.reading).slice(0, 450));
      console.log("---reading tail---");
      console.log(String(s.reading).slice(-200));
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
