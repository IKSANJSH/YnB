export async function GET() {
  const res = await fetch("https://api.upbit.com/v1/ticker?markets=KRW-BTC,KRW-ETH", {
    cache: "no-store",
  });

  if (!res.ok) {
    return Response.json({ error: "업비트 시세 조회 실패" }, { status: 502 });
  }

  const data = await res.json();
  const prices: Record<string, number> = {};
  for (const item of data) {
    const symbol = item.market === "KRW-BTC" ? "BTC" : item.market === "KRW-ETH" ? "ETH" : item.market;
    prices[symbol] = item.trade_price;
  }
  return Response.json(prices);
}
