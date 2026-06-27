"use client";

import { useState } from "react";
import Link from "next/link";
import { submitShortformUploadAction } from "@/lib/community/communityShortformActions";
import { SHORTFORM_CATEGORIES } from "@/lib/community/communityShortformConstants";

const PRIMARY = "#2563EB";

const UPLOAD_TIPS = [
  "유익한 내용 — 학습에 도움이 되는 핵심만 담아 주세요",
  "간결하게 전달 — 3분 안에 메시지가 전달되도록 구성해요",
  "선명한 화질 — 밝은 환경에서 촬영하면 좋아요",
  "적절한 길이 — 너무 길면 이탈이 늘 수 있어요",
] as const;

const UPLOAD_BENEFITS = [
  "좋아요를 받으면 포인트가 적립돼요",
  "정기적으로 우수 콘텐츠가 선정돼요",
  "배지 및 랭킹에 반영돼요",
] as const;

export function CommunityShortformUploadForm(props: { errorCode: string | null; draftSaved: boolean }) {
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [previewName, setPreviewName] = useState<string | null>(null);

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

  function addTag() {
    const t = tagInput.replace(/^#/, "").trim();
    if (!t || tags.length >= 5) return;
    if (!tags.includes(t)) setTags((p) => [...p, t]);
    setTagInput("");
  }

  function onVideoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setPreviewName(file?.name ?? null);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <Link href="/community/shortform" className="text-sm font-extrabold text-slate-600 hover:text-[#2563EB]">
          ← 뒤로
        </Link>
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            form="shortform-upload-form"
            name="intent"
            value="draft"
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            임시저장
          </button>
          <button
            type="submit"
            form="shortform-upload-form"
            name="intent"
            value="publish"
            className="rounded-xl px-5 py-2 text-sm font-extrabold text-white"
            style={{ backgroundColor: PRIMARY }}
          >
            발행하기
          </button>
        </div>
      </div>

      <nav className="flex gap-2 border-b border-slate-200 pb-0">
        <Link
          href="/mentor/community/new"
          className="rounded-t-lg border border-b-0 border-transparent px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-800"
        >
          게시글 작성
        </Link>
        <span
          className="rounded-t-lg border border-b-0 border-slate-200 border-b-white bg-white px-4 py-2 text-sm font-extrabold text-[#2563EB]"
          aria-current="page"
        >
          숏폼 업로드
        </span>
      </nav>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <form
          id="shortform-upload-form"
          action={submitShortformUploadAction}
          className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          {props.draftSaved ? (
            <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-900">
              임시저장되었습니다.
            </p>
          ) : null}
          {err ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-900">
              {err}
            </p>
          ) : null}

          <label className="block text-sm font-extrabold text-slate-800">
            제목 (최대 100자)
            <input name="title" required maxLength={100} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
          </label>

          <label className="block text-sm font-extrabold text-slate-800">
            카테고리
            <select name="category" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" defaultValue="study">
              {SHORTFORM_CATEGORIES.filter((c) => c.slug !== "all").map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-extrabold text-slate-800">
            영상 (mp4/mov, 최대 3분/500MB)
            <input
              type="file"
              name="video"
              accept="video/mp4,video/quicktime,video/webm"
              required
              onChange={onVideoChange}
              className="mt-1 w-full text-sm"
            />
          </label>

          <label className="block text-sm font-extrabold text-slate-800">
            썸네일 (선택)
            <input type="file" name="thumbnail" accept="image/jpeg,image/png,image/webp" className="mt-1 w-full text-sm" />
          </label>

          <label className="block text-sm font-extrabold text-slate-800">
            설명 (최대 500자)
            <textarea name="body" maxLength={500} rows={4} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
          </label>

          <fieldset>
            <legend className="text-sm font-extrabold text-slate-800">태그</legend>
            <input type="hidden" name="tags" value={tags.join(",")} />
            <div className="mt-1 flex gap-2">
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
                placeholder="#태그 Enter"
                className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
              <button type="button" onClick={addTag} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold">
                추가
              </button>
            </div>
            <ul className="mt-2 flex flex-wrap gap-2">
              {tags.map((t) => (
                <li key={t} className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-[#2563EB]">
                  #{t}
                </li>
              ))}
            </ul>
          </fieldset>

          <label className="block text-sm font-extrabold text-slate-800">
            출처 (선택)
            <input name="source" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
          </label>

          <label className="flex items-start gap-2 text-sm text-slate-800">
            <input type="checkbox" name="rightsAck" value="on" required className="mt-1 accent-[#2563EB]" />
            <span>영상 및 콘텐츠의 권리를 보유하며 정책에 맞게 올립니다. (필수)</span>
          </label>
        </form>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">미리보기</p>
            <div className="mx-auto mt-3 flex aspect-[9/16] max-h-[360px] w-full max-w-[200px] items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-4 text-center">
              {previewName ? (
                <p className="text-xs font-bold text-slate-700">{previewName}</p>
              ) : (
                <p className="text-xs leading-relaxed text-slate-500">
                  업로드한 영상의 미리보기가 여기에 표시됩니다.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-extrabold text-slate-900">업로드 팁</p>
            <ul className="mt-2 space-y-2">
              {UPLOAD_TIPS.map((t) => (
                <li key={t} className="flex gap-2 text-xs text-slate-600">
                  <span className="text-[#2563EB]" aria-hidden>
                    •
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
            <p className="text-sm font-extrabold text-amber-950">업로드 시 혜택</p>
            <ul className="mt-2 space-y-1.5">
              {UPLOAD_BENEFITS.map((b) => (
                <li key={b} className="flex gap-2 text-xs font-medium text-amber-950">
                  <span aria-hidden>✓</span>
                  {b}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
