export type InvoiceStatus = "ISSUED" | "PARTIALLY_PAID" | "PAID" | "VOID";
export type PaymentStatus = "POSTED" | "REVERSED";
export type PaymentMethod =
  | "CASH"
  | "BANK_TRANSFER"
  | "CHEQUE"
  | "CARD"
  | "ESEWA"
  | "KHALTI"
  | "FONEPAY"
  | "OTHER";

export type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type FeeInvoiceLine = {
  id: string;
  fee_structure: string;
  fee_head: string;
  fee_head_code: string;
  fee_head_name: string;
  fee_period: string;
  description: string;
  quantity: string;
  unit_amount: string;
  gross_amount: string;
  discount_amount: string;
  scholarship_amount: string;
  net_amount: string;
  source_start: string;
  source_end: string;
};

export type FeeInvoice = {
  id: string;
  invoice_number: string;
  student: string;
  enrollment: string;
  batch: number;
  batch_name: string;
  academic_class: string;
  class_name: string;
  period_start: string;
  period_end: string;
  invoice_date: string;
  due_date: string;
  status: InvoiceStatus;
  currency: string;
  subtotal: string;
  discount_amount: string;
  scholarship_amount: string;
  total_amount: string;
  paid_amount: string;
  advance_applied: string;
  due_amount: string;
  opening_due_amount: string;
  account_due_at_issue: string;
  notes: string;
  created_at: string;
  lines: FeeInvoiceLine[];
};

export type GenerateInvoicePayload = {
  enrollment_id: string;
  period_start: string;
  period_end: string;
  invoice_date?: string;
  due_date?: string;
  notes?: string;
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

export type FeePayment = {
  id: string;
  receipt_number: string;
  student: string;
  enrollment: string;
  paid_at: string;
  amount: string;
  currency: string;
  payment_method: PaymentMethod;
  external_reference: string;
  notes: string;
  status: PaymentStatus;
  before_payment_due: string;
  after_payment_due: string;
  advance_created: string;
  advance_balance_after: string;
  received_by_name: string;
  created_at: string;
  allocations: PaymentAllocation[];
};

export type PostPaymentPayload = {
  enrollment_id: string;
  amount: string;
  paid_at: string;
  payment_method: PaymentMethod;
  invoice_ids: string[];
  auto_allocate: boolean;
  external_reference: string;
  notes: string;
  idempotency_key: string;
};

export type PaymentPostResponse = {
  message: string;
  created: boolean;
  data: FeePayment;
};
