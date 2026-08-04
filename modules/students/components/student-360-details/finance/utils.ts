import type { FeeInvoice } from "../../../types/finance.types";
import {
  NEPALI_MONTHS,
  type NepaliMonthDefinition,
  type NepaliMonthValue,
} from "./constants";

export type NepaliBillingPeriod = {
  month: NepaliMonthDefinition;
  bsYear: number;
  overlapDays: number;
};

export function parseIsoDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(Date.UTC(year, month - 1, day));
}

function differenceInCalendarDays(start: Date, end: Date) {
  return Math.floor((end.getTime() - start.getTime()) / 86_400_000);
}

function getDateRangeOverlapDays(
  firstStart: Date,
  firstEnd: Date,
  secondStart: Date,
  secondEnd: Date
) {
  const overlapStart = new Date(
    Math.max(firstStart.getTime(), secondStart.getTime())
  );
  const overlapEnd = new Date(
    Math.min(firstEnd.getTime(), secondEnd.getTime())
  );

  if (overlapEnd < overlapStart) return 0;
  return differenceInCalendarDays(overlapStart, overlapEnd) + 1;
}

export function formatIsoDate(year: number, month: number, day: number) {
  return [
    String(year).padStart(4, "0"),
    String(month + 1).padStart(2, "0"),
    String(day).padStart(2, "0"),
  ].join("-");
}

export function getNepaliMonthDateRange(
  monthValue: NepaliMonthValue,
  billingYear: number
) {
  const month = NEPALI_MONTHS.find((item) => item.value === monthValue);
  if (!month) throw new Error("Invalid Nepali month selection.");

  return {
    periodStart: formatIsoDate(
      billingYear,
      month.startMonth,
      month.startDay
    ),
    periodEnd: formatIsoDate(
      billingYear + (month.endYearOffset ?? 0),
      month.endMonth,
      month.endDay
    ),
    month,
  };
}

export function getNepaliBillingPeriod(
  periodStart: string,
  periodEnd: string
): NepaliBillingPeriod | null {
  const invoiceStart = parseIsoDate(periodStart);
  const invoiceEnd = parseIsoDate(periodEnd);

  if (!invoiceStart || !invoiceEnd || invoiceEnd < invoiceStart) {
    return null;
  }

  const startYear = invoiceStart.getUTCFullYear();
  const candidateCycleYears = [startYear - 1, startYear, startYear + 1];

  let bestMatch: NepaliBillingPeriod | null = null;

  for (const cycleYear of candidateCycleYears) {
    for (const month of NEPALI_MONTHS) {
      const range = getNepaliMonthDateRange(month.value, cycleYear);
      const monthStart = parseIsoDate(range.periodStart);
      const monthEnd = parseIsoDate(range.periodEnd);
      if (!monthStart || !monthEnd) continue;

      const overlapDays = getDateRangeOverlapDays(
        invoiceStart,
        invoiceEnd,
        monthStart,
        monthEnd
      );

      if (!bestMatch || overlapDays > bestMatch.overlapDays) {
        bestMatch = {
          month,
          bsYear: cycleYear + 57,
          overlapDays,
        };
      }
    }
  }

  return !bestMatch || bestMatch.overlapDays === 0 ? null : bestMatch;
}

export function formatDisplayDate(value: string) {
  const date = parseIsoDate(value);
  if (!date) return value;

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function createBillingYearOptions() {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 5 }, (_, index) => currentYear - 2 + index);
}

export function formatMoney(value: string | number, currency = "NPR") {
  const amount = Number(value || 0);
  return `${currency} ${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function isOutstanding(invoice: FeeInvoice) {
  return (
    invoice.status !== "PAID" &&
    invoice.status !== "VOID" &&
    Number(invoice.due_amount) > 0
  );
}
