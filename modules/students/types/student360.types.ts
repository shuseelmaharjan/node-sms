export type UploadedFile = {
  id: string;
  file_url: string | null;
  download_url?: string | null;
  file_type: string;
  original_name: string;
  size_bytes: number;
  is_temporary: boolean;
  meta: Record<string, any>;
  uploaded_at: string;
};

export type BatchMetaItem = {
  batch_id: number;
  batch_name: string;
  latest_status: string;
  latest_enrolled_at: string | null;
};

export type BatchesMeta = {
  count: number;
  items: BatchMetaItem[];
};

export type StudentEnrollmentMini = {
  id: string;
  status: string;
  enrolled_at: string;
  batch_id: number;
  batch_name: string;
  academic_class_id: string;
  class_name: string;
  section_id: string | null;
  section_name: string | null;
};

export type Student360ListRow = {
  serial?: number;

  id: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  full_name: string;

  role: string;
  status: string;
  username: string;

  profile_id: string | null;
  profile_picture: UploadedFile | null;

  current_enrollment: StudentEnrollmentMini | null;
  batches_meta: BatchesMeta;
};

export type StudentAddress = {
  id: string;
  address_type: "permanent" | "temporary" | "current";
  country: string;
  province: string;
  district: string;
  municipality: string;
  ward_no: string;
  street: string;
  tole: string;
  house_no: string;
  postal_code: string;
  is_primary: boolean;
};

export type StudentGuardian = {
  id: string;
  relation: string;
  full_name: string;
  phone: string;
  email: string;
  occupation: string;
  is_primary: boolean;
};

export type StudentDocument = {
  id: string;
  document_type: string;
  file: UploadedFile;
  issued_by: string;
  issued_date: string | null;
  expiry_date: string | null;
  remarks: string;
  created_at: string;
};

export type StudentOtherInfo = {
  is_disabled: boolean;
  disability_details: string;
  visual_issues: boolean;
  hearing_issues: boolean;
  mobility_issues: boolean;
  chronic_illness: boolean;
  chronic_illness_details: string;
  allergies: boolean;
  allergy_details: string;
  medications: boolean;
  medication_details: string;
  dietary_restrictions: boolean;
  dietary_restriction_details: string;
  other_health_issues: boolean;
  other_health_issue_details: string;
};

export type StudentProfile = {
  id: string;
  school: string;
  date_of_birth_in_ad: string | null;
  date_of_birth_in_bs: string;
  gender: string;
  blood_group: string;
  nationality: string;
  religion: string;
  mother_tongue: string;
  citizenship_no: string;
  pan_no: string;
  created_at: string;
  updated_at: string;
  addresses: StudentAddress[];
  guardians: StudentGuardian[];
  documents: StudentDocument[];
  student_other_info: StudentOtherInfo | null;
};

export type BatchDetail = {
  id: number;
  name: string;
  start_date_bs: string;
  start_date_ad: string;
  end_date_bs: string;
  end_date_ad: string;
  status: string;
  is_active: boolean;
};

export type ClassMini = {
  id: string;
  name: string;
};

export type SectionMini = {
  id: string;
  name: string;
};

export type EnrollmentDetail = {
  id: string;
  status: string;
  enrolled_at: string;
  batch: BatchDetail;
  academic_class: ClassMini;
  section: SectionMini | null;
};

export type BillingRow = {
  id?: string | number;
  amount: string;
  status: "pending" | "paid" | "overdue";
  payment_method: string | null;
  receipt_number: string;
  description: string;
  inwords: string;
  created_at: string;
  received_by?: string | null;
};

export type FeeHeadDetail = {
  id: string;
  name: string;
  code: string;
  group: string;
};

export type FeeStructureRow = {
  id: string;
  fee_head: string;
  fee_head_detail: FeeHeadDetail;
  amount: string;
  currency: string;
  period: string;
  status: string;
  scope: string;
  tax_included: boolean;
  batch: number | null;
  academic_class: string | null;
  created_at: string;
  updated_at: string;
};

export type FeeIncludeRow = {
  id: string;
  fees: string;
  fee_detail?: FeeStructureRow; // your response contains it
  user: string;
  batch: number;
  classroom: string;
  status: string;
  created_at: string;
};

export type WalletRow = {
  id: string;
  student: string;
  batch: number;
  academic_class: string;
  total_payable: string;
  total_paid: string;
  total_discount: string;
  total_scholarship: string;
  total_due: string;
  updated_at: string;
};

export type FeeIncludeAuditRow = {
  id: string;
  fee_include: string;
  actor: string | null;
  action: string;
  prev_status: string;
  new_status: string;
  prev_batch_id: number | null;
  new_batch_id: number | null;
  prev_class_id: string | null;
  new_class_id: string | null;
  created_at: string;
};

export type Student360Detail = {
  registration_no: string;
  id: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  full_name: string;

  role: string;
  status: string;
  username: string;

  profile_id: string | null;
  profile: StudentProfile;
  profile_picture: UploadedFile | null;

  batches_meta: BatchesMeta;

  enrollments: EnrollmentDetail[];
  billings: BillingRow[];
  fee_structures: FeeStructureRow[];
  fee_includes: FeeIncludeRow[];
  wallets: WalletRow[];
  fee_include_audits: FeeIncludeAuditRow[];

  _scope?: {
    batch: number | null;
    enrollment_status: string | null;
    billing_scope_note?: string;
  };
};
