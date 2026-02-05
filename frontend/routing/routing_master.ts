import { z } from 'zod';
import { SkillDefinition, SkillResult } from '../types';

export const RoutingMasterSchema = z.object({
    routePath: z.string().describe('The route path, e.g., /dashboard/settings, (auth)/login, or [id]'),
    isDynamic: z.boolean().describe('Whether this is a dynamic route segment'),
    hasLayout: z.boolean().describe('Whether to include a layout.tsx file'),
});

const handler = async (args: z.infer<typeof RoutingMasterSchema>): Promise<SkillResult> => {
    const { routePath, isDynamic, hasLayout } = args;

    const getComponentName = (path: string) => {
        const cleanPath = path.replace(/[\/\[\]\(\)]/g, ' ').trim();
        const parts = cleanPath.split(' ');
        // CamelCase the last part or "Page" if empty
        const lastPart = parts[parts.length - 1] || 'Home';
        return lastPart.charAt(0).toUpperCase() + lastPart.slice(1);
    };

    const componentName = getComponentName(routePath);

    const pageContent = `export default function ${componentName}Page({ params }: { params: { [key: string]: string } }) {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">${componentName}</h1>
      <p>Welcome to the ${routePath} page.</p>
    </div>
  );
}`;

    const layoutContent = `export default function ${componentName}Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="dashboard-section">
      {/* Add sidebar or header here if needed */}
      {children}
    </section>
  );
}`;

    const loadingContent = `export default function Loading() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>
  );
}`;

    const errorContent = `'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="p-4 border border-red-200 bg-red-50 rounded">
      <h2 className="text-red-700 font-bold">Something went wrong!</h2>
      <button
        onClick={() => reset()}
        className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
      >
        Try again
      </button>
    </div>
  );
}`;

    const files: Record<string, string> = {
        'page.tsx': pageContent,
        'loading.tsx': loadingContent,
        'error.tsx': errorContent,
    };

    if (hasLayout) {
        files['layout.tsx'] = layoutContent;
    }

    return {
        success: true,
        data: files,
        metadata: {
            routeStructure: routePath,
            filesGenerated: Object.keys(files)
        }
    };
};

export const routingMasterSkillDefinition: SkillDefinition<typeof RoutingMasterSchema> = {
    name: 'routing_master',
    description: 'Generates directory structure and essential files (page, layout, loading, error) for Next.js App Router.',
    parameters: RoutingMasterSchema,
    handler,
};
