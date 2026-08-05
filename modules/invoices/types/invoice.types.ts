export type InvoiceStudentDetail = {
  id: string;
  registration_no?: string | null;
  full_name?: string | null;
  phone?: string | null;
};

export type InvoiceLine = {
  id: string;
  fee_head_name: string;
  description?: string;
  net_amount: string;
};

export type InvoiceRecord = {
  serial?: number;
  id: string;
  invoice_number: string;
  student: string;
  student_detail?: InvoiceStudentDetail | null;
  enrollment: string;
  batch: number;
  batch_name?: string | null;
  academic_class: string;
  class_name?: string | null;
  section_id?: string | null;
  section_name?: string | null;
  period_start: string;
  period_end: string;
  invoice_date: string;
  due_date: string;
  status: string;
  currency: string;
  total_amount: string;
  paid_amount: string;
  due_amount: string;
  notes?: string;
  generated_by_name?: string | null;
  created_at: string;
  lines?: InvoiceLine[];
};

export type InvoiceListResponse = {
  count: number;
  next?: string | null;
  previous?: string | null;
  meta?: Record<string, unknown> & { page?: number };
  results: InvoiceRecord[];
};

export type BulkGenerateInvoicePayload = {
  batch_id: number;
  academic_class_id?: string;
  section_id?: string | null;
  period_start: string;
  period_end: string;
  invoice_date?: string;
  due_date?: string;
  apply_advance?: boolean | null;
  notes?: string;
};

export type BulkGenerateInvoiceItem = {
  enrollment_id: string;
  student_id: string;
  student_name: string;
  batch_id: number;
  academic_class_id: string;
  section_id: string | null;
  created: boolean;
  status: "CREATED" | "EXISTING" | "FAILED";
  invoice: InvoiceRecord | null;
  error: unknown;
};

export type BulkGenerateInvoiceResponse = {
  message: string;
  selection: {
    batch_id: number;
    academic_class_id?: string | null;
    section_id?: string | null;
  };
  period: {
    period_start: string;
    period_end: string;
    invoice_date?: string | null;
    due_date?: string | null;
  };
  summary: {
    processed_count: number;
    created_count: number;
    existing_count: number;
    failed_count: number;
  };
  data: BulkGenerateInvoiceItem[];
};
