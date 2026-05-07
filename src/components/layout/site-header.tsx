import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="inline-flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-bold text-white">
            AI
          </span>
          <span>Spend Audit</span>
          <span className="hidden text-xs font-normal text-muted-foreground sm:inline">
            by Credex
          </span>
        </Link>
        <nav className="flex items-center gap-2" aria-label="Primary">
          <Link
            href="/audit"
            className="hidden text-sm text-muted-foreground hover:text-foreground sm:inline"
          >
            Run audit
          </Link>
          <ThemeToggle />
          <Link href="/audit" className={cn(buttonVariants({ size: "sm" }))}>
            Start free audit
          </Link>
        </nav>
      </div>
    </header>
  );
}
