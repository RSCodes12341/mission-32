import { PageTitle } from "@/components/ui";
import { requireUser } from "@/lib/session";

import { NewMissionForm } from "./new-mission-form";

export const metadata = { title: "New mission · September Mission" };

export default async function NewMissionPage() {
  await requireUser();

  return (
    <div className="mx-auto max-w-md space-y-6">
      <PageTitle sub="You'll get an invite code to share once it's created.">
        Start a mission
      </PageTitle>
      <NewMissionForm />
    </div>
  );
}
