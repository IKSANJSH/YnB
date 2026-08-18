export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  if (!q) return Response.json({ items: [] });

  try {
    const res = await fetch(
      `https://ac.stock.naver.com/ac?q=${encodeURIComponent(q)}&target=stock`,
      { headers: { "User-Agent": "Mozilla/5.0" }, cache: "no-store" }
    );
    if (!res.ok) throw new Error("bad response");

    const data = await res.json();
    const items = (data.items ?? [])
      .filter(
        (it: { category: string; nationCode: string }) =>
          it.category === "stock" && (it.nationCode === "KOR" || it.nationCode === "USA")
      )
      .map((it: { reutersCode: string; name: string; typeName: string; nationCode: string }) => ({
        code: it.reutersCode,
        name: it.name,
        exchange: it.typeName,
        nationCode: it.nationCode,
      }));

    return Response.json({ items });
  } catch {
    return Response.json({ items: [], error: "주식 검색에 실패했어요" }, { status: 502 });
  }
}
