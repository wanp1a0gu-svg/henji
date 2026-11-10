/**
 * 八字测算的「断点续取」存储。
 *
 * 背景：一份命书要生成 90–130 秒，而付款凭据是一次性的。用户中途刷新/关页时，
 * jobId 一旦丢掉，服务端报告还在跑、钱也已经付了，人却再也取不回来。
 * 所以提交成功就把 jobId + 表单快照写进 localStorage，进解读页 / 重新打开页面时接回来。
 *
 * 30 分钟与服务端 `_jobs` 的 TTL 对齐。
 */
export const PENDING_KEY = "traces_bazi_pending_v1";
export const PENDING_TTL_MS = 30 * 60 * 1000;

export type PendingJob = {
  jobId: string;
  createdAt: number;
  form: Record<string, string>;
};

export function readPendingJob(): PendingJob | null {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as PendingJob;
    if (!p || !p.jobId || !p.form) return null;
    if (Date.now() - Number(p.createdAt || 0) > PENDING_TTL_MS) {
      localStorage.removeItem(PENDING_KEY);
      return null;
    }
    return p;
  } catch {
    return null;
  }
}

export function writePendingJob(jobId: string, form: Record<string, string>) {
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify({ jobId, createdAt: Date.now(), form }));
  } catch {
    /* 隐私模式等场景禁写 localStorage：不影响本次流程 */
  }
}

export function clearPendingJob() {
  try {
    localStorage.removeItem(PENDING_KEY);
  } catch {
    /* 忽略 */
  }
}

/**
 * 同一份报告只入账一次。
 * 解读页刷新后 job 仍在（30 分钟内），没有这个标记就会重复写一条测算记录。
 */
const SAVED_PREFIX = "traces_bazi_saved_v1:";

export function hasSavedReading(jobId: string): boolean {
  try {
    return localStorage.getItem(SAVED_PREFIX + jobId) === "1";
  } catch {
    return false;
  }
}

export function markReadingSaved(jobId: string) {
  try {
    localStorage.setItem(SAVED_PREFIX + jobId, "1");
  } catch {
    /* 忽略 */
  }
}
