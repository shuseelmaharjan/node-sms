"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ConfirmationModalContextType {
  showConfirmation: (options: ConfirmationOptions) => Promise<boolean>;
}

interface ConfirmationOptions {
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive";
}

const ConfirmationModalContext = createContext<ConfirmationModalContextType | null>(null);

export function useConfirmation() {
  const context = useContext(ConfirmationModalContext);
  if (!context) {
    throw new Error("useConfirmation must be used within a ConfirmationModalProvider");
  }
  return context;
}

export function ConfirmationModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmationOptions>({
    title: "",
    description: "",
  });
  const [resolvePromise, setResolvePromise] = useState<((value: boolean) => void) | null>(null);

  const showConfirmation = (confirmOptions: ConfirmationOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setOptions(confirmOptions);
      setResolvePromise(() => resolve);
      setIsOpen(true);
    });
  };

  const handleConfirm = () => {
    setIsOpen(false);
    if (resolvePromise) {
      resolvePromise(true);
      setResolvePromise(null);
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
    if (resolvePromise) {
      resolvePromise(false);
      setResolvePromise(null);
    }
  };

  return (
    <ConfirmationModalContext.Provider value={{ showConfirmation }}>
      {children}
      
      <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) {
          handleCancel();
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{options.title}</DialogTitle>
            <DialogDescription>
              {options.description}
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleCancel}
              className="flex-1"
            >
              {options.cancelText || "Cancel"}
            </Button>
            <Button 
              variant={options.variant || "default"} 
              onClick={handleConfirm}
              className="flex-1"
            >
              {options.confirmText || "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ConfirmationModalContext.Provider>
  );
}