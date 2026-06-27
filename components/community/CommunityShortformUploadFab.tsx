"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppToast } from "@/components/ui/AppToast";

const PRIMARY = "#2563EB";
const UPLOAD_PATH = "/community/shortform/new";

type Props = {
  isLoggedIn: boolean;
  isMentor: boolean;
};

export function CommunityShortformUploadFab(props: Props) {
  const router = useRouter();
  const [toast, setToast] = useState<string | null>(null);

  function onClick() {
    if (!props.isLoggedIn) {
      router.push(`/login?next=${encodeURIComponent(UPLOAD_PATH)}`);
      return;
    }
    if (!props.isMentor) {
      setToast("숏폼 업로드는 멘토만 가능합니다.");
      return;
    }
    router.push(UPLOAD_PATH);
  }

  return (
    <>
      <button
        type="button"
        onClick={onClick}
        className="fixed bottom-6 right-6 z-40 flex h-14 items-center gap-1 rounded-full px-5 text-sm font-extrabold text-white shadow-lg transition hover:scale-105 sm:bottom-8 sm:right-8"
        style={{ backgroundColor: PRIMARY }}
        aria-label="숏폼 올리기"
      >
        <span className="text-xl leading-none">+</span>
        <span>숏폼 올리기</span>
      </button>
      {toast ? <AppToast message={toast} onDismiss={() => setToast(null)} /> : null}
    </>
  );
}
