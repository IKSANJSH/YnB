"use client";

import { useState, useEffect } from "react";

const PEER_AVERAGE = 680;

const INVEST_TIPS = [
  {
    title: "적립식 투자 (ETF·펀드)",
    desc: "매달 일정 금액을 자동으로 투자해 시점 리스크를 분산하는 방법. 소액으로 시작하기 좋다.",
  },
  {
    title: "청년도약계좌·청년희망적금",
    desc: "정부가 이자·매칭지원을 얹어주는 청년 전용 저축 상품. 목돈 마련의 기본기로 추천된다.",
  },
  {
    title: "비상금 통장 분리",
    desc: "생활비 통장과 분리해 3~6개월치 생활비를 파킹통장에 따로 모아두는 습관.",
  },
  {
    title: "신용점수 관리",
    desc: "연체 없이 카드 한도 30% 이하 사용, 자동이체 설정만으로도 신용점수를 꾸준히 올릴 수 있다.",
  },
];

function getTierInfo(score: number) {
  if (score < 600) return { label: "관리 필요", color: "#dc2626" };
  if (score < 750) return { label: "보통", color: "#d97706" };
  return { label: "우수", color: "#16a34a" };
}

function getCoaching(score: number) {
  if (score < 600) {
    return {
      label: "관리 필요",
      color: "#dc2626",
      tips: [
        "연체 없이 소액이라도 매달 꾸준히 상환하기",
        "고금리 대출부터 우선 상환 계획 세우기",
        "신용카드 한도의 30% 이하로만 사용하기",
      ],
    };
  }
  if (score < 750) {
    return {
      label: "보통",
      color: "#d97706",
      tips: [
        "자동이체로 고정지출 연체 방지하기",
        "비상금 3개월치 생활비 목표로 저축 시작하기",
        "불필요한 구독 서비스 점검하기",
      ],
    };
  }
  return {
    label: "우수",
    color: "#16a34a",
    tips: [
      "여유 자금 일부를 적립식 투자로 전환 고려",
      "신용점수 유지 위해 기존 습관 그대로 유지",
      "주변 친구에게 노하우 공유해보기",
    ],
  };
}

function ScoreGauge({ score }: { score: number }) {
  const tier = getTierInfo(score);
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(score / 1000, 1);
  const offset = circumference * (1 - progress);

  return (
    <div style={{ position: "relative", width: 140, height: 140 }}>
      <svg width={140} height={140} viewBox="0 0 140 140">
        <circle cx={70} cy={70} r={radius} fill="none" stroke="#f3f4f6" strokeWidth={12} />
        <circle
          cx={70}
          cy={70}
          r={radius}
          fill="none"
          stroke={tier.color}
          strokeWidth={12}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 70 70)"
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span style={{ fontSize: "24px", fontWeight: 800 }}>{score}</span>
        <span style={{ fontSize: "12px", color: tier.color, fontWeight: 700 }}>
          {tier.label}
        </span>
      </div>
    </div>
  );
}

function NextTierProgress({ score }: { score: number }) {
  const nextGoal = score < 600 ? 600 : score < 750 ? 750 : 1000;
  const prevGoal = score < 600 ? 0 : score < 750 ? 600 : 750;
  const pct = Math.min(
    100,
    Math.round(((score - prevGoal) / (nextGoal - prevGoal)) * 100)
  );
  const remaining = Math.max(0, nextGoal - score);

  return (
    <div style={{ width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#6b7280" }}>
        <span>다음 등급까지</span>
        <span>{remaining === 0 ? "최고 등급 달성!" : `${remaining}점 남음`}</span>
      </div>
      <div style={{ background: "#f3f4f6", borderRadius: "999px", height: "10px", marginTop: "6px", overflow: "hidden" }}>
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: "#f97316",
            borderRadius: "999px",
            transition: "width 0.5s ease",
          }}
        />
      </div>
    </div>
  );
}

function Header({ onMenuClick, title }: { onMenuClick: () => void; title: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "16px",
        width: "100%",
        maxWidth: "640px",
        marginBottom: "8px",
      }}
    >
      <button
        onClick={onMenuClick}
        aria-label="메뉴 열기"
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "8px",
          display: "flex",
          flexDirection: "column",
          gap: "4px",
        }}
      >
        <span style={{ width: "22px", height: "2px", background: "#1f2937", borderRadius: "2px" }} />
        <span style={{ width: "22px", height: "2px", background: "#1f2937", borderRadius: "2px" }} />
        <span style={{ width: "22px", height: "2px", background: "#1f2937", borderRadius: "2px" }} />
      </button>
      <h1 style={{ fontSize: "20px", fontWeight: 800 }}>{title}</h1>
    </div>
  );
}

function MenuDrawer({
  open,
  onClose,
  onNavigate,
}: {
  open: boolean;
  onClose: () => void;
  onNavigate: (page: "home" | "credit" | "challenge" | "invest") => void;
}) {
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.35)",
        zIndex: 20,
        display: "flex",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "240px",
          height: "100%",
          background: "#ffffff",
          boxShadow: "2px 0 12px rgba(0,0,0,0.15)",
          padding: "24px 16px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        <p style={{ fontWeight: 800, fontSize: "16px", marginBottom: "12px", paddingLeft: "8px" }}>메뉴</p>
        <button
          onClick={() => onNavigate("home")}
          style={{
            textAlign: "left",
            padding: "12px 8px",
            fontSize: "15px",
            fontWeight: 700,
            background: "none",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#f3f4f6")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
        >
          홈
        </button>
        <button
          onClick={() => onNavigate("credit")}
          style={{
            textAlign: "left",
            padding: "12px 8px",
            fontSize: "15px",
            fontWeight: 700,
            background: "none",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#f3f4f6")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
        >
          신용점수 분석
        </button>
        <button
          onClick={() => onNavigate("challenge")}
          style={{
            textAlign: "left",
            padding: "12px 8px",
            fontSize: "15px",
            fontWeight: 700,
            background: "none",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#f3f4f6")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
        >
          챌린지
        </button>
        <button
          onClick={() => onNavigate("invest")}
          style={{
            textAlign: "left",
            padding: "12px 8px",
            fontSize: "15px",
            fontWeight: 700,
            background: "none",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#f3f4f6")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
        >
          모의투자
        </button>
      </div>
    </div>
  );
}

type NewsItem = { title: string; link: string; source: string; pubDate: string; thumbnail?: string };

function timeAgo(pubDate: string) {
  const diffMs = Date.now() - new Date(pubDate).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "방금 전";
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.floor(hours / 24)}일 전`;
}

const NEWS_CATEGORIES = ["전체", "금융", "증권", "산업", "IT", "부동산"];

function HomePage() {
  const [category, setCategory] = useState("전체");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [news, setNews] = useState<NewsItem[] | null>(null);
  const [newsError, setNewsError] = useState("");

  useEffect(() => {
    setNews(null);
    setNewsError("");
    const url = searchQuery
      ? `/api/news?q=${encodeURIComponent(searchQuery)}`
      : `/api/news?category=${encodeURIComponent(category)}`;
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.items?.length) setNews(data.items);
        else setNewsError(data.error || "불러올 뉴스가 없어요");
      })
      .catch(() => setNewsError("뉴스를 불러오지 못했어요"));
  }, [category, searchQuery]);

  const runSearch = () => {
    const q = searchInput.trim();
    if (q) setSearchQuery(q);
  };

  const clearSearch = () => {
    setSearchInput("");
    setSearchQuery("");
  };

  return (
    <div style={{ width: "100%", maxWidth: "640px", display: "flex", flexDirection: "column", gap: "12px" }}>
      <section
        style={{
          background: "#ffffff",
          border: "2px solid #e5e7eb",
          borderRadius: "12px",
          padding: "20px 24px",
          textAlign: "left",
        }}
      >
        <p style={{ fontWeight: 800, fontSize: "16px", marginBottom: "12px" }}>📰 금융 뉴스</p>

        <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runSearch()}
            placeholder="관심 기업 검색 (예: 삼성전자)"
            style={{
              flex: 1,
              padding: "9px 12px",
              fontSize: "13px",
              border: "2px solid #e5e7eb",
              borderRadius: "8px",
            }}
          />
          <button
            onClick={runSearch}
            style={{
              padding: "9px 16px",
              fontSize: "13px",
              fontWeight: 700,
              color: "#fff",
              background: "#f97316",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            검색
          </button>
        </div>

        {searchQuery ? (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
            <span
              style={{
                padding: "6px 14px",
                borderRadius: "999px",
                fontSize: "13px",
                fontWeight: 700,
                border: "1px solid #f97316",
                background: "#fff7ed",
                color: "#f97316",
              }}
            >
              🔍 &ldquo;{searchQuery}&rdquo;
            </span>
            <button
              onClick={clearSearch}
              style={{ fontSize: "12px", color: "#9ca3af", background: "none", border: "none", cursor: "pointer" }}
            >
              ✕ 검색 해제
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "14px" }}>
            {NEWS_CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                style={{
                  padding: "6px 14px",
                  borderRadius: "999px",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: "pointer",
                  border: category === c ? "1px solid #16a34a" : "1px solid #e5e7eb",
                  background: category === c ? "#f0fdf4" : "#fff",
                  color: category === c ? "#16a34a" : "#374151",
                }}
              >
                {c}
              </button>
            ))}
          </div>
        )}
        {news === null && !newsError && (
          <p style={{ fontSize: "13px", color: "#9ca3af" }}>뉴스를 불러오는 중...</p>
        )}
        {newsError && <p style={{ fontSize: "13px", color: "#dc2626" }}>{newsError}</p>}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {news?.map((n, i) => (
            <a
              key={i}
              href={n.link}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                textDecoration: "none",
                color: "inherit",
                display: "flex",
                gap: "12px",
                paddingBottom: i < news.length - 1 ? "14px" : 0,
                borderBottom: i < news.length - 1 ? "1px solid #f3f4f6" : "none",
              }}
            >
              {n.thumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={n.thumbnail}
                  alt=""
                  style={{
                    width: "64px",
                    height: "64px",
                    borderRadius: "8px",
                    objectFit: "cover",
                    flexShrink: 0,
                    background: "#f3f4f6",
                  }}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "64px",
                    height: "64px",
                    borderRadius: "8px",
                    background: "#f3f4f6",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "24px",
                  }}
                >
                  📰
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 700, fontSize: "14px" }}>{n.title}</p>
                <p style={{ fontSize: "12px", color: "#9ca3af", marginTop: "2px" }}>
                  {n.source} · {timeAgo(n.pubDate)}
                </p>
              </div>
            </a>
          ))}
        </div>
      </section>

      <section
        style={{
          background: "#ffffff",
          border: "2px solid #e5e7eb",
          borderRadius: "12px",
          padding: "20px 24px",
          textAlign: "left",
        }}
      >
        <p style={{ fontWeight: 800, fontSize: "16px", marginBottom: "12px" }}>
          💡 20·30대가 알아야 할 금융 정보
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          {INVEST_TIPS.map((t, i) => (
            <div
              key={i}
              style={{
                background: "#fff7ed",
                border: "1px solid #fed7aa",
                borderRadius: "10px",
                padding: "14px",
              }}
            >
              <p style={{ fontWeight: 700, fontSize: "13px", color: "#9a3412" }}>{t.title}</p>
              <p style={{ fontSize: "12px", color: "#6b7280", marginTop: "6px", lineHeight: 1.5 }}>{t.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function CreditScorePage() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<ReturnType<typeof getCoaching> | null>(null);
  const [shake, setShake] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [history, setHistory] = useState<number[]>([]);
  const [checked, setChecked] = useState<Record<number, boolean>>({});

  const handleSubmit = () => {
    const score = Number(input);
    if (!score || score < 0 || score > 1000) {
      setErrorMsg("1000 이내의 숫자를 입력해주세요");
      setShake(true);
      setTimeout(() => setShake(false), 400);
      return;
    }
    setErrorMsg("");
    setResult(getCoaching(score));
    setChecked({});
    setHistory((prev) => [...prev, score]);
  };

  const latestScore = history[history.length - 1];
  const maxForChart = Math.max(1000, ...history);
  const doneCount = Object.values(checked).filter(Boolean).length;

  return (
    <div style={{ width: "100%", maxWidth: "640px", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
      <p style={{ fontSize: "15px", color: "#6b7280", textAlign: "center" }}>
        다른 앱(토스, 뱅크샐러드 등)에서 확인한 신용점수를 입력해보세요
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "center" }}>
        <div style={{ display: "flex", gap: "8px" }}>
          <input
            type="number"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="예: 780"
            className={shake ? "shake" : ""}
            style={{
              padding: "12px 16px",
              fontSize: "16px",
              border: `2px solid ${errorMsg ? "#dc2626" : "#e5e7eb"}`,
              borderRadius: "8px",
              width: "160px",
            }}
          />
          <button
            onClick={handleSubmit}
            style={{
              padding: "12px 20px",
              fontSize: "16px",
              fontWeight: 700,
              color: "#fff",
              background: "#f97316",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            코칭 받기
          </button>
        </div>
        {errorMsg && <p style={{ color: "#dc2626", fontSize: "14px" }}>{errorMsg}</p>}
      </div>

      {result && latestScore !== undefined && (
        <div
          style={{
            background: "#ffffff",
            border: `2px solid ${result.color}`,
            borderRadius: "12px",
            padding: "24px 28px",
            width: "100%",
            textAlign: "left",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap", justifyContent: "center" }}>
            <ScoreGauge score={latestScore} />
            <div style={{ flex: 1, minWidth: "180px", textAlign: "left" }}>
              <p style={{ fontWeight: 800, color: result.color, fontSize: "18px" }}>
                진단: {result.label}
              </p>
              <div style={{ marginTop: "12px" }}>
                <NextTierProgress score={latestScore} />
              </div>
            </div>
          </div>

          <p style={{ fontWeight: 800, fontSize: "15px", marginTop: "20px" }}>
            이번주 실천 미션 ({doneCount}/{result.tips.length})
          </p>
          <ul style={{ marginTop: "10px", paddingLeft: "0", listStyle: "none" }}>
            {result.tips.map((tip, i) => (
              <li
                key={i}
                onClick={() => setChecked((c) => ({ ...c, [i]: !c[i] }))}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "8px 10px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  background: checked[i] ? "#f0fdf4" : "transparent",
                  textDecoration: checked[i] ? "line-through" : "none",
                  color: checked[i] ? "#16a34a" : "#1f2937",
                  marginBottom: "4px",
                }}
              >
                <span
                  style={{
                    width: "18px",
                    height: "18px",
                    borderRadius: "5px",
                    border: `2px solid ${checked[i] ? "#16a34a" : "#d1d5db"}`,
                    background: checked[i] ? "#16a34a" : "transparent",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                >
                  {checked[i] ? "✓" : ""}
                </span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}

      {latestScore !== undefined && (
        <div
          style={{
            background: "#ffffff",
            border: "2px solid #e5e7eb",
            borderRadius: "12px",
            padding: "20px 28px",
            width: "100%",
            textAlign: "left",
          }}
        >
          <p style={{ fontWeight: 800, fontSize: "16px" }}>또래 비교</p>
          <p style={{ fontSize: "14px", color: "#6b7280", marginTop: "4px" }}>
            같은 나이대 평균 신용점수: {PEER_AVERAGE}점
          </p>
          <div style={{ background: "#f3f4f6", borderRadius: "999px", height: "10px", marginTop: "10px", position: "relative" }}>
            <div
              style={{
                position: "absolute",
                left: `${Math.min(100, (PEER_AVERAGE / 1000) * 100)}%`,
                top: "-4px",
                width: "2px",
                height: "18px",
                background: "#9ca3af",
              }}
            />
            <div
              style={{
                width: `${Math.min(100, (latestScore / 1000) * 100)}%`,
                height: "100%",
                borderRadius: "999px",
                background: latestScore >= PEER_AVERAGE ? "#16a34a" : "#dc2626",
                transition: "width 0.5s ease",
              }}
            />
          </div>
          <p style={{ fontSize: "14px", marginTop: "10px" }}>
            내 점수는 평균보다{" "}
            <strong style={{ color: latestScore >= PEER_AVERAGE ? "#16a34a" : "#dc2626" }}>
              {Math.abs(latestScore - PEER_AVERAGE)}점{" "}
              {latestScore >= PEER_AVERAGE ? "높아요" : "낮아요"}
            </strong>
          </p>
        </div>
      )}

      {history.length > 0 && (
        <div
          style={{
            background: "#ffffff",
            border: "2px solid #e5e7eb",
            borderRadius: "12px",
            padding: "20px 28px",
            width: "100%",
            textAlign: "left",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <p style={{ fontWeight: 800, fontSize: "16px", marginBottom: "12px" }}>성장 기록</p>
            <span style={{ fontSize: "13px", color: "#6b7280" }}>총 {history.length}회 기록</span>
          </div>
          {(() => {
            const width = 440;
            const height = 140;
            const padX = 24;
            const padTop = 20;
            const padBottom = 24;
            const maxScore = Math.max(...history);
            const points = history.map((score, i) => {
              const x =
                history.length === 1
                  ? width / 2
                  : padX + (i * (width - padX * 2)) / (history.length - 1);
              const y = padTop + (height - padTop - padBottom) * (1 - score / maxForChart);
              return { x, y, score };
            });
            const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
            const maxY = padTop + (height - padTop - padBottom) * (1 - maxScore / maxForChart);

            return (
              <svg width="100%" viewBox={`0 0 ${width} ${height}`}>
                <line x1={padX} y1={maxY} x2={width - padX} y2={maxY} stroke="#9ca3af" strokeDasharray="4 4" strokeWidth={1} />
                <text x={padX} y={maxY - 6} textAnchor="start" fontSize={11} fill="#6b7280">
                  최고점 {maxScore}
                </text>
                <path d={linePath} fill="none" stroke="#f97316" strokeWidth={2} />
                {points.map((p, i) => (
                  <g key={i}>
                    <circle cx={p.x} cy={p.y} r={4} fill="#f97316" />
                    <text x={p.x} y={p.y - 10} textAnchor="middle" fontSize={12} fontWeight={700} fill="#1f2937">
                      {p.score}
                    </text>
                    {i > 0 && (
                      <text
                        x={(p.x + points[i - 1].x) / 2}
                        y={(p.y + points[i - 1].y) / 2 - 8}
                        textAnchor="middle"
                        fontSize={11}
                        fontWeight={700}
                        fill={p.score - points[i - 1].score >= 0 ? "#16a34a" : "#dc2626"}
                      >
                        {p.score - points[i - 1].score >= 0 ? "+" : ""}
                        {p.score - points[i - 1].score}
                      </text>
                    )}
                    <text x={p.x} y={height - 4} textAnchor="middle" fontSize={11} fill="#9ca3af">
                      #{i + 1}
                    </text>
                  </g>
                ))}
              </svg>
            );
          })()}
        </div>
      )}
    </div>
  );
}

const CHALLENGE_LEVELS = 30;
const CHALLENGE_MISSIONS = [
  "오늘 하루 지출을 메모장에 적어보기",
  "이번 달 고정지출(구독 서비스) 목록 확인하기",
  "가계부 앱 하나 설치해보기",
  "이번 주 무지출 데이 1일 만들기",
  "적금 상품 하나 검색해보기",
  "신용점수 조회해보기",
  "비상금 통장 개설 알아보기",
  "이번 달 배달음식 횟수 세어보기",
  "ETF가 무엇인지 한 문장으로 설명해보기",
  "청년도약계좌 조건 확인해보기",
];

function ChallengePage() {
  const [progress, setProgress] = useState(0); // number of completed levels
  const [activeLevel, setActiveLevel] = useState<number | null>(null);

  const width = 320;
  const stepY = 86;
  const amplitude = 95;
  const height = CHALLENGE_LEVELS * stepY + 40;

  const points = Array.from({ length: CHALLENGE_LEVELS }, (_, i) => {
    const level = i + 1;
    const x = width / 2 + Math.sin(i * 0.9) * amplitude;
    const y = 40 + i * stepY;
    return { level, x, y };
  });

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");

  const closeModal = () => setActiveLevel(null);
  const completeActive = () => {
    if (activeLevel !== null) {
      setProgress((p) => Math.max(p, activeLevel));
      setActiveLevel(null);
    }
  };

  return (
    <div style={{ width: "100%", maxWidth: "640px", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
      <div
        style={{
          background: "#ffffff",
          border: "2px solid #e5e7eb",
          borderRadius: "12px",
          padding: "16px 20px",
          width: "100%",
          textAlign: "left",
        }}
      >
        <p style={{ fontWeight: 800, fontSize: "16px" }}>🏆 금융 습관 챌린지</p>
        <p style={{ fontSize: "13px", color: "#6b7280", marginTop: "4px" }}>
          {progress}/{CHALLENGE_LEVELS}단계 완료 · 한 단계씩 순서대로 통과해야 다음 단계가 열려요
        </p>
      </div>

      <div style={{ background: "#ffffff", border: "2px solid #e5e7eb", borderRadius: "12px", padding: "20px 0", width: "100%" }}>
        <svg width="100%" viewBox={`0 0 ${width} ${height}`}>
          <path d={linePath} fill="none" stroke="#e5e7eb" strokeWidth={6} strokeLinecap="round" />
          {points.map((p) => {
            const isDone = p.level <= progress;
            const isCurrent = p.level === progress + 1;
            const isLocked = p.level > progress + 1;
            const fill = isDone ? "#16a34a" : isCurrent ? "#f97316" : "#e5e7eb";
            return (
              <g
                key={p.level}
                onClick={() => !isLocked && setActiveLevel(p.level)}
                style={{ cursor: isLocked ? "default" : "pointer" }}
              >
                <circle cx={p.x} cy={p.y} r={26} fill={fill} />
                {isCurrent && (
                  <circle cx={p.x} cy={p.y} r={32} fill="none" stroke="#f97316" strokeWidth={2} opacity={0.4} />
                )}
                {isDone ? (
                  <text x={p.x} y={p.y + 7} textAnchor="middle" fontSize={20} fill="#fff">
                    ✓
                  </text>
                ) : (
                  <text
                    x={p.x}
                    y={p.y + 6}
                    textAnchor="middle"
                    fontSize={14}
                    fontWeight={700}
                    fill={isLocked ? "#9ca3af" : "#fff"}
                  >
                    {p.level}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {activeLevel !== null && (
        <div
          onClick={closeModal}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            zIndex: 30,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              padding: "28px 24px",
              maxWidth: "360px",
              width: "100%",
              textAlign: "center",
            }}
          >
            <p style={{ fontSize: "13px", color: "#9a3412", fontWeight: 700 }}>{activeLevel}단계</p>
            <p style={{ fontSize: "16px", fontWeight: 700, marginTop: "10px", lineHeight: 1.5 }}>
              {CHALLENGE_MISSIONS[(activeLevel - 1) % CHALLENGE_MISSIONS.length]}
            </p>
            {activeLevel <= progress ? (
              <p style={{ fontSize: "13px", color: "#16a34a", marginTop: "16px" }}>이미 완료한 단계예요 ✓</p>
            ) : (
              <button
                onClick={completeActive}
                style={{
                  marginTop: "20px",
                  padding: "12px 24px",
                  fontSize: "15px",
                  fontWeight: 700,
                  color: "#fff",
                  background: "#f97316",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
              >
                완료하고 다음 단계 열기
              </button>
            )}
            <button
              onClick={closeModal}
              style={{
                display: "block",
                margin: "12px auto 0",
                background: "none",
                border: "none",
                color: "#6b7280",
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const INITIAL_CASH = 1_000_000;

const INITIAL_ASSETS = [
  { symbol: "삼성전자", type: "주식", price: 71000 },
  { symbol: "카카오", type: "주식", price: 42000 },
  { symbol: "BTC", type: "코인", price: 92000000 },
  { symbol: "ETH", type: "코인", price: 4200000 },
];

function formatWon(n: number) {
  return Math.round(n).toLocaleString("ko-KR") + "원";
}

function InvestPage() {
  const [prices, setPrices] = useState<Record<string, number>>(
    Object.fromEntries(INITIAL_ASSETS.map((a) => [a.symbol, a.price]))
  );
  const [cash, setCash] = useState(INITIAL_CASH);
  const [holdings, setHoldings] = useState<Record<string, { qty: number; avgPrice: number }>>({});
  const [selected, setSelected] = useState(INITIAL_ASSETS[0].symbol);
  const [qtyInput, setQtyInput] = useState("1");
  const [message, setMessage] = useState("");
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [priceError, setPriceError] = useState("");

  const holdingsValue = Object.entries(holdings).reduce(
    (sum, [symbol, h]) => sum + h.qty * (prices[symbol] ?? 0),
    0
  );
  const totalAssets = cash + holdingsValue;
  const profit = totalAssets - INITIAL_CASH;
  const profitPct = (profit / INITIAL_CASH) * 100;

  const refreshPrices = async () => {
    setLoadingPrices(true);
    setPriceError("");

    // 주식은 실시간 API가 없어 모의 변동으로 유지
    setPrices((prev) => {
      const next: Record<string, number> = { ...prev };
      for (const a of INITIAL_ASSETS) {
        if (a.type === "주식") {
          const change = 1 + (Math.random() * 0.06 - 0.03); // ±3%
          next[a.symbol] = Math.max(1, Math.round(prev[a.symbol] * change));
        }
      }
      return next;
    });

    // 코인은 업비트 실시간 시세
    try {
      const res = await fetch("/api/upbit");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setPrices((prev) => ({ ...prev, ...data }));
    } catch {
      setPriceError("업비트 시세를 불러오지 못했어요");
    } finally {
      setLoadingPrices(false);
    }
  };

  useEffect(() => {
    refreshPrices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const buy = () => {
    const qty = Number(qtyInput);
    if (!qty || qty <= 0) return;
    const price = prices[selected];
    const cost = price * qty;
    if (cost > cash) {
      setMessage("잔고가 부족해요");
      return;
    }
    setCash((c) => c - cost);
    setHoldings((prev) => {
      const existing = prev[selected];
      const newQty = (existing?.qty ?? 0) + qty;
      const newAvg = existing
        ? (existing.avgPrice * existing.qty + cost) / newQty
        : price;
      return { ...prev, [selected]: { qty: newQty, avgPrice: newAvg } };
    });
    setMessage(`${selected} ${qty}개 매수 완료`);
  };

  const sell = () => {
    const qty = Number(qtyInput);
    const existing = holdings[selected];
    if (!qty || qty <= 0) return;
    if (!existing || existing.qty < qty) {
      setMessage("보유 수량이 부족해요");
      return;
    }
    const price = prices[selected];
    setCash((c) => c + price * qty);
    setHoldings((prev) => {
      const remaining = existing.qty - qty;
      const next = { ...prev };
      if (remaining <= 0) delete next[selected];
      else next[selected] = { qty: remaining, avgPrice: existing.avgPrice };
      return next;
    });
    setMessage(`${selected} ${qty}개 매도 완료`);
  };

  return (
    <div style={{ width: "100%", maxWidth: "640px", display: "flex", flexDirection: "column", gap: "12px", textAlign: "left" }}>
      <div style={{ background: "#ffffff", border: "2px solid #e5e7eb", borderRadius: "12px", padding: "20px 24px" }}>
        <p style={{ fontSize: "13px", color: "#6b7280" }}>내 총자산</p>
        <p style={{ fontSize: "26px", fontWeight: 800, marginTop: "4px" }}>{formatWon(totalAssets)}</p>
        <p style={{ fontSize: "14px", marginTop: "6px", color: profit >= 0 ? "#16a34a" : "#dc2626", fontWeight: 700 }}>
          {profit >= 0 ? "+" : ""}
          {formatWon(profit)} ({profitPct >= 0 ? "+" : ""}
          {profitPct.toFixed(1)}%)
        </p>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#6b7280", marginTop: "12px" }}>
          <span>현금</span>
          <span>{formatWon(cash)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#6b7280", marginTop: "4px" }}>
          <span>보유 자산 평가액</span>
          <span>{formatWon(holdingsValue)}</span>
        </div>
      </div>

      <div style={{ background: "#ffffff", border: "2px solid #e5e7eb", borderRadius: "12px", padding: "20px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <p style={{ fontWeight: 800, fontSize: "16px" }}>시세</p>
          <button
            onClick={refreshPrices}
            disabled={loadingPrices}
            style={{
              fontSize: "13px",
              fontWeight: 700,
              color: "#f97316",
              background: "#fff7ed",
              border: "1px solid #fed7aa",
              borderRadius: "8px",
              padding: "6px 12px",
              cursor: loadingPrices ? "default" : "pointer",
              opacity: loadingPrices ? 0.6 : 1,
            }}
          >
            {loadingPrices ? "불러오는 중..." : "🔄 시세 갱신"}
          </button>
        </div>
        {priceError && <p style={{ fontSize: "12px", color: "#dc2626", marginBottom: "8px" }}>{priceError}</p>}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {INITIAL_ASSETS.map((a) => (
            <button
              key={a.symbol}
              onClick={() => setSelected(a.symbol)}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px 12px",
                borderRadius: "8px",
                border: selected === a.symbol ? "2px solid #f97316" : "2px solid #f3f4f6",
                background: selected === a.symbol ? "#fff7ed" : "#fff",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <span>
                <span style={{ fontWeight: 700, fontSize: "14px" }}>{a.symbol}</span>
                <span style={{ fontSize: "11px", color: "#9ca3af", marginLeft: "6px" }}>{a.type}</span>
                {a.type === "코인" && (
                  <span style={{ fontSize: "10px", color: "#16a34a", marginLeft: "6px", fontWeight: 700 }}>
                    ● 업비트 실시간
                  </span>
                )}
              </span>
              <span style={{ fontWeight: 700, fontSize: "14px" }}>{formatWon(prices[a.symbol])}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: "#ffffff", border: "2px solid #e5e7eb", borderRadius: "12px", padding: "20px 24px" }}>
        <p style={{ fontWeight: 800, fontSize: "16px", marginBottom: "12px" }}>{selected} 매수/매도</p>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <input
            type="number"
            value={qtyInput}
            onChange={(e) => setQtyInput(e.target.value)}
            min={1}
            style={{
              padding: "10px 14px",
              fontSize: "15px",
              border: "2px solid #e5e7eb",
              borderRadius: "8px",
              width: "100px",
            }}
          />
          <span style={{ fontSize: "13px", color: "#6b7280" }}>개</span>
          <button
            onClick={buy}
            style={{
              padding: "10px 18px",
              fontSize: "14px",
              fontWeight: 700,
              color: "#fff",
              background: "#dc2626",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            매수
          </button>
          <button
            onClick={sell}
            style={{
              padding: "10px 18px",
              fontSize: "14px",
              fontWeight: 700,
              color: "#fff",
              background: "#2563eb",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            매도
          </button>
        </div>
        {message && <p style={{ fontSize: "13px", color: "#6b7280", marginTop: "10px" }}>{message}</p>}
      </div>

      {Object.keys(holdings).length > 0 && (
        <div style={{ background: "#ffffff", border: "2px solid #e5e7eb", borderRadius: "12px", padding: "20px 24px" }}>
          <p style={{ fontWeight: 800, fontSize: "16px", marginBottom: "12px" }}>보유 종목</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {Object.entries(holdings).map(([symbol, h]) => {
              const cur = prices[symbol];
              const value = h.qty * cur;
              const pnl = value - h.qty * h.avgPrice;
              const pnlPct = (pnl / (h.qty * h.avgPrice)) * 100;
              return (
                <div key={symbol} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                  <span>
                    <strong>{symbol}</strong> {h.qty}개 · 평단 {formatWon(h.avgPrice)}
                  </span>
                  <span style={{ color: pnl >= 0 ? "#16a34a" : "#dc2626", fontWeight: 700 }}>
                    {formatWon(value)} ({pnlPct >= 0 ? "+" : ""}
                    {pnlPct.toFixed(1)}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [page, setPage] = useState<"home" | "credit" | "challenge" | "invest">("home");
  const [menuOpen, setMenuOpen] = useState(false);

  const titles = { home: "머니업", credit: "신용점수 분석", challenge: "챌린지", invest: "모의투자" };

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "16px",
        padding: "24px 20px 60px",
        textAlign: "center",
      }}
    >
      <div style={{ width: "100%", maxWidth: "640px", display: "flex", justifyContent: "flex-start" }}>
        <Header onMenuClick={() => setMenuOpen(true)} title={titles[page]} />
      </div>

      {page === "home" && <HomePage />}
      {page === "credit" && <CreditScorePage />}
      {page === "challenge" && <ChallengePage />}
      {page === "invest" && <InvestPage />}

      <MenuDrawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onNavigate={(p) => {
          setPage(p);
          setMenuOpen(false);
        }}
      />
    </main>
  );
}
