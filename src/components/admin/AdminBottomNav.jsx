
'use client';

import {
  LayoutDashboard,
  PackagePlus,
  Pencil,
  ClipboardList,
  Boxes
} from 'lucide-react';

const items = [
  {
    key: 'overview',
    label: 'Overview',
    icon: LayoutDashboard
  },
  {
    key: 'add',
    label: 'Add',
    icon: PackagePlus
  },
  {
    key: 'edit',
    label: 'Edit',
    icon: Pencil
  },
  {
    key: 'orders',
    label: 'Orders',
    icon: ClipboardList
  },
  {
    key: 'inventory',
    label: 'Inventory',
    icon: Boxes
  }
];

export default function AdminBottomNav({
  activeTab,
  onNavigate
}) {
  return (
    <nav
      aria-label="Admin mobile navigation"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-[#333] bg-[#111] pb-[env(safe-area-inset-bottom)] text-white shadow-[0_-4px_20px_rgba(0,0,0,.12)] lg:hidden"
    >
      <div className="grid h-[64px] grid-cols-5">
        {items.map(item => {
          const Icon = item.icon;
          const active = activeTab === item.key;

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onNavigate(item.key)}
              aria-current={active ? 'page' : undefined}
              className={`flex min-w-0 flex-col items-center justify-center gap-1 transition ${
                active
                  ? 'bg-[#292929] text-white'
                  : 'text-[#aaa] hover:text-white'
              }`}
            >
              <Icon
                size={19}
                strokeWidth={active ? 2.3 : 1.8}
              />

              <span className="text-[10px] font-medium">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
