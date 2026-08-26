import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "머니업 (MoneyUp) — 청년 금융습관 코칭 앱",
  description: "금융정보 → OX 퀴즈 → 모의투자 → AI 피드백으로 이어지는 사회초년생·20·30대를 위한 금융습관 코칭 서비스",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
