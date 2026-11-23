import { ChevronRight, History } from "lucide-react";

export function RecentSearchRow({ query, onSelect }: { query: string; onSelect: (query: string) => void }) {
  return (
    <li className="border-b border-line last:border-b-0">
      <button type="button" onClick={() => onSelect(query)} className="flex min-h-12 w-full items-center gap-3 px-4 py-2 text-left active:bg-fill">
        <History aria-hidden size={20} className="shrink-0 text-ink2" />
        <span className="min-w-0 flex-1 break-words text-[16px]">{query}</span>
        <ChevronRight aria-hidden size={20} className="shrink-0 text-ink2" />
      </button>
    </li>
  );
}
