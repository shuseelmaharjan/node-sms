"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Step = "personal" | "school" | "client";

export function AdminStepShell(props: {
  title: string;
  description?: string;

  mode: "create" | "edit" | "view";

  active: Step;

  // gating
  userId: string | null;
  schoolId: string | null;

  // navigation targets
  toPersonal: () => void;
  toSchool: () => void;
  toClient: () => void;

  children: React.ReactNode;
}) {
  const router = useRouter();

  const disabled = {
    personal: false,
    school: props.mode === "create" ? !props.userId : false,
    client: props.mode === "create" ? !props.userId || !props.schoolId : false,
  };

  const completed = {
    personal: Boolean(props.userId),
    school: Boolean(props.schoolId),
    client: false,
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{props.title}</h1>
          {props.description ? (
            <p className="text-muted-foreground">{props.description}</p>
          ) : null}
        </div>

        <Button variant="outline" onClick={() => router.push("/admins")}>
          Back to Admins
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Setup Progress</CardTitle>
          <CardDescription>
            Complete all steps to {props.mode === "create" ? "create" : "update"} the admin
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
            <StepButton
              step={1}
              label="Personal"
              active={props.active === "personal"}
              completed={completed.personal}
              disabled={disabled.personal}
              onClick={props.toPersonal}
            />
            <StepButton
              step={2}
              label="School"
              active={props.active === "school"}
              completed={completed.school}
              disabled={disabled.school}
              onClick={props.toSchool}
            />
            <StepButton
              step={3}
              label="Client"
              active={props.active === "client"}
              completed={completed.client}
              disabled={disabled.client}
              onClick={props.toClient}
            />
          </div>
        </CardContent>
      </Card>

      {props.children}
    </div>
  );
}

function StepButton(props: {
  step: number;
  label: string;
  active: boolean;
  completed: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant={props.active ? "default" : props.completed ? "secondary" : "outline"}
      onClick={props.onClick}
      disabled={props.disabled}
      className="flex items-center gap-2 justify-start"
    >
      <div
        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
          props.completed
            ? "bg-green-500 text-white"
            : props.active
              ? "bg-primary text-primary-foreground"
              : "bg-muted"
        }`}
      >
        {props.completed ? "✓" : props.step}
      </div>
      {props.label}
      {props.completed && <Badge variant="secondary" className="ml-1">✓</Badge>}
    </Button>
  );
}
