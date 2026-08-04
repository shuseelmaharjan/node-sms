"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Banknote,
  CheckCircle2,
  FilePlus2,
  ReceiptText,
  WalletCards,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  studentFinanceApi,
  studentFinanceKeys,
} from "../../apis/student-finance.api";
import type { FeeInvoice } from "../../types/finance.types";
import type { EnrollmentDetail } from "../../types/student360.types";

import { GenerateInvoiceSheet } from "./finance/generate-invoice-sheet";
import { InvoiceHistory } from "./finance/invoice-history";
import { PaymentHistory } from "./finance/payment-history";
import { PostPaymentModal } from "./finance/post-payment-modal";
import { SummaryCard } from "./finance/shared";
import { formatMoney, isOutstanding } from "./finance/utils";

type Props = {
  studentId: string;
  enrollment: EnrollmentDetail | null;
};

export function StudentFinanceOperations({
  studentId,
  enrollment,
}: Props) {
  const queryClient = useQueryClient();
  const enrollmentId = enrollment?.id ?? "";

  const [invoiceSheetOpen, setInvoiceSheetOpen] = React.useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = React.useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = React.useState("");

  const invoicesQuery = useQuery({
    queryKey: studentFinanceKeys.invoices(enrollmentId),
    queryFn: () => studentFinanceApi.listInvoices(enrollmentId),
    enabled: Boolean(enrollmentId),
    staleTime: 15_000,
  });

  const paymentsQuery = useQuery({
    queryKey: studentFinanceKeys.payments(enrollmentId),
    queryFn: () => studentFinanceApi.listPayments(enrollmentId),
    enabled: Boolean(enrollmentId),
    staleTime: 15_000,
  });

  const invoices = invoicesQuery.data?.results ?? [];
  const payments = paymentsQuery.data?.results ?? [];

  const outstandingInvoices = React.useMemo(
    () => invoices.filter(isOutstanding),
    [invoices]
  );

  const selectedInvoice =
    invoices.find((invoice) => invoice.id === selectedInvoiceId) ?? null;

  const refreshFinance = React.useCallback(async () => {
    if (!enrollmentId) return;

    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: studentFinanceKeys.invoices(enrollmentId),
      }),
      queryClient.invalidateQueries({
        queryKey: studentFinanceKeys.payments(enrollmentId),
      }),
      queryClient.invalidateQueries({
        queryKey: ["students-360", "detail", studentId],
      }),
      queryClient.invalidateQueries({
        queryKey: ["students-360", "detail"],
      }),
    ]);
  }, [enrollmentId, queryClient, studentId]);

  const openPaymentForInvoice = React.useCallback((invoice: FeeInvoice) => {
    setSelectedInvoiceId(invoice.id);
    setPaymentModalOpen(true);
  }, []);

  const openGeneralPaymentModal = React.useCallback(() => {
    setSelectedInvoiceId(outstandingInvoices[0]?.id ?? "");
    setPaymentModalOpen(true);
  }, [outstandingInvoices]);

  if (!enrollment) {
    return (
      <Card
        id="student-finance"
        className="scroll-mt-6 rounded-xl border shadow-sm"
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <WalletCards className="h-5 w-5" />
            Fee Management
          </CardTitle>
          <CardDescription>
            No enrollment is available for the selected student scope.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      <Card
        id="student-finance"
        className="scroll-mt-6 rounded-xl border shadow-sm"
      >
        <CardHeader className="gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <WalletCards className="h-5 w-5" />
              Fee Management
            </CardTitle>
            <CardDescription>
              Generate bills, record payments, and download financial documents.
            </CardDescription>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => setInvoiceSheetOpen(true)}
            >
              <FilePlus2 className="mr-2 h-4 w-4" />
              Generate bill
            </Button>

            <Button
              onClick={openGeneralPaymentModal}
              disabled={!outstandingInvoices.length}
            >
              <Banknote className="mr-2 h-4 w-4" />
              Record payment
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard
              title="Invoices"
              value={String(invoices.length)}
              description="Bills generated"
              icon={<ReceiptText className="h-5 w-5" />}
              color="blue"
            />

            <SummaryCard
              title="Outstanding"
              value={String(outstandingInvoices.length)}
              description="Pending invoices"
              icon={<AlertCircle className="h-5 w-5" />}
              color="orange"
            />

            <SummaryCard
              title="Total Due"
              value={formatMoney(
                outstandingInvoices.reduce(
                  (sum, invoice) => sum + Number(invoice.due_amount || 0),
                  0
                )
              )}
              description="Remaining amount"
              icon={<WalletCards className="h-5 w-5" />}
              color="red"
            />

            <SummaryCard
              title="Payments"
              value={String(payments.length)}
              description="Payments received"
              icon={<CheckCircle2 className="h-5 w-5" />}
              color="green"
            />
          </div>

          <InvoiceHistory
            invoices={invoices}
            isLoading={invoicesQuery.isLoading}
            isFetching={invoicesQuery.isFetching}
            isError={invoicesQuery.isError}
            onPay={openPaymentForInvoice}
          />

          <PaymentHistory
            payments={payments}
            isLoading={paymentsQuery.isLoading}
            isFetching={paymentsQuery.isFetching}
            isError={paymentsQuery.isError}
          />
        </CardContent>
      </Card>

      <GenerateInvoiceSheet
        open={invoiceSheetOpen}
        onOpenChange={setInvoiceSheetOpen}
        enrollmentId={enrollmentId}
        onSuccess={refreshFinance}
      />

      <PostPaymentModal
        open={paymentModalOpen}
        onOpenChange={setPaymentModalOpen}
        enrollmentId={enrollmentId}
        invoices={outstandingInvoices}
        selectedInvoice={selectedInvoice}
        selectedInvoiceId={selectedInvoiceId}
        onSelectedInvoiceIdChange={setSelectedInvoiceId}
        onSuccess={refreshFinance}
      />
    </>
  );
}
