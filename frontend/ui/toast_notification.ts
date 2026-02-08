import { z } from 'zod';
import { SkillDefinition, SkillResult } from '../../types';

export const ToastNotificationSchema = z.object({
    provider: z.enum(['sonner', 'react-hot-toast']).default('sonner'),
    withCustomStyles: z.boolean().default(true),
    generateHook: z.boolean().default(true),
});

const handler = async (args: z.infer<typeof ToastNotificationSchema>): Promise<SkillResult> => {
    const { provider, withCustomStyles, generateHook } = args;
    const files: Record<string, string> = {};

    if (provider === 'sonner') {
        files['toast-provider.tsx'] = `"use client";
import { Toaster } from "sonner";

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        ${withCustomStyles ? `classNames: {
          toast: "bg-background border-border",
          title: "text-foreground",
          description: "text-muted-foreground",
          success: "!bg-green-500/10 !border-green-500/20",
          error: "!bg-destructive/10 !border-destructive/20",
          warning: "!bg-yellow-500/10 !border-yellow-500/20",
          info: "!bg-blue-500/10 !border-blue-500/20",
        },` : ''}
        duration: 4000,
      }}
      richColors
      closeButton
    />
  );
}`;

        if (generateHook) {
            files['use-toast.ts'] = `import { toast } from "sonner";

interface ToastOptions {
  description?: string;
  duration?: number;
  action?: { label: string; onClick: () => void };
}

export function useToast() {
  const success = (message: string, options?: ToastOptions) => {
    toast.success(message, {
      description: options?.description,
      duration: options?.duration,
      action: options?.action ? {
        label: options.action.label,
        onClick: options.action.onClick,
      } : undefined,
    });
  };

  const error = (message: string, options?: ToastOptions) => {
    toast.error(message, {
      description: options?.description,
      duration: options?.duration || 5000,
    });
  };

  const warning = (message: string, options?: ToastOptions) => {
    toast.warning(message, { description: options?.description });
  };

  const info = (message: string, options?: ToastOptions) => {
    toast.info(message, { description: options?.description });
  };

  const loading = (message: string) => {
    return toast.loading(message);
  };

  const dismiss = (toastId?: string | number) => {
    toast.dismiss(toastId);
  };

  const promise = <T>(
    promise: Promise<T>,
    messages: { loading: string; success: string; error: string }
  ) => {
    return toast.promise(promise, messages);
  };

  return { success, error, warning, info, loading, dismiss, promise };
}`;
        }
    } else {
        files['toast-provider.tsx'] = `"use client";
import { Toaster } from "react-hot-toast";

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        ${withCustomStyles ? `style: {
          background: "hsl(var(--background))",
          color: "hsl(var(--foreground))",
          border: "1px solid hsl(var(--border))",
        },
        success: { iconTheme: { primary: "#22c55e", secondary: "#fff" } },
        error: { iconTheme: { primary: "#ef4444", secondary: "#fff" } },` : ''}
      }}
    />
  );
}`;

        if (generateHook) {
            files['use-toast.ts'] = `import toast from "react-hot-toast";

export function useToast() {
  return {
    success: (message: string) => toast.success(message),
    error: (message: string) => toast.error(message),
    loading: (message: string) => toast.loading(message),
    dismiss: (id?: string) => toast.dismiss(id),
    promise: <T>(promise: Promise<T>, msgs: { loading: string; success: string; error: string }) =>
      toast.promise(promise, msgs),
  };
}`;
        }
    }

    files['usage-example.tsx'] = `import { useToast } from "./use-toast";

function MyComponent() {
  const toast = useToast();

  const handleSave = async () => {
    toast.promise(saveData(), {
      loading: "Saving...",
      success: "Saved successfully!",
      error: "Failed to save",
    });
  };

  const handleDelete = () => {
    toast.error("Item deleted", { description: "This action cannot be undone" });
  };

  return <button onClick={handleSave}>Save</button>;
}`;

    return {
        success: true,
        data: files,
        metadata: { provider, generatedFiles: Object.keys(files) },
    };
};

export const toastNotificationSkillDefinition: SkillDefinition<typeof ToastNotificationSchema> = {
    name: 'toast_notification_system',
    description: 'Generates toast notification system with Sonner or react-hot-toast.',
    parameters: ToastNotificationSchema,
    handler,
};
