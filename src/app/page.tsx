import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { ButtonLink, Card } from "@/components/ui";

const GOALS = [
  { label: "Rides", value: 15, hint: "including the pit explorations" },
  { label: "Pit explorations", value: 7, hint: "a subset of the rides" },
  { label: "Sport days", value: 10, hint: "anything that counts as sport" },
];

export default async function Home() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">
          One mission, tracked together.
        </h1>
        <p className="max-w-prose text-muted">
          Everyone joins with an invite code, logs rides and sport days with a before and
          after photo, and watches the same tally fill up. Add it to your home screen and
          it behaves like an app.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {GOALS.map((goal) => (
          <Card key={goal.label} className="px-4 py-4">
            <p className="tabular text-2xl font-semibold">{goal.value}</p>
            <p className="text-sm font-medium">{goal.label}</p>
            <p className="mt-0.5 text-xs text-subtle">{goal.hint}</p>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <ButtonLink href="/register">Create an account</ButtonLink>
        <ButtonLink href="/login" variant="secondary">
          I already have one
        </ButtonLink>
      </div>
    </div>
  );
}
