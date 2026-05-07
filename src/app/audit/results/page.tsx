import { Suspense } from "react";
import { SiteHeader } from "@/components/layout/site-header";
import { AuditResultsView } from "@/features/audit/audit-results-view";

export default function AuditResultsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
      <SiteHeader />
      <Suspense fallback={<div className="p-16 text-center text-muted-foreground">Loading…</div>}>
        <AuditResultsView />
      </Suspense>
    </div>
  );
}
