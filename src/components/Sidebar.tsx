import React from 'react';
import {
  LayoutDashboard,
  Receipt,
  FileText,
  Boxes,
  Users,
  Truck,
  Wallet,
  BarChart3,
  Settings,
  X,
  ShieldAlert,
  LogOut,
  UserCheck,
} from 'lucide-react';
import { Language, UserRole } from '../types';
import { getTranslation } from '../i18n/translations';

export type NavTab =
  | 'dashboard'
  | 'billing'
  | 'invoices'
  | 'inventory'
  | 'customers'
  | 'suppliers'
  | 'expenses'
  | 'reports'
  | 'settings';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  language: Language;
  userRole: UserRole;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  lowStockCount: number;
  totalReceivables: number;
  onLogout?: () => void;
  onRoleChange?: (role: UserRole) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  language,
  userRole,
  isMobileOpen,
  onCloseMobile,
  lowStockCount,
  totalReceivables,
  onLogout,
  onRoleChange,
}) => {
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(language, key);

  const navItems = [
    { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { id: 'billing', label: t('posBilling'), icon: Receipt, highlight: true },
    { id: 'invoices', label: t('invoices'), icon: FileText },
    { id: 'inventory', label: t('inventory'), icon: Boxes, badge: lowStockCount > 0 ? lowStockCount : undefined },
    { id: 'customers', label: t('customers'), icon: Users, badgeText: totalReceivables > 0 ? `₹${Math.round(totalReceivables / 1000)}k` : undefined },
    { id: 'suppliers', label: t('suppliers'), icon: Truck },
    { id: 'expenses', label: t('expenses'), icon: Wallet },
    { id: 'reports', label: t('reports'), icon: BarChart3, ownerOnly: true },
    { id: 'settings', label: t('settings'), icon: Settings, ownerOnly: true },
  ];

  const handleNavClick = (tab: NavTab) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  const navContent = (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800 text-slate-200">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-slate-800">
        <span className="font-bold text-white text-lg">{t('appName')}</span>
        <button
          type="button"
          onClick={onCloseMobile}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          aria-label="Close menu"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Nav List */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          if (item.ownerOnly && userRole === 'cashier') {
            return null; // hide confidential reports/settings from cashier
          }
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavClick(item.id as NavTab)}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25 font-bold'
                  : item.highlight
                  ? 'text-amber-400 hover:bg-slate-800/80 border border-amber-500/30'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-slate-950' : item.highlight ? 'text-amber-400' : 'text-slate-400'}`} />
                <span className="text-left line-clamp-1">{item.label}</span>
              </div>

              {item.badge !== undefined && (
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    isActive ? 'bg-slate-950 text-amber-400' : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}
                >
                  {item.badge}
                </span>
              )}

              {item.badgeText !== undefined && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                    isActive ? 'bg-slate-950 text-white' : 'bg-amber-500/20 text-amber-300'
                  }`}
                >
                  {item.badgeText}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Logout Action */}
      <div className="p-3 border-t border-slate-800 space-y-1.5">
        {onRoleChange && (
          <button
            type="button"
            onClick={() => {
              onCloseMobile();
              onRoleChange(userRole === 'owner' ? 'cashier' : 'owner');
            }}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
          >
            <div className="flex items-center space-x-2.5">
              <UserCheck className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>{userRole === 'owner' ? t('roleOwner') : t('roleCashier')}</span>
            </div>
            <span className="text-[11px] text-amber-400 font-bold">{t('switchRole')}</span>
          </button>
        )}

        {onLogout && (
          <button
            type="button"
            onClick={() => {
              onCloseMobile();
              onLogout();
            }}
            className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-rose-400 hover:bg-rose-950/30 hover:text-rose-300 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            <span>{t('logout')}</span>
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex flex-col w-64 flex-shrink-0 h-[calc(100vh-4rem)] sticky top-16 no-print">
        {navContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative flex flex-col w-4/5 max-w-xs bg-slate-900 h-full shadow-2xl z-10">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
};
