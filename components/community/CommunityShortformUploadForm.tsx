"use client";

import { useState } from "react";
import Link from "next/link";
import { submitShortformUploadAction } from "@/lib/community/communityShortformActions";
import { SHORTFORM_CATEGORIES } from "@/lib/community/communityShortformConstants";

const PRIMARY = "#1A56DB";

export function CommunityShortformUploadForm(props: { errorCode: string | null; draftSaved: boolean }) {
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const err =
    props.errorCode === "mentor_only"
      ? "\uBA58\uD1A0 \uACC4\uC815\uB9CC \uC5C5\uB85C\uB4DC\uD560 \uC218 \uC788\uC5B4\uC694."
      : props.errorCode === "rights"
        ? "\uAD8C\uB9AC \uBCF4\uC720 \uD655\uC778\uC774 \uD544\uC694\uD569\uB2C8\uB2E4."
        : props.errorCode === "video" || props.errorCode === "video_upload"
          ? "\uC601\uC0C1 \uC5C5\uB85C\uB4DC\uAC00 \uD544\uC694\uD569\uB2C8\uB2E4."
          : props.errorCode === "video_size"
            ? "\uC601\uC0C1\uC740 \uCD5C\uB300 500MB\uAE4C\uC9C0\uC785\uB2C8\uB2E4."
            : props.errorCode
              ? "\uC800\uC7A5\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4."
              : null;

  function addTag() {
    const t = tagInput.replace(/^#/, "").trim();
    if (!t || tags.length >= 5) return;
    if (!tags.includes(t)) setTags((p) => [...p, t]);
    setTagInput("");
  }

  return (
    <form action={submitShortformUploadAction} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      {props.draftSaved ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-900">
          {"\uC784\uC2DC\uC800\uC7A5\uB418\uC5C8\uC2B5\uB2C8\uB2E4."}
        </p>
      ) : null}
      {err ? <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-900">{err}</p> : null}

      <label className="block text-sm font-extrabold text-slate-800">
        {"\uC81C\uBAA9 (\uCD5C\uB300 100\uC790)"}
        <input name="title" required maxLength={100} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
      </label>

      <label className="block text-sm font-extrabold text-slate-800">
        {"\uCE74\uD14C\uACE0\uB9AC"}
        <select name="category" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" defaultValue="study">
          {SHORTFORM_CATEGORIES.filter((c) => c.slug !== "all").map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.label}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-sm font-extrabold text-slate-800">
        {"\uC601\uC0C1 (mp4/mov, \uCD5C\uB300 3\uBD84/500MB)"}
        <input type="file" name="video" accept="video/mp4,video/quicktime,video/webm" required className="mt-1 w-full text-sm" />
      </label>

      <label className="block text-sm font-extrabold text-slate-800">
        {"\uC378\uB124\uC77C (\uC120\uD0DD)"}
        <input type="file" name="thumbnail" accept="image/jpeg,image/png,image/webp" className="mt-1 w-full text-sm" />
      </label>

      <label className="block text-sm font-extrabold text-slate-800">
        {"\uC124\uBA85 (\uCD5C\uB300 500\uC790)"}
        <textarea name="body" maxLength={500} rows={4} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
      </label>

      <fieldset>
        <legend className="text-sm font-extrabold text-slate-800">{"\uD0DC\uADF8"}</legend>
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
            placeholder="#\uD0DC\uADF8 Enter"
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

      <label className="block text-sm font-extrabold text-slate-800">
        {"\uCD9C\uCC98 (\uC120\uD0DD)"}
        <input name="source" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
      </label>

      <label className="flex items-start gap-2 text-sm text-slate-800">
        <input type="checkbox" name="rightsAck" value="on" required className="mt-1" />
        <span>{"\uC601\uC0C1 \uBC0F \uCF58\uD150\uCE20\uC758 \uAD8C\uB9AC\uB97C \uBCF4\uC720\uD558\uBA70 \uC815\uCC45\uC5D0 \uB9DE\uAC8C \uC62C\uB9BD\uB2C8\uB2E4."}</span>
      </label>

      <div className="flex flex-wrap gap-2">
        <button type="submit" name="intent" value="draft" className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700">
          {"\uC784\uC2DC\uC800\uC7A5"}
        </button>
        <button type="submit" name="intent" value="publish" className="rounded-xl px-5 py-2.5 text-sm font-bold text-white" style={{ backgroundColor: PRIMARY }}>
          {"\uBC1C\uD589\uD558\uAE30"}
        </button>
        <Link href="/community/shortform" className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-500">
          {"\uCDE8\uC18C"}
        </Link>
      </div>
    </form>
  );
}
