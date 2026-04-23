import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 text-6xl font-black text-muted-foreground/20">404</div>
      <h1 className="text-2xl font-bold text-foreground mb-2">페이지를 찾을 수 없어요</h1>
      <p className="text-muted-foreground text-sm mb-8 max-w-xs">
        주소를 잘못 입력하셨거나 페이지가 이동했을 수 있어요.
      </p>
      <div className="flex gap-3">
        <Link
          href="/"
          className="rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground hover:bg-accent-hover transition-colors"
        >
          홈으로
        </Link>
        <Link
          href="/studio"
          className="rounded-xl border border-border px-5 py-3 text-sm font-medium text-foreground hover:bg-muted transition-colors"
        >
          AI 주문서 만들기
        </Link>
      </div>
    </div>
  );
}
