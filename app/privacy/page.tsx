import type { Metadata } from "next";
import Link from "next/link";

import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `개인정보처리방침 | ${SITE_NAME}`,
  description: `${SITE_NAME} 개인정보처리방침`,
  alternates: {
    canonical: "/privacy",
  },
};

const sections = [
  {
    title: "수집하는 정보",
    body: [
      "Musinsa Tracking은 사용자가 직접 입력한 상품 URL, 가격 추적 결과, 로그인 시 제공되는 기본 계정 정보(이메일 또는 사용자 식별자)를 처리할 수 있습니다.",
      "Google 로그인을 사용하는 경우 인증 제공자와 Supabase를 통해 세션과 사용자 식별 정보가 저장될 수 있습니다.",
    ],
  },
  {
    title: "정보 이용 목적",
    body: [
      "무신사 상품 가격 추적 기능 제공",
      "사용자별 저장 상품 목록 관리",
      "로그인 상태 유지 및 계정 보호",
      "서비스 안정화와 오류 대응",
    ],
  },
  {
    title: "보관 기간",
    body: [
      "사용자가 직접 등록한 저장 상품과 관련 데이터는 사용자가 삭제하거나 계정을 더 이상 사용하지 않을 때까지 보관될 수 있습니다.",
      "법적 보관 의무가 없는 한, 운영 목적상 더 이상 필요하지 않은 정보는 합리적인 기간 내에 삭제합니다.",
    ],
  },
  {
    title: "제3자 서비스",
    body: [
      "이 서비스는 Google OAuth와 Supabase를 사용해 인증 및 데이터 저장 기능을 제공합니다.",
      "배포 또는 분석 환경에 따라 Vercel 등 호스팅 인프라가 요청 로그를 처리할 수 있습니다.",
    ],
  },
  {
    title: "이용자 권리",
    body: [
      "사용자는 저장된 상품을 삭제하거나 서비스 이용을 중단할 수 있습니다.",
      "개인정보 관련 문의는 아래 연락처를 통해 요청할 수 있습니다.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <main className="legalShell">
      <section className="legalFrame">
        <article className="legalCard">
          <p className="legalEyebrow">Privacy Policy</p>
          <h1>개인정보처리방침</h1>
          <p className="legalLead">
            Musinsa Tracking은 무신사 상품 가격 추적과 저장 기능을 제공하기 위해 최소한의 정보만 처리합니다.
          </p>
          <div className="legalMeta">
            <span>시행일: 2026년 3월 19일</span>
            <span>문의: wndnjs6304@gmail.com</span>
          </div>
        </article>

        {sections.map((section) => (
          <article className="legalCard" key={section.title}>
            <h2>{section.title}</h2>
            <div className="legalContent">
              {section.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </article>
        ))}

        <article className="legalCard">
          <h2>연락처</h2>
          <div className="legalContent">
            <p>이 문서에 관한 문의는 아래 이메일로 보내주세요.</p>
            <p className="legalContact">wndnjs6304@gmail.com</p>
            <p>
              <Link href="/">서비스로 돌아가기</Link>
            </p>
          </div>
        </article>
      </section>
    </main>
  );
}
