import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";

const NAV_ITEMS = [
  { href: "/", label: "Swipe" },
  { href: "/accounts", label: "Accounts" },
  { href: "/saved", label: "Gemerkt" },
  { href: "/analytics", label: "Trends" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-neutral-800 bg-neutral-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <span className="text-sm font-semibold tracking-tight">heysash85 · viral lab</span>
          <nav className="flex items-center gap-4 text-sm text-neutral-400">
            {NAV_ITEMS.map((item) => (
              <Link key={item.href} href={item.href} className="hover:text-neutral-100">
                {item.label}
              </Link>
            ))}
            <LogoutButton />
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
