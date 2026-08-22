"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SearchIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SearchBar({ initialQuery }: { initialQuery?: string }) {
  const router = useRouter();
  const [value, setValue] = useState(initialQuery ?? "");
  const hasValue = value.trim().length > 0;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = value.trim();
    router.push(query ? `/?q=${encodeURIComponent(query)}` : "/");
  }

  function handleClear() {
    setValue("");
    if (initialQuery) router.push("/");
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 flex max-w-xl gap-2">
      <div className="relative flex-1">
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
    </form>
  );
}
