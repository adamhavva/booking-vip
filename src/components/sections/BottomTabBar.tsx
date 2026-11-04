"use client";

import Link from "next/link";
import {
  BellIcon,
  GiftIcon,
  HomeIcon,
  ListIcon,
  UserIcon,
} from "@/components/icons";
import { useLocale } from "@/components/providers/LocaleProvider";
import type { DictKey } from "@/i18n";

const tabs = [
  { labelKey: "tabBar.home" as DictKey, Icon: HomeIcon, href: "/", active: true },
  { labelKey: "tabBar.rewards" as DictKey, Icon: GiftIcon, href: "#" },
  { labelKey: "tabBar.yourOrders" as DictKey, Icon: ListIcon, href: "/my-booking" },
  { labelKey: "tabBar.notification" as DictKey, Icon: BellIcon, href: "#" },
  { labelKey: "tabBar.account" as DictKey, Icon: UserIcon, href: "#" },
];

export default function BottomTabBar() {
  const { t } = useLocale();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white pb-[env(safe-area-inset-bottom)] lg:hidden">
      <ul className="flex">
        {tabs.map(({ labelKey, Icon, href, active }) => (
          <li key={labelKey} className="flex-1">
            {href === "#" ? (
              <button
                className={`flex w-full flex-col items-center gap-1 py-2 text-[10px] ${
                  active ? "text-brand" : "text-muted"
                }`}
              >
                <Icon width={20} height={20} />
                {t(labelKey)}
              </button>
            ) : (
              <Link
                href={href}
                className={`flex w-full flex-col items-center gap-1 py-2 text-[10px] ${
                  active ? "text-brand" : "text-muted"
                }`}
              >
                <Icon width={20} height={20} />
                {t(labelKey)}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
