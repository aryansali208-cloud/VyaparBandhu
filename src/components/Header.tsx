import React from 'react';
import {
  Store,
  Globe,
  UserCheck,
  AlertTriangle,
  PlusCircle,
  Building2,
  Receipt,
  Menu,
  LogOut,
} from 'lucide-react';
import { BusinessProfile, Language, UserRole } from '../types';
import { getTranslation } from '../i18n/translations';

interface HeaderProps {
  business: BusinessProfile;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  userRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  lowStockCount: number;
  onQuickBill: () => void;
  onOpenLowStock: () => void;
  onToggleMobileMenu: () => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  business,
  language,
  onLanguageChange,
  userRole,
  onRoleChange,
  lowStockCount,
  onQuickBill,
  onOpenLowStock,
  onToggleMobileMenu,
  onLogout,
}) => {
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(language, key);

  return (
    <header className="bg-slate-900 text-white sticky top-0 z-40 shadow-md border-b border-slate-800 no-print">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Mobile menu button + Brand + Business Name */}
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onToggleMobileMenu}
              className="md:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
              aria-label="Toggle navigation menu"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="flex items-center space-x-2.5">
              {business.logoUrl ? (
                <img
                  src={business.logoUrl}
                  alt={business.name}
                  className="w-10 h-10 rounded-xl object-contain bg-white p-0.5 border border-slate-700 shadow-lg shadow-amber-500/10 flex-shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg shadow-amber-500/20 flex-shrink-0">
                  <Store className="w-6 h-6 text-slate-950" />
                </div>
              )}
              <div className="flex flex-col">
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-base sm:text-lg tracking-tight text-white line-clamp-1">
                    {business.name || t('appName')}
                  </span>
                  {business.gstStatus === 'registered' && (
                    <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                      GST
                    </span>
                  )}
                </div>
                <span className="text-xs text-slate-400 hidden sm:block">
                  {business.city ? `${business.city}, ${business.state}` : t('tagline')}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Low stock badge + Quick Bill + Language Switcher + Role + Logout */}
          <div className="flex items-center space-x-2 sm:space-x-2.5">
            {/* Low Stock Warning Pill */}
            {lowStockCount > 0 && (
              <button
                type="button"
                onClick={onOpenLowStock}
                className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25 transition text-xs font-semibold"
                title={`${lowStockCount} items have low stock`}
              >
                <AlertTriangle className="w-4 h-4 text-amber-400 animate-pulse" />
                <span className="hidden md:inline">{t('lowStock')}:</span>
                <span className="bg-amber-500 text-slate-950 px-1.5 py-0.2 rounded-full font-bold text-[11px]">
                  {lowStockCount}
                </span>
              </button>
            )}

            {/* Quick Bill Button */}
            <button
              type="button"
              onClick={onQuickBill}
              className="flex items-center space-x-1.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm shadow-md shadow-amber-500/20 active:scale-95 transition"
            >
              <Receipt className="w-4 h-4" />
              <span>{t('posBilling')}</span>
            </button>

            {/* Language Selector */}
            <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
              <button
                type="button"
                onClick={() => onLanguageChange('en')}
                className={`px-2 py-1 rounded text-xs font-bold transition ${
                  language === 'en'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="English"
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => onLanguageChange('hi')}
                className={`px-2 py-1 rounded text-xs font-bold transition ${
                  language === 'hi'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="हिन्दी"
              >
                हि
              </button>
              <button
                type="button"
                onClick={() => onLanguageChange('mr')}
                className={`px-2 py-1 rounded text-xs font-bold transition ${
                  language === 'mr'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="मराठी"
              >
                म
              </button>
            </div>

            {/* Role Switcher Pill */}
            <button
              type="button"
              onClick={() => onRoleChange(userRole === 'owner' ? 'cashier' : 'owner')}
              className="hidden lg:flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-700 transition"
              title={t('switchRole')}
            >
              <UserCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>{userRole === 'owner' ? t('roleOwner') : t('roleCashier')}</span>
            </button>

            {/* Logout Button */}
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 border border-slate-700 hover:border-rose-700 text-slate-300 hover:text-rose-300 transition text-xs font-semibold"
                title={t('logout')}
                aria-label={t('logout')}
              >
                <LogOut className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden sm:inline">{t('logout')}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
