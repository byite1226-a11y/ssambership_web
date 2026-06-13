import Link from "next/link";

type Props = {
  title?: string;
  body: string;
  subscribeHref?: string;
};

export function PaymentRequiredState(props: Props) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-5 text-sm text-amber-950">
      <p className="font-extrabold">{props.title ?? "결제·구독 확인이 필요합니다"}</p>
      <p className="mt-2 leading-relaxed font-medium">{props.body}</p>
      {props.subscribeHref ? (
        <p className="mt-4">
          <Link href={props.subscribeHref} className="font-bold text-blue-800 underline underline-offset-2 hover:text-blue-950">
            구독·결제 화면으로
          </Link>
        </p>
      ) : null}
    </div>
  );
}
