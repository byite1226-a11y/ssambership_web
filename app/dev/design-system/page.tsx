import { notFound } from "next/navigation";
import {
  StatNumber,
  SurfaceCard,
  StatusBadge,
  Button,
  ProgressTimeline,
  EmptyState,
  DS_CUSTOM_ORDER_PROGRESS_STEPS,
} from "@/components/design-system";

export const metadata = {
  title: "Design System v1 (dev)",
  robots: { index: false, follow: false },
};

/**
 * 내부 미리보기 — production에서는 404.
 * 네비·사이트맵에 추가하지 않음.
 */
export default function DesignSystemPreviewPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <div className="mx-auto max-w-5xl space-y-10 px-4 py-10 sm:px-6">
      <header className="space-y-2 border-b border-ds-border-subtle pb-6">
        <p className="ds-text-caption uppercase tracking-wider">Development only</p>
        <h1 className="ds-text-h1">Design System v1</h1>
        <p className="ds-text-body max-w-2xl">
          토큰·공통 컴포넌트 미리보기. 기존 프로덕션 화면은 변경하지 않았습니다.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="ds-text-h2">Typography & StatNumber</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <SurfaceCard title="새 의뢰">
            <StatNumber value={12} unit="건" label="새 의뢰" hint="미제안 12건" />
          </SurfaceCard>
          <SurfaceCard title="이번 달 수익">
            <StatNumber value="128,400" unit="캐시" label="이번 달 수익" />
          </SurfaceCard>
          <SurfaceCard variant="emphasis" title="Display 위계">
            <p className="ds-text-display">2.25rem</p>
            <p className="mt-1 ds-text-caption">display · body(0.875rem) 대비 ~2.6×</p>
          </SurfaceCard>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="ds-text-h2">StatusBadge</h2>
        <SurfaceCard>
          <div className="flex flex-wrap gap-2">
            <StatusBadge label="모집 중" kind="active" />
            <StatusBadge label="제안서 제출됨" kind="pending" />
            <StatusBadge label="완료" kind="success" />
            <StatusBadge label="분쟁" kind="error" />
            <StatusBadge label="안내" kind="info" />
            <StatusBadge label="종료" kind="default" size="sm" />
          </div>
        </SurfaceCard>
      </section>

      <section className="space-y-4">
        <h2 className="ds-text-h2">Button</h2>
        <SurfaceCard>
          <p className="mb-4 ds-text-caption">primary는 화면당 1곳만 — 나머지는 secondary/ghost</p>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary" accent="mentor">
              멘토 primary
            </Button>
            <Button variant="primary" accent="student">
              학생 primary
            </Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="primary" accent="mentor" size="sm">
              sm
            </Button>
            <Button variant="secondary" size="lg">
              lg
            </Button>
          </div>
        </SurfaceCard>
      </section>

      <section className="space-y-4">
        <h2 className="ds-text-h2">ProgressTimeline</h2>
        <SurfaceCard title="가로형 (목록)">
          <ProgressTimeline steps={DS_CUSTOM_ORDER_PROGRESS_STEPS} currentIndex={2} orientation="horizontal" />
        </SurfaceCard>
        <SurfaceCard title="세로형 (작업방)">
          <ProgressTimeline
            steps={DS_CUSTOM_ORDER_PROGRESS_STEPS}
            currentIndex={1}
            orientation="vertical"
            className="max-w-xs"
          />
        </SurfaceCard>
      </section>

      <section className="space-y-4">
        <h2 className="ds-text-h2">EmptyState</h2>
        <EmptyState
          title="아직 수락된 의뢰가 없어요"
          description="학생이 제안을 수락하면 여기에 표시됩니다."
          action={
            <Button variant="primary" accent="mentor">
              새 의뢰 보기
            </Button>
          }
        />
      </section>

      <section className="space-y-3 rounded-2xl border border-ds-border-subtle bg-ds-muted p-5">
        <h2 className="ds-text-h3">Token reference</h2>
        <dl className="grid gap-2 text-ds-caption sm:grid-cols-2">
          <div>
            <dt className="font-bold text-ds-secondary">Accent student</dt>
            <dd className="text-ds-accent-student">#2563eb</dd>
          </div>
          <div>
            <dt className="font-bold text-ds-secondary">Accent mentor</dt>
            <dd className="text-ds-accent-mentor">#059669</dd>
          </div>
          <div>
            <dt className="font-bold text-ds-secondary">Card padding</dt>
            <dd>p-5 (20px)</dd>
          </div>
          <div>
            <dt className="font-bold text-ds-secondary">Section gap</dt>
            <dd>gap-6 (24px)</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
