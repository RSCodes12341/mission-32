import { Suspense } from "react";

import { PageTitle } from "@/components/ui";
import { requireUser } from "@/lib/session";

import { JoinMissionForm } from "./join-mission-form";

export const metadata = { title: "Join a mission · September Mission" };

export default async function JoinMissionPage() {
  await requireUser();

  return (
    <div className="mx-auto max-w-md space-y-6">
      <PageTitle sub="Ask whoever started the mission for the 6-character code.">
        Join a mission
      </PageTitle>
      <Suspense fallback={null}>
        <JoinMissionForm />
      </Suspense>
    </div>
  );
}
