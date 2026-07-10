"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CreateLinkDialog } from "./create-link-dialog";

type Link = {
  id: string;
  slug: string;
  destinationUrl: string;
  title: string | null;
  clickCount: number;
  createdAt: string;
};

type FetchState = "loading" | "empty" | "error" | "success";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function LinkRow({ link }: { link: Link }) {
  return (
    <TableRow>
      <TableCell className="font-medium">
        <a
          href={"/dashboard/links/" + link.id}
          className="hover:underline underline-offset-2"
        >
          {link.slug}
        </a>
        {link.title && (
          <span className="ml-2 text-xs text-muted-foreground">
            {link.title}
          </span>
        )}
      </TableCell>
      <TableCell className="max-w-[200px] truncate text-muted-foreground">
        <a
          href={link.destinationUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline"
        >
          {link.destinationUrl}
        </a>
      </TableCell>
      <TableCell className="text-right tabular-nums">{link.clickCount}</TableCell>
      <TableCell className="text-right text-muted-foreground">
        {formatDate(link.createdAt)}
      </TableCell>
    </TableRow>
  );
}

function LinkSkeleton() {
  return (
    <TableRow>
      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
      <TableCell><Skeleton className="h-4 w-48" /></TableCell>
      <TableCell><Skeleton className="h-4 w-8 ml-auto" /></TableCell>
      <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
    </TableRow>
  );
}

export function LinkList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const search = searchParams.get("search") || "";
  const sort = searchParams.get("sort") || "newest";

  const [links, setLinks] = useState<Link[]>([]);
  const [state, setState] = useState<FetchState>("loading");
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [localSearch, setLocalSearch] = useState(search);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchLinks = useCallback(async (searchCursor?: string | null) => {
    await Promise.resolve();
    setState("loading");
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (sort) params.set("sort", sort);
      if (searchCursor) params.set("cursor", searchCursor);

      const res = await fetch("/api/links?" + params.toString());
      if (!res.ok) throw new Error("Failed to fetch");

      const data = await res.json();
      setLinks(data.links);
      setNextCursor(data.nextCursor);
      setState(data.links.length === 0 ? "empty" : "success");
    } catch {
      setState("error");
    }
  }, [search, sort]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchLinks(null);
  }, [fetchLinks]);

  function updateParams(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    params.delete("cursor");
    router.push("?" + params.toString(), { scroll: false });
  }

  function handleSearchChange(value: string) {
    setLocalSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateParams({ search: value });
    }, 300);
  }

  if (state === "loading" && links.length === 0) {
    return (
      <div className="space-y-6">
        <Controls
          search={localSearch}
          sort={sort}
          onSearchChange={handleSearchChange}
          onSortChange={(v) => updateParams({ sort: v })}
        />
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Slug</TableHead>
              <TableHead>Destination</TableHead>
              <TableHead className="text-right">Clicks</TableHead>
              <TableHead className="text-right">Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <LinkSkeleton key={i} />
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (state === "empty") {
    return (
      <div className="space-y-6">
        <Controls
          search={localSearch}
          sort={sort}
          onSearchChange={handleSearchChange}
          onSortChange={(v) => updateParams({ sort: v })}
        />
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <h2 className="text-xl font-semibold">No links yet</h2>
          <p className="mt-2 text-muted-foreground">
            {search
              ? "No links match your search."
              : "Create your first branded short link to get started."}
          </p>
          {!search && (
            <div className="mt-6">
              <CreateLinkDialog />
            </div>
          )}
        </div>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <h2 className="text-xl font-semibold">Something went wrong</h2>
        <p className="mt-2 text-muted-foreground">
          Could not load your links. Please try again.
        </p>
        <button
          onClick={() => fetchLinks(null)}
          className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Controls
        search={localSearch}
        sort={sort}
        onSearchChange={handleSearchChange}
        onSortChange={(v) => updateParams({ sort: v })}
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Slug</TableHead>
            <TableHead>Destination</TableHead>
            <TableHead className="text-right">Clicks</TableHead>
            <TableHead className="text-right">Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {links.map((link) => (
            <LinkRow key={link.id} link={link} />
          ))}
        </TableBody>
      </Table>
      {nextCursor && (
        <div className="flex justify-center">
          <button
            onClick={() => fetchLinks(nextCursor)}
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
          >
            Load more
          </button>
        </div>
      )}
    </div>
  );
}

function Controls({
  search,
  sort,
  onSearchChange,
  onSortChange,
}: {
  search: string;
  sort: string;
  onSearchChange: (v: string) => void;
  onSortChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row">
      <Input
        placeholder="Search by slug or URL..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="sm:max-w-xs"
        aria-label="Search links"
      />
      <Select value={sort} onValueChange={(v) => v && onSortChange(v)}>
        <SelectTrigger className="w-[160px]" aria-label="Sort links">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="newest">Newest first</SelectItem>
          <SelectItem value="clicks">Most clicks</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
