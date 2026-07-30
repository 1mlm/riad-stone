"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/Icon";
import { cn } from "@/shadcn/utils";
import { NAV_ITEMS } from "./data";

export function MobileBottomBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 flex border-t border-border bg-sidebar sm:hidden">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 py-2 text-muted-foreground",
              isActive && "text-foreground",
            )}
          >
            <Icon icon={item.icon} className="size-5" />
            <span className="text-[0.65rem]">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
