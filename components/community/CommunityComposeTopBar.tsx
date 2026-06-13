import Link from "next/link";

const PRIMARY = "#1A56DB";

type Props = {
  backHref: string;
  formId: string;
};

export function CommunityComposeTopBar(props: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <Link href={props.backHref} className="text-sm font-extrabold text-slate-600 hover:text-[#1A56DB]">
        ← 뒤로
      </Link>
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          form={props.formId}
          name="intent"
          value="draft"
          formNoValidate
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
        >
          임시저장
        </button>
        <button
          type="submit"
          form={props.formId}
          name="intent"
          value="publish"
          className="rounded-xl px-5 py-2 text-sm font-extrabold text-white hover:opacity-90"
          style={{ backgroundColor: PRIMARY }}
        >
          올리기
        </button>
      </div>
    </div>
  );
}
