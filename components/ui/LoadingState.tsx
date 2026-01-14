"use client";

import React from "react";
import { cn } from "@/lib/utils";

type LoadingVariant = "page" | "section" | "inline";

type LoadingStateProps = {
  title?: string;
  subtitle?: string;
  variant?: LoadingVariant;

  /**
   * If you want: show a top progress bar (nice for full page)
   */
  showTopBar?: boolean;

  /**
   * If false, hides the icon animation (useful in tight spots)
   */
  animate?: boolean;

  className?: string;
};

export function LoadingState({
  title = "Loading…",
  subtitle = "Please wait a moment",
  variant = "page",
  showTopBar = true,
  animate = true,
  className,
}: LoadingStateProps) {
  if (variant === "inline") {
    return (
      <div className={cn("inline-flex items-center gap-2 text-sm text-muted-foreground", className)}>
        <span
          className={cn(
            "h-4 w-4 rounded-full border-2 border-muted-foreground/30 border-t-foreground/70",
            animate && "animate-spin"
          )}
          aria-hidden="true"
        />
        <span>{title}</span>
      </div>
    );
  }

  const isPage = variant === "page";

  return (
    <div
      className={cn(
        isPage
          ? "min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100"
          : "rounded-2xl border bg-card",
        className
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      {/* Top loading bar (page only by default) */}
      {isPage && showTopBar ? (
        <div className="fixed left-0 top-0 z-50 h-1 w-full overflow-hidden">
          <div className={cn("h-full w-1/3 rounded-full bg-foreground/15", animate && "animate-[loadingbar_1.15s_ease-in-out_infinite]")} />
        </div>
      ) : null}

      <div
        className={cn(
          isPage
            ? "mx-auto flex min-h-screen max-w-5xl items-center justify-center px-4"
            : "p-4 sm:p-6"
        )}
      >
        <div
          className={cn(
            "w-full max-w-xl overflow-hidden rounded-2xl border bg-white/70 shadow-sm backdrop-blur",
            !isPage && "bg-card"
          )}
        >
          {/* Header */}
          <div className="flex items-start gap-4 p-6 sm:p-8">
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl border bg-muted/30">
              {/* soft sheen */}
              <div className={cn("absolute inset-0 bg-gradient-to-br from-transparent via-foreground/5 to-transparent", animate && "animate-[sheen_1.6s_ease-in-out_infinite]")} />
              {/* spinner dot */}
              <div
                className={cn(
                  "absolute inset-0 m-auto h-5 w-5 rounded-full border-2 border-foreground/20 border-t-foreground/70",
                  animate && "animate-spin"
                )}
                aria-hidden="true"
              />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">{title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>

              {/* subtle “progress” */}
              <div className="mt-4 space-y-2">
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted/40">
                  <div className={cn("h-full w-1/2 rounded-full bg-foreground/15", animate && "animate-[progress_1.35s_ease-in-out_infinite]")} />
                </div>
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>Preparing content</span>
                  <span className={cn(animate && "animate-pulse")}>Just a sec</span>
                </div>
              </div>
            </div>
          </div>

          {/* Body shimmer blocks */}
          <div className="border-t bg-white/40 p-6 sm:p-8">
            <div className="space-y-4">
              <div className="space-y-2">
                <ShimmerLine w="w-11/12" animate={animate} />
                <ShimmerLine w="w-10/12" animate={animate} />
                <ShimmerLine w="w-8/12" animate={animate} />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <ShimmerCard animate={animate} />
                <ShimmerCard animate={animate} />
              </div>

              <ShimmerCard animate={animate} />
            </div>
          </div>
        </div>
      </div>

      {/* keyframes */}
      <style>{`
        @keyframes loadingbar {
          0% { transform: translateX(-120%); opacity: 0.35; }
          50% { opacity: 0.9; }
          100% { transform: translateX(320%); opacity: 0.35; }
        }

        @keyframes sheen {
          0% { transform: translateX(-40%); opacity: 0.2; }
          50% { opacity: 0.6; }
          100% { transform: translateX(40%); opacity: 0.2; }
        }

        @keyframes progress {
          0% { transform: translateX(-40%); opacity: 0.35; }
          50% { opacity: 0.9; }
          100% { transform: translateX(60%); opacity: 0.35; }
        }
      `}</style>
    </div>
  );
}

function ShimmerLine({ w, animate }: { w: string; animate: boolean }) {
  return (
    <div className={cn("h-3 rounded-full bg-muted/30", w, animate && "animate-pulse")} />
  );
}

function ShimmerCard({ animate }: { animate: boolean }) {
  return (
    <div className="rounded-xl border bg-white/60 p-4">
      <div className={cn("h-3 w-1/2 rounded-full bg-muted/30", animate && "animate-pulse")} />
      <div className={cn("mt-3 h-9 w-full rounded-lg bg-muted/30", animate && "animate-pulse")} />
    </div>
  );
}
