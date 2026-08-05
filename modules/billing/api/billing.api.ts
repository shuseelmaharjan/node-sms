import axios from "axios";

import { api, getApiErrorMessage } from "@/api";
import type { PaginatedResponse } from "@/types/api";
import type {
  BatchEntity,
  ClassroomEntity,
  SectionEntity,
} from "@/modules/academics/types/classroom.types";

import type {
  BillingRecord,
  StudentSearchResult,
} from "../types/billing.types";

const PAYMENTS_URL = "/api/v1/fees/fee-payments/";
const STUDENTS_URL = "/api/v1/students-short-info/";
const BATCHES_URL = "/api/v1/batches/";
const CLASSES_URL = "/api/v1/academics/classrooms/";
const SECTIONS_URL = "/api/v1/academics/sections/";

function normalizeError(
  error: unknown,
  operation: string
): Error {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error
      ? error
      : new Error(`${operation} failed.`);
  }

  if (!error.response) {
    return new Error(
      `${operation} failed because the backend did not return a response.`
    );
  }

  return new Error(
    getApiErrorMessage(error) ||
      `${operation} failed.`
  );
}

function fileNameFromDisposition(
  disposition: string | undefined,
  fallback: string
): string {
  const utf8Match = disposition?.match(
    /filename\*=UTF-8''([^;]+)/i
  );

  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1]);
    } catch {
      return utf8Match[1];
    }
  }

  const plainMatch = disposition?.match(
    /filename="?([^";]+)"?/i
  );

  return plainMatch?.[1] ?? fallback;
}

function saveBlob(
  blob: Blob,
  fileName: string
): void {
  const blobUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = blobUrl;
  anchor.download = fileName;
  anchor.style.display = "none";

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  window.setTimeout(() => {
    URL.revokeObjectURL(blobUrl);
  }, 1000);
}

export type BillingListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
  student_id?: string;
  enrollment_id?: string;
  batch_id?: number;
  academic_class_id?: string;
  section_id?: string;
  payment_method?: string;
  status?: string;
  from_date?: string;
  to_date?: string;
};

export type SearchStudentsByNameParams = {
  mode: "name";
  search: string;
};

export type SearchStudentsByScopeParams = {
  mode: "scope";
  batchId: number;
  academicClassId: string;
  sectionId?: string;
};

export type SearchStudentsParams =
  | SearchStudentsByNameParams
  | SearchStudentsByScopeParams;

export const billingApi = {
  list: async (
    params: BillingListParams
  ): Promise<PaginatedResponse<BillingRecord>> => {
    try {
      const response =
        await api.get<
          PaginatedResponse<BillingRecord>
        >(PAYMENTS_URL, {
          params,
        });

      return response.data;
    } catch (error) {
      throw normalizeError(
        error,
        "Loading billing records"
      );
    }
  },

  downloadReceipt: async (
    record: BillingRecord
  ): Promise<void> => {
    try {
      const response = await api.get<Blob>(
        `${PAYMENTS_URL}${encodeURIComponent(
          record.id
        )}/receipt-pdf/`,
        {
          responseType: "blob",
        }
      );

      saveBlob(
        response.data,
        fileNameFromDisposition(
          response.headers?.[
            "content-disposition"
          ],
          `${record.receipt_number}.pdf`
        )
      );
    } catch (error) {
      throw normalizeError(
        error,
        "Receipt PDF download"
      );
    }
  },

  listBatches: async (): Promise<
    BatchEntity[]
  > => {
    try {
      const response =
        await api.get<
          PaginatedResponse<BatchEntity>
        >(BATCHES_URL, {
          params: {
            status: "active",
            page_size: 200,
          },
        });

      return response.data.results ?? [];
    } catch (error) {
      throw normalizeError(
        error,
        "Loading batches"
      );
    }
  },

  listClasses: async (
    batchId: number
  ): Promise<ClassroomEntity[]> => {
    try {
      const response =
        await api.get<
          PaginatedResponse<ClassroomEntity>
        >(CLASSES_URL, {
          params: {
            batch_id: batchId,
            batch: batchId,
            page_size: 200,
          },
        });

      return response.data.results ?? [];
    } catch (error) {
      throw normalizeError(
        error,
        "Loading classes"
      );
    }
  },

  listSections: async (
    academicClassId: string
  ): Promise<SectionEntity[]> => {
    try {
      const response =
        await api.get<
          PaginatedResponse<SectionEntity>
        >(SECTIONS_URL, {
          params: {
            academic_class_id:
              academicClassId,
            page_size: 200,
          },
        });

      return response.data.results ?? [];
    } catch (error) {
      throw normalizeError(
        error,
        "Loading sections"
      );
    }
  },

  searchStudents: async (
    params: SearchStudentsParams
  ): Promise<StudentSearchResult[]> => {
    try {
      if (params.mode === "name") {
        const normalizedSearch =
          params.search.trim();

        const response =
          await api.get<
            PaginatedResponse<StudentSearchResult>
          >(STUDENTS_URL, {
            params: {
              search: normalizedSearch,
              enrollment_status: "enrolled",
              page_size: 100,
            },
          });

        return response.data.results ?? [];
      }

      const response =
        await api.get<
          PaginatedResponse<StudentSearchResult>
        >(STUDENTS_URL, {
          params: {
            batch_id: params.batchId,
            academic_class_id:
              params.academicClassId,
            section_id:
              params.sectionId || undefined,
            enrollment_status: "enrolled",
            page_size: 100,
          },
        });

      /*
       * Defensive filtering prevents navigation to a student outside
       * the selected academic scope if an older backend ignores one
       * of the query parameters.
       */
      return (response.data.results ?? []).filter(
        (student) => {
          const enrollment =
            student.current_enrollment;

          if (!enrollment) {
            return false;
          }

          if (
            Number(enrollment.batch_id) !==
            Number(params.batchId)
          ) {
            return false;
          }

          if (
            enrollment.academic_class_id !==
            params.academicClassId
          ) {
            return false;
          }

          if (
            params.sectionId &&
            enrollment.section_id !==
              params.sectionId
          ) {
            return false;
          }

          return true;
        }
      );
    } catch (error) {
      throw normalizeError(
        error,
        "Searching students"
      );
    }
  },
};