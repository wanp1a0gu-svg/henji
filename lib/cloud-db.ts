/**
 * Cloud database schema types (supabase-style) for strong typing.
 * Mirrors the `readings` table created in the WorkBuddy Cloud Service.
 */
export type Database = {
  public: {
    Tables: {
      readings: {
        Row: {
          id: number;
          owner_id: string;
          name: string | null;
          birth_date: string;
          birth_time: string | null;
          gender: string;
          focus: string | null;
          locale: string | null;
          report: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          owner_id?: string;
          name?: string | null;
          birth_date: string;
          birth_time?: string | null;
          gender: string;
          focus?: string | null;
          locale?: string | null;
          report: string;
          created_at?: string;
        };
        Update: {
          name?: string | null;
          birth_date?: string;
          birth_time?: string | null;
          gender?: string;
          focus?: string | null;
          locale?: string | null;
          report?: string;
        };
      };
      payment_orders: {
        Row: {
          id: number;
          owner_id: string;
          method: string;
          amount: string | null;
          payer_note: string | null;
          contact: string | null;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          owner_id?: string;
          method: string;
          amount?: string | null;
          payer_note?: string | null;
          contact?: string | null;
          status?: string;
          created_at?: string;
        };
        Update: {
          status?: string;
          payer_note?: string | null;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};
