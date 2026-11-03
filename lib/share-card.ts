"use client";

/**
 * 结果分享卡：把测算结果画成一张 1080×1350 的竖图。
 *
 * 为什么用 canvas 而不是截图：
 * 1. 只放摘要，不把整份命书（几千字）塞进图里，隐私可控
 * 2. 尺寸统一，微信/小红书都能直接发
 * 3. 不依赖 html2canvas 这类重库
 */

export type ShareCardData = {
  /** 顶部小标题：八字命盘 / 塔罗牌阵 / 文王卦 / 紫微斗数 */
  title: string;
  /** 中间大字：核心结果（四柱、牌名、卦名…） */
  headline: string;
  /** 结果明细，最多 6 行 */
  rows: { label: string; value: string }[];
  /** 底部一句摘要或提醒 */
  note?: string;
  /** 语言标注，印在角落 */
  locale?: string;
};

const W = 1080;
const H = 1350;

const SERIF = '"Songti SC","STSong","SimSun","Noto Serif SC",serif';
const SANS = '"PingFang SC","Microsoft YaHei","Helvetica Neue",Arial,sans-serif';

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** 按宽度自动折行（中文按字符、西文按空格）。 */
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const out: string[] = [];
  let line = "";
  for (const ch of text) {
    const test = line + ch;
    if (ctx.measureText(test).width > maxWidth && line) {
      out.push(line);
      line = ch;
    } else {
      line = test;
    }
  }
  if (line) out.push(line);
  return out;
}

export async function renderShareCard(data: ShareCardData): Promise<Blob | null> {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // 底色
    ctx.fillStyle = "#0d0b09";
    ctx.fillRect(0, 0, W, H);

    // 顶部/底部金色光晕
    const glowTop = ctx.createRadialGradient(W / 2, 120, 0, W / 2, 120, 700);
    glowTop.addColorStop(0, "rgba(201,168,124,0.16)");
    glowTop.addColorStop(1, "rgba(201,168,124,0)");
    ctx.fillStyle = glowTop;
    ctx.fillRect(0, 0, W, 700);

    const glowBottom = ctx.createRadialGradient(W / 2, H, 0, W / 2, H, 620);
    glowBottom.addColorStop(0, "rgba(201,168,124,0.10)");
    glowBottom.addColorStop(1, "rgba(201,168,124,0)");
    ctx.fillStyle = glowBottom;
    ctx.fillRect(0, H - 620, W, 620);

    // 内框
    ctx.strokeStyle = "rgba(201,168,124,0.35)";
    ctx.lineWidth = 2;
    roundRect(ctx, 44, 44, W - 88, H - 88, 26);
    ctx.stroke();

    // 品牌
    ctx.textAlign = "center";
    ctx.fillStyle = "#c9a87c";
    ctx.font = `300 76px ${SERIF}`;
    ctx.fillText("痕迹", W / 2, 196);
    ctx.font = `300 22px ${SANS}`;
    ctx.fillStyle = "rgba(201,168,124,0.55)";
    ctx.fillText("T R A C E S", W / 2, 238);

    // 分隔线
    ctx.strokeStyle = "rgba(201,168,124,0.25)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(W / 2 - 90, 278);
    ctx.lineTo(W / 2 + 90, 278);
    ctx.stroke();

    // 标题
    ctx.fillStyle = "rgba(232,228,220,0.62)";
    ctx.font = `300 30px ${SANS}`;
    ctx.fillText(data.title, W / 2, 350);

    // 核心结果（大字，最多两行）
    // 「过去 / 现在 / 未来」这类用斜杠分隔的内容，在窄行里会断得很难看，
    // 统一换成中点，并在标题过长时缩字号。
    const headline = String(data.headline || "").replace(/\s*\/\s*/g, " · ");
    ctx.fillStyle = "#f2ede3";

    // 自适应字号：从 72 往下试，优先让整句排进一行；
    // 实在放不下（超过 24 字）才退化成两行，避免出现「未/来」这种孤字。
    const avail = W - 200;
    let headSize = 72;
    for (const size of [72, 64, 58, 52, 46, 40]) {
      ctx.font = `400 ${size}px ${SERIF}`;
      headSize = size;
      if (ctx.measureText(headline).width <= avail) break;
    }
    ctx.font = `400 ${headSize}px ${SERIF}`;
    const headLines = wrapText(ctx, headline, avail).slice(0, 2);
    let y = 470;
    for (const line of headLines) {
      ctx.fillText(line, W / 2, y);
      y += headSize + 18;
    }

    // 明细
    y = Math.max(y + 40, 640);
    const rows = data.rows.slice(0, 6);
    const rowH = Math.min(92, Math.floor(460 / Math.max(rows.length, 1)));
    for (const row of rows) {
      ctx.textAlign = "left";
      ctx.fillStyle = "rgba(232,228,220,0.45)";
      ctx.font = `300 26px ${SANS}`;
      ctx.fillText(row.label, 150, y);

      ctx.textAlign = "right";
      ctx.fillStyle = "rgba(242,237,227,0.92)";
      ctx.font = `400 30px ${SANS}`;
      const val = wrapText(ctx, row.value, 520)[0] || "";
      ctx.fillText(val, W - 150, y);

      ctx.strokeStyle = "rgba(201,168,124,0.12)";
      ctx.beginPath();
      ctx.moveTo(150, y + 26);
      ctx.lineTo(W - 150, y + 26);
      ctx.stroke();

      y += rowH;
      ctx.textAlign = "center";
    }

    // 摘要
    if (data.note) {
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(232,228,220,0.55)";
      ctx.font = `300 24px ${SANS}`;
      const noteLines = wrapText(ctx, data.note, W - 260).slice(0, 2);
      let ny = Math.min(y + 60, H - 200);
      for (const line of noteLines) {
        ctx.fillText(line, W / 2, ny);
        ny += 38;
      }
    }

    // 底部域名
    ctx.fillStyle = "#c9a87c";
    ctx.font = `400 26px ${SANS}`;
    ctx.fillText("mingli-club.app.workbuddy.host", W / 2, H - 108);
    ctx.fillStyle = "rgba(232,228,220,0.32)";
    ctx.font = `300 20px ${SANS}`;
    ctx.fillText("传统文化与占卜体系 · 仅供娱乐参考", W / 2, H - 70);

    return await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), "image/png", 0.95);
    });
  } catch {
    return null;
  }
}

/** 文件名：使用 ASCII，避免部分安卓机分享失败。 */
export function shareFileName(kind: string): string {
  const stamp = new Date().toISOString().slice(0, 10);
  return `traces-${kind}-${stamp}.png`;
}
