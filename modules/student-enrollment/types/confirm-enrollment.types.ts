export type UploadedFile = {
  id: string;
  file_url: string | null;
  file_type: string;
  download_url?: string | null;
  original_name: string;
  size_bytes: number;
  is_temporary: boolean;
  meta: Record<string, any>;
  uploaded_at: string;
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

export type StudentGuardian = {
  id: string;
  relation: string;
  full_name: string;
  phone: string;
  email: string;
  occupation: string;
  is_primary: boolean;
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
  student_other_info?: StudentOtherInfo;
};

export type StudentShortInfo = {
  id: string;
  phone: string;
  email: string;
  username: string;
  role: string;
  status: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  full_name: string;
  profile_id: string | null;
  profile: StudentProfile;
  profile_picture: UploadedFile | null;
  current_enrollment: any | null;
};

export type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  meta?: Record<string, any>;
  results: T[];
};

export type BatchRow = {
  id: number;
  name: string;
  start_date_bs: string;
  start_date_ad: string;
  end_date_bs: string;
  end_date_ad: string;
  is_active: boolean;
  school: string;
  created_at: string;
  updated_at: string;
  serial?: number;
};

export type ClassroomRow = {
  id: string;
  batch_id: number;
  school_id: string;
  name: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  serial?: number;
};

export type SectionRow = {
  id: string;
  academic_class_id: string;
  batch_id: number;
  name: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  serial?: number;
};

export type FeePeriod =
  | "MONTHLY"
  | "QUARTERLY"
  | "SEMESTER"
  | "ANNUAL"
  | "OTHER"
  | "ONE_TIME";

export type ApplicableFeeStructure = {
  id: string;
  amount: string; // "1500.00"
  currency: string;
  period: FeePeriod;
  status: string;
  tax_included: boolean;
  fee_head_detail: {
    id: string;
    name: string;
    code: string;
    group: string;
  };
};

export type ApplicableFeeResponse = {
  message: string;
  batch: {
    id: number;
    name: string;
    start_date_bs: string;
    start_date_ad: string;
    end_date_bs: string;
    end_date_ad: string;
    is_active: boolean;
    status: string;
    school: string;
    created_at: string;
    updated_at: string;
  };
  data: ApplicableFeeStructure[];
};
