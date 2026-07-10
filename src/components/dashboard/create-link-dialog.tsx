"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createLinkSchema } from "@/lib/validations";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function CreateLinkDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});

    const form = new FormData(e.currentTarget);
    const data = {
      slug: form.get("slug") as string,
      destinationUrl: form.get("destinationUrl") as string,
      title: (form.get("title") as string) || undefined,
    };

    const parsed = createLinkSchema.safeParse(data);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as string;
        if (!fieldErrors[field]) fieldErrors[field] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to create link");
      }

      toast.success("Link created!");
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button>Create link</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a short link</DialogTitle>
          <DialogDescription>
            Paste a long URL and optionally pick a custom slug.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              name="slug"
              placeholder="my-link"
              aria-invalid={!!errors.slug}
            />
            {errors.slug && (
              <p className="text-sm text-destructive">{errors.slug}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="destinationUrl">Destination URL</Label>
            <Input
              id="destinationUrl"
              name="destinationUrl"
              placeholder="https://example.com/long-url"
              aria-invalid={!!errors.destinationUrl}
            />
            {errors.destinationUrl && (
              <p className="text-sm text-destructive">{errors.destinationUrl}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">Title (optional)</Label>
            <Input id="title" name="title" placeholder="My link" />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Creating..." : "Create link"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
