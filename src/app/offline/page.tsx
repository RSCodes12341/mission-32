import { EmptyState } from "@/components/ui";

export const metadata = { title: "Offline · September Mission" };

export default function OfflinePage() {
  return (
    <EmptyState title="You&rsquo;re offline">
      Pages you&rsquo;ve already opened still work. Logging an activity needs a connection
      — try again once you&rsquo;re back.
    </EmptyState>
  );
}
