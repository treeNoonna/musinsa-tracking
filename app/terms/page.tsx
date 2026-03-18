import type { Metadata } from "next";
import Link from "next/link";

import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `이용약관 | ${SITE_NAME}`,
  description: `${SITE_NAME} 이용약관`,
  alternates: {
    canonical: "/terms",
  },
};

const sections = [
  {
    title: "서비스 내용",
    body: [
      "Musinsa Tracking은 사용자가 등록한 무신사 상품 URL을 기준으로 가격 정보와 추이 데이터를 확인할 수 있게 돕는 도구입니다.",
      "서비스는 외부 사이트 구조 변경, 네트워크 상태, 인증 설정에 따라 일부 기능이 일시적으로 동작하지 않을 수 있습니다.",
    ],
  },
  {
    title: "이용자 책임",
    body: [
      "사용자는 본인이 접근 가능한 상품 URL만 등록해야 합니다.",
      "자동화된 사용이나 과도한 요청으로 서비스 운영에 부담을 주는 행위는 제한될 수 있습니다.",
    ],
  },
  {
    title: "데이터와 계정",
    body: [
      "로그인 사용자는 Google OAuth를 통해 인증될 수 있으며, 저장된 상품 목록은 사용자별로 분리되어 관리됩니다.",
      "사용자가 직접 삭제하지 않은 저장 데이터는 서비스 운영 범위 내에서 유지될 수 있습니다.",
    ],
  },
  {
    title: "면책",
    body: [
      "가격 정보는 참고용이며, 실제 판매 가격이나 재고 상태와 차이가 있을 수 있습니다.",
      "운영자는 서비스 중단, 외부 API 변경, 사이트 구조 변경으로 인한 손해에 대해 법률상 허용되는 범위 내에서 책임을 제한합니다.",
    ],
  },
  {
    title: "약관 변경",
    body: [
      "운영자는 서비스 변경에 맞춰 본 약관을 수정할 수 있습니다.",
      "중요한 변경이 있는 경우 이 페이지의 시행일을 업데이트합니다.",
    ],
  },
];

export default function TermsPage() {
  return (
    <main className="legalShell">
      <section className="legalFrame">
        <article className="legalCard">
          <p className="legalEyebrow">Terms of Service</p>
          <h1>이용약관</h1>
          <p className="legalLead">
            이 약관은 Musinsa Tracking 서비스의 이용 조건과 책임 범위를 설명합니다.
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
          <h2>문의</h2>
          <div className="legalContent">
            <p>약관 관련 문의는 아래 이메일로 보내주세요.</p>
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
