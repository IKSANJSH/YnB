import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "머니업 (MoneyUp) — 청년 금융습관 코칭 앱",
  description: "신용점수 진단 → 맞춤 코칭 → 습관 챌린지 → 모의투자로 이어지는 사회초년생·20·30대를 위한 금융습관 코칭 서비스",
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
