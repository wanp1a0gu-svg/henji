/**
 * 客户端发信助手。
 *
 * 所有调用都必须「静默失败」——邮件没发出去不能挡住下单/发货/交付。
 * 服务端未配置发信通道时返回 202，这里直接忽略。
 */

async function post(url: string, payload: any) {
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    /* 邮件是尽力而为 */
  }
}

/** 订单已付款 / 已发货 */
export async function notifyOrder(
  type: "paid" | "shipped" | "refunded",
  to: string | null | undefined,
  locale: string,
  order: {
    id?: number | string;
    product?: string;
    productName?: string;
    amount?: string;
    currency?: string;
    method?: string;
    shipTo?: string;
    tracking?: string;
    carrier?: string;
  }
) {
  if (!to || to.indexOf("@") === -1) return;
  await post("/api/mail/order", { to, locale, type, order });
}

/** 八字报告就绪 */
export async function notifyReport(to: string | null | undefined, locale: string, name: string) {
  if (!to || to.indexOf("@") === -1) return;
  await post("/api/mail/report", { to, locale, name });
}

/** 收件信息拼成一行，给邮件正文用 */
export function shipToText(s: any): string {
  if (!s) return "";
  if (s.name || s.phone) {
    return [s.name, s.phone, [s.country, s.province, s.city].filter(Boolean).join(" "), s.address, s.zip]
      .filter(Boolean)
      .join(" ");
  }
  return [s.address_line_1, s.address_line_2, s.admin_area_2, s.admin_area_1, s.postal_code, s.country_code]
    .filter(Boolean)
    .join(", ");
}
