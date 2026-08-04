"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { LucideIcon } from "lucide-react";
import { Check, HeartCrack, Send } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider as RadixToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";

export type ToastVariant = "success" | "info" | "removed";

type ToastInput = {
  title: string;
  description?: string;
  variant?: ToastVariant;
  /** Overrides the icon lucide would otherwise pick for the variant. */
  icon?: LucideIcon;
};

type ToastRecord = ToastInput & { id: string };

type ToastContextValue = {
  toast: (input: ToastInput) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const VARIANT_ICON: Record<ToastVariant, LucideIcon> = {
  success: Check,
  info: Send,
  removed: HeartCrack,
};

const VARIANT_ICON_CLASS: Record<ToastVariant, string> = {
  success: "bg-accent-soft text-signal",
  info: "bg-accent-soft text-signal",
  removed: "bg-cloud text-slate",
};

/**
 * App-wide toast queue, mirroring the existing cart/wishlist provider
 * pattern (context + hook) rather than pulling in a separate toast state
 * library. Renders on top of Radix's toast primitives, styled to match the
 * rest of the design system (rounded-2xl, quiet shadow, signal accent).
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);

  const toast = useCallback((input: ToastInput) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setToasts((current) => [...current, { ...input, id }]);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((item) => item.id !== id));
  }, []);

  const value = useMemo<ToastContextValue>(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <RadixToastProvider swipeDirection="right" duration={4000}>
        {toasts.map(({ id, title, description, variant = "success", icon }) => {
          const Icon = icon ?? VARIANT_ICON[variant];
          return (
            <Toast
              key={id}
              onOpenChange={(open) => {
                if (!open) dismiss(id);
              }}
            >
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                  VARIANT_ICON_CLASS[variant]
                )}
              >
                <Icon className="h-4 w-4" strokeWidth={1.75} />
              </span>
              <div className="flex flex-col gap-0.5 pr-4">
                <ToastTitle>{title}</ToastTitle>
                {description ? (
                  <ToastDescription>{description}</ToastDescription>
                ) : null}
              </div>
              <ToastClose />
            </Toast>
          );
        })}
        <ToastViewport />
      </RadixToastProvider>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
