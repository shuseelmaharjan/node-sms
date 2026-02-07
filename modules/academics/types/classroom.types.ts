export type BatchEntity = {
  serial?: number;
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
};

export type ClassroomEntity = {
  id: string; // UUID
  batch_id: number; // from your earlier sample: batch id is number
  name: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
};

export type SectionEntity = {
  id: string; // UUID
  academic_class_id: string; // UUID
  batch_id: number;
  name: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
};
