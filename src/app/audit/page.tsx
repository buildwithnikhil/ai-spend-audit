import { SiteHeader } from "@/components/layout/site-header";
import { AuditForm } from "@/features/audit/audit-form";

export default function AuditPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/40">
      <SiteHeader />
      <AuditForm />
    </div>
  );
}
