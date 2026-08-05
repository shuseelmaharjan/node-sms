export type PaymentStatus = "POSTED" | "REVERSED" | string;

export type PaymentStudentDetail = {
  id: string;
  registration_no?: string | null;
  full_name?: string | null;
  phone?: string | null;
};

export type PaymentAllocation = {
  id: string;
  invoice: string;
  invoice_number: string;
  amount: string;
  status: string;
  invoice_due_after: string;
  created_at: string;
};

export type BillingRecord = {
  serial?: number;
  id: string;
  receipt_number: string;
  student: string;
  student_detail?: PaymentStudentDetail | null;
  enrollment: string;
  batch: number;
  batch_name?: string | null;
  academic_class: string;
  class_name?: string | null;
  section_id?: string | null;
  section_name?: string | null;
  paid_at: string;
  amount: string;
  currency: string;
  payment_method: string;
  external_reference?: string | null;
  notes?: string | null;
  status: PaymentStatus;
  account_gross_amount?: string;
  account_discount_amount?: string;
  account_scholarship_amount?: string;
  account_net_amount?: string;
  account_paid_after?: string;
  before_payment_due: string;
  after_payment_due: string;
  advance_created?: string;
  advance_balance_after?: string;
  received_by?: string | null;
  received_by_name?: string | null;
  created_at: string;
  allocations?: PaymentAllocation[];
};

export type StudentSearchEnrollment = {
  id: string;
  batch_id: number;
  batch_name: string;
  academic_class_id: string;
  class_name: string;
  section_id: string | null;
  section_name: string | null;
  status: string;
  enrolled_at: string;
};

export type StudentSearchResult = {
  id: string;
  phone: string | null;
  email: string | null;
  username: string | null;
  role: string;
  status: string;
  registration_no: string | null;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  full_name: string;
  profile_id: string | null;
  current_enrollment: StudentSearchEnrollment | null;
};