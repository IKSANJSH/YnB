export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const markets = searchParams.get("markets")?.trim();

  if (!markets) return Response.json({});

  const res = await fetch(`https://api.upbit.com/v1/ticker?markets=${encodeURIComponent(markets)}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    return Response.json({ error: "업비트 시세 조회 실패" }, { status: 502 });
  }

  const data = await res.json();
  const prices: Record<string, number> = {};
  for (const item of data) {
    prices[item.market] = item.trade_price;
  }
  return Response.json(prices);
}
