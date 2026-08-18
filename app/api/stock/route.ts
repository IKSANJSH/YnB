const FALLBACK_USD_KRW = 1400;

async function fetchUsdKrwRate(): Promise<number> {
  try {
    const res = await fetch("https://finance.naver.com/marketindex/exchangeList.naver", {
      headers: { "User-Agent": "Mozilla/5.0" },
      cache: "no-store",
    });
    if (res.ok) {
      const html = await res.text();
      const match = html.match(/FX_USDKRW[\s\S]*?class="sale">\s*([\d,]+\.?\d*)/);
      if (match) return Number(match[1].replace(/,/g, ""));
    }
  } catch {}
  return FALLBACK_USD_KRW;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const domestic = (searchParams.get("codes") ?? "").split(",").map((c) => c.trim()).filter(Boolean);
  const world = (searchParams.get("worldCodes") ?? "").split(",").map((c) => c.trim()).filter(Boolean);

  const prices: Record<string, number> = {};
  const marketStatus: Record<string, string> = {};

  if (!domestic.length && !world.length) return Response.json({ prices, marketStatus });

  if (domestic.length) {
    try {
      const res = await fetch(
        `https://polling.finance.naver.com/api/realtime/domestic/stock/${domestic.join(",")}`,
        { headers: { "User-Agent": "Mozilla/5.0" }, cache: "no-store" }
      );
      if (res.ok) {
        const data = await res.json();
        for (const item of data.datas ?? []) {
          prices[item.itemCode] = Number(item.closePriceRaw);
          marketStatus[item.itemCode] = item.marketStatus;
        }
      }
    } catch {}
  }

  if (world.length) {
    try {
      const [res, usdKrw] = await Promise.all([
        fetch(`https://polling.finance.naver.com/api/realtime/worldstock/stock/${world.join(",")}`, {
          headers: { "User-Agent": "Mozilla/5.0" },
          cache: "no-store",
        }),
        fetchUsdKrwRate(),
      ]);
      if (res.ok) {
        const data = await res.json();
        for (const item of data.datas ?? []) {
          prices[item.reutersCode] = Number(item.closePriceRaw) * usdKrw;
          marketStatus[item.reutersCode] = item.marketStatus;
        }
      }
    } catch {}
  }

  return Response.json({ prices, marketStatus });
}
