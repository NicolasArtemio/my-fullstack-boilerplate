import { z } from 'zod';
import { SkillDefinition, SkillResult } from '../types';

export const SearchParamsManagerSchema = z.object({
    paramsToUpdate: z.record(z.string(), z.string()).optional().describe('Example params to demonstrate usage or initial filtering values.'),
    behavior: z.enum(['push', 'replace']).default('replace').describe('Navigation behavior: push to history or replace current entry.'),
});

const handler = async (args: z.infer<typeof SearchParamsManagerSchema>): Promise<SkillResult> => {
    const { behavior } = args;

    const hookCode = `import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { useCallback } from 'react';

export function useUpdateSearchParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Get a specific param
  const getQuery = useCallback((name: string) => {
    return searchParams.get(name);
  }, [searchParams]);

  // Update URL params without reloading
  const setQuery = useCallback((name: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (value === null || value === '') {
      params.delete(name);
    } else {
      params.set(name, value);
    }

    const queryString = params.toString();
    const newUrl = queryString ? \`\${pathname}?\${queryString}\` : pathname;

    router.${behavior}(newUrl, { scroll: false });
  }, [searchParams, pathname, router]);

  // Batch update multiple params
  const setQueries = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    Object.entries(updates).forEach(([name, value]) => {
      if (value === null || value === '') {
        params.delete(name);
      } else {
        params.set(name, value);
      }
    });

    const queryString = params.toString();
    const newUrl = queryString ? \`\${pathname}?\${queryString}\` : pathname;

    router.${behavior}(newUrl, { scroll: false });
  }, [searchParams, pathname, router]);

  return { getQuery, setQuery, setQueries, searchParams };
}
`;

    return {
        success: true,
        data: hookCode,
        metadata: {
            behavior,
            hookName: 'useUpdateSearchParams'
        }
    };
};

export const searchParamsManagerSkillDefinition: SkillDefinition<typeof SearchParamsManagerSchema> = {
    name: 'search_params_manager',
    description: 'Generates a secure custom hook for managing URL search parameters (filtering, sorting) in Next.js.',
    parameters: SearchParamsManagerSchema,
    handler,
};
