"use client";

import { HomeIcon, GiftIcon, ListIcon, BellIcon, UserIcon } from "./icons";

const tabs = [
  { label: "Home", Icon: HomeIcon, active: true },
  { label: "Rewards", Icon: GiftIcon },
  { label: "Your Orders", Icon: ListIcon },
  { label: "Notification", Icon: BellIcon },
  { label: "Account", Icon: UserIcon },
];

export default function BottomTabBar() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white md:hidden">
      <ul className="flex">
        {tabs.map(({ label, Icon, active }) => (
          <li key={label} className="flex-1">
            <button
              className={`flex w-full flex-col items-center gap-1 py-2 text-[10px] ${
                active ? "text-brand" : "text-muted"
              }`}
            >
              <Icon width={20} height={20} />
              {label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
