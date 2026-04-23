import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '이용약관',
  description: 'Tacit 서비스 이용약관',
};

export default function TermsPage() {
  return (
    <div className="py-16 sm:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 prose prose-sm dark:prose-invert">
        <h1>이용약관</h1>
        <p className="text-muted-foreground text-sm">최종 수정일: 2026년 4월 24일</p>

        <h2>제1조 (목적)</h2>
        <p>
          이 약관은 Tacit(이하 "서비스")이 제공하는 AI 인터뷰 및 프롬프트 생성 서비스의
          이용 조건 및 절차를 규정합니다.
        </p>

        <h2>제2조 (서비스 이용)</h2>
        <ul>
          <li>서비스는 만 14세 이상 이용 가능합니다.</li>
          <li>1인 1계정을 원칙으로 합니다.</li>
          <li>타인의 명의나 정보를 도용하여 가입할 수 없습니다.</li>
        </ul>

        <h2>제3조 (서비스 내용)</h2>
        <p>서비스는 다음 기능을 제공합니다.</p>
        <ul>
          <li>AI 인터뷰 기반 프롬프트(AI 주문서) 생성</li>
          <li>생성된 주문서 저장 및 관리 (서재)</li>
          <li>공개 주문서 공유 (광장)</li>
          <li>Pro 구독 플랜 (월정액)</li>
        </ul>

        <h2>제4조 (결제 및 환불)</h2>
        <ul>
          <li>Pro 플랜은 월 ₩9,900이며 토스페이먼츠를 통해 결제됩니다.</li>
          <li>결제 후 7일 이내 미사용 시 전액 환불이 가능합니다.</li>
          <li>이용 기간 중 해지 시 남은 기간은 환불되지 않습니다.</li>
        </ul>

        <h2>제5조 (지식재산권)</h2>
        <p>
          사용자가 인터뷰를 통해 생성한 AI 주문서의 저작권은 사용자에게 있습니다.
          단, 광장에 공개한 주문서는 다른 사용자가 복제하여 사용할 수 있습니다.
        </p>

        <h2>제6조 (금지 행위)</h2>
        <ul>
          <li>서비스를 이용한 불법 콘텐츠 생성</li>
          <li>타인의 저작권·명예를 침해하는 행위</li>
          <li>서비스의 정상적 운영을 방해하는 행위</li>
        </ul>

        <h2>제7조 (면책)</h2>
        <p>
          서비스는 AI가 생성한 결과물의 정확성을 보장하지 않습니다.
          생성된 주문서의 활용에 따른 결과에 대해 서비스는 책임을 지지 않습니다.
        </p>

        <h2>제8조 (문의)</h2>
        <p>이용약관 관련 문의는 naggu1999@gmail.com으로 연락해 주세요.</p>
      </div>
    </div>
  );
}
