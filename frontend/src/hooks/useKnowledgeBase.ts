import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import Fuse from "fuse.js";
import { useMemo } from "react";
import { getKBStats, getKBTags, searchKB, type KBFilters } from "../api/knowledgeBase";
import type { KBItem } from "../types";

export function useKnowledgeBase(filters: KBFilters) {
  const query = useInfiniteQuery({
    queryKey: ["kb", filters],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => searchKB({ ...filters, page: Number(pageParam), limit: 20 }),
    getNextPageParam: (lastPage) => {
      const loaded = lastPage.page * 20;
      return loaded < lastPage.total ? lastPage.page + 1 : undefined;
    },
  });
  const stats = useQuery({ queryKey: ["kb-stats"], queryFn: getKBStats });
  const tags = useQuery({ queryKey: ["kb-tags"], queryFn: getKBTags });
  const items = useMemo(() => query.data?.pages.flatMap((page) => page.results) ?? [], [query.data]);
  const fuzzyItems = useMemo(() => {
    if (!filters.q || filters.q.length < 2) return items;
    const fuse = new Fuse(items, { keys: ["title", "preview", "tags"], threshold: 0.42 });
    const found = fuse.search(filters.q).map((result) => result.item);
    return found.length ? found : items;
  }, [filters.q, items]);
  const firstPage = query.data?.pages[0];
  return { ...query, items: fuzzyItems as KBItem[], facets: firstPage?.facets, total: firstPage?.total ?? 0, stats, tags };
}

