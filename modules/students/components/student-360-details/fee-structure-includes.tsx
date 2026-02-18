import * as React from "react";
import { Receipt } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import type { FeeIncludeRow, FeeStructureRow } from "../../types/student360.types";
import { FeeIncludePrettyCard, FeeStructurePrettyCard } from "./fee-cards";

export function Student360FeeStructureIncludes({
  feeStructures,
  feeIncludes,
}: {
  feeStructures: FeeStructureRow[];
  feeIncludes: FeeIncludeRow[];
}) {
  return (
    <Card className="border-1 shadow-sm rounded-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          Fees & Includes
        </CardTitle>
        <CardDescription>
          Fee structures + included fees for this student.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="fees" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="fees">Fee Structures</TabsTrigger>
            <TabsTrigger value="includes">Fee Includes</TabsTrigger>
          </TabsList>

          <TabsContent value="fees" className="mt-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {feeStructures.map((f) => (
                <FeeStructurePrettyCard key={f.id} fee={f} />
              ))}
              {!feeStructures.length && (
                <div className="text-sm text-muted-foreground">
                  No fee structures.
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="includes" className="mt-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {feeIncludes.map((x) => (
                <FeeIncludePrettyCard key={x.id} item={x} />
              ))}
              {!feeIncludes.length && (
                <div className="text-sm text-muted-foreground">
                  No fee includes.
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
