"use client";

import * as React from "react";
import Image from "next/image";
import {
  Download,
  Info,
  RotateCcw,
  RotateCw,
  Search,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { api } from "@/api"; 

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { formatDateShort } from "@/lib/text-utils";

export type UploadedImageInfo = {
  id: string;
  file_url: string | null;
  download_url?: string | null;
  file_type?: string;
  original_name?: string;
  size_bytes?: number;
  is_temporary?: boolean;
  meta?: Record<string, any>;
  uploaded_at?: string;
};

function formatBytes(bytes?: number) {
  if (bytes == null) return "-";
  const units = ["B", "KB", "MB", "GB"];
  let v = bytes;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(i === 0 ? 0 : 2)} ${units[i]}`;
}

function safeName(name?: string) {
  return name?.trim() ? name : "Image";
}

type FitMode = "fit" | "actual";

export function ImageViewer({
  file,
  className,
  thumbSize = 56,
  trigger,
  title,
}: {
  file: UploadedImageInfo;
  className?: string;
  thumbSize?: number;
  trigger?: React.ReactNode;
  title?: string;
}) {
  const src = file?.file_url ?? "";
  const canRender = Boolean(src);

  const [open, setOpen] = React.useState(false);

  // Transform state
  const [scale, setScale] = React.useState(1);
  const [rotation, setRotation] = React.useState(0);
  const [tx, setTx] = React.useState(0);
  const [ty, setTy] = React.useState(0);
  const [fitMode, setFitMode] = React.useState<FitMode>("fit");

  const [downloading, setDownloading] = React.useState(false);

  const containerRef = React.useRef<HTMLDivElement | null>(null);

  const reset = React.useCallback(() => {
    setScale(1);
    setRotation(0);
    setTx(0);
    setTy(0);
    setFitMode("fit");
  }, []);

  React.useEffect(() => {
    if (open) reset();
  }, [open, file?.id, reset]);

  const zoomTo = React.useCallback(
    (nextScale: number, anchor?: { x: number; y: number }) => {
      nextScale = Math.max(0.25, Math.min(8, nextScale));

      // keep point under cursor stable (nice zoom feel)
      if (anchor && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const cx = anchor.x - rect.left - rect.width / 2;
        const cy = anchor.y - rect.top - rect.height / 2;

        const ratio = nextScale / scale;
        setTx((prev) => (prev - cx) * ratio + cx);
        setTy((prev) => (prev - cy) * ratio + cy);
      }

      setScale(nextScale);
    },
    [scale]
  );

  const zoomIn = () => zoomTo(scale + 0.25);
  const zoomOut = () => zoomTo(scale - 0.25);

  const rotateLeft = () => setRotation((r) => (r - 90) % 360);
  const rotateRight = () => setRotation((r) => (r + 90) % 360);

  const toggleFit = () => {
    // when switching to fit, also reset pan
    setFitMode((m) => {
      const next = m === "fit" ? "actual" : "fit";
      if (next === "fit") {
        setTx(0);
        setTy(0);
        setScale(1);
      }
      return next;
    });
  };

  // Drag / pan
  const dragging = React.useRef(false);
  const dragStart = React.useRef({ x: 0, y: 0, tx: 0, ty: 0 });

  const onPointerDown = (e: React.PointerEvent) => {
    if (!canRender) return;
    // allow pan only when zoomed or actual mode
    if (!(scale > 1 || fitMode === "actual")) return;

    dragging.current = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragStart.current = { x: e.clientX, y: e.clientY, tx, ty };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setTx(dragStart.current.tx + dx);
    setTy(dragStart.current.ty + dy);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    dragging.current = false;
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
  };

  // Mouse wheel zoom
  const onWheel = (e: React.WheelEvent) => {
    if (!canRender) return;
    // trackpad pinch/scroll -> zoom (natural)
    e.preventDefault();

    const delta = e.deltaY;
    const step = delta > 0 ? -0.15 : 0.15;
    zoomTo(scale + step, { x: e.clientX, y: e.clientY });
  };

  // Double click to reset
  const onDoubleClick = () => reset();

  // Authenticated download (blob) using axios instance
  const download = async () => {
    const url = file.download_url || file.file_url;
    if (!url) return;

    setDownloading(true);
    try {
      const res = await api.get(url, { responseType: "blob" });
      const blob = res.data as Blob;

      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = safeName(file.original_name);
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);
    } finally {
      setDownloading(false);
    }
  };

  const dialogTitle = title ?? safeName(file.original_name);

  const transform = `translate3d(${tx}px, ${ty}px, 0) rotate(${rotation}deg) scale(${scale})`;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ? (
          <span onClick={(e) => e.stopPropagation()}>{trigger}</span>
        ) : (
          <button
            type="button"
            onClick={(e) => e.stopPropagation()}
            className={cn("relative overflow-hidden rounded-md border bg-muted hover:opacity-90", className)}
            style={{ width: thumbSize, height: thumbSize }}
            aria-label={`Open image ${safeName(file.original_name)}`}
          >
            {canRender ? (
              <Image
                src={src}
                alt={safeName(file.original_name)}
                width={thumbSize}
                height={thumbSize}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                No image
              </div>
            )}
          </button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[720px] p-0 overflow-hidden">
        <DialogHeader className="px-4 pt-4">
          <div className="flex items-start justify-between gap-3">
            <DialogTitle className="truncate pr-2">{dialogTitle}</DialogTitle>

          </div>
        </DialogHeader>

        {/* Toolbar */}
        <div className="px-4 pb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <ToolbarIconButton label="Zoom out" onClick={zoomOut} disabled={!canRender}>
              <ZoomOut className="h-4 w-4" />
            </ToolbarIconButton>
            <ToolbarIconButton label="Zoom in" onClick={zoomIn} disabled={!canRender}>
              <ZoomIn className="h-4 w-4" />
            </ToolbarIconButton>

            <Separator orientation="vertical" className="mx-2 h-8" />

            <ToolbarIconButton label="Rotate left" onClick={rotateLeft} disabled={!canRender}>
              <RotateCcw className="h-4 w-4" />
            </ToolbarIconButton>
            <ToolbarIconButton label="Rotate right" onClick={rotateRight} disabled={!canRender}>
              <RotateCw className="h-4 w-4" />
            </ToolbarIconButton>

            <Separator orientation="vertical" className="mx-2 h-8" />

            <ToolbarIconButton
              label={fitMode === "fit" ? "Actual size" : "Fit to screen"}
              onClick={toggleFit}
              disabled={!canRender}
            >
              <Maximize2 className="h-4 w-4" />
            </ToolbarIconButton>

            <ToolbarIconButton label="Reset" onClick={reset} disabled={!canRender}>
              <Search className="h-4 w-4" />
            </ToolbarIconButton>


            <div className="ml-auto" />

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={download}
              disabled={!canRender || downloading}
            >
              <Download className="mr-2 h-4 w-4" />
              {downloading ? "Downloading..." : "Download"}
            </Button>
            {/* Info drawer trigger */}
            <TooltipProvider>
              <Tooltip>
                <Sheet>
                  <SheetTrigger asChild>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()} aria-label="Image info">
                        <Info className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                  </SheetTrigger>

                  <TooltipContent>Info</TooltipContent>

                  <SheetContent side="right" className="w-full sm:w-[420px]">
                    <SheetHeader>
                      <SheetTitle>Image info</SheetTitle>
                    </SheetHeader>

                    <div className="mt-4 space-y-3 text-sm px-4">
                      {/* <InfoRow label="ID" value={file.id} mono /> */}
                      <InfoRow label="Name" value={safeName(file.original_name)} />
                      <InfoRow label="Type" value={file.file_type ?? "image"} />
                      <InfoRow label="Size" value={formatBytes(file.size_bytes)} />
                      {/* <InfoRow label="Temporary" value={String(Boolean(file.is_temporary))} /> */}
                      <InfoRow label="Uploaded at" value={formatDateShort(file.uploaded_at ?? "-")} />
                      {/* <InfoRow
                        // label="URL"
                        value={
                          file.file_url ? (
                            <a href={file.file_url} target="_blank" rel="noreferrer" className="text-primary underline break-all">
                              {file.file_url}
                            </a>
                          ) : (
                            "-"
                          )
                        }
                      /> */}

                      {/* {file.download_url ? (
                        <InfoRow
                          label="Download"
                          value={
                            <a href={file.download_url} target="_blank" rel="noreferrer" className="text-primary underline break-all">
                              {file.download_url}
                            </a>
                          }
                        />
                      ) : null} */}

                      {file.meta && Object.keys(file.meta).length ? (
                        <>
                          <Separator />
                          <div className="font-medium">Meta</div>
                          <pre className="max-h-56 overflow-auto rounded bg-muted p-2 text-xs">
                            {JSON.stringify(file.meta, null, 2)}
                          </pre>
                        </>
                      ) : null}
                    </div>
                  </SheetContent>
                </Sheet>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* <p className="mt-2 text-xs text-muted-foreground">
            Tip: Mouse wheel to zoom • Drag to pan • Double-click to reset • Right-click for menu
          </p> */}
        </div>

        <Separator />

        {/* Viewer (with context menu) */}
        <div className="p-3">
          <ContextMenu>
            <ContextMenuTrigger asChild>
              <div
                ref={containerRef}
                className={cn(
                  "relative rounded-lg border bg-muted/30",
                  "h-[62vh] w-full overflow-hidden"
                )}
                onWheel={onWheel}
                onDoubleClick={onDoubleClick}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
              >
                {canRender ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    {/* the transformed layer */}
                    <div
                      className={cn(
                        "will-change-transform",
                        (scale > 1 || fitMode === "actual") && "cursor-grab active:cursor-grabbing"
                      )}
                      style={{ transform, transformOrigin: "center center" }}
                    >
                      <Image
                        src={src}
                        alt={safeName(file.original_name)}
                        width={1600}
                        height={1000}
                        className={cn(
                          "rounded-md object-contain select-none",
                          fitMode === "fit" ? "max-h-[58vh] max-w-[calc(100vw-3rem)]" : ""
                        )}
                        draggable={false}
                        priority
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    No image url
                  </div>
                )}
              </div>
            </ContextMenuTrigger>

            <ContextMenuContent className="w-56">
              <ContextMenuItem onSelect={zoomIn} disabled={!canRender}>
                Zoom in
              </ContextMenuItem>
              <ContextMenuItem onSelect={zoomOut} disabled={!canRender}>
                Zoom out
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem onSelect={rotateLeft} disabled={!canRender}>
                Rotate left
              </ContextMenuItem>
              <ContextMenuItem onSelect={rotateRight} disabled={!canRender}>
                Rotate right
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem onSelect={toggleFit} disabled={!canRender}>
                {fitMode === "fit" ? "Actual size" : "Fit to screen"}
              </ContextMenuItem>
              <ContextMenuItem onSelect={reset} disabled={!canRender}>
                Reset
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem onSelect={() => void download()} disabled={!canRender || downloading}>
                Download
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ToolbarIconButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onClick}
            disabled={disabled}
            aria-label={label}
            title={label}
          >
            {children}
          </Button>
        </TooltipTrigger>
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function InfoRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="grid grid-cols-[110px_1fr] gap-2">
      <div className="text-muted-foreground">{label}</div>
      <div className={cn("break-words", mono && "font-mono text-xs")}>{value}</div>
    </div>
  );
}
