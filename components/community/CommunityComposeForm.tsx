"use client";

import { useState } from "react";
import Link from "next/link";
import { submitCommunityBoardPostAction } from "@/lib/community/communityBoardActions";
import { COMMUNITY_POST_CATEGORIES, COMMUNITY_HASHTAG_MAX, COMMUNITY_IMAGE_MAX } from "@/lib/community/communityBoardConstants";
import { CommunityCategoryChips } from "@/components/community/CommunityCategoryChips";

const PRIMARY = "#1A56DB";

type Tab = "board" | "shortform";

export function CommunityComposeForm(props: { errorCode: string | null; draftSaved: boolean }) {
  const [tab, setTab] = useState<Tab>("board");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  function addTag() {
    const t = tagInput.replace(/^#/, "").trim();
    if (!t || tags.length >= COMMUNITY_HASHTAG_MAX) return;
    if (tags.includes(t)) {
      setTagInput("");
      return;
    }
    setTags((prev) => [...prev, t]);
    setTagInput("");
  }

  const err =
    props.errorCode === "title"
      ? "\uC81C\uBAA9\uC744 \uC785\uB825\uD574 \uC8FC\uC138\uC694."
      : props.errorCode === "body"
        ? "\uBCF8\uBB38\uC740 \uCD5C\uC18C 10\uC790 \uC774\uC0C1\uC785\uB2C8\uB2E4."
        : props.errorCode === "upload"
          ? "\uC774\uBBF8\uC9C0 \uC5C5\uB85C\uB4DC\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4."
          : props.errorCode === "images"
            ? `\uC774\uBBF8\uC9C0\uB294 \uCD5C\uB300 ${COMMUNITY_IMAGE_MAX}\uC7A5\uAE4C\uC9C0\uC785\uB2C8\uB2E4.`
            : props.errorCode
              ? "\uC800\uC7A5\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4. \uB2E4\uC2DC \uC2DC\uB3C4\uD574 \uC8FC\uC138\uC694."
              : null;

  if (tab === "shortform") {
    return (
      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex gap-2 border-b border-slate-100 pb-3">
          <button type="button" onClick={() => setTab("board")} className="text-sm font-bold text-slate-500">
            {"\uAC8C\uC2DC\uAE00 \uC791\uC131"}
          </button>
          <button type="button" className="border-b-2 text-sm font-extrabold" style={{ borderColor: PRIMARY, color: PRIMARY }}>
            {"숏폼 \uC5C5\uB85C\uB4DC"}
          </button>
        </div>
        <p className="text-sm text-slate-600">
          {"숏폼 \uC601\uC0C1 \uC5C5\uB85C\uB4DC\uB294 "}
          <Link href="/community/shortform" className="font-bold text-[#1A56DB]">
            {"숏폼 \uBA54\uB274"}
          </Link>
          {"\uC5D0\uC11C \uC774\uC5B4\uAC00\uC694. \uBA58\uD1A0\uB294 \uBA58\uD1A0 \uBA54\uB274\uC758 \uCEF4\uD37C\uB2C8\uD2F0 \uC791\uC131\uC744 \uC0AC\uC6A9\uD560 \uC218 \uC788\uC5B4\uC694."}
        </p>
        <Link
          href="/mentor/community/new"
          className="inline-flex rounded-xl px-4 py-2.5 text-sm font-bold text-white"
          style={{ backgroundColor: PRIMARY }}
        >
          {"\uBA58\uD1A0 숏폼 \uC791\uC131 \uC774\uB3D9"}
        </Link>
      </section>
    );
  }

  return (
    <form action={submitCommunityBoardPostAction} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex gap-2 border-b border-slate-100 pb-3">
        <button type="button" className="border-b-2 text-sm font-extrabold" style={{ borderColor: PRIMARY, color: PRIMARY }}>
          {"\uAC8C\uC2DC\uAE00 \uC791\uC131"}
        </button>
        <button type="button" onClick={() => setTab("shortform")} className="text-sm font-bold text-slate-500">
          {"숏폼 \uC5C5\uB85C\uB4DC"}
        </button>
      </div>

      {props.draftSaved ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-900">
          {"\uC784\uC2DC\uC800\uC7A5\uB418\uC5C8\uC2B5\uB2C8\uB2E4."}
        </p>
      ) : null}
      {err ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-900">{err}</p>
      ) : null}

      <label className="block text-sm font-extrabold text-slate-800">
        {"\uC81C\uBAA9"}
        <input name="title" required className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
      </label>

      <CommunityCategoryChips categories={COMMUNITY_POST_CATEGORIES} name="category" defaultSlug="study" />

      <label className="block text-sm font-extrabold text-slate-800">
        {"\uBCF8\uBB38 (\uCD5C\uC18C 10\uC790)"}
        <textarea name="body" required minLength={10} rows={8} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
      </label>

      <label className="block text-sm font-extrabold text-slate-800">
        {`\uC774\uBBF8\uC9C0 (\uCD5C\uB300 ${COMMUNITY_IMAGE_MAX}\uC7A5)`}
        <input
          type="file"
          name="images"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          className="mt-1 w-full text-sm"
        />
      </label>

      <fieldset>
        <legend className="text-sm font-extrabold text-slate-800">{"\uD574\uC2DC\uD0DC\uADF8"}</legend>
        <input type="hidden" name="hashtags" value={tags.join(",")} />
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
            placeholder="#\uD0DC\uADF8 \uC785\uB825 \uD6C4 Enter"
            className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
          <button type="button" onClick={addTag} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold">
            {"\uCD94\uAC00"}
          </button>
        </div>
        <ul className="mt-2 flex flex-wrap gap-2">
          {tags.map((t) => (
            <li key={t} className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-[#1A56DB]">
              #{t}
            </li>
          ))}
        </ul>
      </fieldset>

      <div className="flex flex-wrap gap-2 pt-2">
        <button
          type="submit"
          name="intent"
          value="draft"
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700"
        >
          {"\uC784\uC2DC\uC800\uC7A5"}
        </button>
        <button
          type="submit"
          name="intent"
          value="publish"
          className="rounded-xl bg-[#1A56DB] px-5 py-2.5 text-sm font-bold text-white hover:opacity-90"
        >
          {"\uBC1C\uD589\uD558\uAE30"}
        </button>
      </div>
    </form>
  );
}
