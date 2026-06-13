export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-black text-slate-900">시스템 설정</h1>
        <p className="mt-1 text-sm text-slate-600">플랫폼 운영 설정을 관리합니다.</p>
      </header>
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-600">요금제·수수료·알림 정책 등은 추후 이 화면에서 설정할 수 있습니다.</p>
      </section>
    </div>
  );
}
