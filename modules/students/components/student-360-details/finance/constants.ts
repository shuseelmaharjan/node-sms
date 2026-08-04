import type { PaymentMethod } from "../../../types/finance.types";

export const PAYMENT_METHODS: Array<{
  value: PaymentMethod;
  label: string;
}> = [
  { value: "CASH", label: "Cash" },
  { value: "BANK_TRANSFER", label: "Bank transfer" },
  { value: "CHEQUE", label: "Cheque" },
  { value: "CARD", label: "Card" },
  { value: "ESEWA", label: "eSewa" },
  { value: "KHALTI", label: "Khalti" },
  { value: "FONEPAY", label: "Fonepay" },
  { value: "OTHER", label: "Other" },
];

export type NepaliMonthValue =
  | "BAISAKH"
  | "JESTHA"
  | "ASAR"
  | "SHRAWAN"
  | "BHADRA"
  | "ASOJ"
  | "KARTIK"
  | "MANGSIR"
  | "POUSH"
  | "MAGH"
  | "FALGUN"
  | "CHAITRA";

export type NepaliMonthDefinition = {
  value: NepaliMonthValue;
  label: string;
  description: string;
  startMonth: number;
  startDay: number;
  endMonth: number;
  endDay: number;
  endYearOffset?: number;
};

export const NEPALI_MONTHS: NepaliMonthDefinition[] = [
  { value: "BAISAKH", label: "Baisakh (बैशाख)", description: "Mid-April to Mid-May", startMonth: 3, startDay: 14, endMonth: 4, endDay: 14 },
  { value: "JESTHA", label: "Jestha (जेठ)", description: "Mid-May to Mid-June", startMonth: 4, startDay: 15, endMonth: 5, endDay: 14 },
  { value: "ASAR", label: "Asar (असार)", description: "Mid-June to Mid-July", startMonth: 5, startDay: 15, endMonth: 6, endDay: 15 },
  { value: "SHRAWAN", label: "Shrawan (श्रावण)", description: "Mid-July to Mid-August", startMonth: 6, startDay: 16, endMonth: 7, endDay: 16 },
  { value: "BHADRA", label: "Bhadra (भदौ)", description: "Mid-August to Mid-September", startMonth: 7, startDay: 17, endMonth: 8, endDay: 16 },
  { value: "ASOJ", label: "Asoj (असोज)", description: "Mid-September to Mid-October", startMonth: 8, startDay: 17, endMonth: 9, endDay: 16 },
  { value: "KARTIK", label: "Kartik (कार्तिक)", description: "Mid-October to Mid-November", startMonth: 9, startDay: 17, endMonth: 10, endDay: 15 },
  { value: "MANGSIR", label: "Mangsir (मंसिर)", description: "Mid-November to Mid-December", startMonth: 10, startDay: 16, endMonth: 11, endDay: 15 },
  { value: "POUSH", label: "Poush (पुष)", description: "Mid-December to Mid-January", startMonth: 11, startDay: 16, endMonth: 0, endDay: 14, endYearOffset: 1 },
  { value: "MAGH", label: "Magh (माघ)", description: "Mid-January to Mid-February", startMonth: 0, startDay: 15, endMonth: 1, endDay: 12 },
  { value: "FALGUN", label: "Falgun (फाल्गुण)", description: "Mid-February to Mid-March", startMonth: 1, startDay: 13, endMonth: 2, endDay: 14 },
  { value: "CHAITRA", label: "Chaitra (चैत)", description: "Mid-March to Mid-April", startMonth: 2, startDay: 15, endMonth: 3, endDay: 14 },
];
