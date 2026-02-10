export type Paginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type Batch = {
  id: number;
  name: string;
  start_date_bs?: string;
  start_date_ad?: string;
  end_date_bs?: string;
  end_date_ad?: string;
  is_active: boolean;
  school: string;
  created_at?: string;
  updated_at?: string;
};

export type AcademicClass = {
  id: string;
  batch_id: number;
  name: string;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
};

export type Section = {
  id: string;
  academic_class_id: string;
  batch_id: number;
  name: string;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
};

export type Subject = {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  sort_order: number;
  status: "active" | "inactive" | "deleted";
  created_at?: string;
  updated_at?: string;
};

export type TeacherListRow = {
  id: string;
  full_name: string;
  phone?: string;
  email?: string;
  status?: string;
  role?: string;
  specialization?: {
    teacher_level?: string | null;
    teacher_level_id?: string | null;
  } | null;
};

export type Schedule = {
  id: string;

  batch_id: number;

  academic_class_id: string;
  academic_class_name: string;

  section_id: string | null;
  section_name: string | null;

  subject_id: string;
  subject_name: string;
  subject_code: string;

  teacher_id: string;
  teacher_name: string;

  day_of_week: number; // 0..6
  start_time: string;  // "HH:MM:SS" or "HH:MM"
  end_time: string;
};

export type ScheduleCreatePayload = {
  batch_id: number;
  academic_class_id: string;
  section_id?: string | null;
  subject_id: string;
  teacher_id: string;
  day_of_week: number;
  start_time: string; // "HH:MM"
  end_time: string;   // "HH:MM"
};

export type ScheduleUpdatePayload = Partial<ScheduleCreatePayload>;
