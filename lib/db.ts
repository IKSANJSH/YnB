import { supabase } from "./supabaseClient";

export type DbTrade = {
  date: string;
  time: string;
  symbol: string;
  action: "매수" | "매도";
  qty: number;
  price: number;
  reason: string;
  mode?: string;
};

export type DbAiMessage = {
  role: "user" | "assistant";
  content: string;
  hidden?: boolean;
};

export async function fetchTrades(userId: string): Promise<DbTrade[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("trades")
    .select("date, time, symbol, action, qty, price, reason, mode")
    .eq("user_id", userId)
    .order("date", { ascending: true })
    .order("time", { ascending: true });
  if (error || !data) return [];
  return data as DbTrade[];
}

export async function insertTrade(userId: string, trade: DbTrade): Promise<void> {
  if (!supabase) return;
  await supabase.from("trades").insert({ user_id: userId, ...trade });
}

export async function fetchMorningLetter(userId: string, date: string): Promise<string | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("morning_letters")
    .select("content")
    .eq("user_id", userId)
    .eq("date", date)
    .maybeSingle();
  if (error || !data) return null;
  return data.content as string;
}

export async function saveMorningLetterDb(userId: string, date: string, content: string): Promise<void> {
  if (!supabase) return;
  await supabase.from("morning_letters").upsert({ user_id: userId, date, content }, { onConflict: "user_id,date" });
}

export async function fetchAiMessages(userId: string, source: string): Promise<DbAiMessage[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("ai_messages")
    .select("role, content, hidden")
    .eq("user_id", userId)
    .eq("source", source)
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return data as DbAiMessage[];
}

export async function insertAiMessage(userId: string, source: string, message: DbAiMessage): Promise<void> {
  if (!supabase) return;
  await supabase.from("ai_messages").insert({ user_id: userId, source, ...message });
}

export type DbPortfolio = {
  cash: number;
  mode: string;
  assets: unknown[];
  holdings: Record<string, { qty: number; avgPrice: number }>;
};

export async function fetchPortfolio(userId: string): Promise<DbPortfolio | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("portfolios")
    .select("cash, mode, assets, holdings")
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return data as DbPortfolio;
}

export async function savePortfolio(userId: string, portfolio: DbPortfolio): Promise<void> {
  if (!supabase) return;
  await supabase.from("portfolios").upsert({ user_id: userId, ...portfolio }, { onConflict: "user_id" });
}

export async function deletePortfolio(userId: string): Promise<void> {
  if (!supabase) return;
  await supabase.from("portfolios").delete().eq("user_id", userId);
}

export type DbQuizResult = {
  date: string;
  time: string;
  score: number;
  total: number;
};

export async function fetchQuizResults(userId: string): Promise<DbQuizResult[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("quiz_results")
    .select("date, time, score, total")
    .eq("user_id", userId)
    .order("date", { ascending: true })
    .order("time", { ascending: true });
  if (error || !data) return [];
  return data as DbQuizResult[];
}

export async function insertQuizResult(userId: string, result: DbQuizResult): Promise<void> {
  if (!supabase) return;
  await supabase.from("quiz_results").insert({ user_id: userId, ...result });
}

