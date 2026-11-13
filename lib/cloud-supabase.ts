"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * WorkBuddy Cloud SDK → Supabase 适配层。
 *
 * 为什么要适配而不是直接换：全站有 46 处调用写成了
 *   getCloud().database.from(...)   /  getCloud().database.rpc(...)
 *   getCloud().auth.xxx(...)
 * 这层适配让那些调用点**一行都不用改**，只要把云服务换成 Supabase。
 *
 * 映射关系：
 *   database.from / database.rpc  →  supabase.from / supabase.rpc（PostgREST，形态一致）
 *   auth.getSession               →  supabase.auth.getSession
 *   auth.signInWithPassword       →  supabase.auth.signInWithPassword
 *   auth.signOut                  →  supabase.auth.signOut
 *   auth.resetPasswordForEmail    →  supabase.auth.resetPasswordForEmail
 *   auth.sendOtp                  →  supabase.auth.signInWithOtp（返回值形状不同，见下）
 *   auth.verifyOtp                →  supabase.auth.verifyOtp({ type: "email" })
 *   auth.onAuthStateChange        →  包装成直接返回 unsubscribe 函数（原来那样用）
 *
 * ⚠️ 两处语义差异（不是 bug，是产品逻辑差异，需要在联调时确认）：
 *   1. 旧 SDK 的 sendOtp 会返回 verificationId 与 isExistingUser，页面据此决定
 *      「新用户要不要设密码」。Supabase 的 signInWithOtp 不返回这两个值，
 *      这里伪造为 { verificationId: null, isExistingUser: true } —— 即走"老用户直接登录"，
 *      新用户首次登录后可在账户页设置密码。若产品要求注册时必须设密码，
 *      需要改成 signUp + 邮件确认流程。
 *   2. 旧 SDK 的 verifyOtp 支持同时带 password（注册即设密码）。Supabase 的做法是
 *      验证通过后再调 updateUser({ password })，这里已实现。
 */

type AnySupabase = SupabaseClient<any, "public", any>;

export type CloudLike = {
  // 用 any 是有意的：调用点写的是 .database.from(...)，而旧 SDK 的类型是重载函数，
  // 两边的函数签名无法在联合类型里统一，标成 any 才能让 46 处调用点原样编译。
  database: any;
  /** 文件存储（头像等），映射到 Supabase Storage */
  storage: any;
  auth: {
    getSession: () => Promise<{ data: { session: any } }>;
    onAuthStateChange: (cb: (event: string, session: any) => void) => () => void;
    signInWithPassword: (args: { email: string; password: string }) => Promise<{ error: any }>;
    signOut: () => Promise<{ error: any }>;
    resetPasswordForEmail: (arg: string | { email: string }) => Promise<{ data: any; error: any }>;
    resetPasswordForOld: (args: { oldPassword: string; newPassword: string }) => Promise<{ error: any }>;
    sendOtp: (args: { email: string }) => Promise<{ data: { verificationId: string; isExistingUser: boolean }; error: any }>;
    verifyOtp: (args: { email: string; token: string; password?: string }) => Promise<{ error: any }>;
  };
};

export function createSupabaseCloud(url: string, anonKey: string): CloudLike {
  const sb = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return {
    // 调用点写的是 .database.from(...)，所以这里把整个 client 挂进去
    database: sb,
    storage: sb.storage,

    auth: {
      getSession: async () => {
        const { data } = await sb.auth.getSession();
        return { data: { session: data.session } };
      },

      onAuthStateChange: (cb) => {
        const { data } = sb.auth.onAuthStateChange((event, session) => cb(event, session));
        // 调用方期望拿到一个 unsubscribe 函数（旧 SDK 的行为）
        return () => data.subscription.unsubscribe();
      },

      signInWithPassword: async ({ email, password }) => {
        const { error } = await sb.auth.signInWithPassword({ email, password });
        return { error };
      },

      signOut: async () => {
        const { error } = await sb.auth.signOut();
        return { error };
      },

      // 调用点传的是裸字符串，返回里还读 .data，所以这里兼容两种入参
      resetPasswordForEmail: async (arg) => {
        const email = typeof arg === "string" ? arg : arg.email;
        const { data, error } = await sb.auth.resetPasswordForEmail(email, {
          redirectTo: typeof window !== "undefined" ? `${window.location.origin}/` : undefined,
        });
        return { data, error };
      },

      // 旧 SDK 专有：改密码时要求先验旧密码。
      // Supabase 没有这个接口，用「用旧密码重新登录一次 → 再 updateUser」达到同样效果。
      resetPasswordForOld: async ({ oldPassword, newPassword }) => {
        const { data: userData } = await sb.auth.getUser();
        const email = userData?.user?.email;
        if (!email) return { error: { message: "NOT_AUTHENTICATED" } };
        const { error: signErr } = await sb.auth.signInWithPassword({ email, password: oldPassword });
        if (signErr) return { error: signErr };
        const { error } = await sb.auth.updateUser({ password: newPassword });
        return { error };
      },

      sendOtp: async ({ email }) => {
        const { error } = await sb.auth.signInWithOtp({
          email,
          options: { shouldCreateUser: true },
        });
        return { data: { verificationId: "", isExistingUser: true }, error };
      },

      verifyOtp: async ({ email, token, password }) => {
        const { error } = await sb.auth.verifyOtp({ email, token, type: "email" });
        if (error) return { error };
        // 新用户首次登录带密码 → 验证通过后补设
        if (password) {
          const { error: pwdErr } = await sb.auth.updateUser({ password });
          if (pwdErr) return { error: pwdErr };
        }
        return { error: null };
      },
    },
  };
}
