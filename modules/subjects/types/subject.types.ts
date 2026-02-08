export type SubjectStatus = "active" | "inactive" | "deleted";

export type SubjectEntity = {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  sort_order: number;
  status: SubjectStatus;
  created_at?: string;
  updated_at?: string;
};

export type PaginatedResponse<T> = {
  count: number;
  next?: string | null;
  previous?: string | null;
  results: T[];
  meta?: any; // if your API returns meta like others
};
