import { ConfirmEnrollmentPage } from "@/modules/student-enrollment/components/confirm-enrollment-page";

export default function ConfirmEnrollmentRoutePage({
  searchParams,
}: {
  searchParams: { user_id?: string };
}) {
  return <ConfirmEnrollmentPage userId={searchParams.user_id ?? ""} />;
}
