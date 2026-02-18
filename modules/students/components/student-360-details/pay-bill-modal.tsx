"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";

import { api, getApiErrorMessage } from "@/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";

const CREATE_BILLING_URL = "/api/v1/billing/";

const payBillSchema = z.object({
  amount: z.string().trim().min(1, "Amount is required"),
  inwords: z.string().trim().min(1, "Inwords is required"),
  description: z.string().optional(),
  payment_method: z.enum(["cash", "bank_transfer", "esewa", "khalti"]),
});

type PayBillValues = z.infer<typeof payBillSchema>;

export function PayBillModal({
  open,
  onOpenChange,
  studentId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
}) {
  const queryClient = useQueryClient();

  const form = useForm<PayBillValues>({
    resolver: zodResolver(payBillSchema),
    defaultValues: {
      amount: "",
      inwords: "",
      description: "",
      payment_method: "cash",
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (values: PayBillValues) => {
      const payload = {
        student: studentId,
        amount: values.amount,
        inwords: values.inwords,
        description: values.description || "",
        payment_method: values.payment_method,
      };
      return (await api.post(CREATE_BILLING_URL, payload)).data;
    },
    onSuccess: async () => {
      toast.success("Bill payment submitted");
      await queryClient.invalidateQueries({
        queryKey: ["students-360", "detail", studentId],
      });
      await queryClient.invalidateQueries({
        queryKey: ["students-360", "detail"],
      });
      form.reset({
        amount: "",
        inwords: "",
        description: "",
        payment_method: "cash",
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error) || "Failed to submit bill payment");
    },
  });

  React.useEffect(() => {
    if (!open) {
      form.reset({
        amount: "",
        inwords: "",
        description: "",
        payment_method: "cash",
      });
    }
  }, [open, form]);

  const isSubmitting = submitMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Pay Bill</DialogTitle>
          <DialogDescription>
            Submit a bill payment for this student.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit(async (values) => {
              await submitMutation.mutateAsync(values);
            })}
          >
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter amount" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="inwords"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Inwords</FormLabel>
                  <FormControl>
                    <Input placeholder="Amount in words" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Optional" rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="payment_method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Method</FormLabel>
                  <FormControl>
                    <RadioGroup
                      className="grid grid-cols-2 gap-3"
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      {[
                        { value: "cash", label: "Cash" },
                        { value: "bank_transfer", label: "Bank Transfer" },
                        { value: "esewa", label: "eSewa" },
                        { value: "khalti", label: "Khalti" },
                      ].map((option) => (
                        <Label
                          key={option.value}
                          htmlFor={`payment-${option.value}`}
                          className="flex cursor-pointer items-center gap-2 rounded-md border p-3"
                        >
                          <RadioGroupItem
                            id={`payment-${option.value}`}
                            value={option.value}
                          />
                          <span className="text-sm">{option.label}</span>
                        </Label>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}