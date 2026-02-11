"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
// If you don’t have a Select component wrapper, you can adapt to your existing DataTable filter select.
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { useBatches, useClasses } from "../hooks/schedule.hooks";
import { useDownloadSchedulePdf } from "../hooks/schedule.hooks";
import { FileDown, Loader2 } from "lucide-react";

function saveBlob(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
}

export function SchedulePdfSheet(props: { open: boolean; onOpenChange: (v: boolean) => void }) {
    const batchesQ = useBatches();
    const [batch, setBatch] = React.useState<string>("");
    const [academicClass, setAcademicClass] = React.useState<string>("all"); // default ALL

    const classesQ = useClasses(batch);
    const pdfMutation = useDownloadSchedulePdf();

    React.useEffect(() => {
        // reset class when batch changes
        setAcademicClass("all");
    }, [batch]);

    const canDownload = Boolean(batch) && !pdfMutation.isPending;

    return (
        <Sheet open={props.open} onOpenChange={props.onOpenChange}>
            <SheetContent className="w-full sm:max-w-md">
                <SheetHeader>
                    <SheetTitle>Generate Routine PDF</SheetTitle>
                </SheetHeader>

                <div className="mt-4 space-y-4 px-4">
                    {/* Batch */}
                    <div className="space-y-2">
                        <div className="text-sm font-medium">Batch</div>
                        <Select value={batch} onValueChange={setBatch}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder={batchesQ.isLoading ? "Loading..." : "Select batch"} />
                            </SelectTrigger>
                            <SelectContent>
                                {(batchesQ.data?.results ?? []).map((b) => (
                                    <SelectItem key={b.id} value={String(b.id)}>
                                        {b.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Class */}
                    <div className="space-y-2">
                        <div className="text-sm font-medium">Class</div>
                        <Select
                            value={academicClass}
                            onValueChange={setAcademicClass}
                            disabled={!batch || classesQ.isLoading}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder={!batch ? "Select batch first" : classesQ.isLoading ? "Loading..." : "Select class"} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All classes</SelectItem>
                                {(classesQ.data?.results ?? []).map((c) => (
                                    <SelectItem key={c.id} value={c.id}>
                                        {c.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="text-xs text-muted-foreground">
                        This will download a landscape PDF (Sunday → Saturday). If you choose “All classes”, each class will be on a separate page.
                    </div>
                </div>

                <SheetFooter className="mt-6">
                    <Button
                        className="w-full"
                        disabled={!canDownload || pdfMutation.isPending}
                        onClick={async () => {
                            try {
                                const { blob, filename } = await pdfMutation.mutateAsync({
                                    batch,
                                    academic_class: academicClass,
                                });
                                saveBlob(blob, filename);
                                toast.success("PDF downloaded");
                                props.onOpenChange(false);
                            } catch (e: any) {
                                toast.error(e?.response?.data?.detail ?? "Failed to download PDF");
                            }
                        }}
                    >
                        {pdfMutation.isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <FileDown className="mr-2 h-4 w-4" />
                                Download PDF
                            </>
                        )}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
