import { Suspense } from "react";
import { LinkList } from "@/components/dashboard/link-list";
import { CreateLinkDialog } from "@/components/dashboard/create-link-dialog";
import { Skeleton } from "@/components/ui/skeleton";

function LinkListFallback() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row">
        <Skeleton className="h-10 sm:max-w-xs flex-1" />
        <Skeleton className="h-10 w-[160px]" />
      </div>
      <div className="rounded-md border">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b px-4 py-3 last:border-0">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Your Links</h1>
        <CreateLinkDialog />
      </div>
      <Suspense fallback={<LinkListFallback />}>
        <LinkList />
      </Suspense>
    </div>
  );
}
