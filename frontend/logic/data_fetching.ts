import { z } from 'zod';
import { SkillDefinition, SkillResult } from '../types';

export const DataFetchingSchema = z.object({
    queryKey: z.array(z.string()).describe('The unique key for the query cache (e.g. ["users", "list"])'),
    fetcherFunction: z.string().describe('Name of the async function handling the request (e.g. "fetchUsers")'),
    type: z.enum(['query', 'mutation']).describe('Type of hook: "query" for fetching, "mutation" for modifying data'),
});

const handler = async (args: z.infer<typeof DataFetchingSchema>): Promise<SkillResult> => {
    const { queryKey, fetcherFunction, type } = args;
    const pascalFetcher = fetcherFunction.charAt(0).toUpperCase() + fetcherFunction.slice(1);

    let hookCode = '';

    if (type === 'query') {
        hookCode = `
import { useQuery } from '@tanstack/react-query';
import { ${fetcherFunction} } from '@/services/api';

export const use${pascalFetcher} = () => {
  return useQuery({
    queryKey: [${queryKey.map(k => `'${k}'`).join(', ')}],
    queryFn: ${fetcherFunction},
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
`;
    } else {
        hookCode = `
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ${fetcherFunction} } from '@/services/api';

export const use${pascalFetcher}Mutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ${fetcherFunction},
    onSuccess: () => {
      // Invalidate relevant queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: [${queryKey.map(k => `'${k}'`).join(', ')}] });
    },
  });
};
`;
    }

    return {
        success: true,
        data: hookCode,
        metadata: {
            cacheStrategy: type === 'query' ? 'stale-while-revalidate' : 'optimistic-ui-ready',
            dependencies: ['@tanstack/react-query']
        }
    };
};

export const dataFetchingSkillDefinition: SkillDefinition<typeof DataFetchingSchema> = {
    name: 'generate_react_query_hook',
    description: 'Generates robust TanStack Query hooks for state management and caching.',
    parameters: DataFetchingSchema,
    handler,
};
