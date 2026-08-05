import axios from "axios";

import { api, getApiErrorMessage } from "@/api";
import type { PaginatedResponse } from "@/types/api";
import type {
  BatchEntity,
  ClassroomEntity,
  SectionEntity,
} from "@/modules/academics/types/classroom.types";

import type {
  BulkGenerateInvoicePayload,
  BulkGenerateInvoiceResponse,
  InvoiceRecord,
} from "../types/invoice.types";

const INVOICES_URL = "/api/v1/fees/fee-invoices/";
const BULK_GENERATE_URL =
  "/api/v1/fees/fee-invoices/bulk-generate/";
const BULK_PDF_URL =
  "/api/v1/fees/fee-invoices/bulk-pdf/";

const BATCHES_URL = "/api/v1/batches/";
const CLASSES_URL = "/api/v1/academics/classrooms/";
const SECTIONS_URL = "/api/v1/academics/sections/";

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
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = fileName;
  anchor.style.display = "none";

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}

function createNetworkErrorMessage(
  operation: string
): string {
  const baseURL =
    api.defaults.baseURL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    "the configured backend";

  return `${operation} failed because the backend did not return a response. Check that the API is reachable at ${baseURL}.`;
}

function normalizeApiError(
  error: unknown,
  operation: string
): Error {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error
      ? error
      : new Error(`${operation} failed.`);
  }

  console.error(`${operation} failed`, {
    message: error.message,
    code: error.code,
    method: error.config?.method,
    baseURL: error.config?.baseURL,
    url: error.config?.url,
    status: error.response?.status,
    responseData: error.response?.data,
  });

  if (!error.response) {
    return new Error(
      createNetworkErrorMessage(operation)
    );
  }

  return new Error(
    getApiErrorMessage(error) ||
      `${operation} failed with status ${error.response.status}.`
  );
}

export type InvoiceListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
  batch_id?: number;
  academic_class_id?: string;
  section_id?: string;
  status?: string;
  from_date?: string;
  to_date?: string;
};

export const invoiceApi = {
  list: async (
    params: InvoiceListParams
  ): Promise<PaginatedResponse<InvoiceRecord>> => {
    try {
      const response =
        await api.get<
          PaginatedResponse<InvoiceRecord>
        >(INVOICES_URL, {
          params,
        });

      return response.data;
    } catch (error) {
      throw normalizeApiError(
        error,
        "Loading invoices"
      );
    }
  },

  generateBulk: async (
    payload: BulkGenerateInvoicePayload
  ): Promise<BulkGenerateInvoiceResponse> => {
    try {
      const response =
        await api.post<BulkGenerateInvoiceResponse>(
          BULK_GENERATE_URL,
          payload,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

      return response.data;
    } catch (error) {
      throw normalizeApiError(
        error,
        "Bulk invoice generation"
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
      throw normalizeApiError(
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
      throw normalizeApiError(
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
      throw normalizeApiError(
        error,
        "Loading sections"
      );
    }
  },

  downloadOne: async (
    invoice: InvoiceRecord
  ): Promise<void> => {
    try {
      const response = await api.get<Blob>(
        `${INVOICES_URL}${encodeURIComponent(
          invoice.id
        )}/pdf/`,
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
          `${invoice.invoice_number}.pdf`
        )
      );
    } catch (error) {
      throw normalizeApiError(
        error,
        "Invoice PDF download"
      );
    }
  },

  downloadBulk: async (
    invoiceIds: string[],
    fallbackName = "selected-fee-invoices.pdf"
  ): Promise<void> => {
    if (invoiceIds.length === 0) {
      throw new Error(
        "Select at least one invoice."
      );
    }

    try {
      const response = await api.post<Blob>(
        BULK_PDF_URL,
        {
          invoice_ids: invoiceIds,
        },
        {
          responseType: "blob",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      saveBlob(
        response.data,
        fileNameFromDisposition(
          response.headers?.[
            "content-disposition"
          ],
          fallbackName
        )
      );
    } catch (error) {
      throw normalizeApiError(
        error,
        "Bulk invoice PDF download"
      );
    }
  },
};