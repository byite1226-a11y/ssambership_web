"use client";

import { useEffect, useState } from "react";
import { submitShortformUploadAction } from "@/lib/community/communityShortformActions";
import { SHORTFORM_CATEGORIES } from "@/lib/community/communityShortformConstants";
import type { ShortformDraftRow } from "@/lib/community/communityShortformQueries";
import { CommunityComposeTopBar } from "@/components/community/CommunityComposeTopBar";
import { CommunityFileDropzone } from "@/components/community/CommunityFileDropzone";
import { AppToast } from "@/components/ui/AppToast";

const FORM_ID = "shortform-upload-form";

const UPLOAD_TIPS = [
  "유익한 내용 — 학습에 도움이 되는 핵심만 담아 주세요",
  "간결하게 전달 — 3분 안에 메시지가 전달되도록 구성해요",
  "선명한 화질 — 밝은 환경에서 촬영하면 좋아요",
  "적절한 길이 — 너무 길면 이탈이 늘 수 있어요",
] as const;

const UPLOAD_BENEFITS = ["정기적으로 우수 콘텐츠가 선정돼요", "배지 및 랭킹에 반영돼요"] as const;

type Props = {
  errorCode: string | null;
  draftSaved: boolean;
  draft: ShortformDraftRow | null;
};

export function CommunityShortformComposeForm(props: Props) {
  const [previewName, setPreviewName] = useState<string | null>(props.draft?.videoUrl ? "저장된 영상" : null);
  const [toast, setToast] = useState<string | null>(null);
  const hasStoredVideo = Boolean(props.draft?.videoUrl);

  useEffect(() => {
    if (props.draftSaved) setToast("임시저장됨");
  }, [props.draftSaved]);

  const err =
    props.errorCode === "policy"
      ? "외부 연락처·대필 요청은 정책상 제한됩니다."
      : props.errorCode === "mentor_only"
      ? "멘토 계정만 업로드할 수 있어요."
      : props.errorCode === "rights"
        ? "권리 보유 확인이 필요합니다."
        : props.errorCode === "video" || props.errorCode === "video_upload"
          ? "영상 업로드가 필요합니다."
          : props.errorCode === "video_size"
            ? "영상은 최대 500MB까지입니다."
            : props.errorCode
              ? "저장에 실패했습니다."
              : null;

  return (
    <div className="space-y-4">
      <CommunityComposeTopBar backHref="/community/shortform" formId={FORM_ID} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <form
          id={FORM_ID}
          action={submitShortformUploadAction}
          className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6"
        >
          {props.draft ? <input type="hidden" name="draftId" value={props.draft.id} /> : null}
          {hasStoredVideo ? <input type="hidden" name="videoUrl" value={props.draft?.videoUrl ?? ""} /> : null}

          {err ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-900">
              {err}
            </p>
          ) : null}

          <label className="block text-sm font-extrabold text-slate-800">
            제목 (최대 100자)
            <input
              name="title"
              required
              maxLength={100}
              defaultValue={props.draft?.title ?? ""}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
            />
          </label>

          <label className="block text-sm font-extrabold text-slate-800">
            카테고리
            <select
              name="category"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
              defaultValue={props.draft?.category ?? "study"}
            >
              {SHORTFORM_CATEGORIES.filter((c) => c.slug !== "all").map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>

          <div>
            <p className="text-sm font-extrabold text-slate-800">영상 (mp4/mov, 최대 3분/500MB)</p>
            {hasStoredVideo ? (
              <p className="mt-1 text-xs text-slate-500">임시저장된 영상이 있습니다. 새 파일을 선택하면 교체됩니다.</p>
            ) : null}
            <div className="mt-2">
              <CommunityFileDropzone
                name="video"
                accept="video/mp4,video/quicktime,video/webm"
                required={!hasStoredVideo}
                buttonLabel="영상 파일 선택"
                hint="클릭하거나 영상 파일을 끌어다 놓으세요"
                onFilesChange={(files) => setPreviewName(files?.[0]?.name ?? (hasStoredVideo ? "저장된 영상" : null))}
              />
            </div>
            {previewName ? <p className="mt-1 text-xs font-semibold text-slate-700">{previewName}</p> : null}
          </div>

          <label className="block text-sm font-extrabold text-slate-800">
            설명 (최대 500자)
            <textarea
              name="body"
              maxLength={500}
              rows={4}
              defaultValue={props.draft?.body ?? ""}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
            />
          </label>

          <label className="block text-sm font-extrabold text-slate-800">
            출처 (선택)
            <input
              name="source"
              defaultValue={props.draft?.source ?? ""}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
            />
          </label>

          <label className="flex items-start gap-2 text-sm text-slate-800">
            <input type="checkbox" name="rightsAck" value="on" className="mt-1 accent-[#1A56DB]" />
            <span>영상 및 콘텐츠의 권리를 보유하며 정책에 맞게 올립니다. (올리기 시 필수)</span>
          </label>
        </form>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">미리보기</p>
            <div className="mx-auto mt-3 flex aspect-[9/16] max-h-[360px] w-full max-w-[200px] items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-4 text-center">
              {previewName ? (
                <p className="text-xs font-bold text-slate-700">{previewName}</p>
              ) : (
                <p className="text-xs leading-relaxed text-slate-500">업로드한 영상의 미리보기가 여기에 표시됩니다.</p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-extrabold text-slate-900">업로드 팁</p>
            <ul className="mt-2 space-y-2">
              {UPLOAD_TIPS.map((t) => (
                <li key={t} className="flex gap-2 text-xs text-slate-600">
                  <span className="text-[#1A56DB]" aria-hidden>
                    •
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-extrabold text-slate-900">업로드 시 장점</p>
            <ul className="mt-2 space-y-2">
              {UPLOAD_BENEFITS.map((b) => (
                <li key={b} className="flex gap-2 text-xs text-slate-600">
                  <span className="text-[#1A56DB]" aria-hidden>
                    •
                  </span>
                  {b}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
      {toast ? <AppToast message={toast} onDismiss={() => setToast(null)} /> : null}
    </div>
  );
}
