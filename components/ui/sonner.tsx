"use client";

import * as React from "react";
import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = (props: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster"
      icons={{
        success: <CircleCheckIcon className="size-4 text-emerald-600" />,
        info: <InfoIcon className="size-4 text-blue-600" />,
        warning: <TriangleAlertIcon className="size-4 text-amber-600" />,
        error: <OctagonXIcon className="size-4 text-red-600" />,
        loading: <Loader2Icon className="size-4 animate-spin text-muted-foreground" />,
      }}
      style={
        {
          "--border-radius": "10px",
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",

          "--success-bg": "rgb(236 253 245)",
          "--success-text": "rgb(6 95 70)",
          "--success-border": "rgb(167 243 208)",

          "--info-bg": "rgb(239 246 255)",
          "--info-text": "rgb(30 64 175)",
          "--info-border": "rgb(191 219 254)",

          "--warning-bg": "rgb(255 251 235)",
          "--warning-text": "rgb(146 64 14)",
          "--warning-border": "rgb(253 230 138)",

          "--error-bg": "rgb(254 242 242)",
          "--error-text": "rgb(153 27 27)",
          "--error-border": "rgb(254 202 202)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: [
            "bg-[var(--normal-bg)] text-[var(--normal-text)] border border-[var(--normal-border)]",
            "shadow-lg",
            "opacity-100", 
          ].join(" "),
          description: "text-muted-foreground",
          actionButton: "bg-primary text-primary-foreground",
          cancelButton: "bg-accent text-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
