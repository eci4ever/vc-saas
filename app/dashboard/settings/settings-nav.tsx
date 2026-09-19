"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/dashboard/settings/profile", label: "Profile" },
  { href: "/dashboard/settings/workspace", label: "Workspace" },
  { href: "/dashboard/settings/members", label: "Members" },
];

export function SettingsNav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 rounded-full border border-zinc-200 p-1 text-sm dark:border-white/15">
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex-1 rounded-full px-4 py-2 text-center font-medium transition-colors ${
              active
                ? "bg-zinc-950 text-white dark:bg-white dark:text-black"
                : "text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
