import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { ButtonLink, Card } from "@/components/ui";

const POINTS = [
  { title: "Count anything", body: "Rides, climbs, sauna, whatever you agreed on. You set the list and the targets." },
  { title: "Everyone runs their own", body: "Each person works through their own copy. One member being ahead doesn't finish it for anyone else." },
  { title: "Did it together? Log it once", body: "Tag whoever was with you and it counts for all of you." },
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
          Everyone joins with an invite code, logs sessions with a before and after photo,
          and watches their own tally fill up next to everyone else&rsquo;s. Add it to your
          home screen and it behaves like an app.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {POINTS.map((point) => (
          <Card key={point.title} className="px-4 py-4">
            <p className="text-sm font-semibold">{point.title}</p>
            <p className="mt-1 text-sm text-muted">{point.body}</p>
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
