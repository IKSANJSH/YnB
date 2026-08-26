"use client";

import { useState, useEffect, useRef, type CSSProperties } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import {
  fetchTrades,
  insertTrade,
  insertTrades,
  fetchMorningLetter,
  saveMorningLetterDb,
  fetchAiMessages,
  insertAiMessage,
  hasAnyTrades,
  fetchPortfolio,
  savePortfolio,
  deletePortfolio,
  fetchQuizResults,
  insertQuizResult,
  insertQuizResults,
  hasAnyQuizResults,
} from "@/lib/db";


const FINANCE_INFO_CATEGORIES = [
  {
    key: "invest",
    icon: "📈",
    title: "투자",
    items: [
      { title: "적립식 투자 (ETF·펀드)", desc: "매달 일정 금액을 자동으로 투자해 시점 리스크를 분산하는 방법. 소액으로 시작하기 좋다." },
      { title: "분산투자", desc: "한 종목·자산에 몰빵하지 않고 여러 섹터·지역에 나눠 담아 리스크를 낮춘다." },
      { title: "소액 투자 플랫폼 활용", desc: "토스증권·카카오페이증권 등에서 1,000원 단위로도 국내외 주식·ETF 투자가 가능하다." },
      { title: "장기 투자 마인드", desc: "단기 시세 변동에 일희일비하지 않고, 목표 기간을 정해두고 꾸준히 유지하는 것이 핵심." },
      { title: "배당주·배당 ETF", desc: "정기적으로 배당금이 들어오는 자산에 투자해 현금흐름을 만드는 전략." },
      { title: "투자 전 리스크 관리", desc: "투자 금액은 감당 가능한 손실 범위 안에서만, 여유자금으로 시작한다." },
    ],
  },
  {
    key: "saving",
    icon: "🏦",
    title: "적금",
    items: [
      { title: "청년도약계좌", desc: "정부 매칭지원금을 얹어주는 청년 전용 5년 만기 상품. 목돈 마련의 대표 상품으로 꼽힌다." },
      { title: "청년희망적금", desc: "저축장려금을 지원해주는 청년 전용 적금. 만기 시 우대금리 혜택도 함께 확인하자." },
      { title: "자유적립식 vs 정기적금", desc: "매달 금액이 유동적이면 자유적립식, 고정 금액을 꾸준히 넣을 수 있다면 정기적금이 유리하다." },
      { title: "파킹통장", desc: "하루만 맡겨도 이자가 붙는 통장. 비상금이나 단기 목돈을 보관하기 좋다." },
      { title: "풍차적금", desc: "매달 새 적금에 가입해 만기를 분산시켜, 매달 목돈이 들어오는 구조를 만드는 방법." },
      { title: "특판 적금 확인하기", desc: "은행 앱의 이벤트·특판 상품은 금리가 높은 경우가 많으니 주기적으로 확인하자." },
    ],
  },
  {
    key: "credit",
    icon: "💳",
    title: "신용점수",
    items: [
      { title: "연체 없이 상환하기", desc: "금액이 적더라도 연체 없이 매달 꾸준히 상환하는 것이 신용점수에 가장 크게 작용한다." },
      { title: "카드 한도 30% 이하 사용", desc: "신용카드 한도 대비 사용 비율(신용카드 이용률)이 낮을수록 점수에 유리하다." },
      { title: "자동이체로 고정지출 관리", desc: "통신비·공과금 등을 자동이체로 설정해두면 실수로 인한 연체를 막을 수 있다." },
      { title: "정기적으로 점수 조회하기", desc: "토스·뱅크샐러드 등에서 무료로 신용점수를 조회하며 변화를 꾸준히 확인하자." },
      { title: "비금융 정보 등록", desc: "통신비·공공요금 납부 내역을 성실납부 정보로 등록하면 가점을 받을 수 있다." },
      { title: "카드론·현금서비스 주의", desc: "단기 대출을 자주 이용하면 신용점수에 부정적인 영향을 줄 수 있으니 최소화한다." },
    ],
  },
  {
    key: "emergency",
    icon: "🛟",
    title: "비상금·지출관리",
    items: [
      { title: "비상금 통장 분리", desc: "생활비 통장과 분리해 3~6개월치 생활비를 파킹통장에 따로 모아두는 습관." },
      { title: "예산 카테고리 나누기", desc: "고정지출·변동지출·저축을 나눠 예산을 짜면 새는 돈을 줄일 수 있다." },
      { title: "무지출 데이 만들기", desc: "일주일에 하루는 지출을 하지 않는 날을 정해 소비 습관을 점검한다." },
      { title: "구독 서비스 점검", desc: "매달 자동결제되는 구독 서비스 목록을 확인하고 안 쓰는 건 정리한다." },
    ],
  },
];

function Header({
  title,
  userEmail,
  onLogin,
  onEditAccount,
  onLogoutRequest,
}: {
  title: string;
  userEmail?: string | null;
  onLogin?: () => void;
  onEditAccount?: () => void;
  onLogoutRequest?: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 10,
        width: "100%",
        maxWidth: "640px",
        marginBottom: "8px",
        padding: "10px 4px 14px",
        background: "rgba(242,242,247,0.85)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <h1 style={{ fontSize: "28px", fontWeight: 800, letterSpacing: "-0.02em", textAlign: "left" }}>
        {title}
      </h1>
      {(onLogin || userEmail) && (
        <div style={{ position: "relative" }}>
          <button
            onClick={() => (userEmail ? setMenuOpen((v) => !v) : onLogin?.())}
            title={userEmail ? "계정 메뉴" : "로그인"}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 12px",
              borderRadius: "999px",
              border: "1px solid #e5e7eb",
              background: "#fff",
              fontSize: "13px",
              fontWeight: 700,
              color: userEmail ? "#374151" : "#f97316",
              cursor: "pointer",
            }}
          >
            {userEmail ? (
              <>
                <span style={{ fontSize: "15px" }}>👤</span>
                <span style={{ maxWidth: "90px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {userEmail}
                </span>
              </>
            ) : (
              "로그인"
            )}
          </button>

          {menuOpen && (
            <>
              <div
                onClick={() => setMenuOpen(false)}
                style={{ position: "fixed", inset: 0, zIndex: 15 }}
              />
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 6px)",
                  right: 0,
                  zIndex: 16,
                  background: "#fff",
                  borderRadius: "12px",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
                  minWidth: "150px",
                  overflow: "hidden",
                  textAlign: "left",
                }}
              >
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onEditAccount?.();
                  }}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "12px 16px",
                    background: "none",
                    border: "none",
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#374151",
                    textAlign: "left",
                    cursor: "pointer",
                  }}
                >
                  회원정보 수정
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onLogoutRequest?.();
                  }}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "12px 16px",
                    background: "none",
                    border: "none",
                    borderTop: "1px solid #f2f2f7",
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#dc2626",
                    textAlign: "left",
                    cursor: "pointer",
                  }}
                >
                  로그아웃
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

const TAB_ITEMS: { key: "home" | "quiz" | "invest" | "ai"; icon: string; label: string }[] = [
  { key: "home", icon: "🏠", label: "홈" },
  { key: "quiz", icon: "❓", label: "퀴즈" },
  { key: "invest", icon: "📈", label: "모의투자" },
  { key: "ai", icon: "✨", label: "AI챗봇" },
];

function TabBar({
  active,
  onNavigate,
}: {
  active: "home" | "quiz" | "invest" | "ai";
  onNavigate: (page: "home" | "quiz" | "invest" | "ai") => void;
}) {
  return (
    <div
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 30,
        display: "flex",
        justifyContent: "center",
        background: "rgba(255,255,255,0.9)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderTop: "1px solid rgba(60,60,67,0.12)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div style={{ display: "flex", width: "100%", maxWidth: "640px" }}>
        {TAB_ITEMS.map((item) => {
          const isActive = active === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              style={{
                flex: 1,
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "8px 2px 10px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "2px",
                color: isActive ? "#f97316" : "#8e8e93",
              }}
            >
              <span style={{ fontSize: "20px", lineHeight: 1 }}>{item.icon}</span>
              <span style={{ fontSize: "11px", fontWeight: isActive ? 700 : 500 }}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function translateAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "이메일 또는 비밀번호가 올바르지 않아요";
  if (m.includes("email not confirmed")) return "이메일 인증이 아직 완료되지 않았어요";
  if (m.includes("already registered")) return "이미 가입된 이메일이에요";
  if (m.includes("password should be at least")) return "비밀번호는 6자 이상이어야 해요";
  if (m.includes("email") && (m.includes("invalid") || m.includes("format"))) return "올바른 이메일 주소가 아니에요";
  if (m.includes("token") && (m.includes("expired") || m.includes("invalid"))) return "인증번호가 만료되었거나 올바르지 않아요";
  if (m.includes("rate limit")) return "요청 한도를 초과했어요. 잠시 후 다시 시도해주세요";
  if (m.includes("security purposes") || (m.includes("after") && m.includes("second"))) return "보안을 위해 잠시 후 다시 시도해주세요";
  if (m.includes("different from the old") || m.includes("same password")) return "새 비밀번호는 이전 비밀번호와 달라야 해요";
  if (m.includes("network")) return "네트워크 오류가 발생했어요. 잠시 후 다시 시도해주세요";
  return "오류가 발생했어요. 잠시 후 다시 시도해주세요";
}

function AuthModal({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [step, setStep] = useState<"form" | "otp">("form");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const submit = async () => {
    if (!supabase) {
      setError("Supabase 설정이 아직 안 되어 있어요. .env.local에 키를 추가해주세요.");
      return;
    }
    if (!email.trim() || !password) {
      setError("이메일과 비밀번호를 입력해주세요");
      return;
    }
    if (mode === "signup" && !nickname.trim()) {
      setError("닉네임을 입력해주세요");
      return;
    }
    setLoading(true);
    setError("");
    setMessage("");
    try {
      if (mode === "signup") {
        const { error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { nickname: nickname.trim() } },
        });
        if (signUpError) {
          setError(translateAuthError(signUpError.message));
        } else {
          setStep("otp");
          setMessage(`${email.trim()}로 보낸 인증번호를 입력해주세요`);
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (signInError) {
          setError(translateAuthError(signInError.message));
        } else {
          onClose();
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    if (!supabase) return;
    if (!otp.trim()) {
      setError("인증번호를 입력해주세요");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: otp.trim(),
        type: "signup",
      });
      if (verifyError) {
        setError(translateAuthError(verifyError.message));
      } else {
        onClose();
      }
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    if (!supabase) return;
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const { error: resendError } = await supabase.auth.resend({ type: "signup", email: email.trim() });
      if (resendError) setError(translateAuthError(resendError.message));
      else setMessage("인증번호를 다시 보냈어요");
    } finally {
      setLoading(false);
    }
  };

  if (step === "otp") {
    return (
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          zIndex: 80,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{ background: "#fff", borderRadius: "18px", padding: "24px", width: "100%", maxWidth: "360px", textAlign: "left" }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <p style={{ fontWeight: 800, fontSize: "17px" }}>인증번호 입력</p>
            <button onClick={onClose} aria-label="닫기" style={{ background: "none", border: "none", fontSize: "18px", color: "#9ca3af", cursor: "pointer" }}>
              ✕
            </button>
          </div>

          <input
            type="text"
            inputMode="numeric"
            maxLength={10}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            onKeyDown={(e) => e.key === "Enter" && verifyCode()}
            placeholder="인증번호"
            autoFocus
            style={{
              width: "100%",
              padding: "12px 14px",
              fontSize: "18px",
              letterSpacing: "0.2em",
              textAlign: "center",
              borderRadius: "10px",
              border: "1px solid #e5e7eb",
            }}
          />

          {error && <p style={{ fontSize: "12px", color: "#dc2626", marginTop: "10px" }}>{error}</p>}
          {message && <p style={{ fontSize: "12px", color: "#16a34a", marginTop: "10px" }}>{message}</p>}

          <button
            onClick={verifyCode}
            disabled={loading}
            style={{
              marginTop: "16px",
              width: "100%",
              padding: "13px",
              borderRadius: "10px",
              border: "none",
              background: loading ? "#fdba74" : "#f97316",
              color: "#fff",
              fontWeight: 700,
              fontSize: "14px",
              cursor: loading ? "default" : "pointer",
            }}
          >
            {loading ? "확인 중..." : "확인"}
          </button>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "12px" }}>
            <button
              onClick={() => {
                setStep("form");
                setOtp("");
                setError("");
                setMessage("");
              }}
              style={{ background: "none", border: "none", fontSize: "12px", color: "#9ca3af", cursor: "pointer" }}
            >
              ← 이메일 다시 입력
            </button>
            <button
              onClick={resendCode}
              disabled={loading}
              style={{ background: "none", border: "none", fontSize: "12px", color: "#f97316", fontWeight: 700, cursor: "pointer" }}
            >
              인증번호 재전송
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        zIndex: 80,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: "#fff", borderRadius: "18px", padding: "24px", width: "100%", maxWidth: "360px", textAlign: "left" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <p style={{ fontWeight: 800, fontSize: "17px" }}>{mode === "login" ? "로그인" : "회원가입"}</p>
          <button onClick={onClose} aria-label="닫기" style={{ background: "none", border: "none", fontSize: "18px", color: "#9ca3af", cursor: "pointer" }}>
            ✕
          </button>
        </div>

        <div style={{ display: "flex", gap: "6px", marginBottom: "16px", background: "#f2f2f7", borderRadius: "10px", padding: "4px" }}>
          {(["login", "signup"] as const).map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                setError("");
                setMessage("");
              }}
              style={{
                flex: 1,
                padding: "8px",
                borderRadius: "8px",
                border: "none",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
                background: mode === m ? "#fff" : "transparent",
                color: mode === m ? "#1c1c1e" : "#8e8e93",
                boxShadow: mode === m ? "0 1px 2px rgba(0,0,0,0.08)" : "none",
              }}
            >
              {m === "login" ? "로그인" : "회원가입"}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {mode === "signup" && (
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="닉네임"
              style={{ padding: "12px 14px", fontSize: "14px", borderRadius: "10px", border: "1px solid #e5e7eb" }}
            />
          )}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="이메일"
            style={{ padding: "12px 14px", fontSize: "14px", borderRadius: "10px", border: "1px solid #e5e7eb" }}
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="비밀번호 (6자 이상)"
            style={{ padding: "12px 14px", fontSize: "14px", borderRadius: "10px", border: "1px solid #e5e7eb" }}
          />
        </div>

        {error && <p style={{ fontSize: "12px", color: "#dc2626", marginTop: "10px" }}>{error}</p>}
        {message && <p style={{ fontSize: "12px", color: "#16a34a", marginTop: "10px" }}>{message}</p>}

        <button
          onClick={submit}
          disabled={loading}
          style={{
            marginTop: "16px",
            width: "100%",
            padding: "13px",
            borderRadius: "10px",
            border: "none",
            background: loading ? "#fdba74" : "#f97316",
            color: "#fff",
            fontWeight: 700,
            fontSize: "14px",
            cursor: loading ? "default" : "pointer",
          }}
        >
          {loading ? "처리 중..." : mode === "login" ? "로그인" : "회원가입"}
        </button>
      </div>
    </div>
  );
}

function AccountModal({ user, onClose }: { user: User; onClose: () => void }) {
  const [nickname, setNickname] = useState((user.user_metadata?.nickname as string) ?? "");
  const [nicknameStatus, setNicknameStatus] = useState("");
  const [nicknameLoading, setNicknameLoading] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [passwordStatus, setPasswordStatus] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  const saveNickname = async () => {
    if (!supabase) return;
    if (!nickname.trim()) {
      setNicknameStatus("닉네임을 입력해주세요");
      return;
    }
    setNicknameLoading(true);
    setNicknameStatus("");
    const { error } = await supabase.auth.updateUser({ data: { nickname: nickname.trim() } });
    setNicknameStatus(error ? translateAuthError(error.message) : "닉네임을 저장했어요");
    setNicknameLoading(false);
  };

  const changePassword = async () => {
    if (!supabase) return;
    if (newPassword.length < 6) {
      setPasswordStatus("비밀번호는 6자 이상이어야 해요");
      return;
    }
    setPasswordLoading(true);
    setPasswordStatus("");
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordStatus(error ? translateAuthError(error.message) : "비밀번호를 변경했어요");
    if (!error) setNewPassword("");
    setPasswordLoading(false);
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        zIndex: 80,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: "#fff", borderRadius: "18px", padding: "24px", width: "100%", maxWidth: "360px", textAlign: "left" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
          <p style={{ fontWeight: 800, fontSize: "17px" }}>회원정보 수정</p>
          <button onClick={onClose} aria-label="닫기" style={{ background: "none", border: "none", fontSize: "18px", color: "#9ca3af", cursor: "pointer" }}>
            ✕
          </button>
        </div>
        <p style={{ fontSize: "12px", color: "#9ca3af", marginBottom: "20px" }}>{user.email}</p>

        <p style={{ fontSize: "13px", fontWeight: 700, marginBottom: "8px" }}>닉네임</p>
        <div style={{ display: "flex", gap: "8px" }}>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="닉네임"
            style={{ flex: 1, padding: "10px 12px", fontSize: "14px", borderRadius: "10px", border: "1px solid #e5e7eb" }}
          />
          <button
            onClick={saveNickname}
            disabled={nicknameLoading}
            style={{ padding: "10px 16px", borderRadius: "10px", border: "none", background: "#f97316", color: "#fff", fontWeight: 700, fontSize: "13px", cursor: nicknameLoading ? "default" : "pointer" }}
          >
            저장
          </button>
        </div>
        {nicknameStatus && (
          <p style={{ fontSize: "12px", color: nicknameStatus === "닉네임을 저장했어요" ? "#16a34a" : "#dc2626", marginTop: "8px" }}>{nicknameStatus}</p>
        )}

        <p style={{ fontSize: "13px", fontWeight: 700, marginTop: "22px", marginBottom: "8px" }}>비밀번호 변경</p>
        <div style={{ display: "flex", gap: "8px" }}>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && changePassword()}
            placeholder="새 비밀번호 (6자 이상)"
            style={{ flex: 1, padding: "10px 12px", fontSize: "14px", borderRadius: "10px", border: "1px solid #e5e7eb" }}
          />
          <button
            onClick={changePassword}
            disabled={passwordLoading}
            style={{ padding: "10px 16px", borderRadius: "10px", border: "none", background: "#f97316", color: "#fff", fontWeight: 700, fontSize: "13px", cursor: passwordLoading ? "default" : "pointer" }}
          >
            변경
          </button>
        </div>
        {passwordStatus && (
          <p style={{ fontSize: "12px", color: passwordStatus === "비밀번호를 변경했어요" ? "#16a34a" : "#dc2626", marginTop: "8px" }}>{passwordStatus}</p>
        )}
      </div>
    </div>
  );
}

function LogoutConfirmModal({ onClose, onConfirm }: { onClose: () => void; onConfirm: () => void }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        zIndex: 90,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: "#fff", borderRadius: "18px", padding: "22px", width: "100%", maxWidth: "340px", textAlign: "left" }}
      >
        <p style={{ fontWeight: 800, fontSize: "16px" }}>로그아웃 하시겠습니까?</p>
        <div style={{ display: "flex", gap: "8px", marginTop: "18px" }}>
          <button
            onClick={onClose}
            style={{ flex: 1, padding: "12px", borderRadius: "10px", border: "none", background: "#f2f2f7", fontWeight: 700, fontSize: "14px", cursor: "pointer" }}
          >
            취소
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            style={{ flex: 1, padding: "12px", borderRadius: "10px", border: "none", background: "#dc2626", color: "#fff", fontWeight: 700, fontSize: "14px", cursor: "pointer" }}
          >
            로그아웃
          </button>
        </div>
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

function MorningLetterModal({ userId }: { userId: string | null }) {
  const [hasHistory, setHasHistory] = useState<boolean | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready">("idle");
  const [content, setContent] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const didInit = useRef(false);

  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;

    const run = async () => {
      const today = localDateStr(new Date());
      const log: TradeRecord[] = userId
        ? (await fetchTrades(userId)).map((t, i) => ({ id: `${i}`, ...t, mode: t.mode as InvestMode | undefined }))
        : loadTradeLog();
      if (log.length === 0) {
        setHasHistory(false);
        return;
      }
      setHasHistory(true);

      const seenKey = `${MORNING_LETTER_SEEN_PREFIX}${today}`;
      const alreadySeenToday = !!window.localStorage.getItem(seenKey);

      const localCached = loadMorningLetter();
      const cachedContent = userId
        ? await fetchMorningLetter(userId, today)
        : localCached && localCached.date === today
        ? localCached.content
        : null;
      if (cachedContent) {
        setContent(cachedContent);
        setStatus("ready");
        if (!alreadySeenToday) {
          setModalOpen(true);
          window.localStorage.setItem(seenKey, "1");
        }
        return;
      }

      setStatus("loading");
      setModalOpen(true);
      let finalText = "";
      try {
        const [usNews, krNews] = await Promise.all([
          fetchNewsHeadlines("미국 경제", "미국 경제"),
          fetchNewsHeadlines("국내 경제", "국내 경제"),
        ]);
        const holdings = deriveHoldingsFromLog(log);
        const recentSymbols = Array.from(
          new Set(
            log
              .slice()
              .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time))
              .map((t) => t.symbol)
          )
        ).slice(0, 5);
        const symbolNewsParts = await Promise.all(recentSymbols.map((s) => fetchNewsHeadlines(s)));
        const recentTrades = log
          .slice()
          .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
          .slice(-10);
        const tradesText = recentTrades
          .map((t) => `- ${t.date} ${t.time} ${t.action} ${t.symbol} ${t.qty}개 @ ${formatWon(t.price)} (이유: ${t.reason})`)
          .join("\n");
        const holdingsText = Object.keys(holdings).length
          ? Object.entries(holdings)
              .map(([s, q]) => `${s} ${q}개`)
              .join(", ")
          : "없음";

        const prompt = `오늘은 ${today}이야. 사용자에게 매일 아침 보내는 투자 습관 편지를 써줘.

[최근 미국 경제 뉴스]${usNews || "\n(뉴스 없음)"}

[최근 국내 경제 뉴스]${krNews || "\n(뉴스 없음)"}

[현재 보유 종목]
${holdingsText}

[보유·거래 종목 관련 최근 뉴스]${symbolNewsParts.join("") || "\n(뉴스 없음)"}

[최근 매수·매도 기록과 이유]
${tradesText || "(거래 기록 없음)"}

위 정보를 바탕으로 아래 3개 항목으로 구성된 편지를 써줘:
1. 잘한 점
2. 아쉬운 점
3. 개선하면 좋은 점

작성 시 유의사항:
- 수익률 결과만으로 평가하지 말고, 뉴스로 확인되는 시장 상황 변화와 사용자가 적은 매수·매도 이유가 서로 논리적으로 맞아떨어지는지를 중요하게 평가해줘.
- 특정 종목을 지금 사거나 팔라고 직접 추천하지 마.
- 편지처럼 다정하고 담백한 톤으로, 인사로 시작해줘.
- 각 항목은 2~4문장 정도로 구체적으로 써줘.`;

        const res = await fetch("/api/coach-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: [{ role: "user", content: prompt }] }),
        });
        let text = "";
        if (res.ok && res.body) {
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            text += decoder.decode(value, { stream: true });
          }
        }
        finalText = text.trim();
      } catch {
        finalText = "";
      }
      if (!finalText) finalText = "편지를 불러오지 못했어요. 잠시 후 다시 열어봐 주세요.";
      setContent(finalText);
      setStatus("ready");
      if (userId) await saveMorningLetterDb(userId, today, finalText);
      else saveMorningLetter({ date: today, content: finalText });
      window.localStorage.setItem(seenKey, "1");
    };

    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!hasHistory) return null;

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          width: "100%",
          textAlign: "left",
          background: "linear-gradient(135deg, #fff7ed, #ffedd5)",
          border: "1px solid #fed7aa",
          borderRadius: "14px",
          padding: "14px 16px",
          cursor: "pointer",
        }}
      >
        <span style={{ fontSize: "20px" }}>☀️</span>
        <span style={{ fontWeight: 700, fontSize: "14px", color: "#9a3412" }}>
          {status === "loading" ? "오늘의 투자 편지를 쓰는 중이에요..." : "오늘의 투자 편지 보기"}
        </span>
      </button>

      {modalOpen && (
        <div
          onClick={() => setModalOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 70,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: "20px",
              padding: "22px",
              width: "100%",
              maxWidth: "420px",
              maxHeight: "85vh",
              overflowY: "auto",
              textAlign: "left",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <p style={{ fontWeight: 800, fontSize: "16px" }}>☀️ 오늘의 투자 편지</p>
              <button
                onClick={() => setModalOpen(false)}
                aria-label="편지 닫기"
                style={{ background: "none", border: "none", fontSize: "18px", color: "#9ca3af", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>
            <p style={{ fontSize: "11px", color: "#9ca3af", marginBottom: "14px", lineHeight: 1.5 }}>
              투자 조언이 아니라 모의투자 습관에 대한 AI 피드백이에요. 특정 종목 매수·매도 추천이나 수익 보장은 하지 않아요 — 실제 투자 결정은 반드시 전문가와 상담하세요.
            </p>
            {status === "loading" ? (
              <p style={{ fontSize: "13px", color: "#9ca3af" }}>편지를 쓰는 중이에요...</p>
            ) : (
              <p style={{ fontSize: "14px", lineHeight: 1.7, whiteSpace: "pre-wrap", color: "#374151" }}>{content}</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function HomePage({ userId }: { userId: string | null }) {
  const [category, setCategory] = useState("전체");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [news, setNews] = useState<NewsItem[] | null>(null);
  const [newsError, setNewsError] = useState("");
  const [openInfoCategory, setOpenInfoCategory] = useState<string | null>(null);

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
      <MorningLetterModal userId={userId} />

      <section
        style={{
          background: "#ffffff",
          boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.05)",
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
            placeholder="검색"
            style={{
              flex: 1,
              padding: "9px 12px",
              fontSize: "13px",
              boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.05)",
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
          boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.05)",
          borderRadius: "12px",
          padding: "20px 24px",
          textAlign: "left",
        }}
      >
        <p style={{ fontWeight: 800, fontSize: "16px", marginBottom: "12px" }}>
          💡 20·30대가 알아야 할 금융 정보
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {FINANCE_INFO_CATEGORIES.map((cat) => {
            const isOpen = openInfoCategory === cat.key;
            return (
              <div
                key={cat.key}
                style={{
                  border: "1px solid #fed7aa",
                  borderRadius: "10px",
                  overflow: "hidden",
                }}
              >
                <button
                  onClick={() => setOpenInfoCategory(isOpen ? null : cat.key)}
                  style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "14px 16px",
                    background: isOpen ? "#fff7ed" : "#fff",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <span style={{ fontWeight: 700, fontSize: "14px", color: "#9a3412" }}>
                    {cat.icon} {cat.title}
                  </span>
                  <span
                    style={{
                      fontSize: "13px",
                      color: "#9a3412",
                      transform: isOpen ? "rotate(180deg)" : "none",
                      transition: "transform 0.2s ease",
                    }}
                  >
                    ▾
                  </span>
                </button>
                {isOpen && (
                  <div style={{ padding: "4px 16px 14px", display: "flex", flexDirection: "column", gap: "10px" }}>
                    {cat.items.map((t, i) => (
                      <div
                        key={i}
                        style={{
                          background: "#fff7ed",
                          border: "1px solid #fed7aa",
                          borderRadius: "8px",
                          padding: "12px",
                        }}
                      >
                        <p style={{ fontWeight: 700, fontSize: "13px", color: "#9a3412" }}>{t.title}</p>
                        <p style={{ fontSize: "12px", color: "#6b7280", marginTop: "6px", lineHeight: 1.5 }}>
                          {t.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}


type QuizQuestion = { q: string; a: boolean; explain: string };

const QUIZ_QUESTIONS: QuizQuestion[] = [
  { q: "매수는 주식을 사는 것이고, 매도는 파는 것이다.", a: true, explain: "매수=사기, 매도=팔기가 맞습니다." },
  { q: "시가는 하루 중 가장 마지막에 거래된 가격을 말한다.", a: false, explain: "시가는 그날 첫 거래가, 마지막 가격은 종가입니다." },
  { q: "상한가란 하루 동안 오를 수 있는 최대 가격을 의미한다.", a: true, explain: "하루 변동폭에는 상한가·하한가라는 상하 제한이 있습니다." },
  { q: "공매도는 주식을 먼저 사고 나중에 파는 투자 방식이다.", a: false, explain: "공매도는 주식을 빌려 먼저 팔고, 나중에 되사서 갚는 방식입니다." },
  { q: "우선주는 보통주보다 배당을 우선적으로 받을 수 있지만 의결권이 없는 경우가 많다.", a: true, explain: "우선주는 배당·청산 우선권이 있는 대신 의결권이 제한되는 경우가 많습니다." },
  { q: "배당은 회사가 벌어들인 이익 일부를 주주에게 나눠주는 것이다.", a: true, explain: "배당은 이익 일부를 주주에게 분배하는 것입니다." },
  { q: "액면분할을 하면 회사의 전체 가치(시가총액)가 커진다.", a: false, explain: "주식 수만 늘어날 뿐, 회사의 전체 가치는 원칙적으로 변하지 않습니다." },
  { q: "거래정지된 종목은 정지 기간 동안 매수·매도를 할 수 없다.", a: true, explain: "거래정지 기간에는 매매 자체가 불가능합니다." },
  { q: "체결이란 매수 주문과 매도 주문이 가격과 수량이 맞아 거래가 성사되는 것이다.", a: true, explain: "매수·매도 주문이 맞아떨어져 거래가 이뤄지는 것을 체결이라 합니다." },
  { q: "호가창에는 매수 주문만 표시되고 매도 주문은 표시되지 않는다.", a: false, explain: "호가창에는 매수 호가와 매도 호가가 함께 표시됩니다." },
  { q: "코스피는 대형 우량주 중심의 시장이고, 코스닥은 상대적으로 중소·벤처기업 중심의 시장이다.", a: true, explain: "코스피는 대형주, 코스닥은 중소·벤처기업이 많은 시장으로 알려져 있습니다." },
  { q: "한국 주식시장은 24시간 거래가 가능하다.", a: false, explain: "국내 정규장은 09:00~15:30로 운영시간이 정해져 있습니다." },
  { q: "서킷브레이커는 주가가 급격히 변동할 때 일시적으로 거래를 정지시키는 제도다.", a: true, explain: "시장 급변 시 일시적으로 매매를 정지시키는 제도입니다." },
  { q: "상장폐지되면 그 회사의 주식을 더 이상 거래소에서 거래할 수 없다.", a: true, explain: "상장폐지 시 거래소를 통한 매매가 불가능해집니다." },
  { q: "스팩(SPAC)은 실체 없는 페이퍼컴퍼니로, 다른 비상장기업과 합병하기 위해 만들어진다.", a: true, explain: "스팩은 비상장기업과의 합병을 목적으로 만들어진 특수목적회사입니다." },
  { q: "무상증자는 주주가 돈을 새로 내고 주식을 더 받는 것이다.", a: false, explain: "돈을 내지 않고 주식을 받는 것이 무상증자, 돈을 내는 것은 유상증자입니다." },
  { q: "유상증자를 하면 발행 주식 수가 늘어나면서 기존 주주의 지분율이 희석될 수 있다.", a: true, explain: "새 주식이 발행되면 기존 주주의 지분율이 낮아질 수 있습니다." },
  { q: "코스피 지수가 오르면 코스피에 상장된 모든 종목의 가격이 반드시 오른다.", a: false, explain: "지수는 전체적인 흐름이며, 개별 종목은 다르게 움직일 수 있습니다." },
  { q: "사이드카는 선물 시장이 급변할 때 프로그램 매매 효력을 일시 정지하는 제도다.", a: true, explain: "선물시장 급변 시 프로그램 매매를 일시 정지시키는 제도입니다." },
  { q: "우회상장은 비상장기업이 상장기업과의 합병 등을 통해 정식 상장 절차 없이 증시에 진입하는 방법이다.", a: true, explain: "정식 공모 절차 없이 합병 등으로 증시에 진입하는 방식입니다." },
  { q: "일반적으로 시장 금리가 오르면 기존에 발행된 채권의 가격은 떨어지는 경향이 있다.", a: true, explain: "금리와 채권 가격은 대체로 반대 방향으로 움직입니다." },
  { q: "채권은 주식과 달리 정해진 만기와 이자(쿠폰)가 있는 경우가 많다.", a: true, explain: "채권은 대부분 만기와 이자가 정해져 있는 상품입니다." },
  { q: "신용등급이 낮은 채권일수록 부도 위험이 낮아 금리가 낮게 형성된다.", a: false, explain: "신용등급이 낮을수록 위험이 커서 금리(수익률)가 더 높게 형성됩니다." },
  { q: "국채는 국가가 발행하는 채권으로 일반적으로 회사채보다 안전하다고 평가된다.", a: true, explain: "국가가 발행하는 만큼 상대적으로 안전하다고 평가됩니다." },
  { q: "채권의 듀레이션이 길수록 금리 변화에 따른 가격 변동성이 커지는 경향이 있다.", a: true, explain: "듀레이션이 길수록 금리 변화에 더 민감하게 반응합니다." },
  { q: "채권을 만기까지 보유하면 발행 시 약속된 원금과 이자를 받을 수 있다(발행자가 부도나지 않는다면).", a: true, explain: "부도가 없다면 약속된 원금과 이자를 만기에 받을 수 있습니다." },
  { q: "회사채는 국채보다 항상 금리가 낮다.", a: false, explain: "위험이 더 크기 때문에 회사채 금리가 국채보다 높은 경우가 많습니다." },
  { q: "콜옵션이 있는 채권은 발행자가 만기 전에 채권을 조기 상환할 수 있는 권리를 가진다.", a: true, explain: "콜옵션이 있으면 발행자가 만기 전 조기상환을 할 수 있습니다." },
  { q: "채권 가격과 채권 금리(수익률)는 반대 방향으로 움직이는 경향이 있다.", a: true, explain: "채권 가격과 수익률은 대체로 역의 관계입니다." },
  { q: "개인은 국채를 매입할 수 없고 금융기관만 매입할 수 있다.", a: false, explain: "개인도 국채를 매입할 수 있습니다." },
  { q: "인덱스펀드는 특정 지수를 그대로 추종하도록 설계된 펀드다.", a: true, explain: "인덱스펀드는 지수를 그대로 추종하는 것을 목표로 합니다." },
  { q: "액티브펀드는 인덱스펀드보다 일반적으로 운용 수수료가 낮다.", a: false, explain: "액티브펀드는 매니저가 적극적으로 운용해 수수료가 더 높은 경우가 많습니다." },
  { q: "ETF는 주식처럼 거래소에서 실시간으로 사고팔 수 있는 펀드다.", a: true, explain: "ETF는 거래소에 상장되어 실시간 매매가 가능한 펀드입니다." },
  { q: "리츠(REITs)는 여러 투자자의 돈을 모아 부동산에 투자하고 수익을 배당하는 상품이다.", a: true, explain: "리츠는 부동산에 투자해 수익을 배당하는 상품입니다." },
  { q: "적립식 투자는 매달 일정 금액을 나눠서 투자해 매입 시점을 분산하는 방법이다.", a: true, explain: "매달 나눠 투자해 매입 시점 리스크를 분산하는 방식입니다." },
  { q: "TDF(타겟데이트펀드)는 투자자의 은퇴 시점에 맞춰 자동으로 자산 배분을 조정해주는 펀드다.", a: true, explain: "은퇴 목표 시점에 맞춰 자산 배분을 자동 조정하는 펀드입니다." },
  { q: "한 종목에 자산을 몰아서 투자하는 것이 분산투자보다 항상 안전하다.", a: false, explain: "한 종목에 몰아서 투자하면 오히려 리스크가 커집니다." },
  { q: "ETF는 항상 손실이 나지 않는 안전한 상품이다.", a: false, explain: "ETF도 기초자산 가격에 따라 손실이 날 수 있습니다." },
  { q: "펀드에 가입하면 원금이 보장된다.", a: false, explain: "대부분의 펀드는 원금이 보장되지 않습니다." },
  { q: "배당 ETF는 정기적으로 배당금을 지급하는 자산들을 모아 담은 ETF다.", a: true, explain: "배당을 주는 자산들을 모아 담아 정기적으로 배당하는 ETF입니다." },
  { q: "대출이나 카드값을 연체하면 신용점수가 떨어질 수 있다.", a: true, explain: "연체는 신용점수에 부정적인 영향을 줍니다." },
  { q: "신용카드 한도 대비 사용 비율(이용률)이 낮을수록 신용점수에 유리한 경우가 많다.", a: true, explain: "카드 이용률이 낮을수록 신용점수에 유리한 경우가 많습니다." },
  { q: "신용점수를 자주 조회하면 그 자체로 신용점수가 크게 떨어진다.", a: false, explain: "본인이 직접 조회하는 것은 대부분 신용점수에 영향을 주지 않습니다." },
  { q: "통신비나 공공요금을 성실히 납부한 내역을 등록하면 신용점수에 가점을 받을 수 있다.", a: true, explain: "비금융 성실납부 정보 등록으로 가점을 받을 수 있습니다." },
  { q: "카드론이나 현금서비스를 자주 이용하면 신용점수에 부정적인 영향을 줄 수 있다.", a: true, explain: "단기 고금리 대출을 자주 쓰면 신용점수에 부정적입니다." },
  { q: "신용점수가 높을수록 대출을 받을 때 더 낮은 금리를 적용받을 가능성이 높다.", a: true, explain: "신용점수가 높으면 우대금리를 받을 가능성이 커집니다." },
  { q: "신용점수는 한 번 오르면 이후로 절대 떨어지지 않는다.", a: false, explain: "관리를 소홀히 하면 다시 떨어질 수 있습니다." },
  { q: "소득이 높을수록 신용점수도 항상 높다.", a: false, explain: "소득과 신용점수는 다른 개념으로, 소득이 높아도 연체 등으로 낮을 수 있습니다." },
  { q: "여러 금융회사에 대출을 동시에 많이 신청하면 신용점수에 부정적 영향을 줄 수 있다.", a: true, explain: "짧은 기간의 다중 대출 신청은 부정적 신호로 작용할 수 있습니다." },
  { q: "신용점수는 토스, 뱅크샐러드 등의 앱에서 무료로 조회할 수 있다.", a: true, explain: "여러 앱에서 무료로 신용점수를 조회할 수 있습니다." },
  { q: "예금자보호제도에 따라 은행이 파산해도 예금자는 금융회사당 일정 한도까지 보호받을 수 있다.", a: true, explain: "예금자보호법에 따라 금융회사당 일정 한도까지 보호됩니다." },
  { q: "파킹통장은 하루만 맡겨도 이자가 붙는 통장이다.", a: true, explain: "파킹통장은 짧은 기간만 맡겨도 이자가 붙는 통장입니다." },
  { q: "정기적금은 매달 금액이 자유롭게 달라져도 되는 상품이다.", a: false, explain: "금액이 자유로운 건 자유적립식이고, 정기적금은 보통 고정 금액입니다." },
  { q: "복리는 원금에 대해서만 이자가 붙고, 이전에 붙은 이자에는 이자가 붙지 않는 방식이다.", a: false, explain: "그 방식은 단리이고, 복리는 이자에도 다시 이자가 붙는 방식입니다." },
  { q: "청년도약계좌는 정부가 일정 금액을 매칭 지원해주는 청년 전용 저축 상품이다.", a: true, explain: "정부 매칭지원금이 더해지는 청년 전용 상품입니다." },
  { q: "적금의 이자에는 세금이 전혀 부과되지 않는다.", a: false, explain: "일반적으로 이자소득세가 부과되며, 비과세 상품은 예외적입니다." },
  { q: "비상금은 생활비 통장과 분리해서 따로 모아두는 것이 좋다.", a: true, explain: "비상금은 생활비와 분리해 관리하는 것이 권장됩니다." },
  { q: "풍차적금은 매달 새로운 적금에 가입해 만기를 분산시키는 저축 방법이다.", a: true, explain: "매달 새 적금에 가입해 만기를 분산시키는 방법입니다." },
  { q: "예금은 한번에 목돈을 넣고, 적금은 매달 나눠서 돈을 넣는 방식이 일반적이다.", a: true, explain: "예금은 목돈 예치, 적금은 매달 납입이 일반적인 형태입니다." },
  { q: "저축은행은 시중은행보다 예금자보호 한도가 다르게 적용된다.", a: false, explain: "예금자보호 한도는 저축은행도 시중은행과 동일하게 금융회사당 적용됩니다." },
  { q: "ISA(개인종합자산관리계좌)는 여러 금융상품을 한 계좌에서 운용하며 세제 혜택을 받을 수 있는 계좌다.", a: true, explain: "ISA는 여러 상품을 한 계좌에서 운용하며 세제 혜택을 주는 계좌입니다." },
  { q: "국내 상장주식을 매도할 때 발생하는 이익에는 모든 개인투자자가 예외 없이 양도소득세를 낸다.", a: false, explain: "대주주 등이 아닌 일반 소액주주는 대부분 양도소득세가 면제됩니다." },
  { q: "배당을 받으면 배당소득에 대해 세금이 부과될 수 있다.", a: true, explain: "배당소득에는 세금이 부과될 수 있습니다." },
  { q: "연말정산을 통해 근로자는 낸 세금 중 일부를 돌려받거나 더 낼 수 있다.", a: true, explain: "연말정산 결과에 따라 환급 또는 추가 납부가 발생할 수 있습니다." },
  { q: "퇴직연금은 IRP, DB형, DC형 등의 형태로 운영될 수 있다.", a: true, explain: "퇴직연금은 IRP·DB·DC 등 여러 형태로 운영됩니다." },
  { q: "해외주식 투자로 얻은 양도차익은 국내주식과 세금 처리 방식이 완전히 동일하다.", a: false, explain: "해외주식은 대부분 양도소득세 과세 대상으로 국내주식과 처리 방식이 다릅니다." },
  { q: "청년희망적금 같은 청년 전용 상품은 일반적으로 저축장려금 등 추가 혜택을 제공한다.", a: true, explain: "청년 전용 상품은 저축장려금 등 추가 혜택이 있는 경우가 많습니다." },
  { q: "세금우대 계좌를 활용하면 동일한 수익이라도 실제 손에 쥐는 돈이 늘어날 수 있다.", a: true, explain: "세제 혜택으로 실수령액이 늘어날 수 있습니다." },
  { q: "종합소득세 신고는 근로소득만 있는 사람도 반드시 매년 따로 해야 한다.", a: false, explain: "근로소득만 있으면 대부분 연말정산으로 끝나 별도 신고가 필요 없는 경우가 많습니다." },
  { q: "금융소득이 일정 금액을 초과하면 종합소득에 합산되어 과세될 수 있다(금융소득종합과세).", a: true, explain: "일정 금액을 초과하면 금융소득종합과세 대상이 될 수 있습니다." },
  { q: "비트코인은 발행량이 정해져 있어 무한정 채굴될 수 없다.", a: true, explain: "비트코인은 최대 발행량이 정해져 있습니다." },
  { q: "업비트, 빗썸 등은 국내 암호화폐 거래소다.", a: true, explain: "업비트·빗썸은 국내의 대표적인 암호화폐 거래소입니다." },
  { q: "암호화폐는 주식처럼 상한가·하한가 제한이 없어 하루에도 가격이 크게 출렁일 수 있다.", a: true, explain: "가격제한이 없어 변동폭이 매우 커질 수 있습니다." },
  { q: "암호화폐는 예금자보호법의 보호를 받는 안전한 자산이다.", a: false, explain: "암호화폐는 예금자보호 대상이 아닙니다." },
  { q: "반감기는 비트코인 채굴 보상이 일정 주기로 절반으로 줄어드는 이벤트를 말한다.", a: true, explain: "반감기마다 채굴 보상이 절반으로 줄어듭니다." },
  { q: "알트코인은 비트코인을 제외한 다른 암호화폐를 통칭하는 말이다.", a: true, explain: "비트코인 외의 암호화폐를 알트코인이라고 부릅니다." },
  { q: "코인 투자는 주식보다 변동성이 낮아 안정적인 투자로 알려져 있다.", a: false, explain: "코인은 일반적으로 주식보다 변동성이 훨씬 큰 자산으로 알려져 있습니다." },
  { q: "스테이블코인은 달러 등 특정 자산과 가치를 연동시켜 가격 변동을 줄이려는 코인이다.", a: true, explain: "특정 자산과 가치를 연동해 가격 안정을 목표로 하는 코인입니다." },
  { q: "지갑의 개인키(프라이빗 키)를 잃어버려도 언제든 거래소에 문의하면 복구할 수 있다.", a: false, explain: "개인키 분실 시 복구가 매우 어렵거나 불가능한 경우가 많습니다." },
  { q: "코인 시장은 주식시장과 달리 정규 개장·마감 시간 없이 연중 거래가 이뤄진다.", a: true, explain: "코인 시장은 정해진 개장·마감 없이 연중 거래됩니다." },
  { q: "기준금리가 오르면 대체로 대출이자 부담이 커지는 경향이 있다.", a: true, explain: "기준금리 상승은 대체로 대출이자 부담을 높입니다." },
  { q: "환율이 오른다는 것(원화 약세)은 같은 금액의 원화로 살 수 있는 외국 돈이 줄어든다는 의미다.", a: true, explain: "원화 약세는 같은 원화로 살 수 있는 외화가 줄어드는 것을 의미합니다." },
  { q: "인플레이션이 심해지면 화폐의 실질 구매력은 떨어지는 경향이 있다.", a: true, explain: "물가가 오르면 같은 돈으로 살 수 있는 양이 줄어듭니다." },
  { q: "실업률이 오르면 일반적으로 소비와 경기에 부정적 영향을 줄 수 있다.", a: true, explain: "실업률 상승은 대체로 소비와 경기에 부정적 영향을 줍니다." },
  { q: "GDP는 한 나라 안에서 일정 기간 생산된 재화와 서비스의 총합을 나타내는 지표다.", a: true, explain: "GDP는 국내에서 생산된 재화·서비스의 총합을 나타냅니다." },
  { q: "중앙은행이 기준금리를 내리면 일반적으로 시중에 돈이 덜 풀리는 효과가 있다.", a: false, explain: "금리를 내리면 대체로 시중에 돈이 더 풀리는 효과가 있습니다." },
  { q: "물가가 오르는 것과 화폐 가치가 오르는 것은 같은 의미다.", a: false, explain: "물가가 오르면 오히려 화폐의 실질 가치는 떨어지는 관계입니다." },
  { q: "미국 금리 정책은 한국을 포함한 다른 나라 금융시장에도 영향을 줄 수 있다.", a: true, explain: "미국 금리 정책은 세계 금융시장에 영향을 줄 수 있습니다." },
  { q: "무역수지 흑자는 수출이 수입보다 많다는 것을 의미한다.", a: true, explain: "무역수지 흑자는 수출이 수입보다 많은 상태를 의미합니다." },
  { q: "경기침체기에는 일반적으로 기업들의 채용이 늘어나는 경향이 있다.", a: false, explain: "경기침체기에는 대체로 채용이 줄어드는 경향이 있습니다." },
  { q: "분산투자는 여러 자산에 나눠 투자해 한 곳에서 발생한 손실의 충격을 줄이는 전략이다.", a: true, explain: "분산투자는 리스크를 낮추기 위한 대표적인 전략입니다." },
  { q: "손절매는 손실이 더 커지기 전에 정해둔 기준에 따라 매도하는 것을 말한다.", a: true, explain: "정해둔 기준에서 손실을 확정하고 매도하는 것이 손절매입니다." },
  { q: "감당할 수 없는 빚을 내서 투자하는 것은 리스크 관리 측면에서 권장되지 않는다.", a: true, explain: "과도한 빚투는 리스크 관리 측면에서 권장되지 않습니다." },
  { q: "투자에서 '몰빵'은 한 종목에 자금을 집중하는 것으로 기대수익과 함께 리스크도 커진다.", a: true, explain: "한 종목에 집중하면 기대수익과 함께 리스크도 커집니다." },
  { q: "장기투자자는 단기적인 가격 변동에 일일이 반응해 매매하는 것이 권장된다.", a: false, explain: "장기투자는 단기 변동에 일희일비하지 않는 것이 일반적으로 권장됩니다." },
  { q: "투자 전에는 감당 가능한 손실 범위와 투자 목적을 먼저 점검하는 것이 좋다.", a: true, explain: "투자 전 손실 감내 범위와 목적을 점검하는 것이 좋습니다." },
  { q: "소문이나 지인의 추천만 믿고 충분한 확인 없이 투자하는 것은 위험할 수 있다.", a: true, explain: "충분한 확인 없는 투자는 위험할 수 있습니다." },
  { q: "평단가를 낮추기 위해 무조건 하락하는 종목을 계속 추가매수하는 것은 항상 안전한 전략이다.", a: false, explain: "'물타기'는 오히려 손실을 더 키울 위험이 있는 전략입니다." },
  { q: "여유자금이 아닌 생활비로 투자를 하는 것은 위험 관리 측면에서 바람직하지 않다.", a: true, explain: "생활비로 투자하는 것은 위험 관리 측면에서 바람직하지 않습니다." },
  { q: "목표수익률과 목표기간을 정해두면 투자 계획을 세우는 데 도움이 될 수 있다.", a: true, explain: "목표수익률·기간 설정은 투자 계획 수립에 도움이 됩니다." },
];

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const QUIZ_ROUND_SIZE = 10;

function pickQuizRound(): QuizQuestion[] {
  return shuffle(QUIZ_QUESTIONS).slice(0, QUIZ_ROUND_SIZE);
}

function QuizCalendarModal({ quizLog, onClose }: { quizLog: QuizResult[]; onClose: () => void }) {
  const today = new Date();
  const todayStr = localDateStr(today);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(todayStr);

  const resultsByDate = quizLog.reduce<Record<string, QuizResult[]>>((acc, r) => {
    (acc[r.date] ??= []).push(r);
    return acc;
  }, {});

  const firstOfMonth = new Date(viewYear, viewMonth, 1);
  const startWeekday = firstOfMonth.getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const totalCells = Math.ceil((startWeekday + daysInMonth) / 7) * 7;

  const cells: { day: number; dateStr: string; inMonth: boolean }[] = [];
  for (let i = 0; i < totalCells; i++) {
    const dayOffset = i - startWeekday + 1;
    const d = new Date(viewYear, viewMonth, dayOffset);
    cells.push({ day: d.getDate(), dateStr: localDateStr(d), inMonth: d.getMonth() === viewMonth });
  }

  const goPrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else setViewMonth((m) => m - 1);
  };
  const goNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else setViewMonth((m) => m + 1);
  };

  const selectedResults = (resultsByDate[selectedDate] ?? []).slice().sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        zIndex: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ position: "relative", background: "#fff", borderRadius: "20px", padding: "20px", width: "100%", maxWidth: "380px", maxHeight: "85vh", overflowY: "auto", textAlign: "left" }}
      >
        <button
          onClick={onClose}
          aria-label="닫기"
          style={{ position: "absolute", top: "14px", right: "14px", background: "none", border: "none", fontSize: "18px", color: "#9ca3af", cursor: "pointer", lineHeight: 1, padding: "4px" }}
        >
          ✕
        </button>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "20px", marginBottom: "16px" }}>
          <button onClick={goPrevMonth} style={{ background: "none", border: "none", fontSize: "18px", color: "#f97316", cursor: "pointer", padding: "4px 10px" }}>
            ‹
          </button>
          <p style={{ fontWeight: 800, fontSize: "17px" }}>
            {viewYear}년 {viewMonth + 1}월
          </p>
          <button onClick={goNextMonth} style={{ background: "none", border: "none", fontSize: "18px", color: "#f97316", cursor: "pointer", padding: "4px 10px" }}>
            ›
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", textAlign: "center", fontSize: "12px", color: "#9ca3af", marginBottom: "6px" }}>
          {["일", "월", "화", "수", "목", "금", "토"].map((w) => (
            <span key={w}>{w}</span>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", rowGap: "4px" }}>
          {cells.map((c, i) => {
            const hasResult = !!resultsByDate[c.dateStr]?.length;
            const isSelected = c.dateStr === selectedDate;
            const isToday = c.dateStr === todayStr;
            return (
              <button
                key={i}
                onClick={() => setSelectedDate(c.dateStr)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "2px",
                  padding: "6px 0",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  opacity: c.inMonth ? 1 : 0.3,
                }}
              >
                <span
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "13px",
                    fontWeight: isToday ? 800 : 500,
                    background: isSelected ? "#f97316" : "transparent",
                    color: isSelected ? "#fff" : isToday ? "#f97316" : "#1c1c1e",
                  }}
                >
                  {c.day}
                </span>
                <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: hasResult ? "#f97316" : "transparent" }} />
              </button>
            );
          })}
        </div>

        <div style={{ marginTop: "18px", borderTop: "1px solid #e5e5ea", paddingTop: "14px" }}>
          <p style={{ fontWeight: 700, fontSize: "14px", marginBottom: "8px" }}>{selectedDate} 퀴즈 기록</p>
          {selectedResults.length === 0 ? (
            <p style={{ fontSize: "13px", color: "#9ca3af" }}>이 날짜엔 퀴즈 기록이 없어요</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {selectedResults.map((r) => {
                const pct = Math.round((r.score / r.total) * 100);
                return (
                  <div key={r.id} style={{ background: "#f2f2f7", borderRadius: "12px", padding: "10px 12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontWeight: 700 }}>
                      <span>{r.score}/{r.total}개 정답</span>
                      <span style={{ color: "#6b7280", fontWeight: 500 }}>{r.time}</span>
                    </div>
                    <p style={{ fontSize: "20px", fontWeight: 800, color: "#f97316", marginTop: "4px" }}>{pct}%</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function QuizPage({ userId }: { userId: string | null }) {
  const [questions, setQuestions] = useState<QuizQuestion[]>(pickQuizRound);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<boolean | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const [quizLog, setQuizLog] = useState<QuizResult[]>([]);
  const [calendarOpen, setCalendarOpen] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchQuizResults(userId).then((rows) => setQuizLog(rows.map((r, i) => ({ id: `${i}`, ...r }))));
    } else {
      setQuizLog(loadQuizLog());
    }
  }, [userId]);

  const current = questions[index];
  const isCorrect = selected !== null && selected === current.a;

  const answer = (choice: boolean) => {
    if (selected !== null) return;
    setSelected(choice);
    if (choice === current.a) setCorrectCount((c) => c + 1);
  };

  const next = () => {
    if (index + 1 >= questions.length) {
      setFinished(true);
      const now = new Date();
      const result: QuizResult = {
        id: `${now.getTime()}`,
        date: localDateStr(now),
        time: now.toTimeString().slice(0, 5),
        score: correctCount,
        total: questions.length,
      };
      const nextLog = [...quizLog, result];
      setQuizLog(nextLog);
      if (userId) void insertQuizResult(userId, { date: result.date, time: result.time, score: result.score, total: result.total });
      else saveQuizLog(nextLog);
      return;
    }
    setIndex((i) => i + 1);
    setSelected(null);
  };

  const restart = () => {
    setQuestions(pickQuizRound());
    setIndex(0);
    setSelected(null);
    setCorrectCount(0);
    setFinished(false);
  };

  return (
    <div style={{ width: "100%", maxWidth: "640px", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
      <div
        style={{
          background: "#ffffff",
          boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.05)",
          borderRadius: "12px",
          padding: "16px 20px",
          width: "100%",
          textAlign: "left",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p style={{ fontWeight: 800, fontSize: "16px" }}>🧠 금융 상식 O/X 퀴즈</p>
          {userId && (
            <button
              onClick={() => setCalendarOpen(true)}
              style={{
                fontSize: "12px",
                fontWeight: 700,
                color: "#6b7280",
                background: "#f2f2f7",
                border: "none",
                borderRadius: "8px",
                padding: "5px 10px",
                cursor: "pointer",
              }}
            >
              📅 기록
            </button>
          )}
        </div>
        {!finished && (
          <p style={{ fontSize: "13px", color: "#6b7280", marginTop: "4px" }}>
            {index + 1}/{questions.length}문제 · 맞은 개수 {correctCount}개
          </p>
        )}
      </div>

      {calendarOpen && <QuizCalendarModal quizLog={quizLog} onClose={() => setCalendarOpen(false)} />}

      {!finished ? (
        <div
          style={{
            background: "#ffffff",
            boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.05)",
            borderRadius: "12px",
            padding: "24px 20px",
            width: "100%",
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: "13px", color: "#9a3412", fontWeight: 700 }}>OX 퀴즈</p>
          <p style={{ fontSize: "17px", fontWeight: 800, marginTop: "14px", lineHeight: 1.6 }}>{current.q}</p>

          {selected === null ? (
            <div style={{ display: "flex", justifyContent: "center", gap: "16px", marginTop: "24px" }}>
              <button
                onClick={() => answer(true)}
                style={{
                  width: "84px",
                  height: "84px",
                  borderRadius: "50%",
                  fontSize: "32px",
                  fontWeight: 800,
                  color: "#16a34a",
                  background: "#f0fdf4",
                  border: "2px solid #16a34a",
                  cursor: "pointer",
                }}
              >
                O
              </button>
              <button
                onClick={() => answer(false)}
                style={{
                  width: "84px",
                  height: "84px",
                  borderRadius: "50%",
                  fontSize: "32px",
                  fontWeight: 800,
                  color: "#dc2626",
                  background: "#fef2f2",
                  border: "2px solid #dc2626",
                  cursor: "pointer",
                }}
              >
                X
              </button>
            </div>
          ) : (
            <>
              <p
                style={{
                  fontSize: "16px",
                  fontWeight: 800,
                  marginTop: "20px",
                  color: isCorrect ? "#16a34a" : "#dc2626",
                }}
              >
                {isCorrect ? "정답이에요! 🎉" : "오답이에요"} (정답: {current.a ? "O" : "X"})
              </p>
              <p style={{ fontSize: "13px", color: "#6b7280", marginTop: "10px", lineHeight: 1.5 }}>
                {current.explain}
              </p>
              <button
                onClick={next}
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
                {index + 1 >= questions.length ? "결과 보기" : "다음 문제"}
              </button>
            </>
          )}
        </div>
      ) : (
        <div
          style={{
            background: "#ffffff",
            boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.05)",
            borderRadius: "12px",
            padding: "32px 20px",
            width: "100%",
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: "15px", fontWeight: 700 }}>퀴즈 완료! 🎉</p>
          <p style={{ fontSize: "36px", fontWeight: 800, marginTop: "10px", color: "#f97316" }}>
            {correctCount}/{questions.length}
          </p>
          <p style={{ fontSize: "16px", fontWeight: 700, marginTop: "4px", color: "#9a3412" }}>
            정답률 {Math.round((correctCount / questions.length) * 100)}%
          </p>
          <p style={{ fontSize: "13px", color: "#6b7280", marginTop: "10px" }}>
            {correctCount >= 8
              ? "금융 상식이 탄탄하네요!"
              : correctCount >= 5
              ? "꽤 알고 있지만 조금 더 공부해봐요"
              : "차근차근 금융 정보를 더 살펴봐요"}
          </p>
          <button
            onClick={restart}
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
            다시 풀기
          </button>
        </div>
      )}
    </div>
  );
}

function formatWon(n: number) {
  return Math.round(n).toLocaleString("ko-KR") + "원";
}

const MARKET_KEYWORDS = [
  "뉴스", "시황", "주가", "종목", "코인", "비트코인", "이더리움", "알트코인",
  "실적", "공시", "상한가", "하한가", "급등", "급락", "상승", "하락",
  "매수", "매도", "증시", "코스피", "코스닥", "나스닥", "다우", "환율", "금리",
  "주식", "장마감", "거래량", "시가총액",
];

function looksLikeMarketQuestion(text: string): boolean {
  if (MARKET_KEYWORDS.some((k) => text.includes(k))) return true;
  return /\b[A-Z]{2,5}\b/.test(text);
}

async function fetchNewsHeadlines(query: string, label?: string): Promise<string> {
  try {
    const res = await fetch(`/api/news?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    const headlines: string[] = (data.items ?? []).slice(0, 10).map((n: { title: string }) => n.title);
    if (!headlines.length) return "";
    return `\n\n[${label ?? query} 관련 최근 뉴스 헤드라인]\n${headlines.map((h, i) => `${i + 1}. ${h}`).join("\n")}`;
  } catch {
    return "";
  }
}

type NewsSource = { title: string; link: string; source: string };

async function fetchNewsWithSources(query: string, label?: string): Promise<{ context: string; sources: NewsSource[] }> {
  try {
    const res = await fetch(`/api/news?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    const sources: NewsSource[] = (data.items ?? [])
      .slice(0, 5)
      .map((n: { title: string; link: string; source: string }) => ({ title: n.title, link: n.link, source: n.source }))
      .filter((n: NewsSource) => n.title && n.link);
    if (!sources.length) return { context: "", sources: [] };
    const context = `\n\n[${label ?? query} 관련 최근 뉴스 헤드라인]\n${sources.map((h, i) => `${i + 1}. ${h.title}`).join("\n")}`;
    return { context, sources };
  } catch {
    return { context: "", sources: [] };
  }
}

const KOREAN_GROUP_UNITS = ["", "만", "억", "조"];

function formatKoreanGroup(group: number) {
  if (group < 100) return String(group);

  const thousands = Math.floor(group / 1000) % 10;
  const hundreds = Math.floor(group / 100) % 10;
  const tensOnes = group % 100;

  let str = "";
  if (thousands > 0) str += `${thousands}천`;
  if (hundreds > 0) str += `${hundreds}백`;
  if (tensOnes > 0) {
    const tens = Math.floor(tensOnes / 10);
    const ones = tensOnes % 10;
    if (tens > 0) str += `${tens}십`;
    if (ones > 0) str += `${ones}`;
  }
  return str;
}

function formatKoreanAmount(n: number) {
  const amount = Math.floor(n);
  if (amount <= 0) return "";

  let result = "";
  let groupIndex = 0;
  let remaining = amount;

  while (remaining > 0) {
    const group = remaining % 10000;
    if (group > 0) result = `${formatKoreanGroup(group)}${KOREAN_GROUP_UNITS[groupIndex]}${result}`;
    remaining = Math.floor(remaining / 10000);
    groupIndex++;
  }

  return `${result}원`;
}

type InvestAssetType = "주식" | "코인";
type InvestAsset = { symbol: string; type: InvestAssetType; code: string; market?: "domestic" | "worldstock" };
type CoinOption = { market: string; symbol: string; name: string };
type StockOption = { code: string; name: string; exchange: string; nationCode: string };
type InvestMode = "realtime" | "virtual";

type TradeRecord = {
  id: string;
  date: string;
  time: string;
  symbol: string;
  action: "매수" | "매도";
  qty: number;
  price: number;
  reason: string;
  mode?: InvestMode;
};

function localDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const TRADE_LOG_KEY = "moneyup_trade_log";

function loadTradeLog(): TradeRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(TRADE_LOG_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveTradeLog(log: TradeRecord[]) {
  try {
    window.localStorage.setItem(TRADE_LOG_KEY, JSON.stringify(log));
  } catch {
    // ignore
  }
}

type InvestSetup = {
  cash: number;
  assets: InvestAsset[];
  mode: InvestMode;
  holdings: Record<string, { qty: number; avgPrice: number }>;
};

const INVEST_SETUP_KEY = "moneyup_invest_setup";

function loadInvestSetupLocal(): InvestSetup | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(INVEST_SETUP_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveInvestSetupLocal(setup: InvestSetup) {
  try {
    window.localStorage.setItem(INVEST_SETUP_KEY, JSON.stringify(setup));
  } catch {
    // ignore
  }
}

function clearInvestSetupLocal() {
  try {
    window.localStorage.removeItem(INVEST_SETUP_KEY);
  } catch {
    // ignore
  }
}

type QuizResult = {
  id: string;
  date: string;
  time: string;
  score: number;
  total: number;
};

const QUIZ_LOG_KEY = "moneyup_quiz_log";

function loadQuizLog(): QuizResult[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(QUIZ_LOG_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveQuizLog(log: QuizResult[]) {
  try {
    window.localStorage.setItem(QUIZ_LOG_KEY, JSON.stringify(log));
  } catch {
    // ignore
  }
}

function deriveHoldingsFromLog(log: TradeRecord[]): Record<string, number> {
  const qty: Record<string, number> = {};
  for (const t of log) {
    const delta = t.action === "매수" ? t.qty : -t.qty;
    qty[t.symbol] = (qty[t.symbol] ?? 0) + delta;
  }
  return Object.fromEntries(Object.entries(qty).filter(([, q]) => q > 1e-9));
}

type MorningLetter = { date: string; content: string };

const MORNING_LETTER_KEY = "moneyup_morning_letter";
const MORNING_LETTER_SEEN_PREFIX = "moneyup_morning_letter_seen_";

const GUEST_INVEST_WARNING_DISMISSED_PREFIX = "moneyup_guest_invest_warning_dismissed_";

function isGuestInvestWarningDismissedToday(): boolean {
  if (typeof window === "undefined") return false;
  return !!window.localStorage.getItem(`${GUEST_INVEST_WARNING_DISMISSED_PREFIX}${localDateStr(new Date())}`);
}

function dismissGuestInvestWarningToday() {
  try {
    window.localStorage.setItem(`${GUEST_INVEST_WARNING_DISMISSED_PREFIX}${localDateStr(new Date())}`, "1");
  } catch {
    // ignore
  }
}

function loadMorningLetter(): MorningLetter | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(MORNING_LETTER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveMorningLetter(letter: MorningLetter) {
  try {
    window.localStorage.setItem(MORNING_LETTER_KEY, JSON.stringify(letter));
  } catch {
    // ignore
  }
}

const MIN_CASH = 1_000_000;
const MAX_CASH = 1_000_000_000;
const MAX_PICKS = 5;

const PRICE_EVENT_THRESHOLD = 5;

const DECLINE_REASONS = [
  "협력업체 파업으로 생산 차질 우려가 불거졌어요",
  "기준금리 인상 발표로 투자 심리가 위축됐어요",
  "실적 어닝쇼크가 발표됐어요",
  "대규모 유상증자 계획이 발표됐어요",
  "원자재 가격 급등으로 수익성 우려가 커졌어요",
  "경영진 리스크 이슈가 불거졌어요",
  "정부 규제 강화 발표로 업황 우려가 커졌어요",
  "신용등급이 강등됐어요",
  "경쟁사의 신제품 출시로 점유율 우려가 나왔어요",
];

const RISE_REASONS = [
  "깜짝 실적(어닝서프라이즈)이 발표됐어요",
  "기준금리 인하 기대감이 확산됐어요",
  "대규모 수주 계약 체결 소식이 전해졌어요",
  "자사주 매입 계획이 발표됐어요",
  "신제품 공개로 기대감이 커졌어요",
  "외국인·기관 매수세가 몰렸어요",
  "정부 정책 수혜 기대감이 커졌어요",
  "인수합병(M&A) 소식이 전해졌어요",
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function AssetPicker({
  initialPicked,
  onComplete,
  onCancel,
  onBack,
  stepLabel,
}: {
  initialPicked: InvestAsset[];
  onComplete: (assets: InvestAsset[]) => void;
  onCancel?: () => void;
  onBack?: () => void;
  stepLabel?: string;
}) {
  const [assetTab, setAssetTab] = useState<InvestAssetType>("코인");
  const [coinOptions, setCoinOptions] = useState<CoinOption[] | null>(null);
  const [coinQuery, setCoinQuery] = useState("");
  const [stockQuery, setStockQuery] = useState("");
  const [stockOptions, setStockOptions] = useState<StockOption[]>([]);
  const [stockLoading, setStockLoading] = useState(false);
  const [picked, setPicked] = useState<InvestAsset[]>(initialPicked);

  useEffect(() => {
    if (assetTab !== "코인" || coinOptions !== null) return;
    fetch("/api/coins")
      .then((res) => res.json())
      .then((data) => setCoinOptions(data.items ?? []))
      .catch(() => setCoinOptions([]));
  }, [assetTab, coinOptions]);

  useEffect(() => {
    if (assetTab !== "주식") return;
    const q = stockQuery.trim();
    if (!q) {
      setStockOptions([]);
      return;
    }
    setStockLoading(true);
    const timer = setTimeout(() => {
      fetch(`/api/stock-search?q=${encodeURIComponent(q)}`)
        .then((res) => res.json())
        .then((data) => setStockOptions(data.items ?? []))
        .catch(() => setStockOptions([]))
        .finally(() => setStockLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [assetTab, stockQuery]);

  const filteredCoins = (coinOptions ?? [])
    .filter((c) => {
      const q = coinQuery.trim().toLowerCase();
      if (!q) return true;
      return c.symbol.toLowerCase().includes(q) || c.name.toLowerCase().includes(q);
    })
    .slice(0, 30);

  const isPicked = (code: string) => picked.some((a) => a.code === code);

  const togglePick = (asset: InvestAsset) => {
    setPicked((prev) => {
      if (prev.some((a) => a.code === asset.code)) return prev.filter((a) => a.code !== asset.code);
      if (prev.length >= MAX_PICKS) return prev;
      return [...prev, asset];
    });
  };

  const removePicked = (code: string) => setPicked((prev) => prev.filter((a) => a.code !== code));

  const canComplete = picked.length >= 1 && picked.length <= MAX_PICKS;

  return (
    <div
      onClick={onCancel}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        zIndex: 40,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          background: "#ffffff",
          borderRadius: "16px",
          padding: "24px",
          maxWidth: "420px",
          width: "100%",
          maxHeight: "80vh",
          overflowY: "auto",
          textAlign: "left",
        }}
      >
        {onBack && (
          <button
            onClick={onBack}
            aria-label="이전 단계로"
            style={{
              position: "absolute",
              top: "16px",
              right: "16px",
              background: "none",
              border: "none",
              fontSize: "20px",
              color: "#9ca3af",
              cursor: "pointer",
              lineHeight: 1,
              padding: "4px",
            }}
          >
            ←
          </button>
        )}
        {stepLabel && <p style={{ fontSize: "13px", fontWeight: 800, color: "#f97316" }}>{stepLabel}</p>}
        <p style={{ fontSize: "18px", fontWeight: 800, marginTop: stepLabel ? "10px" : 0 }}>관심종목을 5개 선택해주세요</p>
        <p style={{ fontSize: "13px", color: "#6b7280", marginTop: "6px" }}>
          {picked.length}/{MAX_PICKS}개 선택됨
        </p>

        {picked.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "12px" }}>
            {picked.map((a) => (
              <span
                key={a.code}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 10px",
                  borderRadius: "999px",
                  background: "#fff7ed",
                  border: "1px solid #fed7aa",
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#9a3412",
                }}
              >
                {a.symbol}
                <span onClick={() => removePicked(a.code)} style={{ cursor: "pointer", color: "#9ca3af" }}>
                  ✕
                </span>
              </span>
            ))}
          </div>
        )}

        <div
          style={{
            display: "flex",
            gap: "2px",
            marginTop: "16px",
            padding: "2px",
            background: "#e5e5ea",
            borderRadius: "10px",
          }}
        >
          {(["코인", "주식"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setAssetTab(t)}
              style={{
                flex: 1,
                padding: "8px",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: 700,
                border: "none",
                background: assetTab === t ? "#fff" : "transparent",
                boxShadow: assetTab === t ? "0 1px 3px rgba(0,0,0,0.15)" : "none",
                color: assetTab === t ? "#f97316" : "#6b7280",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {t}
            </button>
          ))}
        </div>

        <input
          type="text"
          value={assetTab === "코인" ? coinQuery : stockQuery}
          onChange={(e) =>
            assetTab === "코인" ? setCoinQuery(e.target.value) : setStockQuery(e.target.value)
          }
          placeholder={assetTab === "코인" ? "코인명/심볼 검색 (예: 비트코인, BTC)" : "종목명 검색 (예: 삼성전자)"}
          style={{
            marginTop: "12px",
            width: "100%",
            padding: "10px 12px",
            fontSize: "13px",
            boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.05)",
            borderRadius: "8px",
          }}
        />

        <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "6px", maxHeight: "220px", overflowY: "auto" }}>
          {assetTab === "코인" ? (
            coinOptions === null ? (
              <p style={{ fontSize: "13px", color: "#9ca3af" }}>코인 목록을 불러오는 중...</p>
            ) : filteredCoins.length === 0 ? (
              <p style={{ fontSize: "13px", color: "#9ca3af" }}>검색 결과가 없어요</p>
            ) : (
              filteredCoins.map((c) => {
                const done = isPicked(c.market);
                const disabled = !done && picked.length >= MAX_PICKS;
                return (
                  <button
                    key={c.market}
                    onClick={() => togglePick({ symbol: c.symbol, type: "코인", code: c.market })}
                    disabled={disabled}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border: done ? "2px solid #16a34a" : "2px solid #f3f4f6",
                      background: done ? "#f0fdf4" : "#fff",
                      cursor: disabled ? "not-allowed" : "pointer",
                      opacity: disabled ? 0.5 : 1,
                      textAlign: "left",
                    }}
                  >
                    <span style={{ fontSize: "13px" }}>
                      {c.name} <span style={{ color: "#9ca3af", fontSize: "11px" }}>{c.symbol}</span>
                    </span>
                    {done && <span style={{ color: "#16a34a", fontWeight: 700 }}>✓</span>}
                  </button>
                );
              })
            )
          ) : stockLoading ? (
            <p style={{ fontSize: "13px", color: "#9ca3af" }}>검색 중...</p>
          ) : stockQuery.trim() === "" ? (
            <p style={{ fontSize: "13px", color: "#9ca3af" }}>종목명을 입력해주세요</p>
          ) : stockOptions.length === 0 ? (
            <p style={{ fontSize: "13px", color: "#9ca3af" }}>검색 결과가 없어요</p>
          ) : (
            stockOptions.map((s) => {
              const done = isPicked(s.code);
              const disabled = !done && picked.length >= MAX_PICKS;
              const overseas = s.nationCode !== "KOR";
              return (
                <button
                  key={s.code}
                  onClick={() =>
                    togglePick({
                      symbol: s.name,
                      type: "주식",
                      code: s.code,
                      market: overseas ? "worldstock" : "domestic",
                    })
                  }
                  disabled={disabled}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: done ? "2px solid #16a34a" : "2px solid #f3f4f6",
                    background: done ? "#f0fdf4" : "#fff",
                    cursor: disabled ? "not-allowed" : "pointer",
                    opacity: disabled ? 0.5 : 1,
                    textAlign: "left",
                  }}
                >
                  <span style={{ fontSize: "13px" }}>
                    {s.name}{" "}
                    <span style={{ color: "#9ca3af", fontSize: "11px" }}>
                      {s.exchange}
                      {overseas ? " · 해외" : ""}
                    </span>
                  </span>
                  {done && <span style={{ color: "#16a34a", fontWeight: 700 }}>✓</span>}
                </button>
              );
            })
          )}
        </div>

        <button
          onClick={() => canComplete && onComplete(picked)}
          disabled={!canComplete}
          style={{
            marginTop: "20px",
            width: "100%",
            padding: "14px",
            fontSize: "15px",
            fontWeight: 700,
            color: "#fff",
            background: canComplete ? "#16a34a" : "#d1d5db",
            border: "none",
            borderRadius: "8px",
            cursor: canComplete ? "pointer" : "not-allowed",
          }}
        >
          완료
        </button>
      </div>
    </div>
  );
}

function InvestOnboarding({
  onComplete,
  onGoHome,
}: {
  onComplete: (cash: number, assets: InvestAsset[], mode: InvestMode) => void;
  onGoHome: () => void;
}) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [mode, setMode] = useState<InvestMode | null>(null);
  const [cashInput, setCashInput] = useState("1000000");
  const [cashError, setCashError] = useState("");

  const chooseMode = (m: InvestMode) => {
    setMode(m);
    setStep(2);
  };

  const submitCash = () => {
    const amount = Number(cashInput);
    if (!amount || amount < MIN_CASH || amount > MAX_CASH) {
      setCashError(`${MIN_CASH.toLocaleString("ko-KR")}원 이상 ${MAX_CASH.toLocaleString("ko-KR")}원 이하로 입력해주세요`);
      return;
    }
    setCashError("");
    setStep(3);
  };

  if (step === 3) {
    return (
      <AssetPicker
        initialPicked={[]}
        stepLabel="3/3"
        onComplete={(assets) => onComplete(Number(cashInput), assets, mode!)}
        onBack={() => setStep(2)}
      />
    );
  }

  if (step === 1) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.45)",
          zIndex: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
        }}
      >
        <div
          style={{
            position: "relative",
            background: "#ffffff",
            borderRadius: "16px",
            padding: "24px",
            maxWidth: "420px",
            width: "100%",
            maxHeight: "80vh",
            overflowY: "auto",
            textAlign: "left",
          }}
        >
          <button
            onClick={onGoHome}
            aria-label="홈으로"
            style={{
              position: "absolute",
              top: "16px",
              right: "16px",
              background: "none",
              border: "none",
              fontSize: "18px",
              color: "#9ca3af",
              cursor: "pointer",
              lineHeight: 1,
              padding: "4px",
            }}
          >
            ✕
          </button>
          <p style={{ fontSize: "13px", fontWeight: 800, color: "#f97316" }}>1/3</p>
          <p style={{ fontSize: "18px", fontWeight: 800, marginTop: "10px" }}>투자 모드를 선택해주세요</p>
          <p style={{ fontSize: "13px", color: "#6b7280", marginTop: "6px" }}>
            나중에 종목을 편집해도 모드는 바뀌지 않아요
          </p>

          <button
            onClick={() => chooseMode("realtime")}
            style={{
              marginTop: "16px",
              width: "100%",
              textAlign: "left",
              padding: "16px",
              boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.05)",
              borderRadius: "10px",
              background: "#fff",
              cursor: "pointer",
            }}
          >
            <p style={{ fontWeight: 800, fontSize: "15px" }}>📡 실시간모드</p>
            <p style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px", lineHeight: 1.5 }}>
              실제 주식·코인 시세를 그대로 반영해요. 진짜 투자 감각을 느껴보고 싶다면 추천
            </p>
          </button>

          <button
            onClick={() => chooseMode("virtual")}
            style={{
              marginTop: "10px",
              width: "100%",
              textAlign: "left",
              padding: "16px",
              boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.05)",
              borderRadius: "10px",
              background: "#fff",
              cursor: "pointer",
            }}
          >
            <p style={{ fontWeight: 800, fontSize: "15px" }}>🎲 가상모드</p>
            <p style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px", lineHeight: 1.5 }}>
              가격이 몇 초마다 무작위로 변동해요. 짧은 시간에도 등락을 체감하고 싶다면 추천
            </p>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        zIndex: 40,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        style={{
          position: "relative",
          background: "#ffffff",
          borderRadius: "16px",
          padding: "24px",
          maxWidth: "420px",
          width: "100%",
          maxHeight: "80vh",
          overflowY: "auto",
          textAlign: "left",
        }}
      >
        <button
          onClick={() => setStep(1)}
          aria-label="이전 단계로"
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            background: "none",
            border: "none",
            fontSize: "20px",
            color: "#9ca3af",
            cursor: "pointer",
            lineHeight: 1,
            padding: "4px",
          }}
        >
          ←
        </button>
        <p style={{ fontSize: "13px", fontWeight: 800, color: "#f97316" }}>2/3</p>
        <p style={{ fontSize: "18px", fontWeight: 800, marginTop: "10px" }}>모의투자 시작할 금액을 알려주세요</p>
        <p style={{ fontSize: "13px", color: "#6b7280", marginTop: "6px" }}>
          최소 {MIN_CASH.toLocaleString("ko-KR")}원 ~ 최대 {MAX_CASH.toLocaleString("ko-KR")}원
        </p>
        <input
          type="number"
          value={cashInput}
          onChange={(e) => setCashInput(e.target.value)}
          style={{
            marginTop: "16px",
            width: "100%",
            padding: "12px 14px",
            fontSize: "16px",
            border: `2px solid ${cashError ? "#dc2626" : "#e5e7eb"}`,
            borderRadius: "8px",
          }}
        />
        {Number(cashInput) > 0 && (
          <p style={{ fontSize: "12px", color: "#9ca3af", marginTop: "6px" }}>
            {formatKoreanAmount(Number(cashInput))}
          </p>
        )}
        {cashError && <p style={{ color: "#dc2626", fontSize: "13px", marginTop: "6px" }}>{cashError}</p>}
        <button
          onClick={submitCash}
          style={{
            marginTop: "20px",
            width: "100%",
            padding: "14px",
            fontSize: "15px",
            fontWeight: 700,
            color: "#fff",
            background: "#f97316",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          다음
        </button>
      </div>
    </div>
  );
}

const REFRESH_INTERVAL_SECONDS = 10;
const VIRTUAL_TICK_VOLATILITY = 0.03;
const VIRTUAL_TICK_DRIFT = 0.0015;
const VIRTUAL_TICK_REVERSION = 0.2;

function TradeReasonModal({
  action,
  symbol,
  qty,
  price,
  onCancel,
  onConfirm,
}: {
  action: "매수" | "매도";
  symbol: string;
  qty: number;
  price: number;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");

  const submitReason = () => {
    const text = reason.trim();
    if (!text) return;
    onConfirm(text);
  };

  return (
    <div
      onClick={onCancel}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        zIndex: 55,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: "#fff", borderRadius: "18px", padding: "22px", width: "100%", maxWidth: "340px", textAlign: "left" }}
      >
        <p style={{ fontWeight: 800, fontSize: "16px", marginBottom: "6px" }}>
          {symbol} {qty}개 {action} 이유를 알려주세요
        </p>
        <p style={{ fontSize: "12px", color: "#9ca3af", marginBottom: "12px" }}>
          간단하게라도 이유를 남기면 나중에 투자 습관을 돌아볼 수 있어요
        </p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="예: 실적 발표 기대감에 매수"
          autoFocus
          style={{
            width: "100%",
            minHeight: "80px",
            padding: "12px",
            fontSize: "14px",
            borderRadius: "10px",
            border: "1px solid #e5e5ea",
            resize: "none",
            fontFamily: "inherit",
          }}
        />
        <div style={{ display: "flex", gap: "8px", marginTop: "14px" }}>
          <button
            onClick={onCancel}
            style={{ flex: 1, padding: "12px", borderRadius: "10px", border: "none", background: "#f2f2f7", fontWeight: 700, fontSize: "14px", cursor: "pointer" }}
          >
            취소
          </button>
          <button
            onClick={submitReason}
            disabled={!reason.trim()}
            style={{
              flex: 1,
              padding: "12px",
              borderRadius: "10px",
              border: "none",
              background: !reason.trim() ? "#fdba74" : "#f97316",
              color: "#fff",
              fontWeight: 700,
              fontSize: "14px",
              cursor: !reason.trim() ? "default" : "pointer",
            }}
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}

function TradeCalendarModal({ tradeLog, onClose }: { tradeLog: TradeRecord[]; onClose: () => void }) {
  const today = new Date();
  const todayStr = localDateStr(today);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(todayStr);

  const tradesByDate = tradeLog.reduce<Record<string, TradeRecord[]>>((acc, t) => {
    (acc[t.date] ??= []).push(t);
    return acc;
  }, {});

  const firstOfMonth = new Date(viewYear, viewMonth, 1);
  const startWeekday = firstOfMonth.getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const totalCells = Math.ceil((startWeekday + daysInMonth) / 7) * 7;

  const cells: { day: number; dateStr: string; inMonth: boolean }[] = [];
  for (let i = 0; i < totalCells; i++) {
    const dayOffset = i - startWeekday + 1;
    const d = new Date(viewYear, viewMonth, dayOffset);
    cells.push({ day: d.getDate(), dateStr: localDateStr(d), inMonth: d.getMonth() === viewMonth });
  }

  const goPrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else setViewMonth((m) => m - 1);
  };
  const goNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else setViewMonth((m) => m + 1);
  };

  const selectedTrades = (tradesByDate[selectedDate] ?? []).slice().sort((a, b) => a.time.localeCompare(b.time));

  const [advicePanel, setAdvicePanel] = useState<"day" | "month" | null>(null);
  const [adviceText, setAdviceText] = useState("");
  const [adviceLoading, setAdviceLoading] = useState(false);

  const askAdvice = async (prompt: string) => {
    setAdviceLoading(true);
    setAdviceText("");
    let text = "";
    try {
      const res = await fetch("/api/coach-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: prompt }] }),
      });
      if (res.ok && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          text += decoder.decode(value, { stream: true });
          setAdviceText(text);
        }
      }
    } catch {
      // fall back below
    }
    if (!text.trim()) setAdviceText("지금은 분석을 불러오지 못했어요. 잠시 후 다시 시도해주세요.");
    setAdviceLoading(false);
  };

  const triggerDayAdvice = () => {
    setAdvicePanel("day");
    if (selectedTrades.length === 0) {
      setAdviceText("이 날짜엔 거래 내역이 없어서 분석할 게 없어요.");
      return;
    }
    const list = selectedTrades
      .map((t) => `- ${t.time} ${t.action} ${t.symbol} ${t.qty}개 @ ${formatWon(t.price)} (이유: ${t.reason})`)
      .join("\n");
    askAdvice(
      `사용자의 ${selectedDate} 하루 매매 기록이야:\n${list}\n\n이 기록과 각 거래 이유를 보고, 오늘 하루의 매매 패턴에서 눈에 띄는 점(충동매매, 근거 있는 판단, 리스크 관리 등)을 짚어주고 개선하면 좋을 점을 3~4문장으로 조언해줘.`
    );
  };

  const triggerMonthAdvice = () => {
    setAdvicePanel("month");
    const monthPrefix = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}`;
    const monthTrades = tradeLog
      .filter((t) => t.date.startsWith(monthPrefix))
      .slice()
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
    if (monthTrades.length === 0) {
      setAdviceText(`${viewYear}년 ${viewMonth + 1}월엔 거래 내역이 없어서 분석할 게 없어요.`);
      return;
    }
    const list = monthTrades
      .map((t) => `- ${t.date} ${t.time} ${t.action} ${t.symbol} ${t.qty}개 @ ${formatWon(t.price)} (이유: ${t.reason})`)
      .join("\n");
    askAdvice(
      `사용자의 ${viewYear}년 ${viewMonth + 1}월 한 달 매매 기록이야:\n${list}\n\n이 한 달 동안의 매매 패턴과 각 거래 이유를 분석해서, 반복되는 습관(예: 특정 이유로 자주 매매, 손절·익절 타이밍, 특정 종목 쏠림 등)과 개선점을 4~6문장으로 조언해줘.`
    );
  };

  const adviceIconStyle: CSSProperties = {
    width: "22px",
    height: "22px",
    borderRadius: "50%",
    background: "#fff7ed",
    border: "1px solid #fed7aa",
    color: "#f97316",
    fontSize: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    padding: 0,
    flexShrink: 0,
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        zIndex: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ display: "flex", alignItems: "stretch", maxWidth: "calc(100vw - 40px)", overflowX: "auto" }}
      >
      <div
        style={{
          position: "relative",
          background: "#fff",
          borderRadius: advicePanel ? "20px 0 0 20px" : "20px",
          padding: "20px",
          width: "340px",
          flexShrink: 0,
          maxHeight: "85vh",
          overflowY: "auto",
          textAlign: "left",
        }}
      >
        <button
          onClick={onClose}
          aria-label="캘린더 닫기"
          style={{
            position: "absolute",
            top: "14px",
            right: "14px",
            background: "none",
            border: "none",
            fontSize: "18px",
            color: "#9ca3af",
            cursor: "pointer",
            lineHeight: 1,
            padding: "4px",
          }}
        >
          ✕
        </button>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "20px", marginBottom: "16px" }}>
          <button onClick={goPrevMonth} style={{ background: "none", border: "none", fontSize: "18px", color: "#f97316", cursor: "pointer", padding: "4px 10px" }}>
            ‹
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <p style={{ fontWeight: 800, fontSize: "17px" }}>
              {viewYear}년 {viewMonth + 1}월
            </p>
            <button onClick={triggerMonthAdvice} aria-label="이번 달 거래 분석" style={adviceIconStyle}>
              ✨
            </button>
          </div>
          <button onClick={goNextMonth} style={{ background: "none", border: "none", fontSize: "18px", color: "#f97316", cursor: "pointer", padding: "4px 10px" }}>
            ›
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", textAlign: "center", fontSize: "12px", color: "#9ca3af", marginBottom: "6px" }}>
          {["일", "월", "화", "수", "목", "금", "토"].map((w) => (
            <span key={w}>{w}</span>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", rowGap: "4px" }}>
          {cells.map((c, i) => {
            const hasTrade = !!tradesByDate[c.dateStr]?.length;
            const isSelected = c.dateStr === selectedDate;
            const isToday = c.dateStr === todayStr;
            return (
              <button
                key={i}
                onClick={() => setSelectedDate(c.dateStr)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "2px",
                  padding: "6px 0",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  opacity: c.inMonth ? 1 : 0.3,
                }}
              >
                <span
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "13px",
                    fontWeight: isToday ? 800 : 500,
                    background: isSelected ? "#f97316" : "transparent",
                    color: isSelected ? "#fff" : isToday ? "#f97316" : "#1c1c1e",
                  }}
                >
                  {c.day}
                </span>
                <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: hasTrade ? "#f97316" : "transparent" }} />
              </button>
            );
          })}
        </div>

        <div style={{ marginTop: "18px", borderTop: "1px solid #e5e5ea", paddingTop: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
            <p style={{ fontWeight: 700, fontSize: "14px" }}>{selectedDate} 거래 내역</p>
            <button onClick={triggerDayAdvice} aria-label="이 날 거래 분석" style={adviceIconStyle}>
              ✨
            </button>
          </div>
          {selectedTrades.length === 0 ? (
            <p style={{ fontSize: "13px", color: "#9ca3af" }}>이 날짜엔 거래 내역이 없어요</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {selectedTrades.map((t) => (
                <div key={t.id} style={{ background: "#f2f2f7", borderRadius: "12px", padding: "10px 12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px", fontWeight: 700 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ color: t.action === "매수" ? "#dc2626" : "#2563eb" }}>
                        {t.action} · {t.symbol}
                      </span>
                      {t.mode && (
                        <span
                          style={{
                            fontSize: "10px",
                            fontWeight: 700,
                            padding: "2px 6px",
                            borderRadius: "999px",
                            color: t.mode === "virtual" ? "#7c3aed" : "#0369a1",
                            background: t.mode === "virtual" ? "#f3e8ff" : "#e0f2fe",
                          }}
                        >
                          {t.mode === "virtual" ? "🎲 가상모드" : "📡 실시간모드"}
                        </span>
                      )}
                    </span>
                    <span style={{ color: "#6b7280", fontWeight: 500 }}>{t.time}</span>
                  </div>
                  <p style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>
                    {t.qty}개 · {formatWon(t.price)}
                  </p>
                  <p style={{ fontSize: "13px", color: "#374151", marginTop: "6px" }}>“{t.reason}”</p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {advicePanel && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: "#fff",
            borderLeft: "1px solid #f0f0f0",
            borderRadius: "0 20px 20px 0",
            padding: "18px",
            width: "240px",
            flexShrink: 0,
            maxHeight: "85vh",
            overflowY: "auto",
            textAlign: "left",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <p style={{ fontWeight: 800, fontSize: "15px" }}>
              ✨ {advicePanel === "day" ? `${selectedDate} 하루 조언` : `${viewYear}년 ${viewMonth + 1}월 조언`}
            </p>
            <button
              onClick={() => setAdvicePanel(null)}
              aria-label="조언 패널 닫기"
              style={{ background: "none", border: "none", fontSize: "16px", cursor: "pointer", color: "#9ca3af" }}
            >
              ✕
            </button>
          </div>
          {adviceLoading && !adviceText ? (
            <p style={{ fontSize: "13px", color: "#9ca3af" }}>분석 중이에요...</p>
          ) : (
            <p style={{ fontSize: "13px", lineHeight: 1.6, whiteSpace: "pre-wrap", color: "#374151" }}>{adviceText}</p>
          )}
        </div>
      )}
      </div>
    </div>
  );
}

function InvestSession({
  initialCash,
  initialAssets,
  initialHoldings,
  mode,
  userId,
  onReset,
}: {
  initialCash: number;
  initialAssets: InvestAsset[];
  initialHoldings?: Record<string, { qty: number; avgPrice: number }>;
  mode: InvestMode;
  userId: string | null;
  onReset: () => void;
}) {
  const [assets, setAssets] = useState(initialAssets);
  const [prices, setPrices] = useState<Record<string, number>>(
    Object.fromEntries(initialAssets.map((a) => [a.symbol, 0]))
  );
  const [cash, setCash] = useState(initialCash);
  const [holdings, setHoldings] = useState<Record<string, { qty: number; avgPrice: number }>>(initialHoldings ?? {});
  const [selected, setSelected] = useState(initialAssets[0].symbol);
  const [qtyInput, setQtyInput] = useState("1");
  const [message, setMessage] = useState("");
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [priceError, setPriceError] = useState("");
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL_SECONDS);
  const [editingAssets, setEditingAssets] = useState(false);
  const [marketClosed, setMarketClosed] = useState<Record<string, boolean>>({});
  const [notified, setNotified] = useState<Record<string, "up" | "down" | null>>({});
  const [priceEvent, setPriceEvent] = useState<{ symbol: string; changePct: number; direction: "up" | "down"; reason: string } | null>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiAdvice, setAiAdvice] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMessages, setAiMessages] = useState<ChatMessage[]>([]);
  const [aiInput, setAiInput] = useState("");
  const aiScrollRef = useRef<HTMLDivElement>(null);
  const [pendingTrade, setPendingTrade] = useState<{ action: "매수" | "매도"; qty: number; price: number } | null>(null);
  const [tradeLog, setTradeLog] = useState<TradeRecord[]>([]);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchTrades(userId).then((rows) =>
        setTradeLog(rows.map((t, i) => ({ id: `${i}`, ...t, mode: t.mode as InvestMode | undefined })))
      );
    } else {
      setTradeLog(loadTradeLog());
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    fetchAiMessages(userId, "invest").then((rows) => {
      if (rows.length > 0) setAiMessages(rows);
    });
  }, [userId]);

  useEffect(() => {
    for (const [symbol, h] of Object.entries(holdings)) {
      const price = prices[symbol];
      if (!price) continue;
      const pnlPct = ((price - h.avgPrice) / h.avgPrice) * 100;
      const direction = pnlPct <= -PRICE_EVENT_THRESHOLD ? "down" : pnlPct >= PRICE_EVENT_THRESHOLD ? "up" : null;
      const prevDirection = notified[symbol] ?? null;
      if (direction && direction !== prevDirection) {
        setPriceEvent({ symbol, changePct: pnlPct, direction, reason: pickRandom(direction === "down" ? DECLINE_REASONS : RISE_REASONS) });
        setNotified((n) => ({ ...n, [symbol]: direction }));
        if (aiOpen) {
          (async () => {
            const newsContext = await fetchNewsHeadlines(symbol);
            requestAiAdvice(
              `[지금 화면 상황 - 질문 아님, 옆에서 보다가 자연스럽게 코멘트해줘]\n${symbol} 종목이 평단가 대비 ${
                direction === "down" ? "-" : "+"
              }${Math.abs(pnlPct).toFixed(1)}% ${
                direction === "down" ? "하락" : "상승"
              }했어.${newsContext}\n위 뉴스가 있다면 구체적인 내용을 인용해서 ${symbol} 상황을 3~4문장 정도로 설명하고 좋은 신호인지 나쁜 신호인지 근거와 함께 짚어줘. 이전에 이미 한 이야기는 반복하지 말고 새 정보 위주로.`,
              true
            );
          })();
        }
        break;
      }
      if (!direction && prevDirection) {
        setNotified((n) => ({ ...n, [symbol]: null }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prices, holdings]);

  const holdingsValue = Object.entries(holdings).reduce(
    (sum, [symbol, h]) => sum + h.qty * (prices[symbol] ?? 0),
    0
  );
  const totalAssets = cash + holdingsValue;
  const profit = totalAssets - initialCash;
  const profitPct = (profit / initialCash) * 100;

  const requestAiAdvice = async (context: string, hidden = false) => {
    const nextMessages: ChatMessage[] = [...aiMessages, { role: "user", content: context, hidden }];
    setAiMessages(nextMessages);
    if (userId) void insertAiMessage(userId, "invest", { role: "user", content: context, hidden });
    setAiLoading(true);
    setAiAdvice("");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);
    try {
      const res = await fetch("/api/coach-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages.map(({ role, content }) => ({ role, content })) }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) return;

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let text = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        setAiAdvice(text);
      }
      setAiMessages((prev) => [...prev, { role: "assistant", content: text }]);
      if (userId) void insertAiMessage(userId, "invest", { role: "assistant", content: text });
    } catch {
      setAiAdvice("지금은 코치 의견을 불러오지 못했어요 (응답 지연 또는 오류)");
    } finally {
      clearTimeout(timeout);
      setAiLoading(false);
    }
  };

  const loadSelectionAdvice = async () => {
    const holdingsText = Object.keys(holdings).length
      ? Object.entries(holdings)
          .map(([s, h]) => `${s} ${h.qty}개(평단 ${formatWon(h.avgPrice)}, 현재가 ${formatWon(prices[s] ?? 0)})`)
          .join(", ")
      : "아직 없음";
    const newsContext = await fetchNewsHeadlines(selected);
    requestAiAdvice(
      `[지금 화면 상황 - 질문 아님, 옆에서 보다가 자연스럽게 코멘트해줘]\n지금 사용자가 보고 있는 종목: ${selected} (현재가 ${formatWon(
        prices[selected] ?? 0
      )}).\n총자산 ${formatWon(totalAssets)}, 전체 손익률 ${profitPct >= 0 ? "+" : ""}${profitPct.toFixed(
        1
      )}%.\n보유 종목: ${holdingsText}.${newsContext}\n위 뉴스가 있다면 구체적인 내용을 인용해서 ${selected} 최근 상황을 3~4문장 정도로 설명하고 좋은 신호인지 나쁜 신호인지 근거와 함께 짚어줘. 이전에 이미 한 이야기는 반복하지 말고 새 정보나 다른 관점 위주로.`,
      true
    );
  };

  const loadTradeAdvice = (action: "매수" | "매도", qty: number, price: number) => {
    const amount = price * qty;
    const sizePct = totalAssets > 0 ? (amount / totalAssets) * 100 : 0;
    requestAiAdvice(
      `[방금 실제로 한 행동 - 질문 아님, 옆에서 보고 반응해줘]\n${selected}을(를) ${qty}개 ${action}했어. 금액은 ${formatWon(
        amount
      )} (총자산의 약 ${sizePct.toFixed(1)}%), 체결가는 ${formatWon(price)}야. 지금 총자산은 ${formatWon(
        totalAssets
      )}, 전체 손익률은 ${profitPct >= 0 ? "+" : ""}${profitPct.toFixed(
        1
      )}%야.\n이 거래 금액과 비중을 보고 위험한 정도나 습관 측면에서 2~3문장 정도로 구체적으로 코멘트해줘. 이전에 이미 한 이야기는 반복하지 마.`,
      true
    );
  };

  const openAiAdvisor = () => setAiOpen((open) => !open);

  useEffect(() => {
    if (!aiOpen) return;
    void loadSelectionAdvice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiOpen, selected]);

  useEffect(() => {
    aiScrollRef.current?.scrollTo({ top: aiScrollRef.current.scrollHeight });
  }, [aiMessages, aiAdvice]);

  const sendAiMessage = () => {
    const text = aiInput.trim();
    if (!text || aiLoading) return;
    setAiInput("");
    void requestAiAdvice(text);
  };

  const fetchRealPrices = async () => {
    setLoadingPrices(true);
    setPriceError("");
    const failed: string[] = [];

    const stockAssets = assets.filter((a) => a.type === "주식");
    const coinAssets = assets.filter((a) => a.type === "코인");

    if (stockAssets.length) {
      try {
        const domesticCodes = stockAssets.filter((a) => a.market !== "worldstock").map((a) => a.code);
        const worldCodes = stockAssets.filter((a) => a.market === "worldstock").map((a) => a.code);
        const params = new URLSearchParams();
        if (domesticCodes.length) params.set("codes", domesticCodes.join(","));
        if (worldCodes.length) params.set("worldCodes", worldCodes.join(","));
        const res = await fetch(`/api/stock?${params.toString()}`);
        const data = await res.json();
        setPrices((prev) => {
          const next = { ...prev };
          for (const a of stockAssets) if (data.prices?.[a.code] != null) next[a.symbol] = data.prices[a.code];
          return next;
        });
        setMarketClosed((prev) => {
          const next = { ...prev };
          for (const a of stockAssets) {
            if (data.marketStatus?.[a.code] != null) next[a.symbol] = data.marketStatus[a.code] !== "OPEN";
          }
          return next;
        });
      } catch {
        failed.push("주식");
      }
    }

    if (coinAssets.length) {
      try {
        const res = await fetch(`/api/upbit?markets=${coinAssets.map((a) => a.code).join(",")}`);
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setPrices((prev) => {
          const next = { ...prev };
          for (const a of coinAssets) if (data[a.code] != null) next[a.symbol] = data[a.code];
          return next;
        });
      } catch {
        failed.push("코인");
      }
    }

    setPriceError(failed.length ? `${failed.join("·")} 시세를 불러오지 못했어요` : "");
    setLoadingPrices(false);
  };

  const applyVirtualTick = () => {
    setPrices((prev) => {
      const next = { ...prev };
      for (const a of assets) {
        const current = prev[a.symbol];
        if (!current) continue;
        const h = holdings[a.symbol];
        const pnlPct = h ? (current - h.avgPrice) / h.avgPrice : 0;
        const reversion = -VIRTUAL_TICK_REVERSION * pnlPct;
        const changePct = VIRTUAL_TICK_DRIFT + reversion + (Math.random() * 2 - 1) * VIRTUAL_TICK_VOLATILITY;
        next[a.symbol] = Math.max(0.01, current * (1 + changePct));
      }
      return next;
    });
  };

  const tick = mode === "virtual" ? applyVirtualTick : fetchRealPrices;

  useEffect(() => {
    fetchRealPrices();
    setCountdown(REFRESH_INTERVAL_SECONDS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assets]);

  const tickRef = useRef(tick);
  tickRef.current = tick;

  useEffect(() => {
    const id = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          tickRef.current();
          return REFRESH_INTERVAL_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const manualRefresh = () => {
    tick();
    setCountdown(REFRESH_INTERVAL_SECONDS);
  };

  const finishEditingAssets = (newAssets: InvestAsset[]) => {
    setAssets(newAssets);
    setSelected((prev) => (newAssets.some((a) => a.symbol === prev) ? prev : newAssets[0].symbol));
    setEditingAssets(false);
    if (userId) void savePortfolio(userId, { cash, mode, assets: newAssets, holdings });
    else saveInvestSetupLocal({ cash, mode, assets: newAssets, holdings });
  };

  const buy = () => {
    const qty = Number(qtyInput);
    if (!qty || qty <= 0) return;
    const price = prices[selected];
    if (!price) {
      setMessage("시세를 불러오는 중이에요. 잠시 후 다시 시도해주세요");
      return;
    }
    if (price * qty > cash) {
      setMessage("잔고가 부족해요");
      return;
    }
    setPendingTrade({ action: "매수", qty, price });
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
    if (!price) {
      setMessage("시세를 불러오는 중이에요. 잠시 후 다시 시도해주세요");
      return;
    }
    setPendingTrade({ action: "매도", qty, price });
  };

  const executeTrade = (reason: string) => {
    if (!pendingTrade) return;
    const { action, qty, price } = pendingTrade;
    let nextCash: number;
    let nextHoldings: Record<string, { qty: number; avgPrice: number }>;
    if (action === "매수") {
      const cost = price * qty;
      nextCash = cash - cost;
      const existing = holdings[selected];
      const newQty = (existing?.qty ?? 0) + qty;
      const newAvg = existing ? (existing.avgPrice * existing.qty + cost) / newQty : price;
      nextHoldings = { ...holdings, [selected]: { qty: newQty, avgPrice: newAvg } };
      setMessage(`${selected} ${qty}개 매수 완료`);
    } else {
      nextCash = cash + price * qty;
      const existing = holdings[selected];
      nextHoldings = holdings;
      if (existing) {
        const remaining = existing.qty - qty;
        nextHoldings = { ...holdings };
        if (remaining <= 0) delete nextHoldings[selected];
        else nextHoldings[selected] = { qty: remaining, avgPrice: existing.avgPrice };
      }
      setMessage(`${selected} ${qty}개 매도 완료`);
    }
    setCash(nextCash);
    setHoldings(nextHoldings);
    if (userId) void savePortfolio(userId, { cash: nextCash, mode, assets, holdings: nextHoldings });
    else saveInvestSetupLocal({ cash: nextCash, mode, assets, holdings: nextHoldings });
    const now = new Date();
    const record: TradeRecord = {
      id: `${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
      date: localDateStr(now),
      time: now.toTimeString().slice(0, 5),
      symbol: selected,
      action,
      qty,
      price,
      reason,
      mode,
    };
    const nextLog = [...tradeLog, record];
    setTradeLog(nextLog);
    if (userId) {
      void insertTrade(userId, { date: record.date, time: record.time, symbol: record.symbol, action: record.action, qty: record.qty, price: record.price, reason: record.reason, mode: record.mode });
    } else {
      saveTradeLog(nextLog);
    }
    setPendingTrade(null);
    manualRefresh();
    if (aiOpen) loadTradeAdvice(action, qty, price);
  };

  const selectedPrice = prices[selected] ?? 0;
  const maxBuyQty = selectedPrice > 0 ? Math.floor(cash / selectedPrice) : 0;

  return (
    <div style={{ width: "100%", maxWidth: "640px", display: "flex", flexDirection: "column", gap: "12px", textAlign: "left" }}>
      <div style={{ background: "#ffffff", borderRadius: "16px", boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.05)", padding: "20px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p style={{ fontSize: "13px", color: "#6b7280" }}>내 총자산</p>
          <button
            onClick={() => setResetConfirmOpen(true)}
            style={{
              fontSize: "12px",
              fontWeight: 700,
              color: "#6b7280",
              background: "#f2f2f7",
              border: "none",
              borderRadius: "8px",
              padding: "5px 10px",
              cursor: "pointer",
            }}
          >
            🔄 처음부터 다시
          </button>
        </div>
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

      <div style={{ background: "#ffffff", borderRadius: "16px", boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.05)", padding: "20px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <p style={{ fontWeight: 800, fontSize: "16px" }}>시세</p>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={() => setEditingAssets(true)}
              style={{
                fontSize: "13px",
                fontWeight: 700,
                color: "#6b7280",
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                padding: "6px 12px",
                cursor: "pointer",
              }}
            >
              ✏️ 종목 편집
            </button>
            <button
              onClick={manualRefresh}
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
              {loadingPrices ? "불러오는 중..." : `🔄 시세 갱신 - ${countdown}s`}
            </button>
          </div>
        </div>
        {priceError && <p style={{ fontSize: "12px", color: "#dc2626", marginBottom: "8px" }}>{priceError}</p>}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {assets.map((a) => (
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
                <span style={{ fontSize: "10px", color: "#16a34a", marginLeft: "6px", fontWeight: 700 }}>
                  ●{" "}
                  {mode === "virtual"
                    ? "가상 시뮬레이션"
                    : `${a.type === "코인" ? "업비트" : a.market === "worldstock" ? "네이버(원화환산)" : "네이버"} 실시간`}
                </span>
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                {mode === "realtime" && marketClosed[a.symbol] && (
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#dc2626" }}>장마감</span>
                )}
                <span style={{ fontWeight: 700, fontSize: "14px" }}>{formatWon(prices[a.symbol] ?? 0)}</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: "#ffffff", borderRadius: "16px", boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.05)", padding: "20px 24px" }}>
        <p style={{ fontWeight: 800, fontSize: "16px", marginBottom: "12px" }}>{selected} 매수/매도</p>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <div style={{ position: "relative" }}>
            <input
              type="number"
              value={qtyInput}
              onChange={(e) => setQtyInput(e.target.value)}
              min={1}
              style={{
                padding: "16px 68px 16px 18px",
                fontSize: "20px",
                boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.05)",
                borderRadius: "10px",
                width: "180px",
              }}
            />
            <button
              onClick={() => setQtyInput(String(maxBuyQty))}
              disabled={maxBuyQty <= 0}
              style={{
                position: "absolute",
                right: "8px",
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: "13px",
                fontWeight: 700,
                color: "#f97316",
                background: "#fff7ed",
                border: "1px solid #fed7aa",
                borderRadius: "6px",
                padding: "5px 8px",
                cursor: maxBuyQty <= 0 ? "default" : "pointer",
                opacity: maxBuyQty <= 0 ? 0.5 : 1,
              }}
            >
              최대
            </button>
          </div>
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
        <div style={{ background: "#ffffff", borderRadius: "16px", boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.05)", padding: "20px 24px" }}>
          <p style={{ fontWeight: 800, fontSize: "16px", marginBottom: "12px" }}>보유 종목</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {Object.entries(holdings).map(([symbol, h]) => {
              const cur = prices[symbol] ?? 0;
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

      {editingAssets && (
        <AssetPicker initialPicked={assets} onCancel={() => setEditingAssets(false)} onComplete={finishEditingAssets} />
      )}

      {pendingTrade && (
        <TradeReasonModal
          action={pendingTrade.action}
          symbol={selected}
          qty={pendingTrade.qty}
          price={pendingTrade.price}
          onCancel={() => setPendingTrade(null)}
          onConfirm={executeTrade}
        />
      )}

      {calendarOpen && <TradeCalendarModal tradeLog={tradeLog} onClose={() => setCalendarOpen(false)} />}

      {resetConfirmOpen && (
        <div
          onClick={() => setResetConfirmOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 75,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: "#fff", borderRadius: "18px", padding: "22px", width: "100%", maxWidth: "340px", textAlign: "left" }}
          >
            <p style={{ fontWeight: 800, fontSize: "16px", marginBottom: "8px" }}>처음부터 다시 시작할까요?</p>
            <p style={{ fontSize: "13px", color: "#6b7280", lineHeight: 1.6 }}>
              현재 현금·보유 종목·관심종목 설정이 초기화되고 실시간모드/가상모드 선택부터 다시 시작해요. 지금까지의 거래 기록과 캘린더는 그대로 유지됩니다.
            </p>
            <div style={{ display: "flex", gap: "8px", marginTop: "18px" }}>
              <button
                onClick={() => setResetConfirmOpen(false)}
                style={{ flex: 1, padding: "12px", borderRadius: "10px", border: "none", background: "#f2f2f7", fontWeight: 700, fontSize: "14px", cursor: "pointer" }}
              >
                취소
              </button>
              <button
                onClick={onReset}
                style={{ flex: 1, padding: "12px", borderRadius: "10px", border: "none", background: "#dc2626", color: "#fff", fontWeight: 700, fontSize: "14px", cursor: "pointer" }}
              >
                처음부터 다시
              </button>
            </div>
          </div>
        </div>
      )}

      {priceEvent && (
        <div
          onClick={() => setPriceEvent(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 50,
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
            <p style={{ fontSize: "40px" }}>{priceEvent.direction === "down" ? "📉" : "📈"}</p>
            <p
              style={{
                fontSize: "17px",
                fontWeight: 800,
                marginTop: "8px",
                color: priceEvent.direction === "down" ? "#dc2626" : "#16a34a",
              }}
            >
              {priceEvent.symbol} {priceEvent.changePct >= 0 ? "+" : ""}
              {priceEvent.changePct.toFixed(1)}% {priceEvent.direction === "down" ? "하락" : "상승"}했습니다!
            </p>
            <p style={{ fontSize: "13px", color: "#6b7280", marginTop: "12px", lineHeight: 1.5 }}>
              {priceEvent.reason}
            </p>
            <button
              onClick={() => setPriceEvent(null)}
              style={{
                marginTop: "20px",
                padding: "12px 24px",
                fontSize: "15px",
                fontWeight: 700,
                color: "#fff",
                background: priceEvent.direction === "down" ? "#dc2626" : "#16a34a",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              확인
            </button>
          </div>
        </div>
      )}

      <div
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          zIndex: 45,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: "10px",
        }}
      >
        {aiOpen && (
          <div
            style={{
              width: "300px",
              maxWidth: "calc(100vw - 48px)",
              background: "#ffffff",
              border: "2px solid #fed7aa",
              borderRadius: "14px",
              padding: "14px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
              textAlign: "left",
              display: "flex",
              flexDirection: "column",
              maxHeight: "380px",
            }}
          >
            <p style={{ fontWeight: 800, fontSize: "13px", color: "#9a3412", marginBottom: "8px" }}>
              ✨ AI 코치가 지켜보고 있어요
            </p>
            <div
              ref={aiScrollRef}
              style={{ overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px", flex: 1, minHeight: "80px" }}
            >
              {aiMessages.length === 0 && !aiLoading && (
                <p style={{ fontSize: "13px", color: "#9ca3af" }}>포트폴리오를 살펴보는 중이에요</p>
              )}
              {aiMessages
                .filter((m) => m.role === "assistant" || !m.hidden)
                .map((m, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                    <p
                      style={{
                        maxWidth: "85%",
                        fontSize: "13px",
                        lineHeight: 1.5,
                        whiteSpace: "pre-wrap",
                        background: m.role === "user" ? "#f97316" : "#fff7ed",
                        color: m.role === "user" ? "#fff" : "#374151",
                        borderRadius: "10px",
                        padding: "8px 10px",
                        margin: 0,
                      }}
                    >
                      {m.content}
                    </p>
                  </div>
                ))}
              {aiLoading && (
                <div style={{ display: "flex", justifyContent: "flex-start" }}>
                  <p
                    style={{
                      maxWidth: "85%",
                      fontSize: "13px",
                      color: "#374151",
                      lineHeight: 1.5,
                      whiteSpace: "pre-wrap",
                      background: "#fff7ed",
                      borderRadius: "10px",
                      padding: "8px 10px",
                      margin: 0,
                    }}
                  >
                    {aiAdvice || "..."}
                  </p>
                </div>
              )}
            </div>
            <div style={{ display: "flex", gap: "6px", marginTop: "10px" }}>
              <input
                type="text"
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendAiMessage()}
                placeholder="AI 코치에게 물어보기"
                disabled={aiLoading}
                style={{
                  flex: 1,
                  padding: "8px 10px",
                  fontSize: "13px",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.05)",
                  borderRadius: "8px",
                }}
              />
              <button
                onClick={sendAiMessage}
                disabled={aiLoading || !aiInput.trim()}
                style={{
                  padding: "8px 14px",
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#fff",
                  background: aiLoading || !aiInput.trim() ? "#fdba74" : "#f97316",
                  border: "none",
                  borderRadius: "8px",
                  cursor: aiLoading || !aiInput.trim() ? "default" : "pointer",
                }}
              >
                전송
              </button>
            </div>
          </div>
        )}
        <button
          onClick={() => setCalendarOpen(true)}
          aria-label="거래 캘린더"
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            background: "#ffffff",
            color: "#f97316",
            border: "1px solid #fed7aa",
            fontSize: "20px",
            cursor: "pointer",
            boxShadow: "0 6px 16px rgba(0,0,0,0.15)",
          }}
        >
          📅
        </button>
        <button
          onClick={openAiAdvisor}
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #f97316, #ea580c)",
            color: "#fff",
            border: "none",
            fontSize: "22px",
            cursor: "pointer",
            boxShadow: "0 6px 16px rgba(0,0,0,0.25)",
          }}
        >
          ✨
        </button>
      </div>
    </div>
  );
}

function InvestPage({
  userId,
  onGoHome,
  onModeChange,
}: {
  userId: string | null;
  onGoHome: () => void;
  onModeChange: (mode: InvestMode | null) => void;
}) {
  const [setup, setSetup] = useState<InvestSetup | null>(() => (userId ? null : loadInvestSetupLocal()));
  const [checking, setChecking] = useState(!!userId);
  const [guestWarningOpen, setGuestWarningOpen] = useState(() => !userId && !isGuestInvestWarningDismissedToday());
  const [dontShowWarningToday, setDontShowWarningToday] = useState(false);

  useEffect(() => {
    onModeChange(setup?.mode ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setup?.mode]);

  useEffect(() => {
    if (!userId) {
      setChecking(false);
      return;
    }
    setChecking(true);
    fetchPortfolio(userId).then((p) => {
      if (p) {
        setSetup({ cash: p.cash, assets: p.assets as InvestAsset[], mode: p.mode as InvestMode, holdings: p.holdings });
      }
      setChecking(false);
    });
  }, [userId]);

  if (checking) return null;

  const guestWarning = guestWarningOpen && (
    <div
      onClick={() => setGuestWarningOpen(false)}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        zIndex: 90,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: "#fff", borderRadius: "18px", padding: "22px", width: "100%", maxWidth: "340px", textAlign: "left" }}
      >
        <p style={{ fontWeight: 800, fontSize: "16px", marginBottom: "8px" }}>⚠️ 로그인하지 않은 상태예요</p>
        <p style={{ fontSize: "13px", color: "#6b7280", lineHeight: 1.6 }}>
          비로그인 상태에서는 모의투자 내역은 임시로 저장돼요. 다른 기기·브라우저에서는 이어볼 수 없고, 캐시를 지우면 함께 사라져요.
        </p>
        <label style={{ marginTop: "14px", display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#6b7280", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={dontShowWarningToday}
            onChange={(e) => setDontShowWarningToday(e.target.checked)}
          />
          오늘은 다시 보지 않기
        </label>
        <button
          onClick={() => {
            if (dontShowWarningToday) dismissGuestInvestWarningToday();
            setGuestWarningOpen(false);
          }}
          style={{ marginTop: "16px", width: "100%", padding: "12px", borderRadius: "10px", border: "none", background: "#f97316", color: "#fff", fontWeight: 700, fontSize: "14px", cursor: "pointer" }}
        >
          확인
        </button>
      </div>
    </div>
  );

  if (!setup) {
    return (
      <>
        {guestWarning}
        <InvestOnboarding
          onComplete={(cash, assets, mode) => {
            const holdings = {};
            setSetup({ cash, assets, mode, holdings });
            if (userId) void savePortfolio(userId, { cash, mode, assets, holdings });
            else saveInvestSetupLocal({ cash, assets, mode, holdings });
          }}
          onGoHome={onGoHome}
        />
      </>
    );
  }

  return (
    <>
      {guestWarning}
      <InvestSession
        initialCash={setup.cash}
        initialAssets={setup.assets}
        initialHoldings={setup.holdings}
        mode={setup.mode}
        userId={userId}
        onReset={() => {
          if (userId) void deletePortfolio(userId);
          else clearInvestSetupLocal();
          setSetup(null);
        }}
      />
    </>
  );
}

type ChatMessage = { role: "user" | "assistant"; content: string; hidden?: boolean };

function AiCoachPage({ userId }: { userId: string | null }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "안녕하세요! 머니업 AI 코치예요. 예산·저축·신용점수·투자 기본기 같은 금융 습관 고민을 편하게 물어보세요.",
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [newsSources, setNewsSources] = useState<Record<number, NewsSource[]>>({});

  useEffect(() => {
    if (!userId) return;
    fetchAiMessages(userId, "coach").then((rows) => {
      if (rows.length > 0) setMessages(rows);
    });
  }, [userId]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: text }];
    const assistantIndex = nextMessages.length;
    setMessages([...nextMessages, { role: "assistant", content: "" }]);
    if (userId) void insertAiMessage(userId, "coach", { role: "user", content: text });
    setInput("");
    setSending(true);
    setError("");

    const { context: newsContext, sources } = looksLikeMarketQuestion(text)
      ? await fetchNewsWithSources(text)
      : { context: "", sources: [] };
    if (sources.length) setNewsSources((prev) => ({ ...prev, [assistantIndex]: sources }));
    const apiMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: newsContext ? `${text}${newsContext}` : text },
    ];

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);
    try {
      const res = await fetch("/api/coach-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "응답을 받지 못했어요");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        assistantText += decoder.decode(value, { stream: true });
        const textSoFar = assistantText;
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { role: "assistant", content: textSoFar };
          return next;
        });
      }
      if (userId && assistantText) void insertAiMessage(userId, "coach", { role: "assistant", content: assistantText });
    } catch (e) {
      setError(e instanceof Error && e.name === "AbortError" ? "응답이 너무 오래 걸려요. 잠시 후 다시 시도해주세요" : e instanceof Error ? e.message : "오류가 발생했어요");
      setMessages((prev) => prev.slice(0, -1));
      setNewsSources((prev) => {
        const next = { ...prev };
        delete next[assistantIndex];
        return next;
      });
    } finally {
      clearTimeout(timeout);
      setSending(false);
    }
  };

  return (
    <div style={{ width: "100%", maxWidth: "640px", display: "flex", flexDirection: "column", gap: "12px" }}>
      <div
        style={{
          background: "#fff7ed",
          border: "2px solid #fed7aa",
          borderRadius: "12px",
          padding: "14px 18px",
          textAlign: "left",
        }}
      >
        <p style={{ fontWeight: 800, fontSize: "14px", color: "#9a3412" }}>✨ AI챗봇</p>
        <p style={{ fontSize: "12px", color: "#9a3412", marginTop: "4px", lineHeight: 1.5 }}>
          일반적인 금융 습관 코칭이에요. 특정 종목 매수·매도 추천이나 수익 보장은 하지 않아요 — 실제 투자
          결정은 반드시 전문가와 상담하세요.
        </p>
      </div>

      <div
        style={{
          background: "#ffffff",
          boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.05)",
          borderRadius: "12px",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          minHeight: "320px",
          textAlign: "left",
        }}
      >
        {messages.map((m, i) => (
          <div
            key={i}
            style={{ display: "flex", flexDirection: "column", alignItems: m.role === "user" ? "flex-end" : "flex-start", gap: "6px" }}
          >
            <div
              style={{
                maxWidth: "80%",
                padding: "10px 14px",
                borderRadius: "14px",
                fontSize: "14px",
                lineHeight: 1.5,
                whiteSpace: "pre-wrap",
                background: m.role === "user" ? "#f97316" : "#f3f4f6",
                color: m.role === "user" ? "#fff" : "#1f2937",
              }}
            >
              {m.content || (sending && i === messages.length - 1 ? "..." : "")}
            </div>
            {newsSources[i] && newsSources[i].length > 0 && (
              <div
                style={{
                  maxWidth: "80%",
                  padding: "10px 12px",
                  borderRadius: "12px",
                  background: "#f9fafb",
                  border: "1px solid #e5e7eb",
                }}
              >
                <p style={{ fontSize: "11px", fontWeight: 700, color: "#6b7280", marginBottom: "6px" }}>
                  📰 실제 뉴스로 확인하기 (가짜뉴스·AI 오류 여부는 원문에서 직접 확인하세요)
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  {newsSources[i].map((n, j) => (
                    <a
                      key={j}
                      href={n.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: "12px", color: "#c2410c", textDecoration: "none" }}
                    >
                      {j + 1}. {n.title} <span style={{ color: "#9ca3af" }}>· {n.source}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {error && <p style={{ fontSize: "13px", color: "#dc2626" }}>{error}</p>}

      <div style={{ display: "flex", gap: "8px" }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
          placeholder="예: 첫 월급 받았는데 뭐부터 해야 할까요?"
          disabled={sending}
          style={{
            flex: 1,
            padding: "12px 14px",
            fontSize: "14px",
            boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.05)",
            borderRadius: "8px",
          }}
        />
        <button
          onClick={send}
          disabled={sending || !input.trim()}
          style={{
            padding: "12px 20px",
            fontSize: "14px",
            fontWeight: 700,
            color: "#fff",
            background: sending || !input.trim() ? "#fdba74" : "#f97316",
            border: "none",
            borderRadius: "8px",
            cursor: sending || !input.trim() ? "default" : "pointer",
          }}
        >
          전송
        </button>
      </div>
    </div>
  );
}

async function migrateLocalDataToAccount(userId: string) {
  const migratedKey = `moneyup_migrated_${userId}`;
  if (window.localStorage.getItem(migratedKey)) return;

  try {
    const alreadyHasRemoteTrades = await hasAnyTrades(userId);
    if (!alreadyHasRemoteTrades) {
      const localTrades = loadTradeLog();
      if (localTrades.length > 0) {
        await insertTrades(
          userId,
          localTrades.map(({ date, time, symbol, action, qty, price, reason, mode }) => ({
            date,
            time,
            symbol,
            action,
            qty,
            price,
            reason,
            mode,
          }))
        );
      }
    }

    const localLetter = loadMorningLetter();
    if (localLetter) {
      const remoteLetter = await fetchMorningLetter(userId, localLetter.date);
      if (!remoteLetter) {
        await saveMorningLetterDb(userId, localLetter.date, localLetter.content);
      }
    }

    const alreadyHasRemoteQuizResults = await hasAnyQuizResults(userId);
    if (!alreadyHasRemoteQuizResults) {
      const localQuizLog = loadQuizLog();
      if (localQuizLog.length > 0) {
        await insertQuizResults(
          userId,
          localQuizLog.map(({ date, time, score, total }) => ({ date, time, score, total }))
        );
      }
    }

    // 이제 계정(클라우드)에 안전하게 옮겨졌으니, 로그아웃 후 게스트 화면에
    // 이전 계정의 개인 데이터가 그대로 보이는 걸 막기 위해 로컬 캐시를 지운다.
    window.localStorage.removeItem(TRADE_LOG_KEY);
    window.localStorage.removeItem(MORNING_LETTER_KEY);
    window.localStorage.removeItem(QUIZ_LOG_KEY);
    window.localStorage.setItem(migratedKey, "1");
  } catch {
    // leave migratedKey unset so it retries on next login
  }
}

export default function Home() {
  const [page, setPage] = useState<"home" | "quiz" | "invest" | "ai">("home");
  const [user, setUser] = useState<User | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [investMode, setInvestMode] = useState<InvestMode | null>(null);
  const migratingRef = useRef<Set<string>>(new Set());

  const triggerMigration = (uid: string) => {
    if (migratingRef.current.has(uid)) return;
    migratingRef.current.add(uid);
    void migrateLocalDataToAccount(uid);
  };

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      const sessionUser = data.session?.user ?? null;
      setUser(sessionUser);
      if (sessionUser) triggerMigration(sessionUser.id);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null;
      setUser(nextUser);
      if (nextUser) triggerMigration(nextUser.id);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const titles = {
    home: "머니업",
    quiz: "퀴즈",
    invest: investMode ? `모의투자 ${investMode === "virtual" ? "가상모드" : "실시간모드"}` : "모의투자",
    ai: "AI챗봇",
  };

  const userId = user?.id ?? null;
  const userLabel = (user?.user_metadata?.nickname as string) || user?.email;

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "16px",
        padding: "0 20px 100px",
        textAlign: "center",
      }}
    >
      <div style={{ width: "100%", maxWidth: "640px", display: "flex", justifyContent: "flex-start" }}>
        <Header
          title={titles[page]}
          userEmail={userLabel}
          onLogin={() => setAuthOpen(true)}
          onEditAccount={() => setAccountOpen(true)}
          onLogoutRequest={() => setLogoutConfirmOpen(true)}
        />
      </div>

      {page === "home" && <HomePage userId={userId} />}
      {page === "quiz" && <QuizPage userId={userId} />}
      {page === "invest" && <InvestPage userId={userId} onGoHome={() => setPage("home")} onModeChange={setInvestMode} />}
      {page === "ai" && <AiCoachPage userId={userId} />}

      <TabBar active={page} onNavigate={setPage} />

      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
      {accountOpen && user && <AccountModal user={user} onClose={() => setAccountOpen(false)} />}
      {logoutConfirmOpen && (
        <LogoutConfirmModal
          onClose={() => setLogoutConfirmOpen(false)}
          onConfirm={() => supabase?.auth.signOut()}
        />
      )}
    </main>
  );
}
