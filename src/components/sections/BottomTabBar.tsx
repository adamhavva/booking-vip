"use client";

import Link from "next/link";
import {
  BellIcon,
  GiftIcon,
  HomeIcon,
  ListIcon,
  UserIcon,
} from "@/components/icons";

const tabs = [
  { label: "Home", Icon: HomeIcon, href: "/", active: true },
  { label: "Rewards", Icon: GiftIcon, href: "#" },
  { label: "Your Orders", Icon: ListIcon, href: "/my-booking" },
  { label: "Notification", Icon: BellIcon, href: "#" },
  { label: "Account", Icon: UserIcon, href: "#" },
];

export default function BottomTabBar() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white pb-[env(safe-area-inset-bottom)] lg:hidden">
      <ul className="flex">
        {tabs.map(({ label, Icon, href, active }) => (
          <li key={label} className="flex-1">
            {href === "#" ? (
              <button
                className={`flex w-full flex-col items-center gap-1 py-2 text-[10px] ${
                  active ? "text-brand" : "text-muted"
                }`}
              >
                <Icon width={20} height={20} />
                {label}
              </button>
            ) : (
              <Link
                href={href}
                className={`flex w-full flex-col items-center gap-1 py-2 text-[10px] ${
                  active ? "text-brand" : "text-muted"
                }`}
              >
                <Icon width={20} height={20} />
                {label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
