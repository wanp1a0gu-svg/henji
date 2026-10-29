"use client";

import { useEffect, useState } from "react";
import type { UiMessages } from "@/lib/ui-i18n";

export interface ShipInfo {
  name: string;
  phone: string;
  country: string;
  province: string;
  city: string;
  address: string;
  zip: string;
}

export const EMPTY_SHIP: ShipInfo = {
  name: "",
  phone: "",
  country: "",
  province: "",
  city: "",
  address: "",
  zip: "",
};

export function shipReady(s: ShipInfo) {
  return !!(s.name.trim() && s.phone.trim() && s.country.trim() && s.address.trim());
}

const KEY = "traces_ship_info";

/** 实体商品下单前的收货信息表单。内容会存本地，回头客不用重填。 */
export function ShippingForm({
  ui,
  value,
  onChange,
}: {
  ui: UiMessages;
  value: ShipInfo;
  onChange: (v: ShipInfo) => void;
}) {
  const [loaded, setLoaded] = useState(false);

  // 首次挂载读本地缓存
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<ShipInfo>;
        const merged = { ...EMPTY_SHIP, ...saved };
        if (!value.name && !value.address) onChange(merged);
      }
    } catch {
      /* 忽略 */
    }
    setLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 变更后写回本地
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(value));
    } catch {
      /* 忽略 */
    }
  }, [value, loaded]);

  const field = (
    label: string,
    k: keyof ShipInfo,
    opts?: { type?: string; span?: boolean; required?: boolean }
  ) => (
    <label className={opts?.span ? "sm:col-span-2" : ""}>
      <span className="mb-1 block text-[10px] uppercase tracking-wider text-muted/60">
        {label}
        {opts?.required ? <span className="ms-0.5 text-amber-300/70">*</span> : null}
      </span>
      <input
        type={opts?.type || "text"}
        value={value[k]}
        onChange={(e) => onChange({ ...value, [k]: e.target.value })}
        className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-foreground placeholder:text-muted/40 focus:border-accent/40 focus:outline-none"
      />
    </label>
  );

  return (
    <div className="mb-3 rounded-xl border border-accent/20 bg-accent/[0.04] p-3">
      <p className="mb-2 text-[11px] font-medium text-accent">{ui.shipTitle}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {field(ui.shipName, "name", { required: true })}
        {field(ui.shipPhone, "phone", { type: "tel", required: true })}
        {field(ui.shipCountry, "country", { required: true })}
        {field(ui.shipProvince, "province")}
        {field(ui.shipCity, "city")}
        {field(ui.shipZip, "zip")}
        {field(ui.shipAddress, "address", { span: true, required: true })}
      </div>
      {!shipReady(value) && (
        <p className="mt-2 text-[10px] leading-relaxed text-amber-200/80">{ui.shipHint}</p>
      )}
    </div>
  );
}
