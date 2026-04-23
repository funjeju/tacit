import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  UtensilsCrossed,
  GraduationCap,
  Home,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';
import type { DomainId } from '@/types';

type DomainConfig = {
  label: string;
  description: string;
  Icon: React.ComponentType<{ className?: string }>;
  templates: Array<{
    id: string;
    name: string;
    desc: string;
    outputType: string;
    estimatedTime: string;
  }>;
};

const DOMAIN_CONFIG: Record<DomainId, DomainConfig> = {
  restaurant: {
    label: '식당 사장',
    description: '20년 경험을 담은 맞춤 AI 주문서로 홍보·고객응대를 손쉽게',
    Icon: UtensilsCrossed,
    templates: [
      { id: 'new_menu_poster', name: '신메뉴 포스터 만들기', desc: '가게 앞 A4 포스터용 이미지', outputType: 'image', estimatedTime: '3~5분' },
      { id: 'review_response', name: '리뷰 답글 작성', desc: '네이버·배민 리뷰에 답글', outputType: 'report', estimatedTime: '2~4분' },
      { id: 'instagram_post', name: '인스타그램 피드 이미지', desc: '정사각형 SNS 게시물', outputType: 'image', estimatedTime: '3~5분' },
      { id: 'menu_description', name: '메뉴판 설명 문구', desc: '침 넘어가는 3~5줄 설명', outputType: 'report', estimatedTime: '2~3분' },
      { id: 'event_flyer', name: '이벤트 전단지', desc: '할인·신메뉴 오픈 전단지', outputType: 'ppt', estimatedTime: '4~6분' },
    ],
  },
  education: {
    label: '선생님',
    description: '25년 교육 경험을 살린 수업자료·학부모 소통을 AI로 간단하게',
    Icon: GraduationCap,
    templates: [
      { id: 'lesson_plan', name: '수업 지도안 초안', desc: '차시별 수업 지도안', outputType: 'report', estimatedTime: '4~6분' },
      { id: 'parent_communication', name: '학부모 상담 답변', desc: '문의·불만 메시지 답변', outputType: 'report', estimatedTime: '2~4분' },
      { id: 'quiz_generator', name: '평가 문제 출제', desc: '객관식·서술형 문항 생성', outputType: 'report', estimatedTime: '3~5분' },
      { id: 'presentation_slides', name: '수업용 슬라이드 기획', desc: 'Gamma용 슬라이드 생성', outputType: 'ppt', estimatedTime: '4~6분' },
      { id: 'student_feedback', name: '학생별 피드백 코멘트', desc: '학기말 개별 피드백 문구', outputType: 'report', estimatedTime: '2~4분' },
    ],
  },
  real_estate: {
    label: '공인중개사',
    description: '15년 중개 경험을 담은 매물 설명·고객응대를 AI로 빠르게',
    Icon: Home,
    templates: [
      { id: 'listing_description', name: '매물 소개 글 작성', desc: '네이버·직방용 매물 설명', outputType: 'report', estimatedTime: '4~6분' },
      { id: 'customer_response', name: '고객 문의 답변', desc: '카톡·문자 문의 답변', outputType: 'report', estimatedTime: '2~3분' },
      { id: 'market_report', name: '동네 시장 분석 리포트', desc: '지역 시세·트렌드 분석', outputType: 'report', estimatedTime: '5~7분' },
      { id: 'property_photo', name: '매물 사진 보정 주문서', desc: 'AI 이미지 보정 도구용', outputType: 'image', estimatedTime: '2~3분' },
      { id: 'contract_explainer', name: '계약 조건 쉬운 설명', desc: '특약·등기부 쉬운 설명', outputType: 'report', estimatedTime: '3~5분' },
    ],
  },
  beauty: {
    label: '미용사·피부관리사',
    description: '준비 중입니다',
    Icon: UtensilsCrossed,
    templates: [],
  },
  small_biz: {
    label: '소공인·공방',
    description: '준비 중입니다',
    Icon: UtensilsCrossed,
    templates: [],
  },
  service: {
    label: '서비스업',
    description: '준비 중입니다',
    Icon: UtensilsCrossed,
    templates: [],
  },
};

const OUTPUT_TYPE_LABEL: Record<string, string> = {
  image: '이미지',
  report: '문서',
  ppt: '발표자료',
  video: '영상',
  code: '코드',
  music: '음악',
};

const AVAILABLE_DOMAINS: DomainId[] = ['restaurant', 'education', 'real_estate'];

export default async function DomainStudioPage({
  params,
}: {
  params: Promise<{ domainId: string }>;
}) {
  const { domainId } = await params;

  if (!AVAILABLE_DOMAINS.includes(domainId as DomainId)) {
    notFound();
  }

  const domain = DOMAIN_CONFIG[domainId as DomainId];
  const { label, description, Icon, templates } = domain;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/90 backdrop-blur sticky top-0 z-40">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 flex items-center h-14 gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">홈</Link>
          <ChevronRight className="size-3" />
          <Link href="/studio" className="hover:text-foreground transition-colors">AI 주문서 만들기</Link>
          <ChevronRight className="size-3" />
          <span className="text-foreground font-medium">{label}</span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 sm:px-6 py-10 sm:py-16">
        {/* 도메인 헤더 */}
        <div className="mb-10 flex items-start gap-4">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-accent/10">
            <Icon className="size-7 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{label} 전용</h1>
            <p className="mt-1 text-muted-foreground">{description}</p>
          </div>
        </div>

        {/* 템플릿 목록 */}
        <div className="space-y-3">
          {templates.map((tpl) => (
            <Link
              key={tpl.id}
              href={`/studio/create?type=${tpl.outputType}&domain=${domainId}&template=${tpl.id}`}
              className="group flex items-center gap-4 rounded-xl border border-border bg-card p-5 hover:border-accent/50 hover:shadow-md transition-all"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-foreground text-lg">{tpl.name}</span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {OUTPUT_TYPE_LABEL[tpl.outputType]}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{tpl.desc}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs text-muted-foreground">{tpl.estimatedTime}</span>
                <ArrowRight className="size-5 text-muted-foreground group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
              </div>
            </Link>
          ))}
        </div>

        {/* 직접 만들기 */}
        <div className="mt-8 rounded-xl border border-dashed border-border p-5 text-center">
          <p className="text-sm text-muted-foreground mb-3">원하는 게 없으세요? 직접 설명해 드릴게요.</p>
          <Link
            href={`/studio/create?domain=${domainId}`}
            className="inline-flex items-center gap-2 rounded-xl bg-muted px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted/80 transition-colors"
          >
            자유롭게 만들기
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </main>
    </div>
  );
}
