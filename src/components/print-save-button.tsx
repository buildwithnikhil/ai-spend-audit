"use client";

import { Button } from "@/components/ui/button";

export function PrintSaveButton({ label = "Save PDF" }: { label?: string }) {
  return (
    <Button type="button" variant="outline" onClick={() => window.print()}>
      {label}
    </Button>
  );
}
