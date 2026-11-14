"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { getCloud } from "@/lib/cloud";
import { Locale } from "@/lib/i18n";
import { AuthModal } from "./AuthModal";

export interface AuthUser {
  id?: string;
  email?: string | null;
  phone?: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  openAuth: () => void;
  closeAuth: () => void;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  locale: Locale;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export function AuthProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authOpen, setAuthOpen] = useState(false);

  const refreshUser = useCallback(async () => {
    try {
      const cloud = getCloud();
      const { data } = await cloud.auth.getSession();
      // 两种云实现的返回结构不同：
      //   Supabase 包装层 → { data: { session } }
      //   WorkBuddy 云     → { data: session }
      const session = (data && (data as any).session) ?? data ?? null;
      setUser((session?.user as AuthUser) ?? null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();

    let unsubscribe: (() => void) | undefined;
    try {
      unsubscribe = getCloud().auth.onAuthStateChange((_event: string, session: any) => {
        setUser((session?.user as AuthUser) ?? null);
      });
    } catch {
      // auth state subscription unavailable — getSession still covers it
    }
    return () => {
      try {
        unsubscribe?.();
      } catch {
        /* noop */
      }
    };
  }, [refreshUser]);

  const signOut = useCallback(async () => {
    try {
      await getCloud().auth.signOut();
    } catch {
      /* noop */
    }
    setUser(null);
  }, []);

  const openAuth = useCallback(() => setAuthOpen(true), []);
  const closeAuth = useCallback(() => setAuthOpen(false), []);

  return (
    <AuthContext.Provider
      value={{ user, loading, openAuth, closeAuth, signOut, refreshUser, locale }}
    >
      {children}
      {authOpen && (
        <AuthModal
          locale={locale}
          onClose={closeAuth}
          onSuccess={async () => {
            await refreshUser();
            setAuthOpen(false);
          }}
        />
      )}
    </AuthContext.Provider>
  );
}
