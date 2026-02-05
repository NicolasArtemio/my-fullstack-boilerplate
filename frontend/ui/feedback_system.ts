import { z } from 'zod';
import { SkillDefinition, SkillResult } from '../types';

export const FeedbackSystemSchema = z.object({
    triggerAction: z.string().describe('The action triggering the feedback (e.g., "handleSave")'),
    successMessage: z.string().describe('Message to show on success'),
    errorMessage: z.string().describe('Message to show on error'),
});

const handler = async (args: z.infer<typeof FeedbackSystemSchema>): Promise<SkillResult> => {
    const { triggerAction, successMessage, errorMessage } = args;

    const wrappedHandlerCode = `
import { toast } from "sonner";

const ${triggerAction} = async () => {
  try {
    // ... await action()
    toast.success("${successMessage}");
  } catch (error) {
    console.error(error);
    toast.error("${errorMessage}", {
      description: "Please check your connection and try again.",
    });
  }
};
`;

    // Also providing a Skeleton loader snippet as part of the system
    const skeletonLoader = `
import { Skeleton } from "@/components/ui/skeleton";

export function Loading${triggerAction.replace(/handle/, '')}() {
  return (
    <div className="flex flex-col space-y-3">
      <Skeleton className="h-[125px] w-[250px] rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-4 w-[200px]" />
      </div>
    </div>
  )
}
`;

    return {
        success: true,
        data: {
            handler: wrappedHandlerCode,
            skeleton: skeletonLoader
        },
        metadata: {
            library: 'sonner + shadcn/skeleton',
            uxOptimizations: ['error-handling', 'loading-state']
        }
    };
};

export const feedbackSystemSkillDefinition: SkillDefinition<typeof FeedbackSystemSchema> = {
    name: 'generate_feedback_system',
    description: 'Integrates feedback loops (Toasts) and loading states (Skeletons) for better UX.',
    parameters: FeedbackSystemSchema,
    handler,
};
