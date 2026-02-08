import { z } from 'zod';
import { SkillDefinition, SkillResult } from '../../types';

export const SkeletonLoaderSchema = z.object({
    componentName: z.string().describe('Skeleton component name'),
    layout: z.enum(['card', 'table', 'list', 'profile', 'form']).default('card'),
    itemCount: z.number().default(3).describe('Number of skeleton items'),
    animated: z.boolean().default(true),
});

const handler = async (args: z.infer<typeof SkeletonLoaderSchema>): Promise<SkillResult> => {
    const { componentName, layout, itemCount, animated } = args;

    const animationClass = animated ? 'animate-pulse' : '';

    const layouts: Record<string, string> = {
        card: `<div className="rounded-lg border p-4 space-y-3">
      <div className="h-4 w-3/4 bg-muted rounded ${animationClass}" />
      <div className="h-3 w-1/2 bg-muted rounded ${animationClass}" />
      <div className="h-20 bg-muted rounded ${animationClass}" />
    </div>`,
        table: `<div className="space-y-2">
      <div className="h-10 bg-muted rounded ${animationClass}" />
      ${Array(itemCount).fill(`<div className="h-12 bg-muted/50 rounded ${animationClass}" />`).join('\n      ')}
    </div>`,
        list: `<div className="space-y-3">
      ${Array(itemCount).fill(`<div className="flex gap-3">
        <div className="h-10 w-10 rounded-full bg-muted ${animationClass}" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 bg-muted rounded ${animationClass}" />
          <div className="h-3 w-1/2 bg-muted rounded ${animationClass}" />
        </div>
      </div>`).join('\n      ')}
    </div>`,
        profile: `<div className="flex flex-col items-center gap-4">
      <div className="h-24 w-24 rounded-full bg-muted ${animationClass}" />
      <div className="h-5 w-32 bg-muted rounded ${animationClass}" />
      <div className="h-3 w-48 bg-muted rounded ${animationClass}" />
    </div>`,
        form: `<div className="space-y-4">
      ${Array(itemCount).fill(`<div className="space-y-2">
        <div className="h-4 w-20 bg-muted rounded ${animationClass}" />
        <div className="h-10 w-full bg-muted rounded ${animationClass}" />
      </div>`).join('\n      ')}
      <div className="h-10 w-24 bg-muted rounded ${animationClass}" />
    </div>`,
    };

    const code = `import { cn } from "@/lib/utils";

interface ${componentName}Props {
  className?: string;
  count?: number;
}

export function ${componentName}({ className, count = ${itemCount} }: ${componentName}Props) {
  return (
    <div className={cn("w-full", className)}>
      ${layouts[layout]}
    </div>
  );
}

// Reusable skeleton primitives
export function SkeletonLine({ className }: { className?: string }) {
  return <div className={cn("h-4 bg-muted rounded ${animationClass}", className)} />;
}

export function SkeletonCircle({ className }: { className?: string }) {
  return <div className={cn("h-10 w-10 rounded-full bg-muted ${animationClass}", className)} />;
}

export function SkeletonBox({ className }: { className?: string }) {
  return <div className={cn("h-20 bg-muted rounded ${animationClass}", className)} />;
}`;

    return {
        success: true,
        data: code,
        metadata: { componentName, layout, animated },
    };
};

export const skeletonLoaderSkillDefinition: SkillDefinition<typeof SkeletonLoaderSchema> = {
    name: 'skeleton_loader_builder',
    description: 'Generates skeleton loading states for various layouts.',
    parameters: SkeletonLoaderSchema,
    handler,
};
