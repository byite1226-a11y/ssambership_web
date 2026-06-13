"use client";

import { useEffect, useState } from "react";
import { submitCommunityBoardPostAction } from "@/lib/community/communityBoardActions";
import { COMMUNITY_POST_CATEGORIES, COMMUNITY_IMAGE_MAX } from "@/lib/community/communityBoardConstants";
import type { CommunityBoardDraftRow } from "@/lib/community/communityBoardQueries";
import { COMMUNITY_BOARD_COMPOSE_PATH } from "@/lib/community/communityComposeTab";
import { CommunityCategoryChips } from "@/components/community/CommunityCategoryChips";
import { CommunityComposeTopBar } from "@/components/community/CommunityComposeTopBar";
import { CommunityFileDropzone } from "@/components/community/CommunityFileDropzone";
import { AppToast } from "@/components/ui/AppToast";

const FORM_ID = "board-compose-form";

type Props = {
  errorCode: string | null;
  draftSaved: boolean;
  draft: CommunityBoardDraftRow | null;
  returnPath?: string;
};

export function CommunityBoardComposeForm(props: Props) {
  const [toast, setToast] = useState<string | null>(null);
  const returnPath = props.returnPath ?? COMMUNITY_BOARD_COMPOSE_PATH;

  useEffect(() => {
    if (props.draftSaved) setToast("임시저장됨");
  }, [props.draftSaved]);

  const err =
    props.errorCode === "title"
      ? "제목을 입력해 주세요."
      : props.errorCode === "body"
        ? "본문은 최소 10자 이상입니다."
        : props.errorCode === "upload"
          ? "이미지 업로드에 실패했습니다."
          : props.errorCode === "images"
            ? `이미지는 최대 ${COMMUNITY_IMAGE_MAX}장까지입니다.`
            : props.errorCode
              ? "저장에 실패했습니다. 다시 시도해 주세요."
              : null;

  return (
    <div className="space-y-4">
      <CommunityComposeTopBar backHref="/community/board" formId={FORM_ID} />
      <form
        id={FORM_ID}
        action={submitCommunityBoardPostAction}
        className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6"
      >
        <input type="hidden" name="returnPath" value={returnPath} />
        {props.draft ? (
          <>
            <input type="hidden" name="draftId" value={props.draft.id} />
            <input type="hidden" name="existingImageUrls" value={JSON.stringify(props.draft.imageUrls)} />
          </>
        ) : null}

        {err ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-900">{err}</p>
        ) : null}

        <label className="block text-sm font-extrabold text-slate-800">
          제목
          <input
            name="title"
            required
            defaultValue={props.draft?.title ?? ""}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
          />
        </label>

        <CommunityCategoryChips
          categories={COMMUNITY_POST_CATEGORIES}
          name="category"
          defaultSlug={props.draft?.category ?? "study"}
        />

        <label className="block text-sm font-extrabold text-slate-800">
          본문 (올리기 시 최소 10자)
          <textarea
            name="body"
            rows={8}
            defaultValue={props.draft?.body ?? ""}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
          />
        </label>

        <div>
          <p className="text-sm font-extrabold text-slate-800">{`이미지 (최대 ${COMMUNITY_IMAGE_MAX}장)`}</p>
          {props.draft?.imageUrls.length ? (
            <p className="mt-1 text-xs text-slate-500">기존 {props.draft.imageUrls.length}장 유지 · 새로 선택하면 추가됩니다.</p>
          ) : null}
          <div className="mt-2">
            <CommunityFileDropzone
              name="images"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              buttonLabel="이미지 첨부"
              maxFiles={COMMUNITY_IMAGE_MAX}
            />
          </div>
        </div>
      </form>
      {toast ? <AppToast message={toast} onDismiss={() => setToast(null)} /> : null}
    </div>
  );
}
