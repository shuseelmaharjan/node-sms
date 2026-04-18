import type { NavigationEntity } from "../types/navigation.types";

export function byNavigationOrder(
  a: Pick<NavigationEntity, "sort_order" | "name">,
  b: Pick<NavigationEntity, "sort_order" | "name">
) {
  if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
  return a.name.localeCompare(b.name);
}

export function filterNavigations(items: NavigationEntity[], query: string) {
  const q = query.trim().toLowerCase();

  return [...items]
    .filter((item) => {
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.slug.toLowerCase().includes(q)
      );
    })
    .sort(byNavigationOrder);
}

export function formatSortOrder(sortOrder: number) {
  return `Sort order: ${sortOrder}`;
}