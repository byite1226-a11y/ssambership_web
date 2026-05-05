import { HomeLanding } from "@/components/landing/HomeLanding";
import { LandingLayout } from "@/components/landing/LandingLayout";
import { getServerUserWithProfile } from "@/lib/auth/getServerUserWithProfile";
import { loadHomeLandingData } from "@/lib/landing/landingPageQueries";
import { createClient } from "@/lib/supabase/server";

export default async function LandingPage() {
  const { user, profile } = await getServerUserWithProfile();
  const supabase = await createClient();
  const data = await loadHomeLandingData(supabase);

  return (
    <LandingLayout user={user} profile={profile}>
      <HomeLanding data={data} user={user} profile={profile} />
    </LandingLayout>
  );
}
