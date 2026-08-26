const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  "Accept-Language": "ko-KR,ko;q=0.9",
};

const FEEDS: Record<string, { url: string; source: string }[]> = {
  전체: [
    { url: "https://www.yna.co.kr/rss/economy.xml", source: "연합뉴스" },
    { url: "https://www.hankyung.com/feed/economy", source: "한국경제" },
  ],
  금융: [{ url: "https://www.hankyung.com/feed/finance", source: "한국경제" }],
  증권: [{ url: "https://www.yna.co.kr/rss/market.xml", source: "연합뉴스" }],
  산업: [{ url: "https://www.yna.co.kr/rss/industry.xml", source: "연합뉴스" }],
  IT: [{ url: "https://www.hankyung.com/feed/it", source: "한국경제" }],
  부동산: [{ url: "https://www.hankyung.com/feed/realestate", source: "한국경제" }],
  해외뉴스: [],
};

function extractTag(xml: string, tag: string) {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
  if (!match) return "";
  return match[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/, "$1").trim();
}

function extractThumbnail(item: string) {
  const media = item.match(/<media:content[^>]*url="([^"]+)"/);
  if (media) return media[1];
  const enclosure = item.match(/<enclosure[^>]*url="([^"]+)"[^>]*type="image/);
  if (enclosure) return enclosure[1];
  return "";
}

function parseFeed(xml: string, source: string) {
  const items = xml.match(/<item[^>]*>[\s\S]*?<\/item>/g) ?? [];
  return items.slice(0, 8).map((item) => ({
    title: extractTag(item, "title"),
    link: extractTag(item, "link"),
    pubDate: extractTag(item, "pubDate"),
    thumbnail: extractThumbnail(item),
    source,
  }));
}

function parseGoogleNewsFeed(xml: string) {
  const items = xml.match(/<item[^>]*>[\s\S]*?<\/item>/g) ?? [];
  return items.slice(0, 10).map((item) => {
    const rawTitle = extractTag(item, "title");
    const lastDash = rawTitle.lastIndexOf(" - ");
    const title = lastDash > -1 ? rawTitle.slice(0, lastDash) : rawTitle;
    const source = lastDash > -1 ? rawTitle.slice(lastDash + 3) : "Google 뉴스";
    return {
      title,
      link: extractTag(item, "link"),
      pubDate: extractTag(item, "pubDate"),
      thumbnail: "",
      source,
    };
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();

  if (query) {
    try {
      const url = `https://news.google.com/rss/search?q=${encodeURIComponent(
        query
      )}&hl=ko&gl=KR&ceid=KR:ko`;
      const res = await fetch(url, {
        headers: BROWSER_HEADERS,
        cache: "no-store",
      });
      if (!res.ok) throw new Error("bad response");
      const xml = await res.text();
      const items = parseGoogleNewsFeed(xml).filter((n) => n.title && n.link);
      return Response.json({ items, categories: Object.keys(FEEDS) });
    } catch {
      return Response.json(
        { items: [], categories: Object.keys(FEEDS), error: `"${query}" 뉴스를 불러오지 못했어요` },
        { status: 502 }
      );
    }
  }

  const category = searchParams.get("category") ?? "전체";
  const feeds = FEEDS[category] ?? FEEDS["전체"];

  // 카테고리 이름을 구글 뉴스 검색어로 매핑 (원본 매체 RSS를 가져오지 못할 때의 대체 경로)
  const CATEGORY_FALLBACK_QUERY: Record<string, string> = {
    전체: "경제",
    금융: "금융",
    증권: "증권",
    산업: "산업",
    IT: "IT",
    부동산: "부동산",
    해외뉴스: "해외 증시",
  };

  try {
    const results = await Promise.all(
      feeds.map(async (feed) => {
        try {
          const res = await fetch(feed.url, {
            headers: BROWSER_HEADERS,
            cache: "no-store",
            next: { revalidate: 0 },
          });
          if (!res.ok) return [];
          const xml = await res.text();
          return parseFeed(xml, feed.source);
        } catch {
          return [];
        }
      })
    );

    let all = results.flat().filter((n) => n.title && n.link);

    // 원본 매체 RSS를 하나도 못 가져왔으면(예: 호스팅 환경에서 특정 매체가 차단된 경우)
    // 같은 주제로 구글 뉴스 검색을 대신 사용해 빈 화면이 뜨지 않도록 함
    if (all.length === 0) {
      const query = CATEGORY_FALLBACK_QUERY[category] ?? category;
      try {
        const res = await fetch(
          `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=ko&gl=KR&ceid=KR:ko`,
          { headers: BROWSER_HEADERS, cache: "no-store" }
        );
        if (res.ok) {
          const xml = await res.text();
          all = parseGoogleNewsFeed(xml).filter((n) => n.title && n.link);
        }
      } catch {
        // ignore, fall through to empty result below
      }
    }

    all = all.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()).slice(0, 8);

    return Response.json({ items: all, categories: Object.keys(FEEDS) });
  } catch {
    return Response.json(
      { items: [], categories: Object.keys(FEEDS), error: "뉴스를 불러오지 못했어요" },
      { status: 502 }
    );
  }
}
