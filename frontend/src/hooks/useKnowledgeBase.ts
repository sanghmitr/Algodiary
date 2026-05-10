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
  const filteredItems = useMemo(() => {
    const selectedTags = new Set((filters.tags ?? []).map((tag) => tag.toLowerCase()));
    return items.filter((item) => {
      const matchesCategory = !filters.category || filters.category === "all" || item.category === filters.category;
      const matchesType = !filters.type || filters.type === "all" || item.type === filters.type;
      const matchesRevision = !filters.revision_ready || (item.type === "note" && item.is_revision_ready === true);
      const matchesTags = selectedTags.size === 0 || item.tags.some((tag) => selectedTags.has(tag.toLowerCase()));
      return matchesCategory && matchesType && matchesRevision && matchesTags;
    });
  }, [filters.category, filters.revision_ready, filters.tags, filters.type, items]);
  const fuzzyItems = useMemo(() => {
    if (!filters.q || filters.q.length < 2) return filteredItems;
    const fuse = new Fuse(filteredItems, { keys: ["title", "preview", "code_preview", "tags"], threshold: 0.42 });
    const found = fuse.search(filters.q).map((result) => result.item);
    return found.length ? found : filteredItems;
  }, [filters.q, filteredItems]);
  const firstPage = query.data?.pages[0];
  return { ...query, items: fuzzyItems as KBItem[], facets: firstPage?.facets, total: firstPage?.total ?? 0, stats, tags };
}
