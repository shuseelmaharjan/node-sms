import { Spinner } from "@/components/ui/spinner";

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex items-center gap-2">
        <Spinner />
        <span className="text-sm">Loading...</span>
      </div>
    </div>
  );
}
