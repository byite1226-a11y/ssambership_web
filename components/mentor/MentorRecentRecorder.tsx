"use client";

import { useEffect } from "react";
import { recordRecentMentor } from "@/lib/mentor/recentMentorsStorage";

export function MentorRecentRecorder(props: { mentorId: string }) {
  useEffect(() => {
    recordRecentMentor(props.mentorId);
  }, [props.mentorId]);
  return null;
}
