import { redirect } from "next/navigation";
import { HomeLanding } from "@/components/landing/HomeLanding";
import { LandingLayout } from "@/components/landing/LandingLayout";
import { getPostLoginPath } from "@/lib/auth/getPostLoginPath";
import { getServerUserWithProfile } from "@/lib/auth/getServerUserWithProfile";
import { loadHomeLandingData } from "@/lib/landing/landingPageQueries";
import { createClient } from "@/lib/supabase/server";
import type { AppRole } from "@/lib/types/user";

export default async function LandingPage() {
  const { user, profile } = await getServerUserWithProfile();

  const role = profile?.role as AppRole | undefined;
  if (user && role === "mentor") {
    redirect(getPostLoginPath("mentor"));
  }
  const supabase = await createClient();
  const data = await loadHomeLandingData(supabase);

  return (
    <LandingLayout user={user} profile={profile}>
      <HomeLanding data={data} user={user} profile={profile} />
    </LandingLayout>
  );
}
