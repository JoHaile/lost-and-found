"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpDownIcon, SearchIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SORT_OPTIONS, type SortKey } from "@/lib/sort";

interface SearchBarProps {
  initialQuery?: string;
  initialSort?: SortKey;
}

export function SearchBar({ initialQuery, initialSort = "newest" }: SearchBarProps) {
  const router = useRouter();
  const [value, setValue] = useState(initialQuery ?? "");
  const hasValue = value.trim().length > 0;

  function pushUrl(query: string, sort: string) {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    params.set("sort", sort);
    router.push(`/?${params.toString()}`);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    pushUrl(value.trim(), initialSort);
  }

  function handleClear() {
    setValue("");
    if (initialQuery) pushUrl("", initialSort);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 flex max-w-2xl flex-wrap gap-2">
      <div className="relative min-w-52 flex-1">
        <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Search reports by name, description, location…"
          aria-label="Search reports"
          className="h-9 rounded-full bg-card pl-10 pr-9 shadow-sm [&::-webkit-search-cancel-button]:hidden"
        />
        {hasValue && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <XIcon className="size-4" />
          </button>
        )}
      </div>
      <Button type="submit" variant="outline" className="rounded-full">
        Search
      </Button>
      <Select
        value={initialSort}
        onValueChange={(sort) => {
          if (sort) pushUrl(initialQuery ?? "", sort);
        }}
      >
        <SelectTrigger
          aria-label="Sort reports"
          className="h-9 w-[136px] rounded-full bg-card pl-4 pr-3 shadow-sm"
        >
          <ArrowUpDownIcon className="size-3.5 shrink-0 opacity-60" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </form>
  );
}
