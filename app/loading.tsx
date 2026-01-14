import { LoadingState } from "@/components/ui/LoadingState";

export default function Loading() {
  return (
    <LoadingState
      title="Loading your workspace…"
      subtitle="Setting things up"
      variant="page"
    />
  );
}
