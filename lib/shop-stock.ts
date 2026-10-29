/**
 * 商品库存（云端 product_stock 表）。
 *
 * 设计取舍：
 * - 库存由**站长在后台手动维护**（发货 -1、退款 +1、也可直接改数），
 *   不做客户端自动扣减——下单动作在浏览器里发生，让浏览器改库存等于给刷单留下空间。
 * - 表不存在 / 拉取失败时**一律视为有货**：宁可少挡一单，也不要因为网络抖动让整店不可买。
 * - `unlimited = true` 的商品（定制款）永远不显示售罄。
 */

import { getCloud } from "./cloud";

export type StockRow = { product: string; stock: number; unlimited: boolean };

export type StockMap = Record<string, { stock: number; unlimited: boolean }>;

export type StockInfo = {
  /** 是否真的从云端读到了这一款 */
  known: boolean;
  unlimited: boolean;
  stock: number;
  soldOut: boolean;
  /** 库存不多时的提示（<=3 且 >0），否则为空 */
  low: boolean;
};

export function toStockMap(rows: any[] | null | undefined): StockMap {
  const map: StockMap = {};
  (rows || []).forEach((r) => {
    if (!r || !r.product) return;
    map[String(r.product)] = {
      stock: Math.max(0, Number(r.stock) || 0),
      unlimited: !!r.unlimited,
    };
  });
  return map;
}

export async function fetchStock(): Promise<StockMap> {
  try {
    const { data, error } = await getCloud()
      .database.from("product_stock")
      .select("product, stock, unlimited");
    if (error) return {};
    return toStockMap(data as any[]);
  } catch {
    return {};
  }
}

export function stockInfo(map: StockMap, id: string): StockInfo {
  const row = map[id];
  if (!row) {
    // 没读到时按「有货」处理
    return { known: false, unlimited: true, stock: 0, soldOut: false, low: false };
  }
  const soldOut = !row.unlimited && row.stock <= 0;
  return {
    known: true,
    unlimited: row.unlimited,
    stock: row.stock,
    soldOut,
    low: !row.unlimited && row.stock > 0 && row.stock <= 3,
  };
}
