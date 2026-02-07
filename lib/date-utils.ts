import NepaliDate from "nepali-date-converter";
import { format } from "date-fns";

/**
 * Convert Nepali BS date string (YYYY-MM-DD) to AD date string (YYYY-MM-DD)
 */
export function convertBsToAd(bsDate: string): string | null {
    if (!bsDate || bsDate.length !== 10) return null;
    
    try {
        const [y, m, d] = bsDate.split("-").map(Number);
        const nep = new NepaliDate(y, m - 1, d);
        return format(nep.toJsDate(), "yyyy-MM-dd");
    } catch (error) {
        console.warn("Failed to convert BS date to AD:", bsDate, error);
        return null;
    }
}

/**
 * Convert AD date string (YYYY-MM-DD) to Nepali BS date string (YYYY-MM-DD)
 */
export function convertAdToBs(adDate: string): string | null {
    if (!adDate || adDate.length !== 10) return null;
    
    try {
        const nep = new NepaliDate(new Date(adDate));
        return nep.format("YYYY-MM-DD");
    } catch (error) {
        console.warn("Failed to convert AD date to BS:", adDate, error);
        return null;
    }
}

/**
 * Convert multiple BS dates to AD dates
 */
export function convertBsDatesToAd(bsDates: Record<string, string>): Record<string, string> {
    const result: Record<string, string> = {};
    
    for (const [key, bsDate] of Object.entries(bsDates)) {
        const adDate = convertBsToAd(bsDate);
        if (adDate) {
            result[key] = adDate;
        }
    }
    
    return result;
}