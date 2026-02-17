// modules/teachers/types/teacher.types.ts
export type UploadedFile = {
  id: string;
  file_url: string | null;
  file_type: string;
  download_url?: string | null; // ✅ add
  original_name: string;
  size_bytes: number;
  is_temporary: boolean;
  meta: Record<string, any>;
  uploaded_at: string;
};

export type TeacherDocument = {
  id: string;
  document_type: string;
  file: UploadedFile;
  issued_by: string;
  issued_date: string | null;
  expiry_date: string | null;
  remarks: string;
  created_at: string;
};

export type TeacherAddress = {
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

export type TeacherProfile = {
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
  addresses: TeacherAddress[];
  guardians: any[]; // you can type later
  documents: TeacherDocument[];
};

export type Subject = {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  sort_order: number;
  status: "active" | "inactive" | "deleted";
  created_at: string;
  updated_at: string;
};

export type TeacherSpecialization = {
  teacher_level_id: string | null;
  teacher_level: string | null;
  subjects: Subject[];      
  subject_ids?: string[];     
};

export type TeacherListRow = {
  serial?: number;
  id: string;
  phone: string;
  email: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  full_name: string;
  status: string;
  role: string;

  // for table display
  profile_id: string | null;
  specialization?: TeacherSpecialization | null;

  // NOTE: if your list endpoint returns profile too, you can ignore it here or keep optional
  profile?: TeacherProfile;
};

export type TeacherDetail = TeacherListRow & {
  profile: TeacherProfile;
  profile_picture: UploadedFile | null;
  specialization: TeacherSpecialization | null;
};

export type TeacherLevelOption = {
  id: string;
  level: string;
  status: "active" | "inactive" | "deleted";
};
