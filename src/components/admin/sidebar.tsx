"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/prompts", label: "Prompts" },
  { href: "/admin/llm-settings", label: "LLM Settings" },
  { href: "/admin/phase-config", label: "Phase Config" },
  { href: "/admin/phase-prompts", label: "Phase Prompts" },
  { href: "/admin/mood-prompts", label: "Mood Prompts" },
  { href: "/admin/safety", label: "Safety" },
  { href: "/admin/translations", label: "Translations" },
  { href: "/admin/consent", label: "Consent" },
  { href: "/admin/voice-options", label: "Voice Options" },
] as const;

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 border-r border-gray-200 bg-white">
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-lg font-semibold text-gray-900">Admin Panel</h1>
        <p className="text-xs text-gray-500 mt-0.5">App Configuration</p>
      </div>
      <nav className="p-2">
        {NAV_ITEMS.map(({ href, label }) => {
          const isActive =
            href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={`block rounded-md px-3 py-2 text-sm transition-colors ${
                isActive
                  ? "bg-gray-900 text-white font-medium"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto p-4 border-t border-gray-200">
        <Link
          href="/"
          className="block text-xs text-gray-500 hover:text-gray-700"
        >
          Back to app
        </Link>
      </div>
    </aside>
  );
}
