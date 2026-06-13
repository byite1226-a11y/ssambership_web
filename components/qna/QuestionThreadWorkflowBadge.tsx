"use client";

import {
  readQuestionThreadWorkflowStatus,
  workflowStatusLabel,
  workflowStatusTone,
  type QuestionThreadWorkflowStatus,
} from "@/lib/qna/questionThreadStatus";

const toneClass: Record<ReturnType<typeof workflowStatusTone>, string> = {
  amber: "bg-amber-50 text-amber-900 border-amber-200",
  blue: "bg-blue-50 text-blue-900 border-blue-200",
  emerald: "bg-emerald-50 text-emerald-900 border-emerald-200",
};

export function QuestionThreadWorkflowBadge(props: {
  thread: Record<string, unknown> | null | undefined;
  className?: string;
}) {
  const status: QuestionThreadWorkflowStatus = readQuestionThreadWorkflowStatus(props.thread);
  const tone = workflowStatusTone(status);
  return (
    <span
      className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-black ${toneClass[tone]} ${props.className ?? ""}`}
    >
      {workflowStatusLabel(status)}
    </span>
  );
}
