import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '개인정보처리방침',
  description: 'Tacit 개인정보처리방침',
};

export default function PrivacyPage() {
  return (
    <div className="py-16 sm:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 prose prose-sm dark:prose-invert">
        <h1>개인정보처리방침</h1>
        <p className="text-muted-foreground text-sm">최종 수정일: 2026년 4월 24일</p>

        <h2>1. 수집하는 개인정보</h2>
        <p>
          Tacit(이하 "서비스")은 서비스 제공을 위해 다음 정보를 수집합니다.
        </p>
        <ul>
          <li>이메일 주소 (Firebase Authentication을 통한 Google 로그인)</li>
          <li>인터뷰 응답 내용 (AI 주문서 생성 목적)</li>
          <li>서비스 이용 기록 및 생성된 AI 주문서</li>
        </ul>

        <h2>2. 개인정보의 이용 목적</h2>
        <ul>
          <li>AI 주문서(프롬프트) 생성 및 저장</li>
          <li>서비스 이용 통계 및 품질 개선</li>
          <li>결제 처리 (Pro 플랜 구독)</li>
        </ul>

        <h2>3. 개인정보의 보관 및 파기</h2>
        <p>
          회원 탈퇴 시 개인정보는 즉시 파기됩니다. 단, 관계 법령에 따라 보존이 필요한 경우
          해당 기간 동안 보관 후 파기합니다.
        </p>

        <h2>4. 제3자 제공</h2>
        <p>
          수집된 개인정보는 법령에 따른 경우를 제외하고 제3자에게 제공하지 않습니다.
          다만, AI 주문서 생성을 위해 Anthropic API에 인터뷰 응답 내용이 전달됩니다.
        </p>

        <h2>5. 쿠키 및 분석</h2>
        <p>
          서비스는 Google Firebase Analytics를 사용하여 사용 통계를 수집합니다.
          브라우저 설정을 통해 쿠키 사용을 거부할 수 있으나, 일부 기능이 제한될 수 있습니다.
        </p>

        <h2>6. 문의</h2>
        <p>
          개인정보 관련 문의는 naggu1999@gmail.com으로 연락해 주세요.
        </p>
      </div>
    </div>
  );
}
