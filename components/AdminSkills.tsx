"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Plus, Trash2, Pencil, Upload, BookOpen, CheckCircle2, ToggleLeft, ToggleRight } from "lucide-react";
import { getCloud } from "@/lib/cloud";

interface Skill {
  id: number;
  name: string;
  content: string;
  enabled: boolean;
  sort: number;
  updated_at: string;
}

/** 管理后台 · 知识库面板：上传/编辑知识包，对话时自动注入助手提示词。 */
export function AdminSkills() {
  const [list, setList] = useState<Skill[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  // 编辑器
  const [editId, setEditId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const { data, error } = await getCloud()
        .database.from("skills")
        .select("id,name,content,enabled,sort,updated_at")
        .order("sort", { ascending: true })
        .limit(100);
      if (error) throw new Error(error.message);
      setList((data as Skill[]) || []);
    } catch (e: any) {
      setErr((e && e.message) || "加载失败");
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const resetEditor = () => {
    setEditId(null);
    setName("");
    setContent("");
  };

  const save = async () => {
    setMsg("");
    setErr("");
    if (!name.trim() || !content.trim()) {
      setErr("名称和内容都不能为空");
      return;
    }
    setBusy(true);
    try {
      if (editId === null) {
        const { error } = await getCloud()
          .database.from("skills")
          .insert({ name: name.trim(), content, enabled: true, sort: (list ? list.length : 0) + 1 });
        if (error) throw new Error(error.message);
        setMsg("已添加，对话即生效");
      } else {
        const { error } = await getCloud()
          .database.from("skills")
          .update({ name: name.trim(), content, updated_at: new Date().toISOString() })
          .eq("id", editId);
        if (error) throw new Error(error.message);
        setMsg("已更新，对话即生效");
      }
      resetEditor();
      await load();
    } catch (e: any) {
      setErr((e && e.message) || "保存失败");
    } finally {
      setBusy(false);
      setTimeout(() => setMsg(""), 3000);
    }
  };

  const toggle = async (s: Skill) => {
    try {
      const { error } = await getCloud()
        .database.from("skills")
        .update({ enabled: !s.enabled, updated_at: new Date().toISOString() })
        .eq("id", s.id);
      if (error) throw new Error(error.message);
      setList((prev) => (prev || []).map((x) => (x.id === s.id ? { ...x, enabled: !s.enabled } : x)));
    } catch (e: any) {
      setErr((e && e.message) || "操作失败");
    }
  };

  const remove = async (s: Skill) => {
    if (!window.confirm("删除《" + s.name + "》？此操作不可恢复。")) return;
    try {
      const { error } = await getCloud().database.from("skills").delete().eq("id", s.id);
      if (error) throw new Error(error.message);
      setList((prev) => (prev || []).filter((x) => x.id !== s.id));
    } catch (e: any) {
      setErr((e && e.message) || "删除失败");
    }
  };

  const onFile = (f: File | null) => {
    if (!f) return;
    if (f.size > 512 * 1024) {
      setErr("文件太大（限 512KB 内的 .md/.txt）");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      setContent((prev) => (prev ? prev + "\n\n" + text : text));
      if (!name.trim()) setName(f.name.replace(/\.(md|txt|markdown)$/i, "").slice(0, 60));
      setMsg("已读取文件内容，可继续编辑后保存");
      setTimeout(() => setMsg(""), 3000);
    };
    reader.readAsText(f);
  };

  const fmt = (t: string) => {
    try {
      return new Date(t).toLocaleString("zh-CN", { hour12: false, timeZone: "Asia/Shanghai" });
    } catch {
      return t;
    }
  };

  return (
    <div className="space-y-4">
      {/* 编辑器 */}
      <div className="glass rounded-2xl p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="flex items-center gap-1.5 text-xs text-muted/70">
            <BookOpen size={13} /> {editId === null ? "新增知识包" : "编辑知识包 #" + editId}
          </p>
          <div className="flex items-center gap-3">
            {msg && (
              <span className="inline-flex items-center gap-1 text-[11px] text-green-300">
                <CheckCircle2 size={12} /> {msg}
              </span>
            )}
            {err && <span className="text-[11px] text-red-300">{err}</span>}
          </div>
        </div>

        <div className="space-y-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 60))}
            placeholder="知识包名称（如：盲派断法要诀 / 客户常见问题话术）"
            className="w-full max-w-md rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted/50 focus:border-accent/50"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, 8000))}
            rows={8}
            placeholder="把知识内容粘贴到这里（支持 Markdown）。对话助手会把这份知识作为专业参考。"
            className="w-full resize-y rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 font-mono text-xs leading-relaxed text-foreground outline-none placeholder:text-muted/50 focus:border-accent/50"
          />
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={save}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-background transition hover:bg-accent-light disabled:opacity-60"
            >
              {busy ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              {editId === null ? "添加" : "保存修改"}
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-muted transition hover:border-accent/30 hover:text-foreground"
            >
              <Upload size={14} /> 上传 .md/.txt 文件
            </button>
            {editId !== null && (
              <button onClick={resetEditor} className="text-xs text-muted underline underline-offset-2 hover:text-foreground">
                取消编辑
              </button>
            )}
            <span className="ml-auto text-[10px] text-muted/50">当前 {content.length} 字符（上限 8000）</span>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".md,.txt,.markdown,text/plain,text/markdown"
            className="hidden"
            onChange={(e) => {
              onFile(e.target.files && e.target.files[0] ? e.target.files[0] : null);
              e.target.value = "";
            }}
          />
        </div>
      </div>

      {/* 列表 */}
      <div className="glass rounded-2xl p-5">
        <p className="mb-4 text-xs text-muted/70">
          已上传知识（{list ? list.length : "…"}）· 对话助手会按下列顺序参考，开关控制是否生效
        </p>
        {list === null && (
          <div className="flex justify-center py-6">
            <Loader2 size={16} className="animate-spin text-accent/60" />
          </div>
        )}
        {list !== null && list.length === 0 && (
          <p className="py-6 text-center text-[11px] text-muted/50">还没有知识包——上面的编辑框写好内容，点「添加」即可</p>
        )}
        {list !== null &&
          list.map((s) => (
            <div key={s.id} className="mb-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggle(s)}
                    title={s.enabled ? "点击停用" : "点击启用"}
                    className={s.enabled ? "text-accent" : "text-muted/50"}
                  >
                    {s.enabled ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                  </button>
                  <span className="text-sm text-foreground/90">{s.name}</span>
                  <span className="text-[10px] text-muted/50">{s.content.length} 字符 · {fmt(s.updated_at)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setEditId(s.id);
                      setName(s.name);
                      setContent(s.content);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="inline-flex items-center gap-1 text-[11px] text-muted transition hover:text-accent"
                  >
                    <Pencil size={11} /> 编辑
                  </button>
                  <button
                    onClick={() => remove(s)}
                    className="inline-flex items-center gap-1 text-[11px] text-muted transition hover:text-red-300"
                  >
                    <Trash2 size={11} /> 删除
                  </button>
                </div>
              </div>
              <p className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-muted/60">{s.content.slice(0, 160)}</p>
            </div>
          ))}
      </div>
    </div>
  );
}
