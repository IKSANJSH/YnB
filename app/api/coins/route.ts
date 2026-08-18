export async function GET() {
  const res = await fetch("https://api.upbit.com/v1/market/all?isDetails=false", {
    cache: "no-store",
  });

  if (!res.ok) {
    return Response.json({ items: [], error: "코인 목록 조회 실패" }, { status: 502 });
  }

  const data: { market: string; korean_name: string }[] = await res.json();
  const items = data
    .filter((m) => m.market.startsWith("KRW-"))
    .map((m) => ({ market: m.market, symbol: m.market.replace("KRW-", ""), name: m.korean_name }));

  return Response.json({ items });
}
