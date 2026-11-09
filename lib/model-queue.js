"use strict";

/**
 * 模型调用的并发闸门 + FIFO 队列。
 *
 * 为什么需要：智谱 GLM-4.7-Flash 免费档**只允许 1 个并发**。
 * 两个人同时点「生成」，第二个会直接拿到 429。与其报错，不如排队：
 * 谁先提交谁先算，后面的人等前面的人跑完。
 *
 * 设计取舍：
 * - 排队有上限，且等太久就放弃 —— 不让用户对着屏幕干等三分钟
 * - 只限制「模型调用」这一段，排盘引擎（本地计算）不排队，照旧即时返回
 * - 纯内存队列，进程重启即丢；本站是单实例，够用。将来多实例要换成外部队列
 */

/**
 * @param {{concurrency?: number, maxQueue?: number, waitMs?: number}} opts
 */
function createModelQueue(opts) {
  const concurrency = Math.max(1, Number((opts && opts.concurrency) || 1));
  const maxQueue = Math.max(1, Number((opts && opts.maxQueue) || 30));
  const waitMs = Math.max(5000, Number((opts && opts.waitMs) || 60000));

  let active = 0;
  /** @type {{resolve: Function, reject: Function, timer: any, startedAt: number}[]} */
  const waiting = [];

  function stats() {
    return { concurrency, active, waiting: waiting.length };
  }

  function retryLater() {
    const err = new Error("QUEUE_FULL");
    err.code = "QUEUE_FULL";
    return err;
  }

  function timedOut() {
    const err = new Error("QUEUE_TIMEOUT");
    err.code = "QUEUE_TIMEOUT";
    return err;
  }

  function pump() {
    while (active < concurrency && waiting.length) {
      const next = waiting.shift();
      clearTimeout(next.timer);
      active++;
      next.resolve({ release: release });
    }
  }

  let release;

  function acquire() {
    if (active < concurrency) {
      active++;
      return Promise.resolve({ release });
    }
    if (waiting.length >= maxQueue) {
      return Promise.reject(retryLater());
    }
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        const i = waiting.findIndex((w) => w.timer === timer);
        if (i >= 0) waiting.splice(i, 1);
        reject(timedOut());
      }, waitMs);
      waiting.push({ resolve, reject, timer, startedAt: Date.now() });
    });
  }

  release = function release() {
    active = Math.max(0, active - 1);
    pump();
  };

  /** 在闸门内执行；无论成功失败都会释放名额。 */
  async function run(fn) {
    const slot = await acquire();
    try {
      return await fn();
    } finally {
      slot.release();
    }
  }

  return { run, stats };
}

module.exports = { createModelQueue };
