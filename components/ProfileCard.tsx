"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Camera, CheckCircle2, User } from "lucide-react";
import { Locale } from "@/lib/i18n";
import { getAuthMessages } from "@/lib/auth-i18n";
import { getCloud } from "@/lib/cloud";
import { useAuth } from "./AuthProvider";

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

/**
 * 个人信息卡片：头像上传（云存储 users/<uid>/avatars/）+ 显示昵称。
 * 数据存 profiles 表（owner 读写）；头像展示用签名 URL（1 小时有效，每次进页面刷新）。
 */
export function ProfileCard({ locale }: { locale: Locale }) {
  const { user } = useAuth();
  const a = getAuthMessages(locale);
  const [name, setName] = useState("");
  const [avatarPath, setAvatarPath] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [state, setState] = useState<"loading" | "idle" | "saving" | "saved" | "error">("loading");
  const [err, setErr] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const loadedFor = useRef("");

  // 读取已有资料 + 头像签名 URL
  useEffect(() => {
    if (!user || loadedFor.current === (user.id || "me")) return;
    loadedFor.current = user.id || "me";
    (async () => {
      try {
        const { data } = await getCloud()
          .database.from("profiles")
          .select("display_name,avatar_path")
          .limit(1);
        const row: any = Array.isArray(data) ? data[0] : null;
        if (row) {
          setName(row.display_name || "");
          setAvatarPath(row.avatar_path || "");
          if (row.avatar_path) {
            try {
              const { data: su } = await getCloud().storage.createSignedUrl(row.avatar_path, 3600);
              if (su && su.signedUrl) setAvatarUrl(su.signedUrl);
            } catch {
              /* 头像 URL 失败不影响其他 */
            }
          }
        }
      } catch {
        /* 首次无资料 */
      }
      setState("idle");
    })();
  }, [user]);

  const persist = async (patch: { display_name?: string; avatar_path?: string }) => {
    setState("saving");
    setErr("");
    try {
      const { error } = await getCloud()
        .database.from("profiles")
        .upsert({ ...patch, updated_at: new Date().toISOString() });
      if (error) throw new Error(error.message || a.saveFailed);
      setState("saved");
      setTimeout(() => setState((s) => (s === "saved" ? "idle" : s)), 2500);
    } catch (e: any) {
      setErr((e && e.message) || a.saveFailed);
      setState("error");
    }
  };

  const onPickFile = async (f: File | null) => {
    if (!f || !user) return;
    if (!/^image\//.test(f.type) || f.size > MAX_AVATAR_BYTES) {
      setErr(a.avatarHint);
      setState("error");
      return;
    }
    setState("saving");
    setErr("");
    try {
      const ext = (f.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 4) || "jpg";
      const path = getCloud().storage.userPath(user.id || "", "avatars/" + Date.now() + "." + ext);
      const { error: upErr } = await getCloud().storage.upload(path, f, {
        contentType: f.type,
        upsert: true,
      });
      if (upErr) throw new Error(upErr.message || a.saveFailed);
      // 删除旧头像（尽力而为）
      if (avatarPath && avatarPath !== path) {
        try {
          await getCloud().storage.remove([avatarPath]);
        } catch {
          /* 忽略 */
        }
      }
      try {
        const { data: su } = await getCloud().storage.createSignedUrl(path, 3600);
        if (su && su.signedUrl) setAvatarUrl(su.signedUrl);
      } catch {
        /* 忽略 */
      }
      setAvatarPath(path);
      await persist({ avatar_path: path });
    } catch (e: any) {
      setErr((e && e.message) || a.saveFailed);
      setState("error");
    }
  };

  if (!user) return null;

  const initial = (name || user.email || user.phone || "?").trim().charAt(0).toUpperCase();

  return (
    <div className="glass rounded-2xl p-6 sm:p-8">
      <h2 className="mb-6 font-serif text-xl text-foreground">{a.profileTitle}</h2>

      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        {/* 头像 */}
        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="group relative h-24 w-24 overflow-hidden rounded-full border border-accent/25 bg-accent/[0.06] transition hover:border-accent/50"
            title={a.uploadAvatar}
          >
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt={a.avatar} className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center font-serif text-3xl text-accent/70">
                {initial}
              </span>
            )}
            <span className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition group-hover:opacity-100">
              <Camera size={20} className="text-white" />
            </span>
          </button>
          <span className="text-[10px] text-muted/60">{a.avatarHint}</span>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              onPickFile(e.target.files && e.target.files[0] ? e.target.files[0] : null);
              e.target.value = "";
            }}
          />
        </div>

        {/* 昵称 */}
        <div className="flex-1 space-y-3">
          <div>
            <label className="mb-2 block text-sm text-muted">
              <User size={12} className="me-1 inline" />
              {a.displayName}
            </label>
            <input
              type="text"
              value={name}
              maxLength={40}
              onChange={(e) => setName(e.target.value)}
              placeholder={a.displayNamePlaceholder}
              className="w-full max-w-sm rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted/50 focus:border-accent/50 focus:bg-white/[0.05]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={state === "saving" || state === "loading"}
              onClick={() => persist({ display_name: name.trim() })}
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-background transition hover:bg-accent-light disabled:opacity-60"
            >
              {state === "saving" ? <Loader2 size={14} className="animate-spin" /> : null}
              {a.save}
            </button>
            {state === "saved" && (
              <span className="inline-flex items-center gap-1.5 text-xs text-green-300">
                <CheckCircle2 size={13} /> {a.saved}
              </span>
            )}
            {state === "error" && err && <span className="text-xs text-red-300">{err}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
