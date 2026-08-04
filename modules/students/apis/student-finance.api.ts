import { api } from "@/api";

import type {
  FeeInvoice,
  FeePayment,
  GenerateInvoicePayload,
  PaginatedResponse,
  PaymentPostResponse,
  PostPaymentPayload,
} from "../types/finance.types";

const FEES_PREFIX = "/api/v1/fees";

function fileNameFromDisposition(disposition: string | undefined, fallback: string) {
  const utf8Match = disposition?.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) return decodeURIComponent(utf8Match[1]);
  const plainMatch = disposition?.match(/filename="?([^";]+)"?/i);
  return plainMatch?.[1] || fallback;
}

async function downloadPdf(url: string, fallbackName: string) {
  const response = await api.get<Blob>(url, { responseType: "blob" });
  const blobUrl = URL.createObjectURL(response.data);
  const anchor = document.createElement("a");
  anchor.href = blobUrl;
  anchor.download = fileNameFromDisposition(
    response.headers?.["content-disposition"],
    fallbackName
  );
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(blobUrl);
}

export const studentFinanceKeys = {
  all: ["student-finance"] as const,
  invoices: (enrollmentId: string) =>
    [...studentFinanceKeys.all, "invoices", enrollmentId] as const,
  payments: (enrollmentId: string) =>
    [...studentFinanceKeys.all, "payments", enrollmentId] as const,
};

export const studentFinanceApi = {
  listInvoices: async (enrollmentId: string) => {
    const response = await api.get<PaginatedResponse<FeeInvoice>>(
      `${FEES_PREFIX}/fee-invoices/`,
      { params: { enrollment_id: enrollmentId, page_size: 100 } }
    );
    return response.data;
  },

  listPayments: async (enrollmentId: string) => {
    const response = await api.get<PaginatedResponse<FeePayment>>(
      `${FEES_PREFIX}/fee-payments/`,
      { params: { enrollment_id: enrollmentId, page_size: 100 } }
    );
    return response.data;
  },

  generateInvoice: async (payload: GenerateInvoicePayload) => {
    const response = await api.post(
      `${FEES_PREFIX}/fee-invoices/generate/`,
      payload
    );
    return (response.data?.data ?? response.data) as FeeInvoice;
  },

  postPayment: async (payload: PostPaymentPayload) => {
    const response = await api.post<PaymentPostResponse>(
      `${FEES_PREFIX}/fee-payments/`,
      payload
    );
    return response.data;
  },

  downloadInvoicePdf: (invoice: FeeInvoice) =>
    downloadPdf(
      `${FEES_PREFIX}/fee-invoices/${encodeURIComponent(invoice.id)}/pdf/`,
      `${invoice.invoice_number}.pdf`
    ),

  downloadReceiptPdf: (payment: FeePayment) =>
    downloadPdf(
      `${FEES_PREFIX}/fee-payments/${encodeURIComponent(payment.id)}/receipt-pdf/`,
      `${payment.receipt_number}.pdf`
    ),
};
