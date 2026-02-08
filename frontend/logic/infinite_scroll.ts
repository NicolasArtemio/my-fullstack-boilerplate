import { z } from 'zod';
import { SkillDefinition, SkillResult } from '../../types';

export const InfiniteScrollSchema = z.object({
    hookName: z.string().default('useInfiniteData'),
    queryKey: z.array(z.string()),
    fetcherPath: z.string().describe('Import path for fetcher function'),
    pageParamName: z.string().default('page'),
});

const handler = async (args: z.infer<typeof InfiniteScrollSchema>): Promise<SkillResult> => {
    const { hookName, queryKey, fetcherPath, pageParamName } = args;

    const code = `import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useRef, useCallback } from "react";
import { fetchData } from "${fetcherPath}";

interface UseInfiniteOptions {
  enabled?: boolean;
}

export function ${hookName}(options: UseInfiniteOptions = {}) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const query = useInfiniteQuery({
    queryKey: [${queryKey.map(k => `"${k}"`).join(', ')}],
    queryFn: ({ pageParam = 1 }) => fetchData({ ${pageParamName}: pageParam }),
    getNextPageParam: (lastPage, pages) => {
      if (lastPage.hasMore) return pages.length + 1;
      return undefined;
    },
    initialPageParam: 1,
    enabled: options.enabled ?? true,
  });

  const { fetchNextPage, hasNextPage, isFetchingNextPage } = query;

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage]
  );

  useEffect(() => {
    const element = loadMoreRef.current;
    if (!element) return;

    observerRef.current = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: "100px",
      threshold: 0.1,
    });

    observerRef.current.observe(element);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleObserver]);

  const data = query.data?.pages.flatMap((page) => page.items) ?? [];

  return {
    ...query,
    data,
    loadMoreRef,
    hasNextPage,
    isFetchingNextPage,
  };
}

// Usage example component
export function InfiniteList() {
  const { data, isLoading, loadMoreRef, isFetchingNextPage } = ${hookName}();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-4">
      {data.map((item) => (
        <div key={item.id}>{item.name}</div>
      ))}
      
      <div ref={loadMoreRef} className="py-4 text-center">
        {isFetchingNextPage && <span>Loading more...</span>}
      </div>
    </div>
  );
}`;

    return {
        success: true,
        data: code,
        metadata: { hookName, queryKey },
    };
};

export const infiniteScrollSkillDefinition: SkillDefinition<typeof InfiniteScrollSchema> = {
    name: 'infinite_scroll_builder',
    description: 'Generates infinite scroll hook with React Query and Intersection Observer.',
    parameters: InfiniteScrollSchema,
    handler,
};
