export function FileUploadUnavailableNotice() {
  return (
    <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600">
      파일·영상 업로드는 저장소·검수 백엔드가 연결된 화면에서만 활성화됩니다. 이 화면에서는 업로드 버튼을 제공하지 않습니다.
    </p>
  );
}
