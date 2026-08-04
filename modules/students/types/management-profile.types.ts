export type UploadedFile = {
  id: string;
  file_url: string | null;
  download_url?: string | null;
  file_type?: string;
  original_name?: string;
  size_bytes?: number;
  is_temporary?: boolean;
  meta?: Record<string, unknown> | null;
  uploaded_at?: string;
};

export type ManagedUser = {
  id: string;
  phone: string;
  email: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  full_name: string;
  role: string;
  status: string;
  profile_picture_file: UploadedFile | null;
  username: string;
  registration_no: string;
  date_joined: string;
};

export type PersonalInfo = {
  id?: string;
  date_of_birth_in_ad: string;
  date_of_birth_in_bs: string;
  gender: string;
  blood_group: string;
  nationality: string;
  religion: string;
  mother_tongue: string;
  citizenship_no: string;
  pan_no: string;
  created_at?: string;
  updated_at?: string;
};

export type ManagedAddressType = "permanent" | "temporary" | "current";

export type ManagedAddress = {
  id?: string;
  address_type: ManagedAddressType;
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

export type ManagedGuardian = {
  id: string;
  relation: string;
  full_name: string;
  phone: string;
  email: string;
  occupation: string;
  is_primary: boolean;
};

export type ManagedDocument = {
  id: string;
  document_type: string;
  file: UploadedFile | null;
  issued_by: string;
  issued_date: string | null;
  expiry_date: string | null;
  remarks: string;
  created_at?: string;
};

export type ManagedHealth = {
  id?: number;
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

export type ManagedProfile = {
  user: ManagedUser;
  personal_info: PersonalInfo | null;
  permanent_address: ManagedAddress | null;
  temporary_address: ManagedAddress | null;
  current_address: ManagedAddress | null;
  guardians: ManagedGuardian[];
  documents: ManagedDocument[];
  health: ManagedHealth | null;
};
