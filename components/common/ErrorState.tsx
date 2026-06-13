type Props = { title?: string; message: string };

export function ErrorState(props: Props) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-950">
      {props.title ? <p className="font-extrabold">{props.title}</p> : null}
      <p className={props.title ? "mt-1 font-medium" : "font-semibold"}>{props.message}</p>
    </div>
  );
}
