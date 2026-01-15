export type PaginatedMeta = {
  page: number;
  page_size: number;

  filterable?: Record<
    string,
    {
      type: string;
      choices?: string[];
    }
  >;

  sortable?: {
    sort_by?: string[];
    sort_order?: ("asc" | "desc")[];
  };

  searchable?: string[];

  ordering_param?: string; // e.g. "ordering"
  search_param?: string; // e.g. "search"
};

export type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  meta: PaginatedMeta;
  results: T[];
};
