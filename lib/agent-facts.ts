"use client";

import { getCloud } from "./cloud";

/**
 * 小痕的「办事」素材。
 *
 * 设计取舍：本站服务端（server.js）没有数据库连接，所有用户数据都在浏览器侧
 * 用登录会话读。所以不让模型自己去查库，而是每次发消息前，由浏览器把
 * 「这个用户已经有什么」整理成一段事实文本喂给模型。
 * 好处：身份天然正确（RLS 兜底）、不需要给服务端开数据库权限、不新建表。
 *
 * 边界：只带摘要，不带报告全文——一份命书几千字，全塞进上下文又慢又贵。
 */

export type AgentFacts = {
  displayName: string | null;
  /** 余额（numeric 在 PostgREST 里是字符串） */
  balance: string | null;
  /** 最近的测算记录（含付费命书），只取摘要 */
  readings: { created_at: string; birth_date: string; gender: string; focus: string | null }[];
  /** 最近的订单 */
  orders: {
    created_at: string;
    product: string | null;
    status: string;
    amount: string | null;
    tracking: string | null;
    carrier: string | null;
  }[];
};

const PRODUCT_LABEL: Record<string, string> = {
  bazi: "八字测算",
  tarot: "塔罗占卜",
  bagua: "文王卦",
  ziwei: "紫微斗数",
};

function productLabel(p: string | null): string {
  if (!p) return "商品";
  if (PRODUCT_LABEL[p]) return PRODUCT_LABEL[p];
  if (p.indexOf("shop:") === 0) return "符纸 · " + p.slice(5);
  return p;
}

/** 读这个用户的余额 / 历史命书 / 最近订单。任何一步失败都不阻塞对话。 */
export async function loadAgentFacts(user: { id: string } | null): Promise<AgentFacts | null> {
  if (!user) return null;
  const db = getCloud().database;
  const empty: AgentFacts = { displayName: null, balance: null, readings: [], orders: [] };

  try {
    const [profileRes, walletRes, readingRes, orderRes] = await Promise.all([
      db.from("profiles").select("display_name").eq("owner_id", user.id).maybeSingle(),
      db.from("wallet_accounts").select("balance").eq("owner_id", user.id).maybeSingle(),
      db
        .from("readings")
        .select("created_at, birth_date, gender, focus")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false })
        .limit(3),
      db
        .from("payment_orders")
        .select("created_at, product, status, amount, tracking_number, carrier")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false })
        .limit(3),
    ]);

    return {
      displayName: (profileRes.data as any)?.display_name ?? null,
      balance: (walletRes.data as any)?.balance ?? null,
      readings: (readingRes.data as any[]) ?? [],
      orders: ((orderRes.data as any[]) ?? []).map((o) => ({
        created_at: o.created_at,
        product: o.product,
        status: o.status,
        amount: o.amount,
        tracking: o.tracking_number ?? null,
        carrier: o.carrier ?? null,
      })),
    };
  } catch {
    // 读不到就当没有——绝不能因为查库失败让聊天崩掉
    return empty;
  }
}

/** 把事实整理成给模型看的文本。没有事实时返回空串（不注入这一段）。 */
export function factsToPrompt(f: AgentFacts | null): string {
  if (!f) return "";
  const lines: string[] = [];

  lines.push("【这位访客的真实资料（来自网站数据库，可信）】");

  if (f.displayName) lines.push("· 昵称：" + f.displayName);

  if (f.balance !== null && f.balance !== undefined) {
    lines.push("· 钱包余额：$" + f.balance);
  }

  if (f.orders.length) {
    lines.push("· 最近订单：");
    for (const o of f.orders) {
      const day = String(o.created_at).slice(0, 10);
      let s = "  - " + day + " · " + productLabel(o.product) + " · 状态 " + o.status;
      if (o.amount) s += " · $" + o.amount;
      if (o.tracking) s += " · 运单号 " + o.carrier + " " + o.tracking;
      lines.push(s);
    }
  } else {
    lines.push("· 最近订单：无");
  }

  if (f.readings.length) {
    lines.push("· 历史测算记录：");
    for (const r of f.readings) {
      const day = String(r.created_at).slice(0, 10);
      const focus = r.focus && r.focus !== "general" ? "（关注：" + r.focus + "）" : "";
      lines.push("  - " + day + " · " + r.birth_date + " · " + (r.gender === "male" ? "男" : "女") + focus);
    }
  } else {
    lines.push("· 历史测算记录：无");
  }

  lines.push("");
  lines.push(
    "规则：以上是这个访客在站内的真实数据，回答「我的订单 / 我的余额 / 我之前算过什么」时只能依据它。" +
      "清单里没有的信息（例如更早的订单、具体报告内容），直接说「我这边只看到最近的这些，更详细的要到对应页面看」，" +
      "严禁编造订单号、金额、运单号或日期。"
  );

  return lines.join("\n");
}
