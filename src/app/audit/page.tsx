import { SiteHeader } from "@/components/layout/site-header";
import { AuditForm } from "@/features/audit/audit-form";

export default function AuditPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,rgba(99,102,241,0.14),transparent_55%),radial-gradient(ellipse_70%_50%_at_100%_0%,rgba(56,189,248,0.08),transparent),radial-gradient(ellipse_50%_40%_at_0%_100%,rgba(167,139,250,0.07),transparent)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/35 to-transparent"
        aria-hidden
      />
      <div className="relative">
        <SiteHeader />
        <AuditForm />
      </div>
    </div>
  );
}
