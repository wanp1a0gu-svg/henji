"use client";

/**
 * 后台「库存」标签。
 *
 * 规则：
 * - 库存只在后台改（发货 -1、退款 +1 由父组件处理），前台只读。
 * - `unlimited` 用于定制款这类「接单再做」的商品，永远不售罄。
 * - 表里没有的商品（新增商品但没建库存行）会以 0 件显示，保存时自动补一行。
 */

import { useEffect, useState } from "react";
import { Check, Loader2, PackagePlus, RefreshCw } from "lucide-react";
import { getCloud } from "@/lib/cloud";
import { SHOP_PRODUCTS } from "@/lib/shop-data";

type Draft = { stock: number; unlimited: boolean };

export function AdminStock() {
  const [rows, setRows] = useState<Record<string, Draft> | null>(null);
  const [draft, setDraft] = useState<Record<string, Draft>>({});
  const [saving, setSaving] = useState("");
  const [msg, setMsg] = useState("");

  const load = async () => {
    setMsg("");
    try {
      const { data, error } = await getCloud()
        .database.from("product_stock")
        .select("product, stock, unlimited");
      if (error) throw new Error(error.message || "读取失败");
      const map: Record<string, Draft> = {};
      (data || []).forEach((r: any) => {
        map[r.product] = { stock: Number(r.stock) || 0, unlimited: !!r.unlimited };
      });
      setRows(map);
      setDraft(map);
    } catch (e: any) {
      setMsg((e && e.message) || "读取库存失败");
      setRows({});
      setDraft({});
    }
  };

  useEffect(() => {
    load();
  }, []);

  const val = (id: string): Draft => draft[id] || { stock: 0, unlimited: false };
  const dirty = (id: string) => {
    const a = val(id);
    const b = (rows || {})[id] || { stock: 0, unlimited: false };
    return a.stock !== b.stock || a.unlimited !== b.unlimited;
  };

  const setVal = (id: string, patch: Partial<Draft>) =>
    setDraft((d) => ({ ...d, [id]: { ...val(id), ...patch } }));

  const save = async (id: string) => {
    setSaving(id);
    setMsg("");
    try {
      const v = val(id);
      const payload = {
        product: id,
        stock: Math.max(0, Math.floor(v.stock)),
        unlimited: v.unlimited,
        updated_at: new Date().toISOString(),
      };
      const { error } = await getCloud().database.from("product_stock").upsert(payload, { onConflict: "product" });
      if (error) throw new Error(error.message || "保存失败");
      setRows((r) => ({ ...(r || {}), [id]: { stock: payload.stock, unlimited: payload.unlimited } }));
      setMsg("已保存：" + id);
    } catch (e: any) {
      setMsg("保存失败：" + ((e && e.message) || ""));
    } finally {
      setSaving("");
    }
  };

  const restockAll = async (delta: number) => {
    if (!window.confirm(`把所有可售商品的库存 ${delta > 0 ? "+" : ""}${delta}？（定制款不受影响）`)) return;
    setMsg("批量处理中…");
    try {
      const list = SHOP_PRODUCTS.filter((p) => p.id !== "custom");
      for (const p of list) {
        const cur = (rows || {})[p.id] || { stock: 0, unlimited: false };
        if (cur.unlimited) continue;
        await getCloud()
          .database.from("product_stock")
          .upsert(
            { product: p.id, stock: Math.max(0, cur.stock + delta), unlimited: false, updated_at: new Date().toISOString() },
            { onConflict: "product" }
          );
      }
      await load();
      setMsg("批量调整完成");
    } catch (e: any) {
      setMsg("批量失败：" + ((e && e.message) || ""));
    }
  };

  if (!rows) {
    return (
      <div className="glass flex items-center justify-center rounded-2xl py-16">
        <Loader2 size={18} className="animate-spin text-accent/70" />
      </div>
    );
  }

  const soldOutCount = SHOP_PRODUCTS.filter((p) => {
    const v = (rows || {})[p.id];
    return v && !v.unlimited && v.stock <= 0;
  }).length;

  return (
    <div className="space-y-4">
      <div className="glass flex flex-wrap items-center gap-3 rounded-2xl px-5 py-4 text-xs">
        <span className="text-muted">
          共 {SHOP_PRODUCTS.length} 款 · <span className={soldOutCount ? "text-amber-300" : "text-green-300"}>
            售罄 {soldOutCount} 款
          </span>
          <span className="ms-2 text-muted/50">发货自动 -1，退款自动 +1；定制款设为「不限量」</span>
        </span>
        <span className="ms-auto flex items-center gap-2">
          <button
            onClick={() => restockAll(10)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-accent/25 bg-accent/10 px-3 py-1.5 text-accent transition hover:bg-accent/20"
          >
            <PackagePlus size={13} /> 全部 +10
          </button>
          <button
            onClick={load}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1.5 text-muted transition hover:border-accent/30"
          >
            <RefreshCw size={13} /> 刷新
          </button>
        </span>
      </div>

      {msg && <p className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-[11px] text-muted">{msg}</p>}

      <div className="glass overflow-hidden rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-start text-xs">
            <thead>
              <tr className="border-b border-white/[0.08] text-[10px] uppercase tracking-wider text-muted/60">
                <th className="px-4 py-3">商品</th>
                <th className="px-4 py-3">状态</th>
                <th className="px-4 py-3">库存</th>
                <th className="px-4 py-3">不限量</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {SHOP_PRODUCTS.map((p) => {
                const v = val(p.id);
                const st = v.unlimited ? "不限量" : v.stock <= 0 ? "售罄" : v.stock <= 3 ? "紧张" : "在售";
                const badge =
                  st === "售罄"
                    ? "border-white/12 bg-white/[0.04] text-muted/60"
                    : st === "紧张"
                      ? "border-amber-400/30 bg-amber-400/10 text-amber-200"
                      : st === "不限量"
                        ? "border-sky-400/25 bg-sky-400/10 text-sky-200"
                        : "border-green-500/25 bg-green-500/10 text-green-300";
                return (
                  <tr key={p.id} className="border-b border-white/[0.04]">
                    <td className="px-4 py-3">
                      <span className="block text-foreground/90">{p.nameZh}</span>
                      <span className="block text-[10px] text-muted/50">{p.name}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full border px-2.5 py-1 text-[10px] ${badge}`}>{st}</span>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min={0}
                        value={v.stock}
                        onChange={(e) => setVal(p.id, { stock: Math.max(0, Number(e.target.value) || 0) })}
                        disabled={v.unlimited}
                        className="w-20 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-xs text-foreground focus:border-accent/40 focus:outline-none disabled:opacity-40"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={v.unlimited}
                        onChange={(e) => setVal(p.id, { unlimited: e.target.checked })}
                        className="h-4 w-4 accent-[var(--accent)]"
                      />
                    </td>
                    <td className="px-4 py-3">
                      {dirty(p.id) && (
                        <button
                          onClick={() => save(p.id)}
                          disabled={saving === p.id}
                          className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1 text-[10px] text-accent transition hover:bg-accent/20 disabled:opacity-50"
                        >
                          {saving === p.id ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
                          保存
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
